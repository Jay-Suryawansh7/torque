import { Router, type Request, type Response } from "express";
import { v4 as uuid } from "uuid";
import { LLMProvider } from "../types.js";
import { CredentialStore, ConnectorStore, MCPServerStore, SkillStore, OAuthHandler } from "../engine/stores.js";
import { MCPRegistry } from "../engine/mcp-registry.js";
import { CredentialService } from "../engine/credential-service.js";
import { listConnectors, getConnector, getOperations, getOperation } from "../connectors/registry.js";
import { listSkills, getSkill } from "../skills/registry.js";
import { MCPRegistry as MCPRegistryV2, MCP_MARKETPLACE } from "../mcp/MCPRegistry.js";
import { CredentialSchema, ConnectorSchema, MCPServerSchema } from "../schemas/extension.schema.js";
import { validate } from "../schemas/validate.js";
import { authMiddleware } from "../auth/index.js";
import { logger } from "../logger.js";
import { z } from "zod";
import { wrap } from "./wrap.js";

export function extensionsRouter(dataDir: string): Router {
  const router = Router();
  const credStore = new CredentialStore(dataDir);
  const connectors = new ConnectorStore(dataDir);
  const mcpServers = new MCPServerStore(dataDir);
  const skills = new SkillStore();
  const mcp = new MCPRegistry(dataDir, connectors, mcpServers);
  const credSvc = new CredentialService();

  // ── Providers ──
  router.get("/providers", authMiddleware, wrap((_req: Request, res: Response) => { res.json(CredentialStore.providers()); }));
  router.get("/providers/marketplace", authMiddleware, wrap((_req: Request, res: Response) => { res.json(CredentialStore.providers()); }));

  // ── App Connectors (from connector registry) ──
  router.get("/connectors/marketplace", authMiddleware, wrap((_req: Request, res: Response) => {
    res.json(listConnectors().map(c => ({ id: c.id, name: c.name, description: c.description, icon: c.icon, category: c.category, authType: c.authType, operations: c.operations.map(o => ({ id: o.id, name: o.name, description: o.description, type: o.type, fields: o.fields })) })));
  }));

  router.get("/connectors/:id", authMiddleware, wrap((req: Request, res: Response) => {
    const c = getConnector(req.params.id);
    if (!c) { res.status(404).json({ error: "Connector not found" }); return; }
    res.json({ id: c.id, name: c.name, description: c.description, icon: c.icon, category: c.category, authType: c.authType, authConfig: c.authConfig, operations: c.operations.map(o => ({ id: o.id, name: o.name, description: o.description, type: o.type, fields: o.fields, inputSchema: o.inputSchema })) });
  }));

  router.get("/connectors/:connectorId/operations/:operationId", authMiddleware, wrap((req: Request, res: Response) => {
    const op = getOperation(req.params.connectorId, req.params.operationId);
    if (!op) { res.status(404).json({ error: "Operation not found" }); return; }
    res.json({ id: op.id, name: op.name, description: op.description, type: op.type, fields: op.fields });
  }));

  // ── Credentials (encrypted) ──
  router.get("/credentials", authMiddleware, wrap((req: Request, res: Response) => {
    res.json(credSvc.list((req as any).user.id));
  }));

  router.post("/credentials", authMiddleware, validate(CredentialSchema), wrap((req: Request, res: Response) => {
    const body = req.body;
    const result = credSvc.save({ name: body.name, connectorId: body.provider || body.connectorId || "custom", data: body, authType: "api_key" }, (req as any).user.id);
    res.json(result);
  }));

  router.delete("/credentials/:id", authMiddleware, wrap((req: Request, res: Response) => {
    if (!credSvc.delete(req.params.id, (req as any).user.id)) { res.status(404).json({ ok: false }); return; }
    res.json({ ok: true });
  }));

  router.post("/credentials/:id/test", authMiddleware, wrap(async (req: Request, res: Response) => {
    const connectorId = req.query.connectorId as string || "";
    const connector = getConnector(connectorId);
    if (!connector) { res.status(404).json({ error: "Connector not found" }); return; }
    const decrypted = await credSvc.getDecrypted(req.params.id, (req as any).user.id);
    if (!decrypted) { res.status(404).json({ error: "Credential not found" }); return; }
    const testResult = await connector.testConnection(decrypted);
    res.json(testResult);
  }));

  // ── Legacy connector marketplace (from stores) ──
  router.get("/connectors", authMiddleware, wrap((_req: Request, res: Response) => { res.json(connectors.list()); }));
  router.post("/connectors", authMiddleware, validate(ConnectorSchema), wrap(async (req: Request, res: Response) => {
    const conn = req.body;
    conn.connected = true;
    for (const item of ConnectorStore.marketplace()) {
      if (item.id === conn.type) { conn.operations = item.operations; break; }
    }
    res.json(await connectors.save(conn));
  }));
  router.delete("/connectors/:id", authMiddleware, wrap(async (req: Request, res: Response) => {
    if (!await connectors.delete(req.params.id)) { res.status(404).json({ ok: false }); return; }
    res.json({ ok: true });
  }));
  router.get("/connectors/:id/discover", authMiddleware, wrap((req: Request, res: Response) => {
    const conn = connectors.get(req.params.id);
    if (!conn) { res.status(404).json({ ok: false }); return; }
    for (const item of ConnectorStore.marketplace()) {
      if (item.id === conn.type) {
        res.json({ operations: item.operations, auth_type: item.auth_type, readonly: item.readonly });
        return;
      }
    }
    res.json({ operations: conn.operations });
  }));

  // ── OAuth with CSRF protection ──
  const oauthStates = new Map<string, { createdAt: number }>();
  setInterval(() => { const now = Date.now(); for (const [k, v] of oauthStates) { if (now - v.createdAt > 600000) oauthStates.delete(k); } }, 60000);

  router.get("/connectors/:type/oauth/start", authMiddleware, wrap((req: Request, res: Response) => {
    const connectorType = req.params.type;
    const state = uuid();
    oauthStates.set(state, { createdAt: Date.now() });
    const baseUrl = process.env.APP_BASE_URL || `http://localhost:${process.env.PORT || 8000}`;
    const redirectUri = `${baseUrl}/api/connectors/${connectorType}/oauth/callback`;
    const authUrl = OAuthHandler.buildAuthorizeUrl(connectorType, redirectUri, state);
    if (!authUrl) { res.status(400).json({ detail: `No OAuth config for ${connectorType}` }); return; }
    res.json({ auth_url: authUrl, state });
  }));

  router.get("/connectors/:type/oauth/callback", wrap(async (req: Request, res: Response) => {
    const connectorType = req.params.type;
    const state = typeof req.query.state === "string" ? req.query.state : "";
    if (!state || !oauthStates.has(state)) { res.status(403).json({ error: "Invalid or missing OAuth state — possible CSRF" }); return; }
    oauthStates.delete(state);
    const code = typeof req.query.code === "string" ? req.query.code : "";
    const error = typeof req.query.error === "string" ? req.query.error : undefined;
    if (error) { res.status(400).json({ detail: `OAuth error: ${error}` }); return; }
    const baseUrl = process.env.APP_BASE_URL || `http://localhost:${process.env.PORT || 8000}`;
    const redirectUri = `${baseUrl}/api/connectors/${connectorType}/oauth/callback`;
    const tokenData = OAuthHandler.exchangeCode(connectorType, code, redirectUri);
    if (!tokenData) { res.status(400).json({ detail: "Token exchange failed" }); return; }
    const cred = await credStore.save({
      id: "", name: `${connectorType} OAuth`, provider: LLMProvider.custom,
      api_key: "", base_url: "",
      oauth_token: typeof tokenData.access_token === "string" ? tokenData.access_token : "",
      oauth_refresh: typeof tokenData.refresh_token === "string" ? tokenData.refresh_token : "",
      oauth_expires: Date.now() / 1000 + (typeof tokenData.expires_in === "number" ? tokenData.expires_in : 3600),
      oauth_scopes: typeof tokenData.scope === "string" ? tokenData.scope : "",
      is_configured: true,
    });
    res.json({ ok: true, credential_id: cred.id });
  }));

  // ── Skills ──
  router.get("/skills", authMiddleware, wrap((_req: Request, res: Response) => { res.json(skills.list()); }));

  // ── MCP Discovery ──
  router.get("/mcp/discover", authMiddleware, wrap((_req: Request, res: Response) => { res.json(mcp.discoverAll()); }));
  router.get("/mcp/tools", authMiddleware, wrap((_req: Request, res: Response) => { res.json(mcp.listTools()); }));
  router.get("/mcp/resources", authMiddleware, wrap((_req: Request, res: Response) => { res.json(mcp.listResources()); }));

  router.get("/mcp/resources/*", authMiddleware, wrap(async (req: Request, res: Response) => {
    const uri = req.params[0] || req.path.replace("/api/mcp/resources/", "");
    const result = await mcp.readResource(uri);
    if (!result) { res.status(404).json({ detail: `Resource not found: ${uri}` }); return; }
    res.json(result);
  }));

  router.get("/mcp/prompts", authMiddleware, wrap((_req: Request, res: Response) => { res.json(mcp.listPrompts()); }));

  router.get("/mcp/prompts/:name", authMiddleware, wrap((req: Request, res: Response) => {
    const input = typeof req.query.input === "string" ? req.query.input : "";
    const args = input ? { input } : undefined;
    const result = mcp.getPrompt(req.params.name, args);
    if (!result) { res.status(404).json({ ok: false }); return; }
    res.json(result);
  }));

  router.get("/mcp/permissions", authMiddleware, wrap((req: Request, res: Response) => {
    const tool = typeof req.query.tool === "string" ? req.query.tool : "";
    const action = typeof req.query.action === "string" ? req.query.action : "write";
    res.json(mcp.checkPermission(tool, action));
  }));

  // ── Permissions ──
  router.get("/permissions/check", authMiddleware, wrap((req: Request, res: Response) => {
    const connectorId = typeof req.query.connector_id === "string" ? req.query.connector_id : "";
    const action = typeof req.query.action === "string" ? req.query.action : "";
    const conn = connectors.get(connectorId);
    if (!conn) { res.json({ allowed: false, reason: "not_found" }); return; }
    if (["delete", "update", "write"].includes(action) && conn.readonly) {
      res.json({ allowed: false, reason: "readonly", confirm_needed: false }); return;
    }
    if (conn.confirm_destructive && ["delete", "destroy", "remove", "archive"].includes(action)) {
      res.json({ allowed: true, reason: "needs_confirmation", confirm_needed: true }); return;
    }
    res.json({ allowed: true, reason: "ok", confirm_needed: false });
  }));

  // ── Agent Skills ──
  router.get("/skills/list", authMiddleware, wrap((_req: Request, res: Response) => {
    res.json(listSkills().map(s => ({ id: s.id, name: s.name, description: s.description })));
  }));

  router.get("/skills/:id", authMiddleware, wrap((req: Request, res: Response) => {
    const skill = getSkill(req.params.id);
    if (!skill) { res.status(404).json({ error: "Skill not found" }); return; }
    res.json({ id: skill.id, name: skill.name, description: skill.description });
  }));

  // ── New MCP Server Management ──
  const mcpRegistry = new MCPRegistryV2();

  router.get("/mcp-servers/v2", authMiddleware, wrap((req: Request, res: Response) => {
    res.json(mcpRegistry.list((req as any).user.id));
  }));

  const mcpCreateSchema = z.object({ name: z.string().min(1), url: z.string().url(), transport: z.string().default("sse") });
  router.post("/mcp-servers/v2", authMiddleware, wrap(async (req: Request, res: Response) => {
    const parsed = mcpCreateSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() }); return; }
    const { name, url, transport } = parsed.data;
    const server = mcpRegistry.save({ name, url, transport }, (req as any).user.id);
    res.json(server);
  }));

  router.post("/mcp-servers/v2/:id/connect", authMiddleware, wrap(async (req: Request, res: Response) => {
    const ok = await mcpRegistry.connect(req.params.id, (req as any).user.id);
    res.json({ connected: ok });
  }));

  router.post("/mcp-servers/v2/:id/disconnect", authMiddleware, wrap(async (req: Request, res: Response) => {
    await mcpRegistry.disconnect(req.params.id, (req as any).user.id);
    res.json({ ok: true });
  }));

  router.delete("/mcp-servers/v2/:id", authMiddleware, wrap((req: Request, res: Response) => {
    if (!mcpRegistry.delete(req.params.id, (req as any).user.id)) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ ok: true });
  }));

  router.get("/mcp-marketplace", authMiddleware, wrap((_req: Request, res: Response) => {
    res.json(MCP_MARKETPLACE);
  }));

  // Background MCP reconnect loop
  setInterval(() => { mcpRegistry.reconnectLoop().catch((err) => logger.error({ err }, "MCP reconnect loop failed")); }, 30000);

  return router;
}
