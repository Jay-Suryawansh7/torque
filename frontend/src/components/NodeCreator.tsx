import { useState, useMemo } from "react";
import {
  Clock, Brain, Upload, Sparkles, FileCode, GitBranch,
  Shuffle, Webhook, Repeat, Search, Puzzle,
  Server, Zap, Database, GitMerge, GitFork, Timer,
  Globe, FileText, Scan, AlignLeft, Languages, Monitor, X,
} from "lucide-react";

interface NodeCreatorProps {
  onSelect: (type: string) => void;
  onClose: () => void;
}

const ALL_NODES = [
  { type: "trigger", icon: Clock, label: "Schedule", desc: "Cron or time-based trigger", category: "Triggers", color: "text-amber-400", bg: "bg-amber-500/10" },
  { type: "webhook_trigger", icon: Webhook, label: "Webhook", desc: "HTTP POST trigger", category: "Triggers", color: "text-orange-400", bg: "bg-orange-500/10" },
  { type: "condition", icon: GitBranch, label: "IF Condition", desc: "True/false branching", category: "Flow", color: "text-rose-400", bg: "bg-rose-500/10" },
  { type: "switch", icon: Shuffle, label: "Switch", desc: "Multi-route routing", category: "Flow", color: "text-orange-400", bg: "bg-orange-500/10" },
  { type: "loop", icon: Repeat, label: "Loop", desc: "Repeat N times", category: "Flow", color: "text-pink-400", bg: "bg-pink-500/10" },
  { type: "merge", icon: GitMerge, label: "Merge", desc: "Combine data streams", category: "Flow", color: "text-indigo-400", bg: "bg-indigo-500/10" },
  { type: "split", icon: GitFork, label: "Split", desc: "Chunk into batches", category: "Flow", color: "text-teal-400", bg: "bg-teal-500/10" },
  { type: "wait", icon: Timer, label: "Wait", desc: "Delay execution", category: "Flow", color: "text-sky-400", bg: "bg-sky-500/10" },
  { type: "transform", icon: Shuffle, label: "Transform", desc: "Map/filter data", category: "Flow", color: "text-violet-400", bg: "bg-violet-500/10" },
  { type: "agent", icon: Brain, label: "Deep Agent", desc: "AI planning, tools, sub-agents", category: "AI & Agents", color: "text-torque-400", bg: "bg-torque-500/10" },
  { type: "llm", icon: Sparkles, label: "LLM Call", desc: "Direct model inference", category: "AI & Agents", color: "text-purple-400", bg: "bg-purple-500/10" },
  { type: "summarize", icon: AlignLeft, label: "Summarize", desc: "AI text summarization", category: "AI & Agents", color: "text-cyan-400", bg: "bg-cyan-500/10" },
  { type: "translate", icon: Languages, label: "Translate", desc: "AI translation", category: "AI & Agents", color: "text-rose-400", bg: "bg-rose-500/10" },
  { type: "computer_use", icon: Monitor, label: "Computer Use", desc: "Browser automation", category: "AI & Agents", color: "text-rose-400", bg: "bg-rose-500/10" },
  { type: "mcp_tool", icon: Puzzle, label: "MCP Tool", desc: "Call MCP server tool", category: "AI & Agents", color: "text-purple-400", bg: "bg-purple-500/10" },
  { type: "gemini", icon: Sparkles, label: "Gemini", desc: "Google Gemini AI", category: "AI & Agents", color: "text-blue-400", bg: "bg-blue-500/10" },
  { type: "mistral", icon: Sparkles, label: "Mistral", desc: "Mistral AI models", category: "AI & Agents", color: "text-purple-400", bg: "bg-purple-500/10" },
  { type: "huggingface", icon: Sparkles, label: "Hugging Face", desc: "Hugging Face models", category: "AI & Agents", color: "text-yellow-400", bg: "bg-yellow-500/10" },
  { type: "code", icon: FileCode, label: "Code", desc: "Python/JS/SQL script", category: "AI & Agents", color: "text-cyan-400", bg: "bg-cyan-500/10" },
  { type: "extract", icon: Scan, label: "Extract", desc: "Parse JSON/XML/HTML", category: "Data", color: "text-fuchsia-400", bg: "bg-fuchsia-500/10" },
  { type: "http_request", icon: Globe, label: "HTTP Request", desc: "API client (any method)", category: "Data", color: "text-blue-400", bg: "bg-blue-500/10" },
  { type: "database", icon: Database, label: "Database", desc: "SQL queries", category: "Data", color: "text-yellow-400", bg: "bg-yellow-500/10" },
  { type: "file_io", icon: FileText, label: "File", desc: "Read/write files", category: "Data", color: "text-lime-400", bg: "bg-lime-500/10" },
  { type: "rss", icon: FileText, label: "RSS Feed", desc: "Read RSS/Atom feeds", category: "Data", color: "text-orange-400", bg: "bg-orange-500/10" },
  { type: "email", icon: Upload, label: "Email", desc: "Send/receive via SMTP", category: "Data", color: "text-blue-400", bg: "bg-blue-500/10" },
  { type: "whatsapp", icon: Globe, label: "WhatsApp", desc: "WhatsApp Business messages", category: "Data", color: "text-green-400", bg: "bg-green-500/10" },
  { type: "twilio_sms", icon: Globe, label: "Twilio SMS", desc: "Send SMS via Twilio", category: "Data", color: "text-red-400", bg: "bg-red-500/10" },
  { type: "outlook", icon: Globe, label: "Outlook", desc: "Microsoft 365 email", category: "Data", color: "text-blue-400", bg: "bg-blue-500/10" },
  { type: "trello", icon: FileText, label: "Trello", desc: "Trello cards & boards", category: "Data", color: "text-blue-400", bg: "bg-blue-500/10" },
  { type: "asana", icon: FileText, label: "Asana", desc: "Asana tasks & projects", category: "Data", color: "text-pink-400", bg: "bg-pink-500/10" },
  { type: "clickup", icon: FileText, label: "ClickUp", desc: "ClickUp tasks & lists", category: "Data", color: "text-purple-400", bg: "bg-purple-500/10" },
  { type: "vercel", icon: Globe, label: "Vercel", desc: "Vercel deployments", category: "Data", color: "text-gray-400", bg: "bg-gray-500/10" },
  { type: "supabase", icon: Database, label: "Supabase", desc: "Supabase queries", category: "Data", color: "text-green-400", bg: "bg-green-500/10" },
  { type: "redis", icon: Database, label: "Redis", desc: "Redis operations", category: "Data", color: "text-red-400", bg: "bg-red-500/10" },
  { type: "mysql", icon: Database, label: "MySQL", desc: "MySQL queries", category: "Data", color: "text-blue-400", bg: "bg-blue-500/10" },
  { type: "output", icon: Upload, label: "Destination", desc: "File, email, Slack, Docs", category: "Outputs", color: "text-emerald-400", bg: "bg-emerald-500/10" },
  { type: "webhook", icon: Webhook, label: "Send Webhook", desc: "Outbound HTTP call", category: "Outputs", color: "text-orange-400", bg: "bg-orange-500/10" },
  { type: "respond_webhook", icon: Webhook, label: "Respond to Webhook", desc: "Reply to incoming webhook", category: "Outputs", color: "text-orange-400", bg: "bg-orange-500/10" },
];

const CATEGORIES = ["Triggers", "Flow", "AI & Agents", "Data", "Outputs"];

export function NodeCreator({ onSelect, onClose }: NodeCreatorProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return ALL_NODES.filter(n => {
      const matchesSearch = !search || n.label.toLowerCase().includes(search.toLowerCase()) || n.desc.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = !category || n.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [search, category]);

  return (
    <div
      className="absolute inset-0 bg-black/60 flex items-start justify-center z-50 backdrop-blur-sm pt-24"
      onKeyDown={e => { if (e.key === "Escape") onClose(); }}
      tabIndex={0}
      autoFocus
    >
      <div className="w-[680px] max-h-[70vh] bg-gray-900 border border-gray-800 rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Search + category tabs */}
        <div className="px-4 pt-4 pb-3 border-b border-gray-800 space-y-3">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search nodes..."
              className="w-full pl-9 pr-10 py-2.5 text-sm bg-gray-800 border border-gray-700 rounded-xl text-gray-200 placeholder-gray-500 focus:outline-none focus:border-torque-500/50 transition-colors"
              autoFocus
            />
            <button onClick={onClose} className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-gray-700 text-gray-500 hover:text-gray-300 transition-colors">
              <X size={16} />
            </button>
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-0.5">
            <button
              onClick={() => setCategory(null)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${!category ? "bg-torque-500/20 text-torque-400" : "bg-gray-800/50 text-gray-500 hover:text-gray-300"}`}
            >
              All
            </button>
            {CATEGORIES.map(c => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${category === c ? "bg-torque-500/20 text-torque-400" : "bg-gray-800/50 text-gray-500 hover:text-gray-300"}`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Node list */}
        <div className="flex-1 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-sm text-gray-600">No nodes found for "{search}"</div>
          ) : (
            <div className="grid grid-cols-2 gap-1.5">
              {filtered.map(n => (
                <button
                  key={n.type}
                  onClick={() => { onSelect(n.type); onClose(); }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-transparent hover:border-gray-700 hover:bg-gray-800/50 transition-all text-left group"
                >
                  <div className={`p-2 rounded-lg ${n.bg} shrink-0`}>
                    <n.icon size={16} className={n.color} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-200">{n.label}</div>
                    <div className="text-[10px] text-gray-600 truncate">{n.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-gray-800 text-[10px] text-gray-700 flex items-center justify-between">
          <span>{ALL_NODES.length} nodes</span>
          <span className="text-gray-700">Press <kbd className="px-1.5 py-0.5 rounded bg-gray-800 text-gray-500 font-mono text-[9px]">Esc</kbd> to close</span>
        </div>
      </div>
    </div>
  );
}
