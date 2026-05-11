import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Globe } from "lucide-react";

export function VercelNode({ data, selected }: NodeProps) {
  const config = data?.config as Record<string, unknown> | undefined;
  return (
    <div className={`relative px-4 py-3 min-w-[240px] rounded-xl border-2 transition-all ${
      selected
        ? "border-gray-400 shadow-lg shadow-gray-500/15 bg-gray-950/60"
        : "border-gray-800/30 bg-gray-950/30 hover:border-gray-700/50"
    }`}>
      <div className="flex items-center gap-2.5 mb-1">
        <div className="p-1.5 rounded-lg bg-gray-500/10"><Globe size={14} className="text-gray-400" /></div>
        <span className="text-sm font-semibold text-gray-100">Vercel</span>
      </div>
      <div className="text-[10px] text-gray-300/50 ml-9 truncate max-w-[140px]">{(config?.destination as string) || "Deploy"}</div>
      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-gray-400 !border-2 !border-gray-900 !-top-1.5" />
      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-gray-400 !border-2 !border-gray-900 !-bottom-1.5" />
    </div>
  );
}
