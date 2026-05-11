import { getDb } from "../database/index.js";
import { v4 as uuid } from "uuid";
import type { Workflow, WorkflowRun, FlowNode } from "../types.js";
import { NodeType } from "../types.js";

export class WorkflowService {
  async list(userId: string, limit = 100, offset = 0): Promise<{ workflows: Workflow[]; total: number }> {
    if (!userId) return { workflows: [], total: 0 };
    const db = getDb();
    const total = (await db.prepare("SELECT COUNT(*) as c FROM workflows WHERE user_id = ?").get(userId) as any).c;
    const rows = await db.prepare("SELECT * FROM workflows WHERE user_id = ? ORDER BY updated_at DESC LIMIT ? OFFSET ?").all(userId, limit, offset) as any[];
    return { workflows: rows.map(this.rowToWorkflow), total };
  }

  async get(id: string, userId: string): Promise<Workflow | undefined> {
    const db = getDb();
    const row = await db.prepare("SELECT * FROM workflows WHERE id = ? AND user_id = ?").get(id, userId) as any;
    return row ? this.rowToWorkflow(row) : undefined;
  }

  async save(wf: Workflow, userId: string): Promise<Workflow> {
    const db = getDb();
    const definition = JSON.stringify({ nodes: wf.nodes, edges: wf.edges });
    const triggerType = this.detectTriggerType(wf.nodes);
    const triggerConfig = this.getTriggerConfig(wf.nodes);
    if (wf.id) {
      const existing = await db.prepare("SELECT id FROM workflows WHERE id = ? AND user_id = ?").get(wf.id, userId) as any;
      if (existing) {
        await db.prepare(`UPDATE workflows SET name=?, description=?, definition=?, trigger_type=?, trigger_config=?, updated_at=NOW() WHERE id=? AND user_id=?`)
          .run(wf.name, "", definition, triggerType, JSON.stringify(triggerConfig), wf.id, userId);
        return { ...wf, id: wf.id };
      }
    }
    const newId = uuid();
    await db.prepare(`INSERT INTO workflows (id, user_id, name, definition, trigger_type, trigger_config) VALUES (?,?,?,?,?,?)`)
      .run(newId, userId, wf.name, definition, triggerType, JSON.stringify(triggerConfig));
    return { ...wf, id: newId };
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const db = getDb();
    const result = await db.prepare("DELETE FROM workflows WHERE id = ? AND user_id = ?").run(id, userId);
    return result.changes > 0;
  }

  async listRuns(workflowId: string | undefined, userId: string | undefined, limit = 50, offset = 0): Promise<{ runs: WorkflowRun[]; total: number }> {
    if (!userId) return { runs: [], total: 0 };
    const db = getDb();
    let rows: any[];
    let total: number;
    if (workflowId) {
      total = (await db.prepare("SELECT COUNT(*) as c FROM workflow_runs WHERE workflow_id = ? AND user_id = ?").get(workflowId, userId) as any).c;
      rows = await db.prepare("SELECT * FROM workflow_runs WHERE workflow_id = ? AND user_id = ? ORDER BY started_at DESC LIMIT ? OFFSET ?").all(workflowId, userId, limit, offset) as any[];
    } else {
      total = (await db.prepare("SELECT COUNT(*) as c FROM workflow_runs WHERE user_id = ?").get(userId) as any).c;
      rows = await db.prepare("SELECT * FROM workflow_runs WHERE user_id = ? ORDER BY started_at DESC LIMIT ? OFFSET ?").all(userId, limit, offset) as any[];
    }
    return { runs: rows.map((r: any) => ({
      id: r.id, workflow_id: r.workflow_id, status: r.status,
      started_at: r.started_at || "", finished_at: r.completed_at || "",
      logs: [], error: r.error,
    })), total };
  }

  async getRun(id: string): Promise<WorkflowRun | undefined> {
    const db = getDb();
    const row = await db.prepare("SELECT * FROM workflow_runs WHERE id = ?").get(id) as any;
    if (!row) return undefined;
    return {
      id: row.id, workflow_id: row.workflow_id, status: row.status,
      started_at: row.started_at || "", finished_at: row.completed_at || "",
      logs: await this.getRunLogs(row.id), error: row.error,
    };
  }

  async getRunLogs(runId: string): Promise<any[]> {
    const db = getDb();
    return await db.prepare("SELECT * FROM run_logs WHERE run_id = ? ORDER BY created_at ASC").all(runId) as any[];
  }

  private rowToWorkflow(row: any): Workflow {
    const def = JSON.parse(row.definition || "{}");
    return {
      id: row.id,
      name: row.name,
      nodes: def.nodes || [],
      edges: def.edges || [],
      active: row.is_active === 1,
    };
  }

  private detectTriggerType(nodes: FlowNode[]): string | null {
    for (const n of nodes) {
      if (n.type === NodeType.trigger) return "cron";
      if (n.type === NodeType.webhook_trigger) return "webhook";
    }
    return null;
  }

  private getTriggerConfig(nodes: FlowNode[]): Record<string, unknown> {
    for (const n of nodes) {
      if (n.type === NodeType.trigger || n.type === NodeType.webhook_trigger) {
        return { schedule: n.config.schedule };
      }
    }
    return {};
  }
}
