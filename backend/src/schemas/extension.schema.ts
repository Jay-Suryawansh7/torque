import { z } from "zod";

export const CredentialSchema = z.object({
  id: z.string().default(""),
  name: z.string().default(""),
  provider: z.string().default("openai"),
  api_key: z.string().default(""),
  base_url: z.string().default(""),
  oauth_token: z.string().default(""),
  oauth_refresh: z.string().default(""),
  oauth_expires: z.number().default(0),
  oauth_scopes: z.string().default(""),
  is_configured: z.boolean().default(false),
});

export const ConnectorSchema = z.object({
  id: z.string().default(""),
  name: z.string().default(""),
  type: z.string(),
  config: z.record(z.string(), z.string()).default({}),
  credential_id: z.string().nullable().default(null),
  connected: z.boolean().default(false),
  readonly: z.boolean().default(false),
  confirm_destructive: z.boolean().default(true),
  operations: z.array(z.string()).default([]),
});

export const MCPServerSchema = z.object({
  id: z.string().default(""),
  name: z.string().default(""),
  url: z.string(),
  transport: z.string().default("sse"),
  tools: z.array(z.record(z.string(), z.unknown())).default([]),
  enabled: z.boolean().default(true),
});
