import { z } from "zod";
import { NodeType } from "../types.js";

const PositionSchema = z.object({ x: z.number(), y: z.number() });

const NodeConfigSchema = z.object({
  label: z.string().default(""),
  goal: z.string().default(""),
  provider: z.string().default("openai"),
  model: z.string().default("gpt-4o"),
  schedule: z.string().default(""),
  destination: z.string().default(""),
  urls: z.array(z.string()).default([]),
  code: z.string().default(""),
  language: z.string().default("python"),
  condition: z.string().default(""),
  switch_cases: z.array(z.string()).default(["case_1"]),
  switch_value: z.string().default(""),
  transform: z.string().default(""),
  instructions: z.string().default(""),
  temperature: z.number().default(0.7),
  max_tokens: z.number().int().default(2048),
  webhook_url: z.string().default(""),
  method: z.string().default("POST"),
  headers: z.string().default(""),
  body: z.string().default(""),
  query_params: z.string().default(""),
  iteration_count: z.number().int().default(5),
  wait_time: z.number().default(1),
  wait_unit: z.string().default("seconds"),
  merge_mode: z.string().default("combine"),
  split_by: z.string().default("size"),
  split_size: z.number().default(10),
  file_path: z.string().default(""),
  file_content: z.string().default(""),
  file_format: z.string().default("json"),
  database_type: z.string().default("postgres"),
  connection_string: z.string().default(""),
  query: z.string().default(""),
  source_format: z.string().default("json"),
  target_language: z.string().default("spanish"),
  connector_id: z.string().nullable().default(null),
  mcp_server_id: z.string().nullable().default(null),
  mcp_tool: z.string().default(""),
  skill: z.string().default(""),
  credential_id: z.string().nullable().default(null),
  browser_url: z.string().default(""),
  browser_action: z.string().default(""),
  screenshot_quality: z.number().default(0.8),
  confirm_destructive: z.boolean().default(true),
  readonly: z.boolean().default(false),
  input_mapping: z.record(z.string(), z.string()).default({}),
  output_mapping: z.record(z.string(), z.string()).default({}),
});

const FlowNodeSchema = z.object({
  id: z.string(),
  type: z.nativeEnum(NodeType),
  position: PositionSchema,
  config: NodeConfigSchema,
});

const FlowEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
});

export const WorkflowSchema = z.object({
  id: z.string().default(""),
  name: z.string().default("Untitled Workflow"),
  nodes: z.array(FlowNodeSchema).default([]),
  edges: z.array(FlowEdgeSchema).default([]),
  active: z.boolean().default(false),
});
