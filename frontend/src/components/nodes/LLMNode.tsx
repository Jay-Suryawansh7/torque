import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Sparkles } from "lucide-react";

export function LLMNode({ data, selected }: NodeProps) {
  const config = data?.config as Record<string, unknown> | undefined;
  const model = (config?.model as string) || "gpt-4o";
  const provider = (config?.provider as string) || "openai";
  return (
    <div
      className={`relative px-4 py-3 min-w-[240px] rounded-xl border-2 transition-all ${
        selected
          ? "border-purple-400 shadow-lg shadow-purple-500/15 bg-purple-950/60"
          : "border-purple-800/30 bg-purple-950/30 hover:border-purple-700/50"
      }`}
    >
      <div className="flex items-center gap-2.5 mb-1">
        <div className="p-1.5 rounded-lg bg-purple-500/10">
          <Sparkles size={14} className="text-purple-400" />
        </div>
        <span className="text-sm font-semibold text-purple-100 truncate max-w-[200px]">
          {(config?.label as string) || "LLM"}
        </span>
      </div>
      <div className="flex items-center gap-2 ml-9">
        <span className="text-[10px] text-purple-400/50 bg-purple-500/5 px-1.5 py-0.5 rounded font-mono">{provider}</span>
        <span className="text-[10px] text-purple-300/40">{model}</span>
      </div>
      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-purple-400 !border-2 !border-purple-900 !-top-1.5" />
      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-purple-400 !border-2 !border-purple-900 !-bottom-1.5" />
    </div>
  );
}
