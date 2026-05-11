import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Brain, CheckCircle, AlertCircle, Loader } from "lucide-react";

const statusBadge = (status?: string) => {
  switch (status) {
    case "running":
      return <span className="flex items-center gap-1 text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-full"><Loader size={10} className="animate-spin" /> running</span>;
    case "completed":
      return <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full"><CheckCircle size={10} /> done</span>;
    case "failed":
      return <span className="flex items-center gap-1 text-[10px] text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded-full"><AlertCircle size={10} /> failed</span>;
    default:
      return null;
  }
};

export function AgentNode({ data, selected }: NodeProps) {
  const config = data?.config as Record<string, unknown> | undefined;
  const goal = (config?.goal as string) || "No goal set";
  const model = (config?.model as string) || "gpt-4o";
  const status = data?.status as string | undefined;
  return (
    <div
      className={`relative px-4 py-3 min-w-[240px] rounded-xl border-2 transition-all ${
        selected
          ? "border-torque-400 shadow-lg shadow-torque-500/15 bg-torque-950/60"
          : "border-torque-800/30 bg-torque-950/30 hover:border-torque-700/50"
      }`}
    >
      <div className="flex items-center gap-2.5 mb-2">
        <div className="p-1.5 rounded-lg bg-torque-500/10">
          <Brain size={14} className="text-torque-400" />
        </div>
        <span className="text-sm font-semibold text-torque-100 truncate max-w-[200px]">
          {(config?.label as string) || "Agent"}
        </span>
        <div className="ml-auto">{statusBadge(status)}</div>
      </div>
      <div className="text-xs text-torque-300/50 leading-relaxed line-clamp-2 ml-9 mb-1.5">
        {goal}
      </div>
      <div className="flex items-center gap-2 ml-9">
        <span className="text-[10px] text-torque-400/40 bg-torque-500/5 px-1.5 py-0.5 rounded font-mono">
          {model}
        </span>
        {!!(config?.urls && Array.isArray(config.urls) && (config.urls as string[]).length > 0) && (
          <span className="text-[10px] text-torque-400/40">
            {(config.urls as string[]).length} URL{(config.urls as string[]).length > 1 ? "s" : ""}
          </span>
        )}
      </div>
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-torque-400 !border-2 !border-torque-900 !-top-1.5"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-torque-400 !border-2 !border-torque-900 !-bottom-1.5"
      />
    </div>
  );
}
