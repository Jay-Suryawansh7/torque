import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Puzzle } from "lucide-react";

export function MCPToolNode({ data, selected }: NodeProps) {
  const config = data?.config as Record<string, unknown> | undefined;
  const serverId = (config?.mcp_server_id as string) || "";
  const tool = (config?.mcp_tool as string) || "";
  const subtitle = [serverId, tool].filter(Boolean).join(" / ") || "no tool selected";
  return (
    <div
      className={`relative px-4 py-3 min-w-[240px] rounded-xl border-2 transition-all ${
        selected
          ? "border-purple-400 shadow-lg shadow-purple-500/15 bg-purple-950/60"
          : "border-purple-800/30 bg-purple-500/10 hover:border-purple-700/50"
      }`}
    >
      <div className="flex items-center gap-2.5 mb-1">
        <div className="p-1.5 rounded-lg bg-purple-500/10">
          <Puzzle size={14} className="text-purple-400" />
        </div>
        <span className="text-sm font-semibold text-purple-100 truncate max-w-[200px]">
          {(config?.label as string) || "MCP Tool"}
        </span>
      </div>
      <div className="text-[10px] text-purple-300/50 font-mono ml-9">{subtitle}</div>
      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-purple-400 !border-2 !border-purple-900 !-top-1.5" />
      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-purple-400 !border-2 !border-purple-900 !-bottom-1.5" />
    </div>
  );
}
