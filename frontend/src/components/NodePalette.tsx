import { useState } from "react";
import {
  Clock, Brain, Upload, Sparkles, FileCode, GitBranch,
  Shuffle, Webhook, Repeat, Search, GripVertical, Puzzle,
  Server, Zap, Database, GitMerge, GitFork, Timer,
  Globe, FileText, Scan, AlignLeft, Languages, Monitor, BookOpen,
} from "lucide-react";

interface NodePaletteProps {
  onAdd: (type: string) => void;
  onOpenProviders: () => void;
  onOpenConnectors: () => void;
  onOpenMCP: () => void;
  onOpenResources: () => void;
}

const categories = [
  {
    name: "Triggers", icon: Clock,
    items: [
      { type: "trigger", icon: Clock, label: "Schedule", desc: "Cron or time-based", color: "text-amber-400", bg: "bg-amber-500/10" },
      { type: "webhook_trigger", icon: Webhook, label: "Webhook", desc: "HTTP trigger", color: "text-orange-400", bg: "bg-orange-500/10" },
      { type: "whatsapp", icon: Webhook, label: "WhatsApp", desc: "WhatsApp Business messages", color: "text-green-400", bg: "bg-green-500/10" },
      { type: "twilio_sms", icon: Webhook, label: "Twilio SMS", desc: "Send SMS via Twilio", color: "text-red-400", bg: "bg-red-500/10" },
    ],
  },
  {
    name: "Flow", icon: Zap,
    items: [
      { type: "condition", icon: GitBranch, label: "IF Condition", desc: "True/false branching", color: "text-rose-400", bg: "bg-rose-500/10" },
      { type: "switch", icon: Shuffle, label: "Switch", desc: "Multi-route routing", color: "text-orange-400", bg: "bg-orange-500/10" },
      { type: "loop", icon: Repeat, label: "Loop", desc: "Repeat N times", color: "text-pink-400", bg: "bg-pink-500/10" },
      { type: "merge", icon: GitMerge, label: "Merge", desc: "Combine data streams", color: "text-indigo-400", bg: "bg-indigo-500/10" },
      { type: "split", icon: GitFork, label: "Split", desc: "Chunk into batches", color: "text-teal-400", bg: "bg-teal-500/10" },
      { type: "wait", icon: Timer, label: "Wait", desc: "Delay execution", color: "text-sky-400", bg: "bg-sky-500/10" },
      { type: "transform", icon: Shuffle, label: "Transform", desc: "Map/filter data", color: "text-violet-400", bg: "bg-violet-500/10" },
    ],
  },
  {
    name: "AI & Agents", icon: Brain,
    items: [
      { type: "agent", icon: Brain, label: "Deep Agent", desc: "Planning, tools, sub-agents", color: "text-torque-400", bg: "bg-torque-500/10" },
      { type: "llm", icon: Sparkles, label: "LLM Call", desc: "Direct model inference", color: "text-purple-400", bg: "bg-purple-500/10" },
      { type: "summarize", icon: AlignLeft, label: "Summarize", desc: "AI text summarization", color: "text-cyan-400", bg: "bg-cyan-500/10" },
      { type: "translate", icon: Languages, label: "Translate", desc: "AI translation", color: "text-rose-400", bg: "bg-rose-500/10" },
      { type: "computer_use", icon: Monitor, label: "Computer Use", desc: "Browser automation (Playwright)", color: "text-rose-400", bg: "bg-rose-500/10" },
      { type: "mcp_tool", icon: Puzzle, label: "MCP Tool", desc: "Call MCP server tool", color: "text-purple-400", bg: "bg-purple-500/10" },
      { type: "gemini", icon: Sparkles, label: "Gemini", desc: "Google Gemini AI", color: "text-blue-400", bg: "bg-blue-500/10" },
      { type: "mistral", icon: Sparkles, label: "Mistral", desc: "Mistral AI models", color: "text-purple-400", bg: "bg-purple-500/10" },
      { type: "huggingface", icon: Sparkles, label: "HuggingFace", desc: "Hugging Face models", color: "text-yellow-400", bg: "bg-yellow-500/10" },
      { type: "code", icon: FileCode, label: "Code", desc: "Python/JS/SQL script", color: "text-cyan-400", bg: "bg-cyan-500/10" },
    ],
  },
  {
    name: "Data", icon: Database,
    items: [
      { type: "extract", icon: Scan, label: "Extract", desc: "Parse JSON/XML/HTML", color: "text-fuchsia-400", bg: "bg-fuchsia-500/10" },
      { type: "http_request", icon: Globe, label: "HTTP Request", desc: "API client (any method)", color: "text-blue-400", bg: "bg-blue-500/10" },
      { type: "database", icon: Database, label: "Database", desc: "SQL queries", color: "text-yellow-400", bg: "bg-yellow-500/10" },
      { type: "file_io", icon: FileText, label: "File", desc: "Read/write files", color: "text-lime-400", bg: "bg-lime-500/10" },
      { type: "rss", icon: FileText, label: "RSS Feed", desc: "Read RSS/Atom feeds", color: "text-orange-400", bg: "bg-orange-500/10" },
      { type: "email", icon: Upload, label: "Email", desc: "Send/receive via SMTP", color: "text-blue-400", bg: "bg-blue-500/10" },
      { type: "whatsapp", icon: Globe, label: "WhatsApp", desc: "WhatsApp Business messages", color: "text-green-400", bg: "bg-green-500/10" },
      { type: "twilio_sms", icon: Globe, label: "Twilio SMS", desc: "Send SMS via Twilio", color: "text-red-400", bg: "bg-red-500/10" },
      { type: "outlook", icon: Globe, label: "Outlook", desc: "Microsoft 365 email", color: "text-blue-400", bg: "bg-blue-500/10" },
      { type: "trello", icon: FileText, label: "Trello", desc: "Trello cards & boards", color: "text-blue-400", bg: "bg-blue-500/10" },
      { type: "asana", icon: FileText, label: "Asana", desc: "Asana tasks & projects", color: "text-pink-400", bg: "bg-pink-500/10" },
      { type: "clickup", icon: FileText, label: "ClickUp", desc: "ClickUp tasks & lists", color: "text-purple-400", bg: "bg-purple-500/10" },
      { type: "vercel", icon: Globe, label: "Vercel", desc: "Vercel deployments", color: "text-gray-400", bg: "bg-gray-500/10" },
      { type: "supabase", icon: Database, label: "Supabase", desc: "Supabase queries", color: "text-green-400", bg: "bg-green-500/10" },
      { type: "redis", icon: Database, label: "Redis", desc: "Redis operations", color: "text-red-400", bg: "bg-red-500/10" },
      { type: "mysql", icon: Database, label: "MySQL", desc: "MySQL queries", color: "text-blue-400", bg: "bg-blue-500/10" },
    ],
  },
  {
    name: "Outputs", icon: Upload,
    items: [
      { type: "output", icon: Upload, label: "Destination", desc: "File, email, Slack, Docs", color: "text-emerald-400", bg: "bg-emerald-500/10" },
      { type: "webhook", icon: Webhook, label: "Send Webhook", desc: "Outbound HTTP call", color: "text-orange-400", bg: "bg-orange-500/10" },
      { type: "respond_webhook", icon: Webhook, label: "Respond to Webhook", desc: "Reply to incoming webhook", color: "text-orange-400", bg: "bg-orange-500/10" },
    ],
  },
];

export function NodePalette({ onAdd, onOpenProviders, onOpenConnectors, onOpenMCP, onOpenResources }: NodePaletteProps) {
  const [search, setSearch] = useState("");
  const total = categories.flatMap(c => c.items).length;

  const filtered = categories.map(c => ({
    ...c,
    items: c.items.filter(i =>
      i.label.toLowerCase().includes(search.toLowerCase()) ||
      i.desc.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter(c => c.items.length > 0);

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 pt-3 pb-2 border-b border-gray-800">
        <div className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider mb-2 flex items-center justify-between">
          <span>Nodes</span>
          <span className="text-gray-700 font-normal normal-case">{total}</span>
        </div>
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-600" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search..." className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-800 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-600 focus:outline-none focus:border-torque-500/50 transition-colors" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-3">
        {filtered.map(cat => (
          <div key={cat.name}>
            <div className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider px-2 mb-1.5 flex items-center gap-1.5">
              <cat.icon size={11} className="text-gray-700" />
              {cat.name}
            </div>
            <div className="space-y-0.5">
              {cat.items.map(item => (
                <button key={item.type} onClick={() => onAdd(item.type)}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg border border-transparent hover:border-gray-700 hover:bg-gray-900 transition-all group cursor-grab active:cursor-grabbing">
                  <div className={`p-1.5 rounded-md ${item.bg}`}><item.icon size={13} className={item.color} /></div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="text-sm font-medium text-gray-200">{item.label}</div>
                    <div className="text-[10px] text-gray-600 truncate">{item.desc}</div>
                  </div>
                  <GripVertical size={11} className="text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div className="text-center py-8 text-xs text-gray-600">No nodes for "{search}"</div>}
      </div>

      <div className="border-t border-gray-800 px-3 py-2 space-y-1">
        <button onClick={onOpenResources} className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] text-gray-500 hover:text-gray-200 hover:bg-gray-900 transition-all">
          <BookOpen size={12} /> Resources
        </button>
        <button id="tour-providers" onClick={onOpenProviders} className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] text-gray-500 hover:text-gray-200 hover:bg-gray-900 transition-all">
          <Server size={12} /> Providers & Keys
        </button>
        <button id="tour-connectors" onClick={onOpenConnectors} className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] text-gray-500 hover:text-gray-200 hover:bg-gray-900 transition-all">
          <Puzzle size={12} /> App Connectors
        </button>
        <button id="tour-mcp" onClick={onOpenMCP} className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] text-gray-500 hover:text-gray-200 hover:bg-gray-900 transition-all">
          <Server size={12} /> MCP Servers
        </button>
      </div>
    </div>
  );
}
