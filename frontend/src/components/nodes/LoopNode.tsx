import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Repeat } from "lucide-react";

export function LoopNode({ data, selected }: NodeProps) {
  const config = data?.config as Record<string, unknown> | undefined;
  const count = (config?.iteration_count as number) || 5;
  return (
    <div
      className={`relative px-4 py-3 min-w-[240px] rounded-xl border-2 transition-all ${
        selected
          ? "border-pink-400 shadow-lg shadow-pink-500/15 bg-pink-950/60"
          : "border-pink-800/30 bg-pink-950/30 hover:border-pink-700/50"
      }`}
    >
      <div className="flex items-center gap-2.5 mb-1">
        <div className="p-1.5 rounded-lg bg-pink-500/10">
          <Repeat size={14} className="text-pink-400" />
        </div>
        <span className="text-sm font-semibold text-pink-100 truncate max-w-[200px]">
          {(config?.label as string) || "Loop"}
        </span>
      </div>
      <div className="text-[10px] text-pink-300/50 font-mono ml-9">{count}x iterations</div>
      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-pink-400 !border-2 !border-pink-900 !-top-1.5" />
      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-pink-400 !border-2 !border-pink-900 !-bottom-1.5" />
    </div>
  );
}
