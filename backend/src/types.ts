export enum NodeType {
  trigger = "trigger", agent = "agent", output = "output",
  llm = "llm", code = "code", condition = "condition",
  switch = "switch", transform = "transform", webhook = "webhook",
  webhook_trigger = "webhook_trigger", loop = "loop",
  merge = "merge", split = "split", wait = "wait",
  http_request = "http_request", database = "database",
  file_io = "file_io", extract = "extract",
  summarize = "summarize", translate = "translate",
  computer_use = "computer_use", mcp_tool = "mcp_tool",
  rss = "rss", email = "email", respond_webhook = "respond_webhook",
  whatsapp = "whatsapp", twilio_sms = "twilio_sms", outlook = "outlook",
  trello = "trello", asana = "asana", clickup = "clickup",
  vercel = "vercel", supabase = "supabase", redis = "redis", mysql = "mysql",
  gemini = "gemini", mistral = "mistral", huggingface = "huggingface",
}

export enum LLMProvider {
  openai = "openai", anthropic = "anthropic", google = "google",
  groq = "groq", together = "together", openrouter = "openrouter",
  ollama = "ollama", custom = "custom",
}

export enum ConnectorType {
  google_docs = "google_docs", google_sheets = "google_sheets",
  gmail = "gmail", slack = "slack", discord = "discord",
  notion = "notion", github = "github", jira = "jira",
  airtable = "airtable", hubspot = "hubspot",
  salesforce = "salesforce", zendesk = "zendesk",
  figma = "figma", linear = "linear",
  stripe = "stripe", custom_api = "custom_api",
}

export interface Position {
  x: number;
  y: number;
}

export interface NodeConfig {
  label: string;
  goal: string;
  provider: string;
  model: string;
  schedule: string;
  destination: string;
  urls: string[];
  code: string;
  language: string;
  condition: string;
  switch_cases: string[];
  switch_value: string;
  transform: string;
  instructions: string;
  temperature: number;
  max_tokens: number;
  webhook_url: string;
  method: string;
  headers: string;
  body: string;
  query_params: string;
  iteration_count: number;
  wait_time: number;
  wait_unit: string;
  merge_mode: string;
  split_by: string;
  split_size: number;
  file_path: string;
  file_content: string;
  file_format: string;
  database_type: string;
  connection_string: string;
  query: string;
  source_format: string;
  target_language: string;
  connector_id: string | null;
  mcp_server_id: string | null;
  mcp_tool: string;
  skill: string;
  credential_id: string | null;
  browser_url: string;
  browser_action: string;
  screenshot_quality: number;
  confirm_destructive: boolean;
  readonly: boolean;
  input_mapping: Record<string, string>;
  output_mapping: Record<string, string>;
}

export interface FlowNode {
  id: string;
  type: NodeType;
  position: Position;
  config: NodeConfig;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
}

export interface Workflow {
  id: string;
  name: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  active: boolean;
}

export interface WorkflowRun {
  id: string;
  workflow_id: string;
  status: string;
  started_at: string;
  finished_at: string;
  logs: LogEntry[];
  error: string | null;
}

export interface LogEntry {
  timestamp: number;
  step: string;
  detail: string;
  status: string;
}

export interface Credential {
  id: string;
  name: string;
  provider: LLMProvider;
  api_key: string;
  base_url: string;
  oauth_token: string;
  oauth_refresh: string;
  oauth_expires: number;
  oauth_scopes: string;
  is_configured: boolean;
}

export interface Connector {
  id: string;
  name: string;
  type: string;
  config: Record<string, string>;
  credential_id: string | null;
  connected: boolean;
  readonly: boolean;
  confirm_destructive: boolean;
  operations: string[];
}

export interface MCPServer {
  id: string;
  name: string;
  url: string;
  transport: string;
  tools: Record<string, unknown>[];
  enabled: boolean;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  prompt_template: string;
  tools: string[];
}

export interface ProviderInfo {
  id: string;
  name: string;
  icon: string;
  docs: string;
  endpoint: string;
  auth_type: string;
  models: string[];
}

export interface ConnectorItem {
  id: string;
  name: string;
  icon: string;
  category: string;
  description: string;
  auth_type: string;
  readonly: boolean;
  operations: string[];
  oauth_config?: {
    auth_url: string;
    token_url: string;
    scopes: string[];
  };
}

export interface MCPServerItem {
  id: string;
  name: string;
  icon: string;
  description: string;
  url: string;
  transport: string;
}

export function defaultNodeConfig(type: string): NodeConfig {
  return {
    label: type, goal: "", provider: "openai", model: "gpt-4o",
    schedule: "", destination: "", urls: [],
    code: "", language: "python", condition: "", switch_cases: ["case_1"],
    switch_value: "", transform: "", instructions: "",
    temperature: 0.7, max_tokens: 2048,
    webhook_url: "", method: "POST", headers: "", body: "", query_params: "",
    iteration_count: 5, wait_time: 1, wait_unit: "seconds",
    merge_mode: "combine", split_by: "size", split_size: 10,
    file_path: "", file_content: "", file_format: "json",
    database_type: "postgres", connection_string: "", query: "",
    source_format: "json", target_language: "spanish",
    connector_id: null, mcp_server_id: null, mcp_tool: "",
    skill: "", credential_id: null,
    browser_url: "", browser_action: "", screenshot_quality: 0.8,
    confirm_destructive: true, readonly: false,
    input_mapping: {}, output_mapping: {},
  };
}

export function generateId(): string {
  return `node_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
