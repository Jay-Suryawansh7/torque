import { Handle, Position, type NodeProps } from "@xyflow/react";
import { GitFork } from "lucide-react";

export function SplitNode({ data, selected }: NodeProps) {
  const config = data?.config as Record<string, unknown> | undefined;
  const by = (config?.split_by as string) || "size";
  const size = (config?.split_size as number) || 10;
  return (
    <div className={`relative px-4 py-3 min-w-[240px] rounded-xl border-2 transition-all ${
      selected
        ? "border-teal-400 shadow-lg shadow-teal-500/15 bg-teal-950/60"
        : "border-teal-800/30 bg-teal-950/30 hover:border-teal-700/50"
    }`}>
      <div className="flex items-center gap-2.5 mb-1">
        <div className="p-1.5 rounded-lg bg-teal-500/10"><GitFork size={14} className="text-teal-400" /></div>
        <span className="text-sm font-semibold text-teal-100 truncate max-w-[200px]">{(config?.label as string) || "Split"}</span>
      </div>
      <div className="text-[10px] text-teal-300/50 ml-9">{by} · {size}</div>
      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-teal-400 !border-2 !border-teal-900 !-top-1.5" />
      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-teal-400 !border-2 !border-teal-900 !-bottom-1.5" />
    </div>
  );
}
