import { z } from "zod";
import { BaseConnector } from "./BaseConnector.js";
import { ConnectorError } from "../core/ConnectorError.js";
import type { IOperation, OperationOutput, ConnectionTestResult, AuthConfig } from "../core/interfaces/IConnector.js";

const chatOp: IOperation = {
  id: "chat_completion",
  name: "Chat Completion",
  description: "Generate a chat completion using OpenAI models",
  type: "action",
  inputSchema: z.object({
    model: z.string().default("gpt-4o"),
    messages: z.array(z.object({ role: z.enum(["system", "user", "assistant"]), content: z.string() })),
    temperature: z.number().min(0).max(2).default(0.7),
    maxTokens: z.number().min(1).max(128000).default(2048),
  }),
  outputSchema: z.object({ content: z.string(), model: z.string(), usage: z.object({ prompt_tokens: z.number(), completion_tokens: z.number() }) }),
  fields: [
    { id: "model", label: "Model", type: "select", required: true, default: "gpt-4o", options: [{ label: "GPT-4o", value: "gpt-4o" }, { label: "GPT-4o Mini", value: "gpt-4o-mini" }, { label: "o3-mini", value: "o3-mini" }] },
    { id: "messages", label: "Messages", type: "json", required: true },
    { id: "temperature", label: "Temperature", type: "number", default: 0.7 },
    { id: "maxTokens", label: "Max Tokens", type: "number", default: 2048 },
  ],
  async execute(input, credential, _context): Promise<OperationOutput> {
    const p = input as { model: string; messages: { role: string; content: string }[]; temperature: number; maxTokens: number };
    const key = (credential.api_key || credential.apiKey || process.env.OPENAI_API_KEY || "") as string;
    if (!key) throw new ConnectorError({ connectorId: "openai", operationId: "chat_completion", message: "Missing API key", statusCode: 401 });

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: p.model, messages: p.messages, temperature: p.temperature, max_tokens: p.maxTokens }),
    });
    if (!res.ok) { const t = await res.text(); throw new ConnectorError({ connectorId: "openai", operationId: "chat_completion", message: `OpenAI error ${res.status}: ${t.slice(0, 200)}`, statusCode: res.status }); }
    const d = await res.json() as any;
    return { data: { content: d.choices[0].message.content, model: d.model, usage: d.usage } };
  },
};

const embedOp: IOperation = {
  id: "create_embedding",
  name: "Create Embedding",
  description: "Generate embeddings for text input",
  type: "action",
  inputSchema: z.object({ model: z.string().default("text-embedding-3-small"), input: z.union([z.string(), z.array(z.string())]) }),
  outputSchema: z.object({ embeddings: z.array(z.array(z.number())) }),
  fields: [
    { id: "input", label: "Input Text", type: "textarea", required: true },
  ],
  async execute(input, credential, _context): Promise<OperationOutput> {
    const p = input as { model: string; input: string | string[] };
    const key = (credential.api_key || credential.apiKey || process.env.OPENAI_API_KEY || "") as string;
    if (!key) throw new ConnectorError({ connectorId: "openai", operationId: "create_embedding", message: "Missing API key", statusCode: 401 });

    const res = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: p.model, input: p.input }),
    });
    if (!res.ok) { const t = await res.text(); throw new ConnectorError({ connectorId: "openai", operationId: "create_embedding", message: `OpenAI error ${res.status}: ${t.slice(0, 200)}`, statusCode: res.status }); }
    const d = await res.json() as any;
    return { data: { embeddings: d.data.map((x: any) => x.embedding) } };
  },
};

export class OpenAIConnector extends BaseConnector {
  id = "openai"; name = "OpenAI"; description = "GPT models, embeddings via OpenAI REST API";
  icon = "https://cdn.simpleicons.org/openai"; category = "ai" as const;
  authType = "api_key" as const;
  authConfig: AuthConfig = { apiKey: { header: "Authorization", type: "header" as const } };
  operations = [chatOp, embedOp];

  async testConnection(credential: Record<string, unknown>): Promise<ConnectionTestResult> {
    try {
      const key = (credential.api_key || credential.apiKey || process.env.OPENAI_API_KEY || "") as string;
      if (!key) return { ok: false, message: "No API key" };
      const res = await fetch("https://api.openai.com/v1/models", { headers: { Authorization: `Bearer ${key}` } });
      return { ok: res.ok, message: res.ok ? "Authenticated" : `Invalid key (${res.status})` };
    } catch (err) { return { ok: false, message: err instanceof Error ? err.message : "Connection failed" }; }
  }
}
