import { getDb } from "../database";
import { v4 as uuid } from "uuid";
import { logger } from "../logger";

const BLOCKED_HOSTS = /^(127\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|0\.0\.0\.0|localhost|::1)/i;

function validateUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") throw new Error("Only http/https allowed");
    if (BLOCKED_HOSTS.test(parsed.hostname)) throw new Error(`Blocked internal host: ${parsed.hostname}`);
    if (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1" || parsed.hostname === "::1" || parsed.hostname === "0.0.0.0") throw new Error("Blocked localhost/loopback");
    return url;
  } catch (err) {
    throw err instanceof Error && err.message.includes("Blocked") ? err : new Error(`Invalid URL: ${url}`);
  }
}

interface MCPServerConfig {
  id: string;
  userId: string;
  name: string;
  url: string;
  transport: "sse" | "stdio";
  status: "disconnected" | "connected" | "error";
  tools: string;
  createdAt: string;
  lastPingAt: string | null;
}

// In-memory active connections (SSE or stdio)
const connections = new Map<string, { connected: boolean; tools: Record<string, unknown>[] }>();

export class MCPRegistry {
  list(userId: string): MCPServerConfig[] {
    const db = getDb();
    return db.prepare("SELECT * FROM mcp_servers WHERE user_id = ? ORDER BY created_at DESC").all(userId) as MCPServerConfig[];
  }

  get(id: string, userId: string): MCPServerConfig | undefined {
    const db = getDb();
    return db.prepare("SELECT * FROM mcp_servers WHERE id = ? AND user_id = ?").get(id, userId) as MCPServerConfig | undefined;
  }

  save(input: { name: string; url: string; transport: string }, userId: string): MCPServerConfig {
    const db = getDb();
    const id = uuid();
    db.prepare("INSERT INTO mcp_servers (id, user_id, name, url, transport) VALUES (?,?,?,?,?)")
      .run(id, userId, input.name, input.url, input.transport);
    return this.get(id, userId)!;
  }

  delete(id: string, userId: string): boolean {
    const db = getDb();
    connections.delete(id);
    return db.prepare("DELETE FROM mcp_servers WHERE id = ? AND user_id = ?").run(id, userId).changes > 0;
  }

  async connect(serverId: string, userId: string): Promise<boolean> {
    const server = this.get(serverId, userId);
    if (!server) return false;
    try {
      validateUrl(server.url); // SSRF protection
      if (server.transport === "sse") {
        const res = await fetch(server.url.replace(/\/+$/, "") + "/tools/list", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
        if (!res.ok) throw new Error(`SSE connect failed: ${res.status}`);
        const tools = await res.json();
        const db = getDb();
        db.prepare("UPDATE mcp_servers SET status = 'connected', tools = ?, last_ping_at = datetime('now') WHERE id = ?")
          .run(JSON.stringify(tools.tools || []), serverId);
        connections.set(serverId, { connected: true, tools: tools.tools || [] });
        return true;
      }
      // stdio transport mock
      connections.set(serverId, { connected: true, tools: [] });
      return true;
    } catch (err) {
      const db = getDb();
      db.prepare("UPDATE mcp_servers SET status = 'error' WHERE id = ?").run(serverId);
      logger.error({ err, serverId }, "MCP connect failed");
      return false;
    }
  }

  async disconnect(serverId: string, userId: string): Promise<boolean> {
    const db = getDb();
    connections.delete(serverId);
    db.prepare("UPDATE mcp_servers SET status = 'disconnected' WHERE id = ? AND user_id = ?").run(serverId, userId);
    return true;
  }

  async callTool(serverId: string, userId: string, toolName: string, args: Record<string, unknown>): Promise<unknown> {
    const server = this.get(serverId, userId);
    if (!server) throw new Error("MCP server not found");
    if (!connections.has(serverId)) throw new Error("MCP server not connected");

    const conn = connections.get(serverId)!;
    const tool = conn.tools.find((t: any) => t.name === toolName);
    if (!tool) throw new Error(`Tool "${toolName}" not found on server`);

    // In production, would call the SSE endpoint or send to stdio process
    return { result: args, tool: toolName, server: server.name };
  }

  async reconnectLoop(): Promise<void> {
    const db = getDb();
    const errored = db.prepare("SELECT * FROM mcp_servers WHERE status IN ('error', 'disconnected')").all() as MCPServerConfig[];
    for (const server of errored) {
      try {
        await this.connect(server.id, server.userId);
      } catch (err) { logger.error({ err, serverId: server.id }, "MCP reconnect failed"); }
    }
  }
}

// Marketplace of well-known MCP servers
export const MCP_MARKETPLACE = [
  { id: "filesystem", name: "Filesystem", description: "Read, write, search local files", url: "npm:@modelcontextprotocol/server-filesystem", transport: "stdio" },
  { id: "github", name: "GitHub MCP", description: "PRs, issues, repos, search", url: "npm:@modelcontextprotocol/server-github", transport: "stdio" },
  { id: "postgres", name: "PostgreSQL", description: "SQL queries & schema inspection", url: "npm:@modelcontextprotocol/server-postgres", transport: "stdio" },
  { id: "slack", name: "Slack MCP", description: "Messages, channels, users", url: "npm:@modelcontextprotocol/server-slack", transport: "stdio" },
  { id: "puppeteer", name: "Puppeteer", description: "Browser automation & scraping", url: "npm:@modelcontextprotocol/server-puppeteer", transport: "stdio" },
  { id: "brave-search", name: "Brave Search", description: "Web & local search", url: "npm:@modelcontextprotocol/server-brave-search", transport: "stdio" },
  { id: "fetch", name: "Fetch", description: "HTTP requests & HTML parsing", url: "npm:@modelcontextprotocol/server-fetch", transport: "stdio" },
  { id: "memory", name: "Memory", description: "Persistent knowledge graph memory", url: "npm:@modelcontextprotocol/server-memory", transport: "stdio" },
  { id: "playwright", name: "Playwright", description: "Browser automation", url: "npm:@anthropic/mcp-server-playwright", transport: "stdio" },
  { id: "google-maps", name: "Google Maps", description: "Maps and places", url: "npm:@modelcontextprotocol/server-google-maps", transport: "stdio" },
];
