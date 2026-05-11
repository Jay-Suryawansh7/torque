import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Clock, Play, CheckCircle, AlertCircle, Loader } from "lucide-react";

const statusIcon = (status?: string) => {
  switch (status) {
    case "running": return <Loader size={12} className="text-amber-400 animate-spin" />;
    case "completed": return <CheckCircle size={12} className="text-emerald-400" />;
    case "failed": return <AlertCircle size={12} className="text-red-400" />;
    default: return null;
  }
};

export function TriggerNode({ data, selected }: NodeProps) {
  const config = data?.config as Record<string, unknown> | undefined;
  const schedule = config?.schedule as string || "Manual";
  const status = data?.status as string | undefined;
  return (
    <div
      className={`relative px-4 py-3 min-w-[240px] rounded-xl border-2 transition-all ${
        selected
          ? "border-amber-400 shadow-lg shadow-amber-500/15 bg-amber-950/60"
          : "border-amber-800/30 bg-amber-950/30 hover:border-amber-700/50"
      }`}
    >
      <div className="flex items-center gap-2.5 mb-1">
        <div className="p-1.5 rounded-lg bg-amber-500/10">
          <Clock size={14} className="text-amber-400" />
        </div>
        <span className="text-sm font-semibold text-amber-100">Trigger</span>
        {statusIcon(status)}
      </div>
      <div className="text-xs text-amber-300/50 font-mono ml-9">{schedule}</div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-amber-400 !border-2 !border-amber-900 !-bottom-1.5"
      />
    </div>
  );
}
