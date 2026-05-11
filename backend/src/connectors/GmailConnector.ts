import { z } from "zod";
import { BaseConnector } from "./BaseConnector";
import { ConnectorError } from "../core/ConnectorError";
import type { IOperation, OperationOutput, ExecutionContext, ConnectionTestResult, AuthConfig } from "../core/interfaces/IConnector";

function encodeBase64Url(str: string): string {
  return Buffer.from(str).toString("base64url");
}

function buildMimeMessage(from: string, to: string, cc: string, subject: string, body: string, isHtml: boolean): string {
  const boundary = `boundary_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const encodedSubject = `=?UTF-8?B?${Buffer.from(subject).toString("base64")}?=`;
  const lines = [
    `From: ${from}`,
    `To: ${to}`,
    cc ? `Cc: ${cc}` : "",
    `Subject: ${encodedSubject}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    Buffer.from(body.replace(/<[^>]*>/g, "")).toString("base64"),
    "",
    `--${boundary}`,
    isHtml ? `Content-Type: text/html; charset=UTF-8` : "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    Buffer.from(isHtml ? body : body.replace(/<[^>]*>/g, "")).toString("base64"),
    "",
    `--${boundary}--`,
  ];
  return lines.filter(l => l !== "").join("\r\n");
}

const sendEmailOp: IOperation = {
  id: "send_email",
  name: "Send Email",
  description: "Send an email via Gmail API",
  type: "action",
  inputSchema: z.object({
    to: z.string().email(),
    cc: z.string().optional().default(""),
    bcc: z.string().optional().default(""),
    subject: z.string().min(1),
    body: z.string().min(1),
    isHtml: z.boolean().default(false),
  }),
  outputSchema: z.object({ messageId: z.string(), sent: z.boolean() }),
  fields: [
    { id: "to", label: "To", type: "text", required: true, placeholder: "recipient@example.com" },
    { id: "cc", label: "CC", type: "text", placeholder: "cc@example.com" },
    { id: "subject", label: "Subject", type: "text", required: true },
    { id: "body", label: "Body", type: "textarea", required: true },
    { id: "isHtml", label: "HTML", type: "toggle", default: false },
  ],
  async execute(input, credential, context): Promise<OperationOutput> {
    const parsed = sendEmailOp.inputSchema.parse(input) as { to: string; cc: string; bcc: string; subject: string; body: string; isHtml: boolean };
    const accessToken = (credential.access_token || credential.accessToken || "") as string;
    if (!accessToken) throw new ConnectorError({ connectorId: "gmail", operationId: "send_email", message: "Missing access token — re-authenticate with OAuth2", statusCode: 401 });

    const from = (credential.email || credential.from || "me") as string;
    const raw = buildMimeMessage(from, parsed.to, parsed.cc, parsed.subject, parsed.body, parsed.isHtml);
    const encoded = encodeBase64Url(raw);

    const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ raw: encoded }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new ConnectorError({ connectorId: "gmail", operationId: "send_email", message: `Gmail API error ${res.status}: ${text.slice(0, 200)}`, statusCode: res.status, retryable: res.status >= 500 });
    }

    const data = await res.json() as { id: string };
    return { data: { messageId: data.id, sent: true } };
  },
};

const listEmailsOp: IOperation = {
  id: "list_emails",
  name: "List Emails",
  description: "List emails from Gmail inbox via Gmail API",
  type: "action",
  inputSchema: z.object({ maxResults: z.number().min(1).max(50).default(10), query: z.string().optional().default("") }),
  outputSchema: z.object({ emails: z.array(z.object({ id: z.string(), threadId: z.string(), subject: z.string(), from: z.string(), snippet: z.string() })) }),
  fields: [
    { id: "maxResults", label: "Max Results", type: "number", default: 10 },
    { id: "query", label: "Search Query", type: "text", placeholder: "from:someone@example.com" },
  ],
  async execute(input, credential, _context): Promise<OperationOutput> {
    const parsed = listEmailsOp.inputSchema.parse(input) as { maxResults: number; query: string };
    const accessToken = (credential.access_token || credential.accessToken || "") as string;
    if (!accessToken) throw new ConnectorError({ connectorId: "gmail", operationId: "list_emails", message: "Missing access token", statusCode: 401 });

    const params = new URLSearchParams({ maxResults: String(parsed.maxResults) });
    if (parsed.query) params.set("q", parsed.query);

    const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?${params}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new ConnectorError({ connectorId: "gmail", operationId: "list_emails", message: `Gmail API error ${res.status}: ${text.slice(0, 200)}`, statusCode: res.status, retryable: res.status >= 500 });
    }

    const data = await res.json() as { messages?: { id: string; threadId: string }[] };
    const emails = (data.messages || []).map(m => ({ id: m.id, threadId: m.threadId, subject: "", from: "", snippet: "" }));
    return { data: { emails } };
  },
};

export class GmailConnector extends BaseConnector {
  id = "gmail";
  name = "Gmail";
  description = "Send and read emails via Google's Gmail REST API";
  icon = "https://cdn.simpleicons.org/gmail";
  category = "communication" as const;
  authType = "oauth2" as const;
  authConfig: AuthConfig = {
    oauth2: { authUrl: "https://accounts.google.com/o/oauth2/auth", tokenUrl: "https://oauth2.googleapis.com/token", scopes: ["https://www.googleapis.com/auth/gmail.send", "https://www.googleapis.com/auth/gmail.readonly"] },
  };
  operations = [sendEmailOp, listEmailsOp];

  async testConnection(credential: Record<string, unknown>): Promise<ConnectionTestResult> {
    try {
      const token = (credential.access_token || credential.accessToken || "") as string;
      if (!token) return { ok: false, message: "No access token provided" };
      const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/profile", { headers: { Authorization: `Bearer ${token}` } });
      return { ok: res.ok, message: res.ok ? "Authenticated" : `Token invalid (${res.status})` };
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : "Connection failed" };
    }
  }
}
