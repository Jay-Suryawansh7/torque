import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Globe } from "lucide-react";

export function HttpRequestNode({ data, selected }: NodeProps) {
  const cfg = data?.config as Record<string, unknown> | undefined;
  const method = (cfg?.method as string) || "GET";
  const url = (cfg?.webhook_url as string) || "";
  return (
    <div className={`relative px-4 py-3 min-w-[240px] rounded-xl border-2 transition-all ${
      selected ? "border-blue-400 shadow-lg shadow-blue-500/15 bg-blue-950/60"
      : "border-blue-800/30 bg-blue-950/30 hover:border-blue-700/50"}`}>
      <div className="flex items-center gap-2.5 mb-1">
        <div className="p-1.5 rounded-lg bg-blue-500/10"><Globe size={14} className="text-blue-400" /></div>
        <span className="text-sm font-semibold text-blue-100 truncate max-w-[200px]">{(cfg?.label as string) || "HTTP"}</span>
      </div>
      <div className="flex items-center gap-2 ml-9">
        <span className="text-[10px] font-mono text-blue-400/70">{method}</span>
        <span className="text-[10px] text-blue-300/50 truncate max-w-[120px]">{url || "no URL"}</span>
      </div>
      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-blue-400 !border-2 !border-blue-900 !-top-1.5" />
      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-blue-400 !border-2 !border-blue-900 !-bottom-1.5" />
    </div>
  );
}
