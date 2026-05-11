import { z } from "zod";
import { BaseConnector } from "./BaseConnector";
import { ConnectorError } from "../core/ConnectorError";
import type { IOperation, OperationOutput, ExecutionContext, ConnectionTestResult, AuthConfig } from "../core/interfaces/IConnector";

async function slackFetch(token: string, method: string, body: Record<string, unknown>): Promise<any> {
  const res = await fetch(`https://slack.com/api/${method}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json() as { ok: boolean; error?: string };
  if (!data.ok) throw new ConnectorError({ connectorId: "slack", operationId: method, message: data.error || "Slack API error", statusCode: 400 });
  return data;
}

const sendMessageOp: IOperation = {
  id: "send_message",
  name: "Send Message",
  description: "Send a message to a Slack channel",
  type: "action",
  inputSchema: z.object({ channel: z.string().min(1), text: z.string().min(1), threadTs: z.string().optional().default("") }),
  outputSchema: z.object({ ok: z.boolean(), ts: z.string(), channel: z.string() }),
  fields: [
    { id: "channel", label: "Channel", type: "text", required: true, placeholder: "#general or C123ABC" },
    { id: "text", label: "Message", type: "textarea", required: true },
    { id: "threadTs", label: "Thread Timestamp", type: "text", placeholder: "optional thread reply" },
  ],
  async execute(input, credential, _context): Promise<OperationOutput> {
    const parsed = sendMessageOp.inputSchema.parse(input) as { channel: string; text: string; threadTs: string };
    const token = (credential.access_token || credential.accessToken || credential.api_key || "") as string;
    if (!token) throw new ConnectorError({ connectorId: "slack", operationId: "send_message", message: "Missing bot token", statusCode: 401 });

    const body: Record<string, unknown> = { channel: parsed.channel, text: parsed.text };
    if (parsed.threadTs) body.thread_ts = parsed.threadTs;

    const data = await slackFetch(token, "chat.postMessage", body);
    return { data: { ok: true, ts: data.ts as string, channel: data.channel as string } };
  },
};

const listChannelsOp: IOperation = {
  id: "list_channels",
  name: "List Channels",
  description: "List all channels in the workspace",
  type: "action",
  inputSchema: z.object({ limit: z.number().min(1).max(200).default(100), cursor: z.string().optional().default("") }),
  outputSchema: z.object({ channels: z.array(z.object({ id: z.string(), name: z.string() })), nextCursor: z.string() }),
  fields: [{ id: "limit", label: "Limit", type: "number", default: 100 }],
  async execute(input, credential, _context): Promise<OperationOutput> {
    const parsed = listChannelsOp.inputSchema.parse(input) as { limit: number; cursor: string };
    const token = (credential.access_token || credential.accessToken || credential.api_key || "") as string;
    if (!token) throw new ConnectorError({ connectorId: "slack", operationId: "list_channels", message: "Missing bot token", statusCode: 401 });

    const body: Record<string, unknown> = { limit: parsed.limit, types: "public_channel,private_channel" };
    if (parsed.cursor) body.cursor = parsed.cursor;

    const data = await slackFetch(token, "conversations.list", body);
    const channels = ((data.channels || []) as any[]).map((c: any) => ({ id: c.id as string, name: c.name as string }));
    return { data: { channels, nextCursor: (data.response_metadata?.next_cursor as string) || "" } };
  },
};

export class SlackConnector extends BaseConnector {
  id = "slack";
  name = "Slack";
  description = "Send messages, list channels via Slack Web API";
  icon = "https://cdn.simpleicons.org/slack";
  category = "communication" as const;
  authType = "oauth2" as const;
  authConfig: AuthConfig = {
    oauth2: { authUrl: "https://slack.com/oauth/v2/authorize", tokenUrl: "https://slack.com/api/oauth.v2.access", scopes: ["channels:read", "chat:write", "channels:history"] },
  };
  operations = [sendMessageOp, listChannelsOp];

  async testConnection(credential: Record<string, unknown>): Promise<ConnectionTestResult> {
    try {
      const token = (credential.access_token || credential.accessToken || credential.api_key || "") as string;
      if (!token) return { ok: false, message: "No token provided" };
      const data = await slackFetch(token, "auth.test", {});
      return { ok: true, message: `Authenticated as @${(data as any).user_id || "unknown"}` };
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : "Connection failed" };
    }
  }
}
