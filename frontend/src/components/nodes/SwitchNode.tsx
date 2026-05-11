import { Handle, Position, type NodeProps } from "@xyflow/react";
import { ArrowLeftRight } from "lucide-react";

export function SwitchNode({ data, selected }: NodeProps) {
  const config = data?.config as Record<string, unknown> | undefined;
  const cases = (config?.switch_cases as string[]) || ["case_1"];
  const val = (config?.switch_value as string) || "";
  return (
    <div className={`relative px-4 py-3 min-w-[240px] rounded-xl border-2 transition-all ${
      selected
        ? "border-orange-400 shadow-lg shadow-orange-500/15 bg-orange-950/60"
        : "border-orange-800/30 bg-orange-950/30 hover:border-orange-700/50"
    }`}>
      <div className="flex items-center gap-2.5 mb-1">
        <div className="p-1.5 rounded-lg bg-orange-500/10"><ArrowLeftRight size={14} className="text-orange-400" /></div>
        <span className="text-sm font-semibold text-orange-100 truncate max-w-[200px]">{(config?.label as string) || "Switch"}</span>
      </div>
      <div className="text-[10px] text-orange-300/50 ml-9 font-mono truncate">{cases.length} cases</div>
      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-orange-400 !border-2 !border-orange-900 !-top-1.5" />
      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-orange-400 !border-2 !border-orange-900 !-bottom-1.5" />
    </div>
  );
}
