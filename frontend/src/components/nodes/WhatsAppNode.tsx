import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Globe } from "lucide-react";

export function WhatsAppNode({ data, selected }: NodeProps) {
  const config = data?.config as Record<string, unknown> | undefined;
  return (
    <div className={`relative px-4 py-3 min-w-[240px] rounded-xl border-2 transition-all ${
      selected
        ? "border-emerald-400 shadow-lg shadow-emerald-500/15 bg-emerald-950/60"
        : "border-emerald-800/30 bg-emerald-950/30 hover:border-emerald-700/50"
    }`}>
      <div className="flex items-center gap-2.5 mb-1">
        <div className="p-1.5 rounded-lg bg-emerald-500/10"><Globe size={14} className="text-emerald-400" /></div>
        <span className="text-sm font-semibold text-emerald-100">WhatsApp</span>
      </div>
      <div className="text-[10px] text-emerald-300/50 ml-9 truncate max-w-[140px]">{(config?.destination as string) || "no destination"}</div>
      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-emerald-400 !border-2 !border-emerald-900 !-top-1.5" />
      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-emerald-400 !border-2 !border-emerald-900 !-bottom-1.5" />
    </div>
  );
}
