import { z } from "zod";
import { BaseConnector } from "./BaseConnector";
import { ConnectorError } from "../core/ConnectorError";
import type { IOperation, OperationOutput, ConnectionTestResult, AuthConfig } from "../core/interfaces/IConnector";

const chatOp: IOperation = {
  id: "chat_completion", name: "Chat Completion", description: "Generate text using Anthropic Claude", type: "action",
  inputSchema: z.object({ model: z.string().default("claude-sonnet-4-20250514"), prompt: z.string(), maxTokens: z.number().min(1).max(128000).default(4096) }),
  outputSchema: z.object({ content: z.string(), model: z.string() }),
  fields: [
    { id: "model", label: "Model", type: "select", default: "claude-sonnet-4-20250514", options: [{ label: "Claude Sonnet 4", value: "claude-sonnet-4-20250514" }, { label: "Claude Haiku 3.5", value: "claude-haiku-3-5" }] },
    { id: "prompt", label: "Prompt", type: "textarea", required: true },
  ],
  async execute(input, credential, _ctx): Promise<OperationOutput> {
    const p = input as { model: string; prompt: string; maxTokens: number };
    const key = (credential.api_key || credential.apiKey || process.env.ANTHROPIC_API_KEY || "") as string;
    if (!key) throw new ConnectorError({ connectorId: "anthropic", operationId: "chat_completion", message: "Missing API key — set ANTHROPIC_API_KEY", statusCode: 401 });
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST", headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
      body: JSON.stringify({ model: p.model, max_tokens: p.maxTokens, messages: [{ role: "user", content: p.prompt }] }),
    });
    if (!res.ok) { const t = await res.text(); throw new ConnectorError({ connectorId: "anthropic", operationId: "chat_completion", message: `Anthropic error ${res.status}: ${t.slice(0, 200)}`, statusCode: res.status }); }
    const d = await res.json() as any;
    return { data: { content: d.content?.[0]?.text || "", model: d.model } };
  },
};

export class AnthropicConnector extends BaseConnector {
  id = "anthropic"; name = "Anthropic Claude"; description = "Claude AI models via Anthropic REST API";
  icon = "https://cdn.simpleicons.org/anthropic"; category = "ai" as const;
  authType = "api_key" as const; authConfig: AuthConfig = { apiKey: { header: "x-api-key", type: "header" as const } };
  operations = [chatOp];
  async testConnection(credential: Record<string, unknown>): Promise<ConnectionTestResult> {
    try {
      const key = (credential.api_key || credential.apiKey || process.env.ANTHROPIC_API_KEY || "") as string;
      if (!key) return { ok: false, message: "No API key" };
      const res = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "Content-Type": "application/json" }, body: JSON.stringify({ model: "claude-haiku-3-5", max_tokens: 10, messages: [{ role: "user", content: "hi" }] }) });
      return { ok: res.ok, message: res.ok ? "Authenticated" : `Invalid key (${res.status})` };
    } catch (err) { return { ok: false, message: err instanceof Error ? err.message : "Connection failed" }; }
  }
}
