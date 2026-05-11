import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Database } from "lucide-react";

export function SupabaseNode({ data, selected }: NodeProps) {
  const config = data?.config as Record<string, unknown> | undefined;
  return (
    <div className={`relative px-4 py-3 min-w-[240px] rounded-xl border-2 transition-all ${
      selected
        ? "border-green-400 shadow-lg shadow-green-500/15 bg-green-950/60"
        : "border-green-800/30 bg-green-950/30 hover:border-green-700/50"
    }`}>
      <div className="flex items-center gap-2.5 mb-1">
        <div className="p-1.5 rounded-lg bg-green-500/10"><Database size={14} className="text-green-400" /></div>
        <span className="text-sm font-semibold text-green-100">Supabase</span>
      </div>
      <div className="text-[10px] text-green-300/50 ml-9 truncate max-w-[140px]">{(config?.destination as string) || "Query"}</div>
      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-green-400 !border-2 !border-green-900 !-top-1.5" />
      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-green-400 !border-2 !border-green-900 !-bottom-1.5" />
    </div>
  );
}
