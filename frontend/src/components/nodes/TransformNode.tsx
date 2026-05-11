import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Shuffle } from "lucide-react";

export function TransformNode({ data, selected }: NodeProps) {
  const config = data?.config as Record<string, unknown> | undefined;
  return (
    <div
      className={`relative px-4 py-3 min-w-[240px] rounded-xl border-2 transition-all ${
        selected
          ? "border-violet-400 shadow-lg shadow-violet-500/15 bg-violet-950/60"
          : "border-violet-800/30 bg-violet-950/30 hover:border-violet-700/50"
      }`}
    >
      <div className="flex items-center gap-2.5 mb-1">
        <div className="p-1.5 rounded-lg bg-violet-500/10">
          <Shuffle size={14} className="text-violet-400" />
        </div>
        <span className="text-sm font-semibold text-violet-100 truncate max-w-[200px]">
          {(config?.label as string) || "Transform"}
        </span>
      </div>
      <div className="text-[10px] text-violet-300/50 ml-9 truncate max-w-[160px]">
        {(config?.transform as string) || "data transformation"}
      </div>
      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-violet-400 !border-2 !border-violet-900 !-top-1.5" />
      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-violet-400 !border-2 !border-violet-900 !-bottom-1.5" />
    </div>
  );
}
