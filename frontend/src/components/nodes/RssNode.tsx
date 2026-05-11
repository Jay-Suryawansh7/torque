import { Handle, Position, type NodeProps } from "@xyflow/react";
import { FileText } from "lucide-react";

export function RssNode({ data, selected }: NodeProps) {
  const config = data?.config as Record<string, unknown> | undefined;
  const url = (config?.webhook_url as string) || "feed URL not set";
  return (
    <div className={`relative px-4 py-3 min-w-[240px] rounded-xl border-2 transition-all ${
      selected ? "border-orange-400 shadow-lg shadow-orange-500/15 bg-orange-950/60"
      : "border-orange-800/30 bg-orange-950/30 hover:border-orange-700/50"}`}>
      <div className="flex items-center gap-2.5 mb-1">
        <div className="p-1.5 rounded-lg bg-orange-500/10"><FileText size={14} className="text-orange-400" /></div>
        <span className="text-sm font-semibold text-orange-100 truncate max-w-[200px]">{(config?.label as string) || "RSS Feed"}</span>
      </div>
      <div className="text-[10px] text-orange-300/50 ml-9 truncate max-w-[140px]">{url}</div>
      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-orange-400 !border-2 !border-orange-900 !-bottom-1.5" />
    </div>
  );
}
