import { Handle, Position, type NodeProps } from "@xyflow/react";
import { GitBranch } from "lucide-react";

export function ConditionNode({ data, selected }: NodeProps) {
  const config = data?.config as Record<string, unknown> | undefined;
  return (
    <div
      className={`relative px-4 py-3 min-w-[240px] rounded-xl border-2 transition-all ${
        selected
          ? "border-rose-400 shadow-lg shadow-rose-500/15 bg-rose-950/60"
          : "border-rose-800/30 bg-rose-950/30 hover:border-rose-700/50"
      }`}
    >
      <div className="flex items-center gap-2.5 mb-1">
        <div className="p-1.5 rounded-lg bg-rose-500/10">
          <GitBranch size={14} className="text-rose-400" />
        </div>
        <span className="text-sm font-semibold text-rose-100 truncate max-w-[200px]">
          {(config?.label as string) || "Condition"}
        </span>
      </div>
      <div className="text-[10px] text-rose-300/50 ml-9 truncate max-w-[160px]">
        {(config?.condition as string) || "if / else"}
      </div>
      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-rose-400 !border-2 !border-rose-900 !-top-1.5" />
      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-rose-400 !border-2 !border-rose-900 !-bottom-1.5" />
      <Handle type="source" id="true" position={Position.Right} className="!w-3 !h-3 !bg-emerald-400 !border-2 !border-emerald-900" style={{ top: "40%" }} />
      <Handle type="source" id="false" position={Position.Right} className="!w-3 !h-3 !bg-red-400 !border-2 !border-red-900" style={{ top: "60%" }} />
    </div>
  );
}
