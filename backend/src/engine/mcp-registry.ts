import { ConnectorStore, MCPServerStore, SkillStore, CredentialStore } from "./stores";
import { WorkflowService } from "./workflow-service";

export class MCPRegistry {
  private connectors: ConnectorStore;
  private mcpServers: MCPServerStore;
  private skills: SkillStore;
  private dataDir: string;
  private svc: WorkflowService;

  constructor(dataDir: string, connectors?: ConnectorStore, mcpServers?: MCPServerStore) {
    this.dataDir = dataDir;
    this.connectors = connectors ?? new ConnectorStore(dataDir);
    this.mcpServers = mcpServers ?? new MCPServerStore(dataDir);
    this.skills = new SkillStore();
    this.svc = new WorkflowService();
  }

  listTools(): Record<string, unknown>[] {
    const tools: Record<string, unknown>[] = [];

    for (const conn of this.connectors.list()) {
      if (!conn.connected) continue;
      for (const item of ConnectorStore.marketplace()) {
        if (item.id !== conn.type) continue;
        for (const op of item.operations) {
          tools.push({
            name: `${conn.type}__${op}`,
            description: `${item.name}: ${op.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}`,
            input_schema: {
              type: "object",
              properties: {
                action: { type: "string", description: `The operation to perform: ${op}` },
                params: { type: "object", description: "Operation parameters" },
              },
            },
            server: `connector://${conn.type}`,
            readonly: item.readonly,
            confirm_destructive: conn.confirm_destructive,
          });
        }
      }
    }

    for (const server of this.mcpServers.list()) {
      if (!server.enabled) continue;
      for (const tool of server.tools) {
        const t = tool as Record<string, unknown>;
        tools.push({
          name: `mcp_${server.id.slice(0, 6)}__${t.name}`,
          description: `${server.name}: ${t.description}`,
          input_schema: { type: "object", properties: { params: { type: "object" } } },
          server: `mcp://${server.id}`,
          readonly: false,
          confirm_destructive: false,
        });
      }
    }

    tools.push(
      { name: "code_interpreter", description: "Execute Python/JS code in sandbox",
        input_schema: { type: "object", properties: { code: { type: "string" }, language: { type: "string" } } },
        server: "builtin://runtime", readonly: false, confirm_destructive: false },
      { name: "web_search", description: "Search the web for information",
        input_schema: { type: "object", properties: { query: { type: "string" } } },
        server: "builtin://runtime", readonly: true, confirm_destructive: false },
      { name: "web_scrape", description: "Scrape content from a URL",
        input_schema: { type: "object", properties: { url: { type: "string" } } },
        server: "builtin://runtime", readonly: true, confirm_destructive: false },
      { name: "computer_use", description: "Control browser: navigate, click, type, screenshot",
        input_schema: { type: "object", properties: { action: { type: "string", enum: ["navigate", "click", "type", "screenshot", "get_text"] }, selector: { type: "string" }, text: { type: "string" }, url: { type: "string" } } },
        server: "builtin://computer-use", readonly: false, confirm_destructive: true },
      { name: "file_system", description: "Read and write files",
        input_schema: { type: "object", properties: { path: { type: "string" }, content: { type: "string" } } },
        server: "builtin://runtime", readonly: false, confirm_destructive: false },
      { name: "http_request", description: "Make HTTP requests to any API",
        input_schema: { type: "object", properties: { url: { type: "string" }, method: { type: "string" }, headers: { type: "object" }, body: { type: "string" } } },
        server: "builtin://runtime", readonly: false, confirm_destructive: false },
    );

    return tools;
  }

  getConnectorTools(connectorType: string): Record<string, unknown>[] {
    return this.listTools().filter(t => (t.server as string) === `connector://${connectorType}`);
  }

  listResources(): Record<string, unknown>[] {
    const resources: Record<string, unknown>[] = [];

    for (const conn of this.connectors.list()) {
      if (!conn.connected) continue;
      const prefix = `${conn.type}://`;
      resources.push({ uri: `${prefix}docs`, name: `${conn.name} Documentation`, description: `API docs and usage for ${conn.name}`, mime_type: "text/markdown" });
      resources.push({ uri: `${prefix}schemas`, name: `${conn.name} Schemas`, description: `Data schemas for ${conn.name}`, mime_type: "application/json" });
      resources.push({ uri: `${prefix}config`, name: `${conn.name} Configuration`, description: `Current config for ${conn.name}`, mime_type: "application/json" });
    }

    resources.push(
      { uri: "system://memory", name: "Agent Memory", description: "Persistent key-value memory across sessions", mime_type: "application/json" },
      { uri: "system://config", name: "System Configuration", description: "Current agent configuration and environment", mime_type: "application/json" },
      { uri: "system://workflows", name: "Saved Workflows", description: "List of saved workflow definitions", mime_type: "application/json" },
      { uri: "system://credentials", name: "Credential Status", description: "Which providers and connectors are configured", mime_type: "application/json" },
      { uri: "system://logs", name: "Execution Logs", description: "Recent workflow execution history", mime_type: "application/json" },
    );

    return resources;
  }

  readResource(uri: string): Record<string, unknown> | undefined {
    if (uri === "system://memory") {
      return { content: JSON.stringify({ note: "Memory store ready" }, null, 2) };
    }
    if (uri === "system://config") {
      const wfResult = this.svc.list("", 1, 0);
      return { content: JSON.stringify({
        version: "0.1.0",
        mcp_servers: this.mcpServers.list().length,
        workflows: wfResult.total,
      }, null, 2) };
    }
    if (uri === "system://workflows") {
      const wfResult = this.svc.list("", 100, 0);
      return { content: JSON.stringify(wfResult.workflows.map((w: any) => ({ id: w.id, name: w.name, nodes: w.nodes.length })), null, 2) };
    }
    if (uri === "system://logs") {
      const runsResult = this.svc.listRuns(undefined, undefined, 10, 0);
      return { content: JSON.stringify(runsResult.runs.map((r: any) => ({ id: r.id, workflow_id: r.workflow_id, status: r.status, started: r.started_at })), null, 2) };
    }

    for (const conn of this.connectors.list()) {
      if (!conn.connected) continue;
      const prefix = `${conn.type}://`;
      if (!uri.startsWith(prefix)) continue;
      const key = uri.slice(prefix.length);
      for (const item of ConnectorStore.marketplace()) {
        if (item.id !== conn.type) continue;
        if (key === "docs") {
          return { content: `# ${item.name} Connector\n\n${item.description}\n\n## Operations\n\n${item.operations.map((op: string) => `- \`${op}\``).join("\n")}` };
        }
        if (key === "schemas") {
          return { content: JSON.stringify({ type: "connector", provider: item.name, auth: item.auth_type, operations: item.operations }, null, 2) };
        }
        if (key === "config") {
          return { content: JSON.stringify({ id: conn.id, name: conn.name, type: conn.type, readonly: conn.readonly, confirm_destructive: conn.confirm_destructive }, null, 2) };
        }
      }
    }

    return undefined;
  }

  listPrompts(): Record<string, unknown>[] {
    return this.skills.list().map(skill => ({
      name: skill.id,
      description: skill.description,
      arguments: skill.prompt_template.includes("{input}")
        ? [{ name: "input", description: "The input for this skill", required: true }]
        : [],
    }));
  }

  getPrompt(name: string, arguments_?: Record<string, string>): Record<string, unknown> | undefined {
    for (const skill of this.skills.list()) {
      if (skill.id === name) {
        let filled = skill.prompt_template;
        if (arguments_) {
          for (const [k, v] of Object.entries(arguments_)) {
            filled = filled.replace(`{${k}}`, v);
          }
        }
        return { name, description: skill.description, prompt: filled, tools: skill.tools };
      }
    }
    return undefined;
  }

  discoverAll(): Record<string, unknown> {
    return {
      servers: this._listServers(),
      tools: this.listTools(),
      resources: this.listResources(),
      prompts: this.listPrompts(),
    };
  }

  private _listServers(): Record<string, string>[] {
    const servers: Record<string, string>[] = [
      { id: "builtin://runtime", name: "Torque Runtime", type: "builtin" },
      { id: "builtin://computer-use", name: "Computer Use", type: "builtin" },
    ];
    for (const conn of this.connectors.list()) {
      if (conn.connected) servers.push({ id: `connector://${conn.type}`, name: conn.name, type: "connector" });
    }
    for (const server of this.mcpServers.list()) {
      if (server.enabled) servers.push({ id: `mcp://${server.id}`, name: server.name, type: "mcp" });
    }
    return servers;
  }

  checkPermission(toolName: string, action = "write"): Record<string, unknown> {
    const tools = this.listTools();
    for (const t of tools) {
      if (t.name === toolName) {
        if (["delete", "destroy", "remove", "archive"].includes(action) && t.confirm_destructive) {
          return { allowed: true, confirm_needed: true };
        }
        if (t.readonly && ["write", "delete", "update"].includes(action)) {
          return { allowed: false, reason: "readonly", confirm_needed: false };
        }
        return { allowed: true, confirm_needed: false };
      }
    }
    return { allowed: true, confirm_needed: false };
  }
}
