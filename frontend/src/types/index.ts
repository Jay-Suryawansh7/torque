export type NodeType =
  | "trigger"
  | "agent"
  | "output"
  | "llm"
  | "code"
  | "condition"
  | "switch"
  | "transform"
  | "webhook"
  | "webhook_trigger"
  | "loop"
  | "merge"
  | "split"
  | "wait"
  | "http_request"
  | "database"
  | "file_io"
  | "extract"
  | "summarize"
  | "translate"
  | "computer_use"
  | "mcp_tool"
  | "rss"
  | "email"
  | "respond_webhook"
  | "whatsapp"
  | "twilio_sms"
  | "outlook"
  | "trello"
  | "asana"
  | "clickup"
  | "vercel"
  | "supabase"
  | "redis"
  | "mysql"
  | "gemini"
  | "mistral"
  | "huggingface";

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

export interface NodeData {
  label: string;
  config: NodeConfig;
  status?: string;
}

export interface Provider {
  id: string;
  name: string;
  icon: string;
  models: string[];
}

export interface Credential {
  id: string;
  name: string;
  provider: string;
  api_key: string;
  base_url: string;
  is_configured: boolean;
}

export interface ConnectorInfo {
  id: string;
  name: string;
  icon: string;
  category: string;
}

export interface Connector {
  id: string;
  name: string;
  type: string;
  config: Record<string, string>;
  credential_id: string | null;
  connected: boolean;
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
