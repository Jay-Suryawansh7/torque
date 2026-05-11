import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Scan } from "lucide-react";

export function ExtractNode({ data, selected }: NodeProps) {
  const config = data?.config as Record<string, unknown> | undefined;
  const fmt = (config?.source_format as string) || "json";
  return (
    <div className={`relative px-4 py-3 min-w-[240px] rounded-xl border-2 transition-all ${
      selected
        ? "border-fuchsia-400 shadow-lg shadow-fuchsia-500/15 bg-fuchsia-950/60"
        : "border-fuchsia-800/30 bg-fuchsia-950/30 hover:border-fuchsia-700/50"
    }`}>
      <div className="flex items-center gap-2.5 mb-1">
        <div className="p-1.5 rounded-lg bg-fuchsia-500/10"><Scan size={14} className="text-fuchsia-400" /></div>
        <span className="text-sm font-semibold text-fuchsia-100 truncate max-w-[200px]">{(config?.label as string) || "Extract"}</span>
      </div>
      <div className="text-[10px] text-fuchsia-300/50 ml-9">{fmt}</div>
      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-fuchsia-400 !border-2 !border-fuchsia-900 !-top-1.5" />
      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-fuchsia-400 !border-2 !border-fuchsia-900 !-bottom-1.5" />
    </div>
  );
}
