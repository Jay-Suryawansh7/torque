import type { ZodSchema } from "zod";

export type ConnectorCategory = "communication" | "productivity" | "developer" | "data" | "finance" | "marketing" | "crm" | "storage" | "ai" | "utility";
export type AuthType = "oauth2" | "api_key" | "basic" | "none" | "custom";
export type OperationType = "action" | "trigger" | "webhook" | "polling";

export interface AuthConfig {
  oauth2?: { authUrl: string; tokenUrl: string; scopes: string[]; pkce?: boolean };
  apiKey?: { header: string; type: "header" | "query" };
  basic?: { label: string };
}

export interface IField {
  id: string;
  label: string;
  type: "text" | "textarea" | "number" | "toggle" | "select" | "date" | "code" | "json" | "file" | "tags";
  placeholder?: string;
  required?: boolean;
  default?: unknown;
  options?: { label: string; value: string }[];
  dynamicOptions?: { connectorId: string; operationId: string; field: string };
}

export interface OperationInput {
  [key: string]: unknown;
}

export interface OperationOutput {
  data: unknown;
  error?: string;
}

export interface ConnectionTestResult {
  ok: boolean;
  message?: string;
}

export interface IOperation {
  id: string;
  name: string;
  description: string;
  type: OperationType;
  inputSchema: ZodSchema;
  outputSchema: ZodSchema;
  fields: IField[];
  execute(input: OperationInput, credential: Record<string, unknown>, context: ExecutionContext): Promise<OperationOutput>;
}

export interface ExecutionContext {
  runId: string;
  workflowId: string;
  nodeId: string;
  userId: string;
  logger: { info: (msg: string, data?: unknown) => void; error: (msg: string, data?: unknown) => void };
  emit(event: string, data: unknown): void;
  getNodeOutput(nodeId: string): unknown;
  variables: Record<string, unknown>;
  getCredential(id: string): Promise<Record<string, unknown> | null>;
}

export interface IConnector {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: ConnectorCategory;
  authType: AuthType;
  authConfig: AuthConfig;
  operations: IOperation[];
  testConnection(credential: Record<string, unknown>): Promise<ConnectionTestResult>;
}
