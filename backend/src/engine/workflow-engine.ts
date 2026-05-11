import { getDb } from "../database";
import { v4 as uuid } from "uuid";
import type { Workflow, WorkflowRun, FlowNode } from "../types";
import type { ExecutionContext } from "../core/interfaces/IConnector";
import { NodeType } from "../types";
import { runAgentLoop } from "../agent/harness";
import { MCPRegistry } from "../mcp/MCPRegistry";
import { logger } from "../logger";
import { getConnector } from "../connectors/registry";
import { getSkill } from "../skills/registry";
import { CredentialService } from "./credential-service";
import type { OperationOutput } from "../core/interfaces/IConnector";

// ── Real-time event emitter (wired to socket.io from index.ts) ──
let _emit: ((runId: string, event: string, data: unknown) => void) | null = null;
export function setEmitter(fn: (runId: string, event: string, data: unknown) => void) { _emit = fn; }

function emit(runId: string, event: string, data: unknown) { try { _emit?.(runId, event, data); } catch (err) { logger.error({ err, runId, event }, "emit failed"); } }

function addLog(runId: string, nodeId: string | null, level: string, message: string, data?: unknown) {
  const db = getDb();
  db.prepare("INSERT INTO run_logs (run_id, node_id, level, message, data) VALUES (?,?,?,?,?)")
    .run(runId, nodeId, level, message, JSON.stringify(data || {}));
  emit(runId, "log", { timestamp: new Date().toISOString(), nodeId, level, message });
}

export class WorkflowEngine {
  async runWorkflow(workflowId: string, userId: string): Promise<WorkflowRun> {
    const db = getDb();
    const wfRow = db.prepare("SELECT * FROM workflows WHERE id = ? AND user_id = ?").get(workflowId, userId) as any;
    if (!wfRow) throw new Error(`Workflow not found`);
    const workflow: Workflow = { id: wfRow.id, name: wfRow.name, nodes: JSON.parse(wfRow.definition || "{}").nodes || [], edges: JSON.parse(wfRow.definition || "{}").edges || [], active: wfRow.is_active === 1 };

    const runId = uuid();
    db.prepare("INSERT INTO workflow_runs (id, workflow_id, user_id, status, trigger_source, started_at) VALUES (?,?,?,'running','manual',datetime('now'))").run(runId, workflowId, userId);
    const startedAt = Date.now();
    const run: WorkflowRun = { id: runId, workflow_id: workflowId, status: "running", started_at: new Date().toISOString(), finished_at: "", logs: [], error: null };

    const credSvc = new CredentialService();

    try {
      const { nodes, edges } = workflow;
      const nodeMap = new Map(nodes.map(n => [n.id, n]));

      // Build adjacency
      const inDegree: Record<string, number> = {};
      const outEdges: Record<string, string[]> = {};
      for (const n of nodes) { inDegree[n.id] = 0; outEdges[n.id] = []; }
      for (const e of edges) { if (outEdges[e.source]) outEdges[e.source].push(e.target); if (inDegree[e.target] !== undefined) inDegree[e.target]++; }

      // Dependency info for each node: which source nodes feed into it
      const upstreamMap: Record<string, string[]> = {};
      for (const e of edges) { (upstreamMap[e.target] = upstreamMap[e.target] || []).push(e.source); }

      // Build execution context creator
      const outputs: Record<string, unknown> = {};
      const nodeStatuses: Record<string, string> = {};
      const nodeErrors: Record<string, string> = {};

      function buildContext(node: FlowNode): ExecutionContext {
        return {
          runId, workflowId, nodeId: node.id, userId,
          logger: { info: (m: string, d?: unknown) => addLog(runId, node.id, "info", m, d), error: (m: string, d?: unknown) => addLog(runId, node.id, "error", m, d) },
          emit: (event, data) => emit(runId, event, data),
          getNodeOutput: (id) => outputs[id],
          variables: {},
          getCredential: async (id) => credSvc.getDecrypted(id, userId),
        };
      }

      async function executeNode(node: FlowNode): Promise<void> {
        const startedNodeAt = Date.now();
        addLog(runId, node.id, "info", `▶ Executing: ${node.config.label || node.type}`);

        // Gather upstream inputs
        const upstreamIds = upstreamMap[node.id] || [];
        const inputs = upstreamIds.map(id => outputs[id]);
        const input = inputs.length === 0 ? null : inputs.length === 1 ? inputs[0] : inputs;

        const ctx = buildContext(node);
        const onError = (node.config as any).onError || "stop";

        let retriesLeft = onError === "retry" ? 3 : 0;

        const attempt = async (): Promise<{ result: unknown; error?: string }> => {
          try {
            const result = await executeNodeWithType(node, input, ctx);
            return { result };
          } catch (err) {
            return { result: null, error: err instanceof Error ? err.message : String(err) };
          }
        };

        while (true) {
          const { result, error } = await attempt();
          const dur = Date.now() - startedNodeAt;

          if (!error) {
            outputs[node.id] = result;
            nodeStatuses[node.id] = "completed";
            db.prepare("INSERT INTO node_executions (run_id, node_id, node_name, status, input, output, started_at, completed_at, duration_ms) VALUES (?,?,?,'completed',?,?,?,datetime('now'),?)")
              .run(runId, node.id, node.config.label || node.type,
                JSON.stringify(input).slice(0, 10000), JSON.stringify(result).slice(0, 10000),
                new Date(startedNodeAt).toISOString(), dur);
            addLog(runId, node.id, "info", `✓ Completed (${dur}ms)`);
            emit(runId, "node:completed", { nodeId: node.id, output: result });
            return;
          }

          nodeErrors[node.id] = error;
          if (retriesLeft > 0) {
            retriesLeft--;
            addLog(runId, node.id, "warn", `↻ Retrying (${retriesLeft} left): ${error}`);
            await new Promise(r => setTimeout(r, 1000 * (3 - retriesLeft)));
            continue;
          }

          db.prepare("INSERT INTO node_executions (run_id, node_id, node_name, status, input, output, error, started_at, completed_at, duration_ms) VALUES (?,?,?,'failed',?,?,?,?,datetime('now'),?)")
            .run(runId, node.id, node.config.label || node.type,
              JSON.stringify(input).slice(0, 10000), null, error,
              new Date(startedNodeAt).toISOString(), dur);
          addLog(runId, node.id, "error", `✗ Failed: ${error}`);
          emit(runId, "node:failed", { nodeId: node.id, error });

          if (onError === "stop") throw new Error(`Node ${node.config.label || node.id} failed: ${error}`);
          if (onError === "continue") {
            outputs[node.id] = null;
            nodeStatuses[node.id] = "skipped";
            return;
          }
          // onError === "retry" exhausted — fall through to stop
          throw new Error(`Node ${node.config.label || node.id} failed after retries: ${error}`);
        }
      }

      // Parallel DAG execution: run nodes whose dependencies are all satisfied
      const completed = new Set<string>();
      const remaining = new Set(nodes.map(n => n.id));

      while (remaining.size > 0) {
        const ready = Array.from(remaining).filter(id => {
          const upstream = upstreamMap[id] || [];
          return upstream.every(u => completed.has(u));
        });
        if (ready.length === 0) break; // cycle or all remaining blocked by failed

        await Promise.all(ready.map(id => (async () => {
          const node = nodeMap.get(id)!;
          try { await executeNode(node); }
          catch (err) { logger.error({ err, nodeId: id }, "DAG node execution failed unexpectedly"); }
          if (nodeStatuses[id] === "completed" || nodeStatuses[id] === "skipped") {
            completed.add(id);
          }
          remaining.delete(id);
        })()));
      }

      let hasFail = false;
      for (const key in nodeStatuses) { if (nodeStatuses[key] === "failed") { hasFail = true; break; } }
      const finalStatus = hasFail ? "failed" : "completed";
      db.prepare("UPDATE workflow_runs SET status=?, completed_at=datetime('now'), duration_ms=? WHERE id=?")
        .run(finalStatus, Date.now() - startedAt, runId);
      run.status = finalStatus;
      if (finalStatus === "failed") run.error = "One or more nodes failed";

    } catch (err) {
      const msg = String(err);
      db.prepare("UPDATE workflow_runs SET status='failed', error=?, completed_at=datetime('now') WHERE id=?").run(msg, runId);
      run.status = "failed";
      run.error = msg;
    }
    run.finished_at = new Date().toISOString();
    emit(runId, "run:completed", { status: run.status });
    return run;
  }
}

// ── Parallel DAG-aware queue ──
import Queue from "better-queue";
const engine = new WorkflowEngine();
const runQueue = new Queue(async (task: { workflowId: string; userId: string }, cb: (err?: any, result?: any) => void) => {
  try { cb(null, await engine.runWorkflow(task.workflowId, task.userId)); }
  catch (err) { cb(err); }
}, { concurrent: 5 });

export function enqueueWorkflowRun(workflowId: string, userId: string): Promise<WorkflowRun> {
  return new Promise((resolve, reject) => {
    runQueue.push({ workflowId, userId }, (err, result) => { if (err) reject(err); else resolve(result); });
  });
}

// ── Node type executor ──
async function executeNodeWithType(node: FlowNode, input: unknown, ctx: ExecutionContext): Promise<unknown> {
  switch (node.type) {
    case NodeType.trigger:
    case NodeType.webhook_trigger:
      return { timestamp: Date.now() / 1000, schedule: node.config.schedule || "manual", input };

    case NodeType.agent: {
      const skillList = node.config.skill ? [node.config.skill] : ["web_search", "http_request", "calculate", "extract_structured_data", "summarize"];
      const result = await runAgentLoop(
        node.config.goal || "Process the input data",
        node.config.provider || "openai",
        node.config.model || "gpt-4o",
        node.config.temperature || 0.7,
        node.config.max_tokens || 2048,
        10, skillList, input, ctx,
      );
      for (const l of result.logs) addLog(ctx.runId, node.id, "info", `${l.step}: ${l.detail}`);
      return result.output;
    }

    case NodeType.llm:
      return `[LLM] ${node.config.provider}/${node.config.model} processed: ${JSON.stringify(input)}`;

    case NodeType.code:
      return `[Code] ${node.config.language} executed`;

    // ── Connector-backed node types ──
    case NodeType.http_request: {
      const connector = getConnector("http");
      if (!connector) return `[HTTP] connector not found`;
      const op = connector.operations[0];
      const cred = node.config.credential_id ? await ctx.getCredential(node.config.credential_id) : undefined;
      const result: OperationOutput = await op.execute({
        method: node.config.method || "GET", url: node.config.webhook_url || "http://localhost",
        headers: {}, body: JSON.stringify(input), timeout: 30000, followRedirects: true,
      }, cred || {}, ctx);
      return result.data;
    }

    case NodeType.database:
      return `[DB] ${node.config.database_type}: ${(node.config.query || "SELECT 1").slice(0, 100)}`;

    case NodeType.file_io:
      return `[File] ${node.config.file_format}`;

    case NodeType.webhook:
      return `[Webhook] ${node.config.method} ${node.config.webhook_url}`;

    case NodeType.summarize:
      return `[Summarize] ${String(input).slice(0, 200)}`;

    case NodeType.translate:
      return `[Translate] → ${node.config.target_language}`;

    case NodeType.computer_use:
      return `[Browser] ${node.config.browser_url || "no URL"}`;

    case NodeType.extract:
      return typeof input === "string" ? input : input;

    // ── MCP tool node ──
    case NodeType.mcp_tool: {
      const mcp = new MCPRegistry();
      const result = await mcp.callTool(node.config.mcp_server_id || "", ctx.userId, node.config.mcp_tool || "unknown", { input });
      return result;
    }

    // ── Flow control ──
    case NodeType.condition:
      return node.config.condition ? Boolean(input) : true;

    case NodeType.switch:
      return node.config.switch_value || input;

    case NodeType.transform:
      return input;

    case NodeType.merge:
      return input;

    case NodeType.split:
      return Array.isArray(input) ? input : [input];

    case NodeType.wait:
      return input;

    case NodeType.loop: {
      const items = Array.isArray(input) ? input : [input];
      return items.slice(0, node.config.iteration_count || 5);
    }

    case NodeType.rss: {
      const url = node.config.webhook_url || "https://example.com/feed.xml";
      return { feed: url, items: [{ title: "Mock Item", link: url, pubDate: new Date().toISOString() }] };
    }

    case NodeType.email:
      return `[Email] Sending to ${node.config.destination || "unknown"}: ${String(input).slice(0, 100)}`;

    case NodeType.respond_webhook:
      return { status: 200, body: input, headers: { "Content-Type": "application/json" } };

    // ── New Communication Nodes ──
    case NodeType.whatsapp:
      return { sent: true, to: node.config.destination || "unknown", messageId: `wa_${Date.now()}` };

    case NodeType.twilio_sms:
      return { sent: true, to: node.config.destination || "unknown", sid: `SM${Date.now()}` };

    case NodeType.outlook:
      return `[Outlook] Email sent to ${node.config.destination || "unknown"}`;

    // ── New Productivity Nodes ──
    case NodeType.trello:
      return { card: { id: `card_${Date.now()}`, name: input, list: node.config.destination || "To Do" } };

    case NodeType.asana:
      return { task: { gid: `task_${Date.now()}`, name: input, project: node.config.destination } };

    case NodeType.clickup:
      return { task: { id: `task_${Date.now()}`, name: input, list: node.config.destination } };

    // ── New Developer / Data Nodes ──
    case NodeType.vercel:
      return { deployment: { id: `dpl_${Date.now()}`, state: "READY", url: `${input}.vercel.app` } };

    case NodeType.supabase:
      return { rows: [{ id: 1, data: input }], rowCount: 1 };

    case NodeType.redis:
      return { operation: node.config.method || "GET", key: String(input), value: "OK" };

    case NodeType.mysql:
      return `[MySQL] Query: ${(node.config.query || "SELECT 1").slice(0, 100)}`;

    // ── New AI Nodes ──
    case NodeType.gemini:
      return `[Gemini] ${node.config.model || "gemini-2.0-flash"}: ${String(input).slice(0, 100)}`;

    case NodeType.mistral:
      return `[Mistral] ${node.config.model || "mistral-large-latest"}: ${String(input).slice(0, 100)}`;

    case NodeType.huggingface:
      return `[HuggingFace] Model ${node.config.model || "unknown"}: ${String(input).slice(0, 100)}`;

    case NodeType.output:
      return typeof input === "string" ? input : JSON.stringify(input, null, 2);

    default:
      return input;
  }
}
