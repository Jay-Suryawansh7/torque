import type { Workflow } from "../types.js";
import { NodeType } from "../types.js";

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: "starter" | "communication" | "developer" | "ai" | "data";
  icon: string;
  workflow: Workflow;
}

const T: any = NodeType;

const trigger = (schedule = "") => ({
  id: "t1", type: T.trigger, position: { x: 0, y: 0 },
  config: { label: "Schedule", goal: "", provider: "openai", model: "gpt-4o", schedule, destination: "", urls: [], code: "", language: "python", condition: "", switch_cases: ["case_1"], switch_value: "", transform: "", instructions: "", temperature: 0.7, max_tokens: 2048, webhook_url: "", method: "POST", headers: "", body: "", query_params: "", iteration_count: 5, wait_time: 1, wait_unit: "seconds", merge_mode: "combine", split_by: "size", split_size: 10, file_path: "", file_content: "", file_format: "json", database_type: "postgres", connection_string: "", query: "", source_format: "json", target_language: "spanish", connector_id: null, mcp_server_id: null, mcp_tool: "", skill: "", credential_id: null, browser_url: "", browser_action: "", screenshot_quality: 0.8, confirm_destructive: true, readonly: false, input_mapping: {}, output_mapping: {} },
});

function node(type: NodeType, overrides: Record<string, unknown> = {}): any {
  const base = { label: "", goal: "", provider: "openai", model: "gpt-4o", schedule: "", destination: "", urls: [], code: "", language: "python", condition: "", switch_cases: ["case_1"], switch_value: "", transform: "", instructions: "", temperature: 0.7, max_tokens: 2048, webhook_url: "", method: "POST", headers: "", body: "", query_params: "", iteration_count: 5, wait_time: 1, wait_unit: "seconds", merge_mode: "combine", split_by: "size", split_size: 10, file_path: "", file_content: "", file_format: "json", database_type: "postgres", connection_string: "", query: "", source_format: "json", target_language: "spanish", connector_id: null, mcp_server_id: null, mcp_tool: "", skill: "", credential_id: null, browser_url: "", browser_action: "", screenshot_quality: 0.8, confirm_destructive: true, readonly: false, input_mapping: {}, output_mapping: {} };
  return { id: `n${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, type, position: { x: 0, y: 0 }, config: { ...base, ...overrides } };
}

export const TEMPLATES: WorkflowTemplate[] = [
  {
    id: "blank", name: "Blank Workflow", description: "Start from scratch with a trigger node", category: "starter", icon: "Plus",
    workflow: { id: "", name: "Untitled Workflow", nodes: [trigger()], edges: [], active: false },
  },
  {
    id: "slack-notify", name: "Slack Notification", description: "Send a Slack message when a webhook fires", category: "communication", icon: "Slack",
    workflow: {
      id: "", name: "Slack Notification", active: false,
      nodes: [
        { ...trigger(), config: { ...trigger().config, label: "Webhook Trigger" } },
        { ...node(T.slack, { label: "Send Slack Message", channel: "#general", text: "Hello from Torque!" }), position: { x: 300, y: 0 } },
      ],
      edges: [{ id: "e1", source: "t1", target: `n` }],
    },
  },
  {
    id: "github-issue", name: "Create GitHub Issue", description: "Create a GitHub issue when triggered", category: "developer", icon: "GitHub",
    workflow: {
      id: "", name: "GitHub Issue Creator", active: false,
      nodes: [
        { ...trigger(), config: { ...trigger().config, label: "Webhook Trigger" } },
        { ...node(T.github, { label: "Create Issue", owner: "my-org", repo: "my-repo", title: "Issue from Torque" }), position: { x: 300, y: 0 } },
      ],
      edges: [{ id: "e1", source: "t1", target: `n` }],
    },
  },
  {
    id: "ai-summarize", name: "AI Summarization", description: "Send text to an LLM and get a summary back", category: "ai", icon: "Sparkles",
    workflow: {
      id: "", name: "AI Summarization", active: false,
      nodes: [
        { ...trigger(), config: { ...trigger().config, label: "Manual Trigger" } },
        { ...node(T.agent, { label: "Summarize", goal: "Summarize the input text concisely", provider: "openai", model: "gpt-4o", skill: "summarize" }), position: { x: 300, y: 0 } },
      ],
      edges: [{ id: "e1", source: "t1", target: `n` }],
    },
  },
  {
    id: "http-to-slack", name: "HTTP to Slack", description: "Forward an HTTP request payload to a Slack channel", category: "data", icon: "Globe",
    workflow: {
      id: "", name: "HTTP to Slack Bridge", active: false,
      nodes: [
        { ...trigger(), config: { ...trigger().config, label: "Webhook" } },
        { ...node(T.transform, { label: "Extract Message", transform: "data => data.body?.message || JSON.stringify(data)" }), position: { x: 300, y: 0 } },
        { ...node(T.slack, { label: "Send to Slack", channel: "#alerts" }), position: { x: 600, y: 0 } },
      ],
      edges: [
        { id: "e1", source: "t1", target: `n` },
        { id: "e2", source: "n", target: `n2` },
      ],
    },
  },
];

export function getTemplate(id: string): WorkflowTemplate | undefined {
  return TEMPLATES.find(t => t.id === id);
}
