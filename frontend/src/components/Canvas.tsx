import { useEffect } from "react";
import {
  ReactFlow, Background, Controls, MiniMap, BackgroundVariant,
  type Node, type Edge, type NodeTypes, type OnNodesChange,
  type OnEdgesChange, type OnConnect, useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { TriggerNode } from "./nodes/TriggerNode";
import { AgentNode } from "./nodes/AgentNode";
import { OutputNode } from "./nodes/OutputNode";
import { LLMNode } from "./nodes/LLMNode";
import { CodeNode } from "./nodes/CodeNode";
import { ConditionNode } from "./nodes/ConditionNode";
import { SwitchNode } from "./nodes/SwitchNode";
import { TransformNode } from "./nodes/TransformNode";
import { WebhookNode } from "./nodes/WebhookNode";
import { LoopNode } from "./nodes/LoopNode";
import { MergeNode } from "./nodes/MergeNode";
import { SplitNode } from "./nodes/SplitNode";
import { WaitNode } from "./nodes/WaitNode";
import { HttpRequestNode } from "./nodes/HttpRequestNode";
import { DatabaseNode } from "./nodes/DatabaseNode";
import { FileIONode } from "./nodes/FileIONode";
import { ExtractNode } from "./nodes/ExtractNode";
import { SummarizeNode } from "./nodes/SummarizeNode";
import { TranslateNode } from "./nodes/TranslateNode";
import { ComputerUseNode } from "./nodes/ComputerUseNode";
import { RssNode } from "./nodes/RssNode";
import { EmailNode } from "./nodes/EmailNode";
import { RespondWebhookNode } from "./nodes/RespondWebhookNode";
import { MCPToolNode } from "./nodes/MCPToolNode";
import { WhatsAppNode } from "./nodes/WhatsAppNode";
import { TwilioSmsNode } from "./nodes/TwilioSmsNode";
import { OutlookNode } from "./nodes/OutlookNode";
import { TrelloNode } from "./nodes/TrelloNode";
import { AsanaNode } from "./nodes/AsanaNode";
import { ClickUpNode } from "./nodes/ClickUpNode";
import { VercelNode } from "./nodes/VercelNode";
import { SupabaseNode } from "./nodes/SupabaseNode";
import { RedisNode } from "./nodes/RedisNode";
import { MySQLNode } from "./nodes/MySQLNode";
import { GeminiNode } from "./nodes/GeminiNode";
import { MistralNode } from "./nodes/MistralNode";
import { HuggingFaceNode } from "./nodes/HuggingFaceNode";

const nodeTypes: NodeTypes = {
  trigger: TriggerNode, webhook_trigger: WebhookNode, agent: AgentNode, output: OutputNode,
  llm: LLMNode, code: CodeNode, condition: ConditionNode,
  switch: SwitchNode, transform: TransformNode, webhook: WebhookNode,
  loop: LoopNode, merge: MergeNode, split: SplitNode,
  wait: WaitNode, http_request: HttpRequestNode, database: DatabaseNode,
  file_io: FileIONode, extract: ExtractNode,
  summarize: SummarizeNode, translate: TranslateNode,
  computer_use: ComputerUseNode, mcp_tool: MCPToolNode,
  rss: RssNode, email: EmailNode, respond_webhook: RespondWebhookNode,
  whatsapp: WhatsAppNode, twilio_sms: TwilioSmsNode, outlook: OutlookNode,
  trello: TrelloNode, asana: AsanaNode, clickup: ClickUpNode,
  vercel: VercelNode, supabase: SupabaseNode, redis: RedisNode, mysql: MySQLNode,
  gemini: GeminiNode, mistral: MistralNode, huggingface: HuggingFaceNode,
};

const NODE_COLORS: Record<string, string> = {
  trigger: "#f59e0b", agent: "#0ea5e9", output: "#10b981",
  llm: "#a855f7", code: "#06b6d4", condition: "#f43f5e",
  switch: "#f97316", transform: "#8b5cf6", webhook: "#f97316",
  loop: "#ec4899", merge: "#6366f1", split: "#14b8a6",
  wait: "#0ea5e9", http_request: "#3b82f6", database: "#eab308",
  file_io: "#84cc16", extract: "#d946ef",
  summarize: "#06b6d4", translate: "#f43f5e",
  computer_use: "#e11d48", mcp_tool: "#a855f7",
  rss: "#f97316", email: "#3b82f6", respond_webhook: "#f97316",
  whatsapp: "#22c55e", twilio_sms: "#ef4444", outlook: "#3b82f6",
  trello: "#3b82f6", asana: "#ec4899", clickup: "#a855f7",
  vercel: "#6b7280", supabase: "#22c55e", redis: "#ef4444", mysql: "#3b82f6",
  gemini: "#3b82f6", mistral: "#a855f7", huggingface: "#eab308",
};

interface CanvasProps {
  nodes: Node[]; edges: Edge[];
  onNodesChange: OnNodesChange; onEdgesChange: OnEdgesChange;
  onConnect: OnConnect; onNodeClick: (node: Node) => void;
}

export function Canvas({ nodes, edges, onNodesChange, onEdgesChange, onConnect, onNodeClick }: CanvasProps) {
  const { fitView } = useReactFlow();
  useEffect(() => {
    if (nodes.length > 0) {
      const timer = setTimeout(() => fitView({ duration: 300, padding: 0.3 }), 100);
      return () => clearTimeout(timer);
    }
  }, [nodes.length, fitView]);

  return (
    <ReactFlow
      nodes={nodes} edges={edges}
      onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onNodeClick={(_, node) => onNodeClick(node)}
      nodeTypes={nodeTypes}
      deleteKeyCode={["Backspace", "Delete"]}
      fitView
      className="bg-gray-950"
      defaultEdgeOptions={{ style: { stroke: "#4b5563", strokeWidth: 2 }, animated: true }}
    >
      <Background variant={BackgroundVariant.Dots} gap={24} size={1.5} color="#374151" />
      <Controls showInteractive={false} className="!bg-gray-900 !border-gray-800 !rounded-xl !shadow-xl !gap-0 [&>button]:!border-gray-800 [&>button]:!text-gray-400" />
      <MiniMap nodeColor={(node) => NODE_COLORS[node.type || ""] || "#4b5563"}
        maskColor="rgba(0,0,0,0.7)" className="!bg-gray-900 !border-gray-800 !rounded-xl !shadow-xl" style={{ width: 160, height: 100 }} />
    </ReactFlow>
  );
}
