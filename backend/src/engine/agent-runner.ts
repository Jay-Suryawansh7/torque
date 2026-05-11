import type { FlowNode } from "../types";
import { NodeType } from "../types";
import type { ExecutionContext } from "../core/interfaces/IConnector";
import { runAgentLoop } from "../agent/harness";

export class AgentRunner {
  async runNode(node: FlowNode, input: unknown, ctx: ExecutionContext): Promise<{ output: string; logs: unknown[] }> {
    if (node.type !== NodeType.agent) return { output: "", logs: [] };
    const skills = node.config.skill ? [node.config.skill] : ["web_search", "http_request", "calculate"];
    return runAgentLoop(
      node.config.goal || "Process input", node.config.provider || "openai", node.config.model || "gpt-4o",
      node.config.temperature || 0.7, node.config.max_tokens || 2048, 10, skills, input, ctx,
    );
  }
}
