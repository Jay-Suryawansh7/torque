import { Handle, Position, type NodeProps } from "@xyflow/react";
import { AlignLeft } from "lucide-react";

export function SummarizeNode({ data, selected }: NodeProps) {
  const config = data?.config as Record<string, unknown> | undefined;
  const label = (config?.label as string) || "Summarize";
  return (
    <div className={`relative px-4 py-3 min-w-[240px] rounded-xl border-2 transition-all ${
      selected
        ? "border-cyan-400 shadow-lg shadow-cyan-500/15 bg-cyan-950/60"
        : "border-cyan-800/30 bg-cyan-950/30 hover:border-cyan-700/50"
    }`}>
      <div className="flex items-center gap-2.5 mb-1">
        <div className="p-1.5 rounded-lg bg-cyan-500/10"><AlignLeft size={14} className="text-cyan-400" /></div>
        <span className="text-sm font-semibold text-cyan-100 truncate max-w-[200px]">{label}</span>
      </div>
      <div className="text-[10px] text-cyan-300/50 ml-9">AI-powered</div>
      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-cyan-400 !border-2 !border-cyan-900 !-top-1.5" />
      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-cyan-400 !border-2 !border-cyan-900 !-bottom-1.5" />
    </div>
  );
}
