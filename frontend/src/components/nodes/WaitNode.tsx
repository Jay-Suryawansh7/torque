import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Timer } from "lucide-react";

export function WaitNode({ data, selected }: NodeProps) {
  const config = data?.config as Record<string, unknown> | undefined;
  const time = (config?.wait_time as number) || 1;
  const unit = (config?.wait_unit as string) || "seconds";
  return (
    <div className={`relative px-4 py-3 min-w-[240px] rounded-xl border-2 transition-all ${
      selected
        ? "border-sky-400 shadow-lg shadow-sky-500/15 bg-sky-950/60"
        : "border-sky-800/30 bg-sky-950/30 hover:border-sky-700/50"
    }`}>
      <div className="flex items-center gap-2.5 mb-1">
        <div className="p-1.5 rounded-lg bg-sky-500/10"><Timer size={14} className="text-sky-400" /></div>
        <span className="text-sm font-semibold text-sky-100 truncate max-w-[200px]">{(config?.label as string) || "Wait"}</span>
      </div>
      <div className="text-[10px] text-sky-300/50 ml-9">{time} {unit}</div>
      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-sky-400 !border-2 !border-sky-900 !-top-1.5" />
      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-sky-400 !border-2 !border-sky-900 !-bottom-1.5" />
    </div>
  );
}
