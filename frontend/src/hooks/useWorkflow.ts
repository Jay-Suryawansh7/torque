import { useState, useCallback, useRef, useEffect } from "react";
import {
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
} from "@xyflow/react";
import { api } from "../api/workflows";
import type { Workflow, FlowNode, NodeConfig } from "../types";

function generateId(): string {
  return `node_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

const NODE_LABELS: Record<string, string> = {
  trigger: "Schedule", webhook_trigger: "Webhook Trigger",
  agent: "Agent", output: "Output", llm: "LLM",
  code: "Code", condition: "IF", switch: "Switch",
  transform: "Transform", webhook: "Webhook", loop: "Loop",
  merge: "Merge", split: "Split", wait: "Wait",
  http_request: "HTTP Request", database: "Database",
  file_io: "File", extract: "Extract",
  summarize: "Summarize", translate: "Translate",
  computer_use: "Computer Use",
  mcp_tool: "MCP Tool", rss: "RSS Feed", email: "Email",
  respond_webhook: "Respond to Webhook",
  whatsapp: "WhatsApp", twilio_sms: "Twilio SMS", outlook: "Outlook",
  trello: "Trello", asana: "Asana", clickup: "ClickUp",
  vercel: "Vercel", supabase: "Supabase", redis: "Redis", mysql: "MySQL",
  gemini: "Gemini", mistral: "Mistral", huggingface: "HuggingFace",
};

function defaultConfig(type: string): NodeConfig {
  return {
    label: NODE_LABELS[type] || type,
    goal: "", provider: "openai", model: "gpt-4o",
    schedule: "", destination: "", urls: [],
    code: "", language: "python", condition: "",
    switch_cases: ["case_1"], switch_value: "",
    transform: "", instructions: "",
    temperature: 0.7, max_tokens: 2048,
    webhook_url: "", method: "POST",
    headers: "", body: "", query_params: "",
    iteration_count: 5,
    wait_time: 1, wait_unit: "seconds",
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

export function useWorkflow() {
  const [workflowId, setWorkflowId] = useState<string | null>(null);
  const [name, setName] = useState("Untitled Workflow");
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const selectedRef = useRef<Node | null>(null);
  selectedRef.current = selectedNode;
  const [clipboard, setClipboard] = useState<{ nodes: Node[]; edges: Edge[] } | null>(null);

  // Undo/redo history
  const [history, setHistory] = useState<{ nodes: Node[]; edges: Edge[] }[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const pushHistory = useCallback((newNodes: Node[], newEdges: Edge[]) => {
    setHistory(prev => {
      const trimmed = prev.slice(0, historyIndex + 1);
      trimmed.push({ nodes: JSON.parse(JSON.stringify(newNodes)), edges: JSON.parse(JSON.stringify(newEdges)) });
      if (trimmed.length > 50) trimmed.shift();
      return trimmed;
    });
    setHistoryIndex(prev => Math.min(prev + 1, 49));
  }, [historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex < 0) return;
    const entry = history[historyIndex];
    setNodes(entry.nodes);
    setEdges(entry.edges);
    setHistoryIndex(prev => prev - 1);
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex + 2 > history.length) return;
    const entry = history[historyIndex + 1];
    if (!entry) return;
    setNodes(entry.nodes);
    setEdges(entry.edges);
    setHistoryIndex(prev => prev + 1);
  }, [history, historyIndex]);

  const onNodesChange: OnNodesChange = useCallback((changes) => {
    for (const change of changes) {
      if (change.type === "remove" && "id" in change && selectedRef.current && change.id === selectedRef.current.id) {
        setSelectedNode(null);
      }
    }
    setNodes((nds) => applyNodeChanges(changes, nds));
  }, []);

  const onEdgesChange: OnEdgesChange = useCallback((changes) => {
    setEdges((eds) => applyEdgeChanges(changes, eds));
  }, []);

  const onConnect: OnConnect = useCallback(
    (connection) => setEdges((eds) => addEdge(connection, eds)),
    []
  );

  const addNode = useCallback(
    (type: string, position?: { x: number; y: number }) => {
      setNodes((nds) => {
        const id = generateId();
        const newNode: Node = { id, type, position: position || { x: 250, y: 250 }, data: { label: NODE_LABELS[type] || type, config: defaultConfig(type) } };
        pushHistory([...nds, newNode], edges);
        return [...nds, newNode];
      });
    },
    [edges, pushHistory]
  );

  const updateNodeConfig = useCallback(
    (nodeId: string, config: Partial<NodeConfig>) => {
      setNodes((nds) => {
        const updated = nds.map((n) => {
          if (n.id !== nodeId) return n;
          const current = (n.data?.config || {}) as NodeConfig;
          return { ...n, data: { label: config.label || n.data?.label || "", config: { ...current, ...config } } };
        });
        pushHistory(updated, edges);
        return updated;
      });
    },
    [edges, pushHistory]
  );

  const deleteSelected = useCallback(() => {
    if (selectedNode) {
      setNodes((nds) => {
        const filtered = nds.filter((n) => n.id !== selectedNode.id);
        pushHistory(filtered, edges.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id));
        return filtered;
      });
      setEdges((eds) => eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id));
      setSelectedNode(null);
    }
  }, [selectedNode, edges, pushHistory]);

  const copySelected = useCallback(() => {
    if (!selectedNode) return;
    const relatedEdges = edges.filter(e => e.source === selectedNode.id || e.target === selectedNode.id);
    setClipboard({ nodes: [selectedNode], edges: relatedEdges });
  }, [selectedNode, edges]);

  const pasteClipboard = useCallback(() => {
    if (!clipboard || clipboard.nodes.length === 0) return;
    const offset = { x: 50, y: 50 };
    const idMap = new Map<string, string>();
    const newNodes = clipboard.nodes.map(n => {
      const newId = generateId();
      idMap.set(n.id, newId);
      return { ...n, id: newId, position: { x: n.position.x + offset.x, y: n.position.y + offset.y }, selected: false, data: { ...n.data } };
    });
    const newEdges = clipboard.edges.map(e => ({ ...e, id: generateId(), source: idMap.get(e.source) || e.source, target: idMap.get(e.target) || e.target }));
    setNodes((nds) => { pushHistory([...nds, ...newNodes], edges); return [...nds, ...newNodes]; });
    setEdges((eds) => [...eds, ...newEdges]);
  }, [clipboard, edges, pushHistory]);

  const save = useCallback(async () => {
    const wf: Workflow = {
      id: workflowId || "",
      name,
      nodes: nodes.map((n) => ({
        id: n.id,
        type: n.type as FlowNode["type"],
        position: n.position,
        config: n.data.config as NodeConfig,
      })),
      edges: edges.map((e) => ({ id: e.id, source: e.source, target: e.target })),
      active: false,
    };
    const saved = await api.saveWorkflow(wf);
    setWorkflowId(saved.id);
    return saved;
  }, [workflowId, name, nodes, edges]);

  const load = useCallback(async (id: string) => {
    const wf = await api.getWorkflow(id);
    setWorkflowId(wf.id);
    setName(wf.name);
    setNodes(
      wf.nodes.map((n) => ({
        id: n.id,
        type: n.type,
        position: n.position,
        data: { label: n.config.label || n.type, config: n.config },
      }))
    );
    setEdges(
      wf.edges.map((e) => ({ id: e.id, source: e.source, target: e.target }))
    );
  }, []);

  const run = useCallback(async () => {
    if (!workflowId) {
      const saved = await save();
      return api.runWorkflow(saved.id);
    }
    return api.runWorkflow(workflowId);
  }, [workflowId, save]);

  const reset = useCallback(() => {
    setWorkflowId(null);
    setName("Untitled Workflow");
    setNodes([]);
    setEdges([]);
    setSelectedNode(null);
  }, []);

  return {
    workflowId, name, setName, nodes, edges, selectedNode, setSelectedNode,
    onNodesChange, onEdgesChange, onConnect,
    addNode, updateNodeConfig, deleteSelected, save, load, run, reset,
    undo, redo, copySelected, pasteClipboard,
  };
}
