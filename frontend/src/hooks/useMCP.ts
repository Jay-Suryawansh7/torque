import { useState, useEffect, useCallback } from "react";

interface MCPTool {
  name: string; description: string; server: string;
  readonly: boolean; confirm_destructive: boolean;
  input_schema?: { properties: Record<string, any> };
}

interface MCPResource {
  uri: string; name: string; description: string; mime_type: string;
}

interface MCPPrompt {
  name: string; description: string; arguments: { name: string; required: boolean }[];
}

interface MCPDiscover {
  servers: { id: string; name: string; type: string }[];
  tools: MCPTool[];
  resources: MCPResource[];
  prompts: MCPPrompt[];
}

export function useMCPDiscovery() {
  const [data, setData] = useState<MCPDiscover | null>(null);
  const [loading, setLoading] = useState(true);

  const discover = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/mcp/discover");
      const d = await res.json();
      setData(d);
    } catch (err) {
      console.error("MCP discovery failed:", err);
      setData(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => { discover(); }, [discover]);

  const tools = data?.tools || [];
  const resources = data?.resources || [];
  const prompts = data?.prompts || [];
  const servers = data?.servers || [];

  const toolsByServer = servers.map(s => ({
    ...s,
    tools: tools.filter(t => t.server === s.id),
    resources: resources.filter(r => r.uri.startsWith(s.id.replace("://", "://"))),
  }));

  const readonlyTools = tools.filter(t => t.readonly);
  const writeTools = tools.filter(t => !t.readonly);
  const destructiveTools = tools.filter(t => t.confirm_destructive);

  return { data, loading, discover, tools, resources, prompts, servers,
    toolsByServer, readonlyTools, writeTools, destructiveTools };
}

export function useMCPResource(uri: string | null) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!uri) { setContent(null); return; }
    setLoading(true);
    fetch(`/api/mcp/resources/${encodeURIComponent(uri)}`)
      .then(r => r.json())
      .then(d => setContent(d?.content || "No content"))
      .catch(() => setContent("Error loading resource"))
      .finally(() => setLoading(false));
  }, [uri]);

  return { content, loading };
}
