import { z } from "zod";
import { BaseConnector } from "./BaseConnector.js";
import { ConnectorError } from "../core/ConnectorError.js";
import type { IOperation, OperationOutput, ConnectionTestResult, AuthConfig } from "../core/interfaces/IConnector.js";

const sendMessageOp: IOperation = {
  id: "send_message", name: "Send Message", description: "Send a message to a Discord channel via webhook", type: "action",
  inputSchema: z.object({ webhookUrl: z.string().url(), content: z.string().min(1).max(2000) }),
  outputSchema: z.object({ sent: z.boolean() }),
  fields: [
    { id: "webhookUrl", label: "Webhook URL", type: "text", required: true, placeholder: "https://discord.com/api/webhooks/..." },
    { id: "content", label: "Content", type: "textarea", required: true },
  ],
  async execute(input, credential, _ctx): Promise<OperationOutput> {
    const p = input as { webhookUrl: string; content: string };
    const url = p.webhookUrl || (credential.webhook_url as string) || "";
    if (!url) throw new ConnectorError({ connectorId: "discord", operationId: "send_message", message: "Webhook URL required", statusCode: 400 });
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: p.content }) });
    if (!res.ok && res.status !== 204) { const t = await res.text(); throw new ConnectorError({ connectorId: "discord", operationId: "send_message", message: `Discord error ${res.status}: ${t.slice(0, 200)}`, statusCode: res.status }); }
    return { data: { sent: true } };
  },
};

export class DiscordConnector extends BaseConnector {
  id = "discord"; name = "Discord"; description = "Send messages to Discord channels via webhooks";
  icon = "https://cdn.simpleicons.org/discord"; category = "communication" as const;
  authType = "api_key" as const; authConfig: AuthConfig = { apiKey: { header: "Authorization", type: "header" as const } };
  operations = [sendMessageOp];
  async testConnection(): Promise<ConnectionTestResult> { return { ok: true, message: "Discord webhook connector ready" }; }
}
