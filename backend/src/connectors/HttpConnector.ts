import { z } from "zod";
import { BaseConnector } from "./BaseConnector";
import { ConnectorError } from "../core/ConnectorError";
import type { IOperation, OperationOutput, ExecutionContext, ConnectionTestResult, AuthConfig } from "../core/interfaces/IConnector";

const inputSchema = z.object({
  method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"]).default("GET"),
  url: z.string().url(),
  headers: z.record(z.string(), z.string()).default({}),
  queryParams: z.record(z.string(), z.string()).default({}),
  body: z.string().optional().default(""),
  timeout: z.number().min(100).max(60000).default(30000),
  followRedirects: z.boolean().default(true),
});

const outputSchema = z.object({
  status: z.number(),
  headers: z.record(z.string(), z.string()),
  body: z.string(),
});

const requestOp: IOperation = {
  id: "request",
  name: "HTTP Request",
  description: "Make any HTTP request to any API",
  type: "action",
  inputSchema,
  outputSchema,
  fields: [
    { id: "method", label: "Method", type: "select", required: true, default: "GET",
      options: ["GET","POST","PUT","PATCH","DELETE","HEAD","OPTIONS"].map(v => ({ label: v, value: v })) },
    { id: "url", label: "URL", type: "text", required: true, placeholder: "https://api.example.com/..." },
    { id: "headers", label: "Headers", type: "json", placeholder: '{"Content-Type": "application/json"}' },
    { id: "queryParams", label: "Query Parameters", type: "json" },
    { id: "body", label: "Body", type: "textarea", placeholder: '{"key": "value"}' },
    { id: "timeout", label: "Timeout (ms)", type: "number", default: 30000 },
    { id: "followRedirects", label: "Follow Redirects", type: "toggle", default: true },
  ],
  async execute(input, _credential, _context): Promise<OperationOutput> {
    try {
      const parsed = inputSchema.parse(input);
      const url = new URL(parsed.url);
      for (const [k, v] of Object.entries(parsed.queryParams)) url.searchParams.set(k, v);

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), parsed.timeout);

      try {
        const res = await fetch(url.toString(), {
          method: parsed.method,
          headers: { ...parsed.headers, "Content-Type": "application/json" },
          body: ["POST","PUT","PATCH"].includes(parsed.method) ? parsed.body || undefined : undefined,
          signal: controller.signal,
          redirect: parsed.followRedirects ? "follow" : "manual" as any,
        });
        const body = await res.text();
        const respHeaders: Record<string, string> = {};
        res.headers.forEach((v, k) => { respHeaders[k] = v; });
        if (!res.ok) throw new ConnectorError({ connectorId: "http", operationId: "request", message: `HTTP ${res.status}: ${body.slice(0, 200)}`, statusCode: res.status, retryable: res.status >= 500 });
        return { data: { status: res.status, headers: respHeaders, body } };
      } finally {
        clearTimeout(timer);
      }
    } catch (err) {
      if (err instanceof ConnectorError) throw err;
      throw new ConnectorError({ connectorId: "http", operationId: "request", message: err instanceof Error ? err.message : String(err), statusCode: 500, retryable: true, cause: err });
    }
  },
};

export class HttpConnector extends BaseConnector {
  id = "http";
  name = "HTTP Request";
  description = "Make HTTP requests to any API. The escape hatch for any service.";
  icon = "https://cdn.simpleicons.org/httparty";
  category = "utility" as const;
  authType = "none" as const;
  authConfig: AuthConfig = {};

  operations = [requestOp];

  async testConnection(): Promise<ConnectionTestResult> {
    return { ok: true, message: "HTTP connector does not require authentication" };
  }
}
