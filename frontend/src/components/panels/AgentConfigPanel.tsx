import { useState } from "react";
import { X, Settings, Sliders, Code, ChevronDown, ChevronUp } from "lucide-react";
import type { Node } from "@xyflow/react";
import type { NodeConfig } from "../../types";

interface AgentConfigPanelProps {
  node: Node;
  onClose: () => void;
  onUpdate: (nodeId: string, config: Partial<NodeConfig>) => void;
}

type Tab = "params" | "settings" | "output";

const NODE_META: Record<string, { color: string; bg: string; border: string }> = {
  trigger: { color: "bg-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  agent: { color: "bg-torque-500", bg: "bg-torque-500/10", border: "border-torque-500/20" },
  output: { color: "bg-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  llm: { color: "bg-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/20" },
  code: { color: "bg-cyan-500", bg: "bg-cyan-500/10", border: "border-cyan-500/20" },
  condition: { color: "bg-rose-500", bg: "bg-rose-500/10", border: "border-rose-500/20" },
  transform: { color: "bg-violet-500", bg: "bg-violet-500/10", border: "border-violet-500/20" },
  webhook: { color: "bg-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/20" },
  loop: { color: "bg-pink-500", bg: "bg-pink-500/10", border: "border-pink-500/20" },
};

export function AgentConfigPanel({ node, onClose, onUpdate }: AgentConfigPanelProps) {
  const config = (node.data?.config || {}) as NodeConfig;
  const [tab, setTab] = useState<Tab>("params");
  const [advanced, setAdvanced] = useState(false);
  const meta = (node.type && NODE_META[node.type]) || { color: "bg-gray-500", bg: "bg-gray-500/10", border: "border-gray-500/20" };

  const update = <K extends keyof NodeConfig>(key: K, value: NodeConfig[K]) => {
    onUpdate(node.id, { [key]: value });
  };

  const tabs: { id: Tab; label: string; icon: typeof Settings }[] = [
    { id: "params", label: "Parameters", icon: Settings },
    { id: "settings", label: "Settings", icon: Sliders },
    { id: "output", label: "Output", icon: Code },
  ];

  return (
    <div className="h-full flex flex-col bg-gray-950 border-l border-gray-800">
      <div className="px-4 py-3 border-b border-gray-800">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2.5">
            <div className={`w-2 h-2 rounded-full ${meta.color}`} />
            <span className="text-sm font-semibold text-gray-200">{config.label || node.type}</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-900 text-gray-500 hover:text-gray-200 transition-colors">
            <X size={14} />
          </button>
        </div>
        <div className="text-[10px] text-gray-600 font-mono">{node.id.slice(0, 8)} · {node.type || "unknown"}</div>
      </div>

      <div className="flex border-b border-gray-800 px-3">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
              tab === t.id ? "text-torque-400 border-torque-400" : "text-gray-500 border-transparent hover:text-gray-400"
            }`}>
            <t.icon size={12} /> {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {tab === "params" && (
          <div className="p-4 space-y-4">
            <Field label="Label">
              <input type="text" value={config.label || ""} onChange={e => update("label", e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-gray-800 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-600 focus:outline-none focus:border-torque-500/50" placeholder="Node name" />
            </Field>

            {node.type === "trigger" && (
              <Field label="Schedule" hint="cron or natural language">
                <input type="text" value={config.schedule || ""} onChange={e => update("schedule", e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-gray-800 border border-gray-700 rounded-lg text-gray-200 font-mono focus:outline-none focus:border-torque-500/50" placeholder="0 9 * * *" />
              </Field>
            )}

            {node.type === "agent" && (
              <>
                <Field label="Goal">
                  <textarea value={config.goal || ""} onChange={e => update("goal", e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-gray-800 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-600 focus:outline-none focus:border-torque-500/50 resize-none" rows={3} placeholder="What should this agent do?" />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Model">
                    <select value={config.model || "gpt-4o"} onChange={e => update("model", e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-gray-800 border border-gray-700 rounded-lg text-gray-200 focus:outline-none focus:border-torque-500/50">
                      <option value="gpt-4o">GPT-4o</option><option value="gpt-4o-mini">GPT-4o Mini</option>
                      <option value="claude-sonnet-4-20250514">Claude Sonnet 4</option>
                      <option value="claude-haiku-3-5">Claude Haiku 3.5</option>
                    </select>
                  </Field>
                  <Field label="Temp">
                    <input type="number" min="0" max="2" step="0.1" value={config.temperature ?? 0.7}
                      onChange={e => update("temperature", parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 text-xs bg-gray-800 border border-gray-700 rounded-lg text-gray-200 font-mono focus:outline-none focus:border-torque-500/50" />
                  </Field>
                </div>
                <Field label="URLs" hint="one per line">
                  <textarea value={(config.urls || []).join("\n")} onChange={e => update("urls", e.target.value.split("\n").filter(Boolean))}
                    className="w-full px-3 py-1.5 text-xs bg-gray-800 border border-gray-700 rounded-lg text-gray-200 font-mono focus:outline-none focus:border-torque-500/50 resize-none" rows={2} placeholder="https://..." />
                </Field>
              </>
            )}

            {node.type === "llm" && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Provider">
                    <select value={config.provider || "openai"} onChange={e => {
                      update("provider", e.target.value);
                      if (e.target.value === "openai") update("model", "gpt-4o");
                      if (e.target.value === "anthropic") update("model", "claude-sonnet-4-20250514");
                    }}
                      className="w-full px-3 py-1.5 text-xs bg-gray-800 border border-gray-700 rounded-lg text-gray-200 focus:outline-none focus:border-torque-500/50">
                      <option value="openai">OpenAI</option><option value="anthropic">Anthropic</option>
                      <option value="google">Google AI</option><option value="groq">Groq</option>
                      <option value="together">Together</option><option value="openrouter">OpenRouter</option>
                    </select>
                  </Field>
                  <Field label="Model">
                    <input type="text" value={config.model || "gpt-4o"} onChange={e => update("model", e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-gray-800 border border-gray-700 rounded-lg text-gray-200 font-mono focus:outline-none focus:border-torque-500/50" />
                  </Field>
                </div>
                <Field label="System Prompt">
                  <textarea value={config.instructions || ""} onChange={e => update("instructions", e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-gray-800 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-600 focus:outline-none focus:border-torque-500/50 resize-none" rows={3} placeholder="Optional system instructions..." />
                </Field>
              </>
            )}

            {node.type === "code" && (
              <>
                <Field label="Language">
                  <select value={config.language || "python"} onChange={e => update("language", e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-gray-800 border border-gray-700 rounded-lg text-gray-200 focus:outline-none focus:border-torque-500/50">
                    <option value="python">Python</option><option value="javascript">JavaScript</option>
                    <option value="typescript">TypeScript</option><option value="bash">Bash</option>
                    <option value="sql">SQL</option>
                  </select>
                </Field>
                <Field label="Code">
                  <textarea value={config.code || ""} onChange={e => update("code", e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-gray-800 border border-gray-700 rounded-lg text-gray-200 font-mono focus:outline-none focus:border-torque-500/50 resize-none" rows={6} placeholder="# write your code here" />
                </Field>
              </>
            )}

            {node.type === "condition" && (
              <Field label="Condition" hint="returns boolean">
                <textarea value={config.condition || ""} onChange={e => update("condition", e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-gray-800 border border-gray-700 rounded-lg text-gray-200 font-mono focus:outline-none focus:border-torque-500/50 resize-none" rows={3} placeholder="e.g. data.length > 0" />
              </Field>
            )}

            {node.type === "transform" && (
              <Field label="Transform" hint="data => transformed">
                <textarea value={config.transform || ""} onChange={e => update("transform", e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-gray-800 border border-gray-700 rounded-lg text-gray-200 font-mono focus:outline-none focus:border-torque-500/50 resize-none" rows={3} placeholder="e.g. data.map(x => x.name)" />
              </Field>
            )}

            {node.type === "webhook" && (
              <>
                <Field label="URL">
                  <input type="text" value={config.webhook_url || ""} onChange={e => update("webhook_url", e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-gray-800 border border-gray-700 rounded-lg text-gray-200 font-mono focus:outline-none focus:border-torque-500/50" placeholder="https://hooks.example.com/..." />
                </Field>
                <Field label="Method">
                  <select value={config.method || "POST"} onChange={e => update("method", e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-gray-800 border border-gray-700 rounded-lg text-gray-200 focus:outline-none focus:border-torque-500/50">
                    <option value="GET">GET</option><option value="POST">POST</option>
                    <option value="PUT">PUT</option><option value="PATCH">PATCH</option>
                    <option value="DELETE">DELETE</option>
                  </select>
                </Field>
              </>
            )}

            {node.type === "loop" && (
              <Field label="Iterations">
                <input type="number" min="1" max="1000" value={config.iteration_count ?? 5}
                  onChange={e => update("iteration_count", parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-1.5 text-xs bg-gray-800 border border-gray-700 rounded-lg text-gray-200 font-mono focus:outline-none focus:border-torque-500/50" />
              </Field>
            )}

            {node.type === "output" && (
              <Field label="Destination">
                <select value={config.destination || ""} onChange={e => update("destination", e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-gray-800 border border-gray-700 rounded-lg text-gray-200 focus:outline-none focus:border-torque-500/50">
                  <option value="">Select...</option>
                  <option value="file">Local File</option>
                  <option value="google-docs">Google Docs</option>
                  <option value="email">Email</option>
                  <option value="slack">Slack</option>
                  <option value="notion">Notion</option>
                </select>
              </Field>
            )}

            {node.type === "http_request" && (
              <>
                <Field label="URL">
                  <input type="text" value={config.webhook_url || ""} onChange={e => update("webhook_url", e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-gray-800 border border-gray-700 rounded-lg text-gray-200 font-mono focus:outline-none focus:border-torque-500/50" placeholder="https://api.example.com/..." />
                </Field>
                <Field label="Method">
                  <select value={config.method || "GET"} onChange={e => update("method", e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-gray-800 border border-gray-700 rounded-lg text-gray-200 focus:outline-none focus:border-torque-500/50">
                    <option value="GET">GET</option><option value="POST">POST</option>
                    <option value="PUT">PUT</option><option value="PATCH">PATCH</option>
                    <option value="DELETE">DELETE</option>
                  </select>
                </Field>
              </>
            )}

            {node.type === "database" && (
              <>
                <Field label="Type">
                  <input type="text" value={config.database_type || "postgres"} onChange={e => update("database_type", e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-gray-800 border border-gray-700 rounded-lg text-gray-200 font-mono focus:outline-none focus:border-torque-500/50" placeholder="postgres" />
                </Field>
                <Field label="Query">
                  <textarea value={config.query || ""} onChange={e => update("query", e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-gray-800 border border-gray-700 rounded-lg text-gray-200 font-mono focus:outline-none focus:border-torque-500/50 resize-none" rows={3} placeholder="SELECT * FROM ..." />
                </Field>
              </>
            )}

            {node.type === "summarize" && (
              <Field label="Goal">
                <textarea value={config.goal || ""} onChange={e => update("goal", e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-gray-800 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-600 focus:outline-none focus:border-torque-500/50 resize-none" rows={2} placeholder="What to summarize?" />
              </Field>
            )}

            {node.type === "translate" && (
              <Field label="Target Language">
                <input type="text" value={config.target_language || "spanish"} onChange={e => update("target_language", e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-gray-800 border border-gray-700 rounded-lg text-gray-200 font-mono focus:outline-none focus:border-torque-500/50" placeholder="spanish" />
              </Field>
            )}

            {node.type === "computer_use" && (
              <Field label="Browser URL">
                <input type="text" value={config.browser_url || ""} onChange={e => update("browser_url", e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-gray-800 border border-gray-700 rounded-lg text-gray-200 font-mono focus:outline-none focus:border-torque-500/50" placeholder="https://example.com" />
              </Field>
            )}

            {node.type === "wait" && (
              <div className="grid grid-cols-2 gap-3">
                <Field label="Duration">
                  <input type="number" min="1" value={config.wait_time || 1} onChange={e => update("wait_time", parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-1.5 text-xs bg-gray-800 border border-gray-700 rounded-lg text-gray-200 font-mono focus:outline-none focus:border-torque-500/50" />
                </Field>
                <Field label="Unit">
                  <select value={config.wait_unit || "seconds"} onChange={e => update("wait_unit", e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-gray-800 border border-gray-700 rounded-lg text-gray-200 focus:outline-none focus:border-torque-500/50">
                    <option value="seconds">Seconds</option>
                    <option value="minutes">Minutes</option>
                  </select>
                </Field>
              </div>
            )}

            {node.type === "file_io" && (
              <Field label="Format">
                <select value={config.file_format || "json"} onChange={e => update("file_format", e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-gray-800 border border-gray-700 rounded-lg text-gray-200 focus:outline-none focus:border-torque-500/50">
                  <option value="json">JSON</option>
                  <option value="csv">CSV</option>
                  <option value="txt">Text</option>
                </select>
              </Field>
            )}

            {node.type === "extract" && (
              <Field label="Source Format">
                <select value={config.source_format || "json"} onChange={e => update("source_format", e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-gray-800 border border-gray-700 rounded-lg text-gray-200 focus:outline-none focus:border-torque-500/50">
                  <option value="json">JSON</option>
                  <option value="xml">XML</option>
                  <option value="html">HTML</option>
                </select>
              </Field>
            )}

            {node.type === "switch" && (
              <Field label="Switch Value">
                <input type="text" value={config.switch_value || ""} onChange={e => update("switch_value", e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-gray-800 border border-gray-700 rounded-lg text-gray-200 font-mono focus:outline-none focus:border-torque-500/50" placeholder="value to match" />
              </Field>
            )}
          </div>
        )}

        {tab === "settings" && (
          <div className="p-4 space-y-4">
            <Field label="Node Label">
              <input type="text" value={config.label || ""} onChange={e => update("label", e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-gray-800 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-600 focus:outline-none focus:border-torque-500/50" />
            </Field>

            {(node.type === "agent" || node.type === "llm") && (
              <div className="grid grid-cols-2 gap-3">
                <Field label="Temperature">
                  <input type="number" min="0" max="2" step="0.1" value={config.temperature ?? 0.7}
                    onChange={e => update("temperature", parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 text-xs bg-gray-800 border border-gray-700 rounded-lg text-gray-200 font-mono focus:outline-none focus:border-torque-500/50" />
                </Field>
                <Field label="Max Tokens">
                  <input type="number" min="1" max="128000" value={config.max_tokens ?? 2048}
                    onChange={e => update("max_tokens", parseInt(e.target.value) || 2048)}
                    className="w-full px-3 py-1.5 text-xs bg-gray-800 border border-gray-700 rounded-lg text-gray-200 font-mono focus:outline-none focus:border-torque-500/50" />
                </Field>
              </div>
            )}

            <div>
              <button onClick={() => setAdvanced(!advanced)} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors">
                {advanced ? <ChevronUp size={12} /> : <ChevronDown size={12} />} Advanced
              </button>
              {advanced && (
                <div className="mt-3 space-y-3">
                  <Field label="Credential">
                    <select value={config.credential_id || ""} onChange={e => update("credential_id", e.target.value || null)}
                      className="w-full px-3 py-1.5 text-xs bg-gray-800 border border-gray-700 rounded-lg text-gray-200 focus:outline-none focus:border-torque-500/50">
                      <option value="">None</option>
                    </select>
                  </Field>
                  <Field label="MCP Server">
                    <select value={config.mcp_server_id || ""} onChange={e => update("mcp_server_id", e.target.value || null)}
                      className="w-full px-3 py-1.5 text-xs bg-gray-800 border border-gray-700 rounded-lg text-gray-200 focus:outline-none focus:border-torque-500/50">
                      <option value="">None</option>
                    </select>
                  </Field>
                  {node.type !== "trigger" && (
                    <Field label="Skill">
                      <select value={config.skill || ""} onChange={e => update("skill", e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-gray-800 border border-gray-700 rounded-lg text-gray-200 focus:outline-none focus:border-torque-500/50">
                        <option value="">None</option>
                        <option value="research">Deep Research</option>
                        <option value="code-gen">Code Generation</option>
                        <option value="data-analysis">Data Analysis</option>
                      </select>
                    </Field>
                  )}
                </div>
              )}
            </div>

            {node.type !== "trigger" && node.type !== "output" && (
              <div className="pt-3 border-t border-gray-800/50">
                <Field label="MCP Tool">
                  <input type="text" value={config.mcp_tool || ""} onChange={e => update("mcp_tool", e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-gray-800 border border-gray-700 rounded-lg text-gray-200 font-mono focus:outline-none focus:border-torque-500/50" placeholder="tool_name" />
                </Field>
              </div>
            )}

            <div className="pt-3 border-t border-gray-800/50 space-y-2">
              <div className="text-xs font-medium text-gray-400">Required Environment</div>
              {node.type === "output" && config.destination === "google-docs" && <EnvVar name="GOOGLE_CREDENTIALS" desc="Google service account JSON" />}
              {node.type === "output" && config.destination === "email" && <><EnvVar name="SMTP_HOST" desc="SMTP host" /><EnvVar name="SMTP_PORT" desc="Port" /><EnvVar name="SMTP_USER" desc="Username" /><EnvVar name="SMTP_PASS" desc="Password" /><EnvVar name="EMAIL_TO" desc="Recipient" /></>}
              {node.type === "output" && config.destination === "slack" && <EnvVar name="SLACK_WEBHOOK_URL" desc="Slack webhook URL" />}
              {node.type === "llm" && config.provider === "openai" && <EnvVar name="OPENAI_API_KEY" desc="OpenAI API key" />}
              {node.type === "llm" && config.provider === "anthropic" && <EnvVar name="ANTHROPIC_API_KEY" desc="Anthropic API key" />}
            </div>
          </div>
        )}

        {tab === "output" && (
          <div className="p-4">
            <div className="text-xs text-gray-500 mb-3">This node outputs the following data:</div>
            <pre className="text-[11px] text-gray-400 font-mono bg-gray-950 rounded-lg p-3 overflow-x-auto border border-gray-800 leading-relaxed">{`// Node: ${config.label || node.type}\n// Type: ${node.type}\n// Run the workflow to see output`}</pre>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-medium text-gray-400">{label}</label>
        {hint && <span className="text-[10px] text-gray-600">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function EnvVar({ name, desc }: { name: string; desc: string }) {
  return (
    <div className="flex items-center justify-between px-3 py-2 bg-gray-900 rounded-lg border border-gray-800">
      <div>
        <div className="text-xs font-mono text-torque-400">{name}</div>
        <div className="text-[10px] text-gray-600">{desc}</div>
      </div>
      <span className="text-[10px] text-gray-700 bg-gray-800/50 px-1.5 py-0.5 rounded">required</span>
    </div>
  );
}
