import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Upload, CheckCircle, AlertCircle, Loader } from "lucide-react";

const destLabels: Record<string, string> = {
  file: "Local File",
  "google-docs": "Google Docs",
  email: "Email",
  slack: "Slack",
};

export function OutputNode({ data, selected }: NodeProps) {
  const config = data?.config as Record<string, unknown> | undefined;
  const dest = config?.destination as string || "Not configured";
  const label = destLabels[dest] || dest;
  const status = data?.status as string | undefined;

  const statusIcon = () => {
    switch (status) {
      case "running": return <Loader size={12} className="text-amber-400 animate-spin" />;
      case "completed": return <CheckCircle size={12} className="text-emerald-400" />;
      case "failed": return <AlertCircle size={12} className="text-red-400" />;
      default: return null;
    }
  };

  return (
    <div
      className={`relative px-4 py-3 min-w-[240px] rounded-xl border-2 transition-all ${
        selected
          ? "border-emerald-400 shadow-lg shadow-emerald-500/15 bg-emerald-950/60"
          : "border-emerald-800/30 bg-emerald-950/30 hover:border-emerald-700/50"
      }`}
    >
      <div className="flex items-center gap-2.5 mb-1">
        <div className="p-1.5 rounded-lg bg-emerald-500/10">
          <Upload size={14} className="text-emerald-400" />
        </div>
        <span className="text-sm font-semibold text-emerald-100">Output</span>
        {statusIcon()}
      </div>
      <div className="text-xs text-emerald-300/50 font-mono ml-9 capitalize">{label}</div>
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-emerald-400 !border-2 !border-emerald-900 !-top-1.5"
      />
    </div>
  );
}
