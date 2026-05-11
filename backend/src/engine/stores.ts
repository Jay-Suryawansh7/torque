import { readFileSync, writeFileSync, renameSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { v4 as uuid } from "uuid";
import { Mutex } from "async-mutex";
import type { Credential, Connector, MCPServer, Skill, ProviderInfo, ConnectorItem, MCPServerItem } from "../types.js";
import { LLMProvider } from "../types.js";
import { logger } from "../logger.js";

const ICON_CDN = "https://cdn.simpleicons.org";

function readJSON<T>(filePath: string): Record<string, T> {
  try {
    if (!existsSync(filePath)) return {};
    return JSON.parse(readFileSync(filePath, "utf-8"));
  } catch (err) {
    logger.error({ filePath, err }, "Failed to read file");
    return {};
  }
}

function writeJSON<T>(filePath: string, data: Record<string, T>): void {
  const tmp = filePath + ".tmp";
  writeFileSync(tmp, JSON.stringify(data, null, 2));
  renameSync(tmp, filePath);
}

// ── Credential Store ──

export class CredentialStore {
  private _file: string;
  private _data: Record<string, Credential> = {};
  private _mutex = new Mutex();

  constructor(dataDir: string) {
    mkdirSync(dataDir, { recursive: true });
    this._file = join(dataDir, "credentials.json");
    this._load();
  }

  private _load(): void {
    this._data = readJSON<Credential>(this._file);
  }

  private _save(): void {
    writeJSON(this._file, this._data);
  }

  list(): Credential[] {
    return Object.values(this._data).map(c => ({
      ...c,
      api_key: c.api_key ? "••••••" : "",
      oauth_token: c.oauth_token ? "••••••" : "",
    }));
  }

  get(id: string): Credential | undefined {
    const cred = this._data[id];
    if (!cred) return undefined;
    return { ...cred, api_key: "••••••", oauth_token: "••••••", oauth_refresh: "••••••" };
  }

  getRaw(id: string): Credential | undefined {
    return this._data[id];
  }

  async save(cred: Credential): Promise<Credential> {
    return this._mutex.runExclusive(() => {
      if (!cred.id) cred.id = uuid();
      cred.is_configured = !!cred.api_key || !!cred.oauth_token;
      this._data[cred.id] = cred;
      this._save();
      return { ...cred, api_key: cred.api_key ? "••••••" : "", oauth_token: cred.oauth_token ? "••••••" : "" };
    });
  }

  async delete(id: string): Promise<boolean> {
    return this._mutex.runExclusive(() => {
      if (!this._data[id]) return false;
      delete this._data[id];
      this._save();
      return true;
    });
  }

  static providers(): ProviderInfo[] {
    return [
      { id: "openai", name: "OpenAI", icon: `${ICON_CDN}/openai`, docs: "platform.openai.com/api-keys",
        endpoint: "https://api.openai.com/v1", auth_type: "api_key",
        models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo", "o1", "o3-mini"] },
      { id: "anthropic", name: "Anthropic", icon: `${ICON_CDN}/anthropic`, docs: "console.anthropic.com/settings/keys",
        endpoint: "https://api.anthropic.com", auth_type: "api_key",
        models: ["claude-sonnet-4-20250514", "claude-haiku-3-5", "claude-opus-4-20250514"] },
      { id: "google", name: "Google AI", icon: `${ICON_CDN}/google`, docs: "aistudio.google.com/apikey",
        endpoint: "https://generativelanguage.googleapis.com", auth_type: "api_key",
        models: ["gemini-2.5-pro", "gemini-2.0-flash", "gemini-1.5-pro"] },
      { id: "groq", name: "Groq", icon: `${ICON_CDN}/groq`, docs: "console.groq.com/keys",
        endpoint: "https://api.groq.com/openai/v1", auth_type: "api_key",
        models: ["llama-3.3-70b", "llama-3.1-8b", "mixtral-8x7b", "gemma2-9b"] },
      { id: "together", name: "Together AI", icon: `${ICON_CDN}/togetherai`, docs: "api.together.ai/settings/api-keys",
        endpoint: "https://api.together.xyz/v1", auth_type: "api_key",
        models: ["mixtral-8x22b", "llama-3.3-70b", "deepseek-coder-33b"] },
      { id: "openrouter", name: "OpenRouter", icon: `${ICON_CDN}/openrouter`, docs: "openrouter.ai/keys",
        endpoint: "https://openrouter.ai/api/v1", auth_type: "api_key",
        models: ["openrouter/auto", "openai/gpt-4o", "anthropic/claude-sonnet", "google/gemini-pro"] },
      { id: "ollama", name: "Ollama (Local)", icon: `${ICON_CDN}/ollama`, docs: "ollama.com/download",
        endpoint: "http://localhost:11434", auth_type: "none",
        models: ["llama3", "llama3.1", "mistral", "codellama", "phi3", "qwen2", "deepseek-r1", "gemma2"] },
      { id: "lm_studio", name: "LM Studio (Local)", icon: `${ICON_CDN}/lmstudio`, docs: "lmstudio.ai",
        endpoint: "http://localhost:1234/v1", auth_type: "none", models: ["local-model"] },
      { id: "litellm", name: "LiteLLM Proxy", icon: `${ICON_CDN}/litellm`, docs: "docs.litellm.ai",
        endpoint: "http://localhost:4000", auth_type: "api_key", models: ["gpt-4", "claude-3", "custom-model"] },
      { id: "deepinfra", name: "DeepInfra", icon: `${ICON_CDN}/deepinfra`, docs: "deepinfra.com",
        endpoint: "https://api.deepinfra.com/v1/openai", auth_type: "api_key",
        models: ["meta-llama/Llama-3.3-70B", "mistralai/Mixtral-8x22B"] },
      { id: "perplexity", name: "Perplexity", icon: `${ICON_CDN}/perplexity`, docs: "docs.perplexity.ai",
        endpoint: "https://api.perplexity.ai", auth_type: "api_key", models: ["sonar-pro", "sonar"] },
      { id: "mistral", name: "Mistral AI", icon: `${ICON_CDN}/mistral`, docs: "console.mistral.ai/api-keys",
        endpoint: "https://api.mistral.ai/v1", auth_type: "api_key",
        models: ["mistral-large-latest", "mistral-small-latest", "codestral-latest"] },
      { id: "cohere", name: "Cohere", icon: `${ICON_CDN}/cohere`, docs: "dashboard.cohere.com/api-keys",
        endpoint: "https://api.cohere.com/v1", auth_type: "api_key", models: ["command-r-plus", "command-r"] },
    ];
  }
}

// ── Connector Store ──

export class ConnectorStore {
  private _file: string;
  private _data: Record<string, Connector> = {};
  private _mutex = new Mutex();

  constructor(dataDir: string) {
    mkdirSync(dataDir, { recursive: true });
    this._file = join(dataDir, "connectors.json");
    this._load();
  }

  private _load(): void { this._data = readJSON<Connector>(this._file); }
  private _save(): void { writeJSON(this._file, this._data); }

  list(): Connector[] { return Object.values(this._data); }
  get(id: string): Connector | undefined { return this._data[id]; }

  async save(conn: Connector): Promise<Connector> {
    return this._mutex.runExclusive(() => {
      if (!conn.id) conn.id = uuid();
      this._data[conn.id] = conn;
      this._save();
      return conn;
    });
  }

  async delete(id: string): Promise<boolean> {
    return this._mutex.runExclusive(() => {
      if (!this._data[id]) return false;
      delete this._data[id];
      this._save();
      return true;
    });
  }

  static marketplace(): ConnectorItem[] {
    return [
      { id: "google_docs", name: "Google Docs", icon: `${ICON_CDN}/googledocs`, category: "Google",
        description: "Create & edit documents", auth_type: "oauth", readonly: false,
        operations: ["create_doc", "read_doc", "update_doc", "list_docs"],
        oauth_config: { auth_url: "https://accounts.google.com/o/oauth2/auth", token_url: "https://oauth2.googleapis.com/token",
          scopes: ["https://www.googleapis.com/auth/documents.readonly", "https://www.googleapis.com/auth/drive.file"] } },
      { id: "google_sheets", name: "Google Sheets", icon: `${ICON_CDN}/googlesheets`, category: "Google",
        description: "Read & write spreadsheets", auth_type: "oauth", readonly: false,
        operations: ["read_sheet", "update_cell", "append_row", "create_sheet"],
        oauth_config: { auth_url: "https://accounts.google.com/o/oauth2/auth", token_url: "https://oauth2.googleapis.com/token",
          scopes: ["https://www.googleapis.com/auth/spreadsheets"] } },
      { id: "gmail", name: "Gmail", icon: `${ICON_CDN}/gmail`, category: "Google",
        description: "Send & read emails", auth_type: "oauth", readonly: false,
        operations: ["send_email", "read_inbox", "search_emails", "draft_email"],
        oauth_config: { auth_url: "https://accounts.google.com/o/oauth2/auth", token_url: "https://oauth2.googleapis.com/token",
          scopes: ["https://www.googleapis.com/auth/gmail.modify"] } },
      { id: "google_calendar", name: "Google Calendar", icon: `${ICON_CDN}/googlecalendar`, category: "Google",
        description: "Manage events & schedules", auth_type: "oauth", readonly: true,
        operations: ["list_events", "get_event", "create_event", "update_event"],
        oauth_config: { auth_url: "https://accounts.google.com/o/oauth2/auth", token_url: "https://oauth2.googleapis.com/token",
          scopes: ["https://www.googleapis.com/auth/calendar"] } },
      { id: "google_drive", name: "Google Drive", icon: `${ICON_CDN}/googledrive`, category: "Google",
        description: "File storage & management", auth_type: "oauth", readonly: false,
        operations: ["list_files", "upload_file", "download_file", "search_files"],
        oauth_config: { auth_url: "https://accounts.google.com/o/oauth2/auth", token_url: "https://oauth2.googleapis.com/token",
          scopes: ["https://www.googleapis.com/auth/drive.file"] } },
      { id: "slack", name: "Slack", icon: `${ICON_CDN}/slack`, category: "Communication",
        description: "Messages, channels & webhooks", auth_type: "oauth", readonly: false,
        operations: ["send_message", "list_channels", "get_history", "create_channel"],
        oauth_config: { auth_url: "https://slack.com/oauth/v2/authorize", token_url: "https://slack.com/api/oauth.v2.access",
          scopes: ["channels:read", "chat:write", "channels:history"] } },
      { id: "discord", name: "Discord", icon: `${ICON_CDN}/discord`, category: "Communication",
        description: "Bot messages & channel management", auth_type: "token", readonly: false,
        operations: ["send_message", "list_channels", "get_messages"] },
      { id: "telegram", name: "Telegram", icon: `${ICON_CDN}/telegram`, category: "Communication",
        description: "Bot messages & chat updates", auth_type: "token", readonly: false,
        operations: ["send_message", "get_updates", "set_webhook"] },
      { id: "notion", name: "Notion", icon: `${ICON_CDN}/notion`, category: "Productivity",
        description: "Databases, pages & blocks API", auth_type: "oauth", readonly: false,
        operations: ["search_pages", "create_page", "update_page", "query_database"],
        oauth_config: { auth_url: "https://api.notion.com/v1/oauth/authorize", token_url: "https://api.notion.com/v1/oauth/token", scopes: [] } },
      { id: "airtable", name: "Airtable", icon: `${ICON_CDN}/airtable`, category: "Productivity",
        description: "Base & table management", auth_type: "token", readonly: false,
        operations: ["list_records", "create_record", "update_record", "query_table"] },
      { id: "trello", name: "Trello", icon: `${ICON_CDN}/trello`, category: "Productivity",
        description: "Cards, boards & lists", auth_type: "api_key", readonly: false,
        operations: ["list_boards", "list_cards", "create_card", "move_card"] },
      { id: "asana", name: "Asana", icon: `${ICON_CDN}/asana`, category: "Productivity",
        description: "Tasks, projects & sections", auth_type: "oauth", readonly: false,
        operations: ["list_tasks", "create_task", "update_task", "list_projects"],
        oauth_config: { auth_url: "https://app.asana.com/-/oauth_authorize", token_url: "https://app.asana.com/-/oauth_token",
          scopes: ["default"] } },
      { id: "github", name: "GitHub", icon: `${ICON_CDN}/github`, category: "Development",
        description: "Repos, issues, PRs & actions", auth_type: "oauth", readonly: false,
        operations: ["list_repos", "create_issue", "list_prs", "get_file"],
        oauth_config: { auth_url: "https://github.com/login/oauth/authorize", token_url: "https://github.com/login/oauth/access_token",
          scopes: ["repo", "issues:write"] } },
      { id: "gitlab", name: "GitLab", icon: `${ICON_CDN}/gitlab`, category: "Development",
        description: "Repos, MRs & CI pipelines", auth_type: "oauth", readonly: false,
        operations: ["list_projects", "create_mr", "list_issues", "run_pipeline"],
        oauth_config: { auth_url: "https://gitlab.com/oauth/authorize", token_url: "https://gitlab.com/oauth/token", scopes: ["api"] } },
      { id: "jira", name: "Jira", icon: `${ICON_CDN}/jira`, category: "Development",
        description: "Issues, sprints & projects", auth_type: "oauth", readonly: false,
        operations: ["search_issues", "create_issue", "update_issue", "list_sprints"],
        oauth_config: { auth_url: "https://auth.atlassian.com/authorize", token_url: "https://auth.atlassian.com/oauth/token",
          scopes: ["read:jira-work", "write:jira-work"] } },
      { id: "linear", name: "Linear", icon: `${ICON_CDN}/linear`, category: "Development",
        description: "Issues & project management", auth_type: "api_key", readonly: false,
        operations: ["list_issues", "create_issue", "update_issue", "search_issues"] },
      { id: "sentry", name: "Sentry", icon: `${ICON_CDN}/sentry`, category: "DevOps",
        description: "Errors, performance & releases", auth_type: "token", readonly: true,
        operations: ["list_issues", "get_event", "list_projects"] },
      { id: "pagerduty", name: "PagerDuty", icon: `${ICON_CDN}/pagerduty`, category: "DevOps",
        description: "Incidents & on-call", auth_type: "token", readonly: false,
        operations: ["list_incidents", "acknowledge_incident", "resolve_incident"] },
      { id: "datadog", name: "Datadog", icon: `${ICON_CDN}/datadog`, category: "DevOps",
        description: "Metrics, logs & monitors", auth_type: "api_key", readonly: true,
        operations: ["query_metrics", "list_monitors", "search_logs"] },
      { id: "hubspot", name: "HubSpot", icon: `${ICON_CDN}/hubspot`, category: "CRM",
        description: "Contacts, deals & tickets", auth_type: "oauth", readonly: false,
        operations: ["list_contacts", "create_contact", "list_deals", "create_ticket"],
        oauth_config: { auth_url: "https://app.hubspot.com/oauth/authorize", token_url: "https://api.hubapi.com/oauth/v1/token",
          scopes: ["crm.objects.contacts.write", "crm.objects.deals.read"] } },
      { id: "salesforce", name: "Salesforce", icon: `${ICON_CDN}/salesforce`, category: "CRM",
        description: "Objects, records & queries", auth_type: "oauth", readonly: false,
        operations: ["query", "create_record", "update_record", "describe_object"],
        oauth_config: { auth_url: "https://login.salesforce.com/services/oauth2/authorize", token_url: "https://login.salesforce.com/services/oauth2/token",
          scopes: ["api", "refresh_token"] } },
      { id: "zendesk", name: "Zendesk", icon: `${ICON_CDN}/zendesk`, category: "Support",
        description: "Tickets, users & articles", auth_type: "token", readonly: false,
        operations: ["list_tickets", "create_ticket", "update_ticket", "search_tickets"] },
      { id: "intercom", name: "Intercom", icon: `${ICON_CDN}/intercom`, category: "Support",
        description: "Conversations & contacts", auth_type: "token", readonly: false,
        operations: ["list_conversations", "reply_conversation", "search_contacts"] },
      { id: "stripe", name: "Stripe", icon: `${ICON_CDN}/stripe`, category: "Payments",
        description: "Payments, customers & invoices", auth_type: "api_key", readonly: true,
        operations: ["list_payments", "get_customer", "list_invoices", "create_payment_link"] },
      { id: "shopify", name: "Shopify", icon: `${ICON_CDN}/shopify`, category: "E-commerce",
        description: "Products, orders & customers", auth_type: "token", readonly: false,
        operations: ["list_products", "get_order", "update_inventory", "list_customers"] },
      { id: "figma", name: "Figma", icon: `${ICON_CDN}/figma`, category: "Design",
        description: "Files, components & comments", auth_type: "token", readonly: true,
        operations: ["get_file", "get_components", "get_comments"] },
      { id: "supabase", name: "Supabase", icon: `${ICON_CDN}/supabase`, category: "Database",
        description: "DB queries & real-time", auth_type: "api_key", readonly: false,
        operations: ["query", "insert_row", "update_row", "delete_row"] },
      { id: "confluence", name: "Confluence", icon: `${ICON_CDN}/confluence`, category: "Productivity",
        description: "Pages & spaces", auth_type: "oauth", readonly: false,
        operations: ["list_pages", "create_page", "update_page", "search"],
        oauth_config: { auth_url: "https://auth.atlassian.com/authorize", token_url: "https://auth.atlassian.com/oauth/token",
          scopes: ["read:confluence-space.summary", "write:confluence-content"] } },
      { id: "dropbox", name: "Dropbox", icon: `${ICON_CDN}/dropbox`, category: "Storage",
        description: "File storage & sharing", auth_type: "oauth", readonly: false,
        operations: ["list_files", "upload_file", "download_file", "search_files"],
        oauth_config: { auth_url: "https://www.dropbox.com/oauth2/authorize", token_url: "https://api.dropboxapi.com/oauth2/token",
          scopes: ["files.metadata.read", "files.content.write"] } },
      { id: "custom_api", name: "Custom API", icon: `${ICON_CDN}/api`, category: "Custom",
        description: "Any REST/GraphQL endpoint", auth_type: "custom", readonly: false, operations: ["custom_request"] },
    ];
  }
}

// ── MCP Server Store ──

export class MCPServerStore {
  private _file: string;
  private _data: Record<string, MCPServer> = {};
  private _mutex = new Mutex();

  constructor(dataDir: string) {
    mkdirSync(dataDir, { recursive: true });
    this._file = join(dataDir, "mcp_servers.json");
    this._load();
  }

  private _load(): void { this._data = readJSON<MCPServer>(this._file); }
  private _save(): void { writeJSON(this._file, this._data); }

  list(): MCPServer[] { return Object.values(this._data); }
  get(id: string): MCPServer | undefined { return this._data[id]; }

  async save(server: MCPServer): Promise<MCPServer> {
    return this._mutex.runExclusive(() => {
      if (!server.id) server.id = uuid();
      this._data[server.id] = server;
      this._save();
      return server;
    });
  }

  async delete(id: string): Promise<boolean> {
    return this._mutex.runExclusive(() => {
      if (!this._data[id]) return false;
      delete this._data[id];
      this._save();
      return true;
    });
  }

  static discoverTools(url: string): Record<string, unknown>[] {
    const registry: Record<string, Record<string, unknown>[]> = {
      "filesystem": [{ name: "read_file", description: "Read file contents" }, { name: "write_file", description: "Write file" }, { name: "list_directory", description: "List directory contents" }, { name: "search_files", description: "Search files by pattern" }],
      "github": [{ name: "create_issue", description: "Create GitHub issue" }, { name: "list_issues", description: "List repository issues" }, { name: "get_pr", description: "Get pull request details" }, { name: "search_code", description: "Search code in repository" }],
      "slack": [{ name: "send_message", description: "Send message to channel" }, { name: "list_channels", description: "List all channels" }, { name: "get_history", description: "Get channel history" }, { name: "create_channel", description: "Create new channel" }],
      "postgres": [{ name: "query", description: "Execute SQL query" }, { name: "list_tables", description: "List database tables" }, { name: "describe_table", description: "Describe table schema" }],
      "sqlite": [{ name: "query", description: "Execute SQL query" }, { name: "list_tables", description: "List tables" }],
      "memory": [{ name: "store_memory", description: "Store information" }, { name: "retrieve_memory", description: "Retrieve information" }, { name: "search_memories", description: "Search memories" }],
      "puppeteer": [{ name: "navigate", description: "Navigate to URL" }, { name: "click", description: "Click element" }, { name: "type", description: "Type text" }, { name: "screenshot", description: "Take screenshot" }, { name: "evaluate", description: "Run JS in page" }],
      "brave-search": [{ name: "web_search", description: "Search the web" }, { name: "local_search", description: "Search locally" }],
      "fetch": [{ name: "fetch_url", description: "Fetch URL content" }, { name: "extract_html", description: "Extract data from HTML" }],
      "playwright": [{ name: "navigate", description: "Navigate to page" }, { name: "click", description: "Click element" }, { name: "fill", description: "Fill input field" }, { name: "screenshot", description: "Take screenshot" }, { name: "get_text", description: "Get element text" }],
      "cloudflare": [{ name: "list_workers", description: "List Cloudflare Workers" }, { name: "get_kv", description: "Get KV value" }, { name: "query_d1", description: "Query D1 database" }],
      "sequential-thinking": [{ name: "think", description: "Record reasoning step" }, { name: "review", description: "Review reasoning chain" }],
    };
    for (const [key, tools] of Object.entries(registry)) {
      if (url.includes(key)) return tools;
    }
    return [{ name: "call_tool", description: `Call a tool on ${url}` }];
  }

  static marketplace(): MCPServerItem[] {
    return [
      { id: "filesystem", name: "Filesystem", icon: `${ICON_CDN}/files`, description: "Read, write, search local files", url: "npm:@modelcontextprotocol/server-filesystem", transport: "stdio" },
      { id: "github-mcp", name: "GitHub MCP", icon: `${ICON_CDN}/github`, description: "PRs, issues, repos, search", url: "npm:@modelcontextprotocol/server-github", transport: "stdio" },
      { id: "slack-mcp", name: "Slack MCP", icon: `${ICON_CDN}/slack`, description: "Messages, channels, users", url: "npm:@modelcontextprotocol/server-slack", transport: "stdio" },
      { id: "postgres", name: "PostgreSQL", icon: `${ICON_CDN}/postgresql`, description: "SQL queries & schema inspection", url: "npm:@modelcontextprotocol/server-postgres", transport: "stdio" },
      { id: "sqlite", name: "SQLite", icon: `${ICON_CDN}/sqlite`, description: "SQLite database queries", url: "npm:@modelcontextprotocol/server-sqlite", transport: "stdio" },
      { id: "memory", name: "Memory", icon: `${ICON_CDN}/brain`, description: "Persistent knowledge graph memory", url: "npm:@modelcontextprotocol/server-memory", transport: "stdio" },
      { id: "puppeteer", name: "Puppeteer", icon: `${ICON_CDN}/puppeteer`, description: "Browser automation & scraping", url: "npm:@modelcontextprotocol/server-puppeteer", transport: "stdio" },
      { id: "brave-search", name: "Brave Search", icon: `${ICON_CDN}/brave`, description: "Web & local search", url: "npm:@modelcontextprotocol/server-brave-search", transport: "stdio" },
      { id: "fetch", name: "Fetch", icon: `${ICON_CDN}/fetch`, description: "HTTP requests & HTML parsing", url: "npm:@modelcontextprotocol/server-fetch", transport: "stdio" },
      { id: "playwright", name: "Playwright", icon: `${ICON_CDN}/playwright`, description: "Browser automation", url: "npm:@anthropic/mcp-server-playwright", transport: "stdio" },
      { id: "cloudflare", name: "Cloudflare", icon: `${ICON_CDN}/cloudflare`, description: "Workers, KV, R2, D1", url: "npm:cloudflare-mcp-server", transport: "stdio" },
      { id: "sequential-thinking", name: "Sequential Thinking", icon: `${ICON_CDN}/brain`, description: "Structured reasoning chains", url: "npm:@modelcontextprotocol/server-sequential-thinking", transport: "stdio" },
    ];
  }
}

// ── OAuth Handler ──

export class OAuthHandler {
  static getOAuthConfig(connectorType: string): { auth_url: string; token_url: string; scopes: string[] } | undefined {
    for (const item of ConnectorStore.marketplace()) {
      if (item.id === connectorType && item.auth_type === "oauth" && item.oauth_config) {
        return item.oauth_config;
      }
    }
    return undefined;
  }

  static buildAuthorizeUrl(connectorType: string, redirectUri: string, state: string): string | undefined {
    const config = OAuthHandler.getOAuthConfig(connectorType);
    if (!config) return undefined;
    const clientId = process.env[`${connectorType.toUpperCase()}_CLIENT_ID`] || "";
    const params = new URLSearchParams({
      response_type: "code",
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: config.scopes.join(" "),
      state,
      access_type: "offline",
    });
    return `${config.auth_url}?${params.toString()}`;
  }

  static exchangeCode(connectorType: string, code: string, _redirectUri: string): Record<string, unknown> | undefined {
    const config = OAuthHandler.getOAuthConfig(connectorType);
    if (!config) return undefined;
    return {
      access_token: `mock_${connectorType}_token_${code.slice(0, 8)}`,
      refresh_token: `mock_refresh_${connectorType}`,
      expires_in: 3600,
      scope: config.scopes.join(" "),
    };
  }

  static refreshToken(connectorType: string, _refreshToken: string): Record<string, unknown> | undefined {
    const config = OAuthHandler.getOAuthConfig(connectorType);
    if (!config) return undefined;
    return {
      access_token: `refreshed_${connectorType}_token_${Date.now()}`,
      expires_in: 3600,
    };
  }
}

// ── Skill Store ──

export class SkillStore {
  private _skills: Skill[];

  constructor() {
    this._skills = SkillStore._defaultSkills();
  }

  list(): Skill[] { return this._skills; }

  private static _defaultSkills(): Skill[] {
    return [
      { id: "research", name: "Deep Research", category: "research", icon: "🔬",
        description: "Scrape & synthesize from multiple sources",
        prompt_template: "Research: {input}", tools: ["web_search", "web_scrape", "summarize"] },
      { id: "code-gen", name: "Code Generation", category: "development", icon: "💻",
        description: "Generate code in any language",
        prompt_template: "Write code for: {input}", tools: ["code_interpreter", "file_system"] },
      { id: "data-analysis", name: "Data Analysis", category: "data", icon: "📊",
        description: "Analyze CSV, JSON, structured data",
        prompt_template: "Analyze: {input}", tools: ["code_interpreter", "file_system", "chart_builder"] },
      { id: "computer-use", name: "Computer Use", category: "automation", icon: "🖥️",
        description: "Control browser via Playwright",
        prompt_template: "Use a computer to: {input}", tools: ["navigate", "click", "type", "screenshot"] },
    ];
  }
}
