import { Handle, Position, type NodeProps } from "@xyflow/react";
import { GitMerge } from "lucide-react";

export function MergeNode({ data, selected }: NodeProps) {
  const config = data?.config as Record<string, unknown> | undefined;
  const mode = (config?.merge_mode as string) || "combine";
  return (
    <div className={`relative px-4 py-3 min-w-[240px] rounded-xl border-2 transition-all ${
      selected
        ? "border-indigo-400 shadow-lg shadow-indigo-500/15 bg-indigo-950/60"
        : "border-indigo-800/30 bg-indigo-950/30 hover:border-indigo-700/50"
    }`}>
      <div className="flex items-center gap-2.5 mb-1">
        <div className="p-1.5 rounded-lg bg-indigo-500/10"><GitMerge size={14} className="text-indigo-400" /></div>
        <span className="text-sm font-semibold text-indigo-100 truncate max-w-[200px]">{(config?.label as string) || "Merge"}</span>
      </div>
      <div className="text-[10px] text-indigo-300/50 ml-9 capitalize">{mode}</div>
      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-indigo-400 !border-2 !border-indigo-900 !-top-1.5" />
      <Handle type="target" id="b" position={Position.Left} className="!w-3 !h-3 !bg-indigo-400 !border-2 !border-indigo-900" style={{ top: "60%" }} />
      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-indigo-400 !border-2 !border-indigo-900 !-bottom-1.5" />
    </div>
  );
}
