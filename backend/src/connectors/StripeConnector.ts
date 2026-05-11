import { z } from "zod";
import { BaseConnector } from "./BaseConnector.js";
import { ConnectorError } from "../core/ConnectorError.js";
import type { IOperation, OperationOutput, ConnectionTestResult, AuthConfig } from "../core/interfaces/IConnector.js";

async function stripeFetch(key: string, method: string, path: string, body?: Record<string, unknown>): Promise<any> {
  const opts: RequestInit = { method, headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/x-www-form-urlencoded" } };
  if (body) {
    const parts: string[] = [];
    for (const [k, v] of Object.entries(body)) {
      if (v !== undefined && v !== null && v !== "") parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
    }
    opts.body = parts.join("&");
  }
  const res = await fetch(`https://api.stripe.com/v1${path}`, opts);
  if (!res.ok) { const t = await res.text(); throw new ConnectorError({ connectorId: "stripe", operationId: path, message: `Stripe error ${res.status}: ${t.slice(0, 200)}`, statusCode: res.status, retryable: res.status >= 500 }); }
  return res.json();
}

const createCustomerOp: IOperation = {
  id: "create_customer", name: "Create Customer", description: "Create a new Stripe customer", type: "action",
  inputSchema: z.object({ email: z.string().email(), name: z.string().optional().default("") }),
  outputSchema: z.object({ id: z.string(), email: z.string(), name: z.string() }),
  fields: [
    { id: "email", label: "Email", type: "text", required: true },
    { id: "name", label: "Name", type: "text" },
  ],
  async execute(input, credential, _ctx): Promise<OperationOutput> {
    const p = input as { email: string; name: string };
    const key = (credential.api_key || credential.apiKey || "") as string;
    if (!key) throw new ConnectorError({ connectorId: "stripe", operationId: "create_customer", message: "Missing API key", statusCode: 401 });
    const d = await stripeFetch(key, "POST", "/customers", { email: p.email, name: p.name || undefined });
    return { data: { id: d.id, email: d.email, name: d.name } };
  },
};

const listChargesOp: IOperation = {
  id: "list_charges", name: "List Charges", description: "List recent charges", type: "action",
  inputSchema: z.object({ limit: z.number().min(1).max(100).default(10) }),
  outputSchema: z.object({ charges: z.array(z.object({ id: z.string(), amount: z.number(), currency: z.string(), status: z.string() })) }),
  fields: [{ id: "limit", label: "Limit", type: "number", default: 10 }],
  async execute(input, credential, _ctx): Promise<OperationOutput> {
    const p = input as { limit: number };
    const key = (credential.api_key || credential.apiKey || "") as string;
    if (!key) throw new ConnectorError({ connectorId: "stripe", operationId: "list_charges", message: "Missing API key", statusCode: 401 });
    const d = await stripeFetch(key, "GET", `/charges?limit=${p.limit}`);
    return { data: { charges: (d.data || []).map((c: any) => ({ id: c.id, amount: c.amount, currency: c.currency, status: c.status })) } };
  },
};

export class StripeConnector extends BaseConnector {
  id = "stripe"; name = "Stripe"; description = "Customers, charges, invoices via Stripe REST API";
  icon = "https://cdn.simpleicons.org/stripe"; category = "finance" as const;
  authType = "api_key" as const;
  authConfig: AuthConfig = { apiKey: { header: "Authorization", type: "header" as const } };
  operations = [createCustomerOp, listChargesOp];

  async testConnection(credential: Record<string, unknown>): Promise<ConnectionTestResult> {
    try {
      const key = (credential.api_key || credential.apiKey || "") as string;
      if (!key) return { ok: false, message: "No API key" };
      await stripeFetch(key, "GET", "/charges?limit=1");
      return { ok: true, message: "Connected to Stripe" };
    } catch (err) { return { ok: false, message: err instanceof Error ? err.message : "Connection failed" }; }
  }
}
