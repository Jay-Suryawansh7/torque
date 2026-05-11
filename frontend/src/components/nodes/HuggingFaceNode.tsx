import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Sparkles } from "lucide-react";

export function HuggingFaceNode({ data, selected }: NodeProps) {
  const config = data?.config as Record<string, unknown> | undefined;
  return (
    <div className={`relative px-4 py-3 min-w-[240px] rounded-xl border-2 transition-all ${
      selected
        ? "border-yellow-400 shadow-lg shadow-yellow-500/15 bg-yellow-950/60"
        : "border-yellow-800/30 bg-yellow-950/30 hover:border-yellow-700/50"
    }`}>
      <div className="flex items-center gap-2.5 mb-1">
        <div className="p-1.5 rounded-lg bg-yellow-500/10"><Sparkles size={14} className="text-yellow-400" /></div>
        <span className="text-sm font-semibold text-yellow-100">HuggingFace</span>
      </div>
      <div className="text-[10px] text-yellow-300/50 ml-9 truncate max-w-[140px]">{(config?.model as string) || "unknown model"}</div>
      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-yellow-400 !border-2 !border-yellow-900 !-top-1.5" />
      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-yellow-400 !border-2 !border-yellow-900 !-bottom-1.5" />
    </div>
  );
}
