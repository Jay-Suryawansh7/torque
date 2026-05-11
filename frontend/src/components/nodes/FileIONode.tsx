import { Handle, Position, type NodeProps } from "@xyflow/react";
import { FileText } from "lucide-react";

export function FileIONode({ data, selected }: NodeProps) {
  const config = data?.config as Record<string, unknown> | undefined;
  const fmt = (config?.file_format as string) || "json";
  return (
    <div className={`relative px-4 py-3 min-w-[240px] rounded-xl border-2 transition-all ${
      selected
        ? "border-lime-400 shadow-lg shadow-lime-500/15 bg-lime-950/60"
        : "border-lime-800/30 bg-lime-950/30 hover:border-lime-700/50"
    }`}>
      <div className="flex items-center gap-2.5 mb-1">
        <div className="p-1.5 rounded-lg bg-lime-500/10"><FileText size={14} className="text-lime-400" /></div>
        <span className="text-sm font-semibold text-lime-100 truncate max-w-[200px]">{(config?.label as string) || "File"}</span>
      </div>
      <div className="text-[10px] text-lime-300/50 font-mono ml-9">.{fmt}</div>
      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-lime-400 !border-2 !border-lime-900 !-top-1.5" />
      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-lime-400 !border-2 !border-lime-900 !-bottom-1.5" />
    </div>
  );
}
