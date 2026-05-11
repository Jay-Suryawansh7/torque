import { apiRequest } from "../../api/client";
import { useState, useEffect } from "react";
import { X, Search, Plus, Trash2, Wifi, WifiOff, ExternalLink, Box } from "lucide-react";

interface MCPServerItem { id: string; name: string; icon: string; description: string; url: string; transport: string; }
interface MCPServer { id: string; name: string; url: string; transport: string; tools: Record<string, unknown>[]; enabled: boolean; }

export function MCPModal({ onClose }: { onClose: () => void }) {
  const [marketplace, setMarketplace] = useState<MCPServerItem[]>([]);
  const [servers, setServers] = useState<MCPServer[]>([]);
  const [search, setSearch] = useState("");
  const [manualUrl, setManualUrl] = useState("");
  const [manualName, setManualName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [marketplace, servers] = await Promise.all([
          apiRequest<MCPServerItem[]>("GET", "/mcp-servers/marketplace"),
          apiRequest<MCPServer[]>("GET", "/mcp-servers"),
        ]);
        setMarketplace(marketplace || []);
        setServers(servers || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load MCP servers");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const addServer = async (item: MCPServerItem) => {
    try {
      setError(null);
      await apiRequest("POST", "/mcp-servers", { name: item.name, url: item.url, transport: item.transport, tools: [], enabled: true });
      setServers(await apiRequest("GET", "/mcp-servers"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add server");
    }
  };

  const addManual = async () => {
    if (!manualName || !manualUrl) return;
    try {
      setError(null);
      await apiRequest("POST", "/mcp-servers", { name: manualName, url: manualUrl, transport: manualUrl.startsWith("http") ? "sse" : "stdio", tools: [], enabled: true });
      setServers(await apiRequest("GET", "/mcp-servers"));
      setManualName(""); setManualUrl("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add manual server");
    }
  };

  const removeServer = async (id: string) => {
    try {
      setError(null);
      await apiRequest("DELETE", `/mcp-servers/${id}`);
      setServers(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove server");
    }
  };

  const isConnected = (url: string) => servers.some(s => s.url === url);
  const filtered = marketplace.filter(m => m.name.toLowerCase().includes(search.toLowerCase()) || m.description.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="modal-title" onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}>
      <div className="w-[720px] max-h-[85vh] bg-gray-900 border border-gray-800 rounded-xl shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <div>
            <h2 id="modal-title" className="text-sm font-semibold text-gray-200">🔌 MCP Server Marketplace</h2>
            <p className="text-[11px] text-gray-600 mt-0.5">Connect external tools via Model Context Protocol</p>
          </div>
          <button onClick={onClose} aria-label="Close modal" className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-500 hover:text-gray-300 transition-colors"><X size={16} /></button>
        </div>

        <div className="px-4 py-3 border-b border-gray-800/50">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search MCP servers..." className="w-full pl-9 pr-3 py-2 text-xs bg-gray-800/50 border border-gray-700/50 rounded-lg text-gray-200 placeholder-gray-600 focus:outline-none focus:border-torque-500/50" />
          </div>
          {error && <div className="text-xs text-red-400 mb-2 px-1">{error}</div>}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* Connected servers */}
          {servers.length > 0 && (
            <div>
              <div className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Wifi size={11} /> Connected ({servers.length})</div>
              <div className="space-y-2">
                {servers.map(s => (
                  <div key={s.id} className="flex items-center justify-between px-4 py-3 rounded-xl border border-emerald-800/30 bg-emerald-950/10">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-emerald-500/10"><Wifi size={14} className="text-emerald-400" /></div>
                      <div>
                        <div className="text-sm font-medium text-gray-200">{s.name}</div>
                        <div className="text-[10px] text-gray-600 font-mono">{s.url}</div>
                        {s.tools.length > 0 && <div className="flex gap-1 mt-1">{s.tools.slice(0, 3).map((t: Record<string, unknown>, i) => {
                          const n = typeof t.name === "string" ? t.name : `tool-${i}`;
                          return <span key={`mcp-tool-${i}`} className="text-[9px] text-torque-400/60 bg-torque-500/5 px-1.5 py-0.5 rounded font-mono">{n}</span>;
                        })}</div>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-emerald-400/60 bg-emerald-500/5 px-2 py-0.5 rounded-full">{s.transport}</span>
                      <button onClick={() => removeServer(s.id)} aria-label="Remove server" className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-600 hover:text-red-400 transition-colors"><Trash2 size={12} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Marketplace */}
          <div>
            <div className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Box size={11} /> Available ({filtered.length})</div>
            <div className="grid grid-cols-2 gap-2">
              {filtered.map(item => {
                const connected = isConnected(item.url);
                return (
                  <div key={item.id} className={`rounded-xl border transition-all ${
                    connected ? "border-gray-700/30 bg-gray-800/20" : "border-gray-800/30 bg-gray-800/10 hover:border-gray-700/50"
                  }`}>
                    <div className="p-3.5">
                      <div className="flex items-start justify-between mb-1.5">
                        <div className="flex items-center gap-2.5">
                          <span className="text-lg">{item.icon}</span>
                          <div>
                            <div className="text-sm font-semibold text-gray-200">{item.name}</div>
                            <div className="text-[10px] text-gray-600 font-mono">{item.transport}</div>
                          </div>
                        </div>
                        {connected ? (
                          <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full"><Wifi size={10} /> Active</span>
                        ) : (
                          <button onClick={() => addServer(item)} className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-gray-200 bg-gray-800 hover:bg-gray-700 px-2.5 py-1 rounded-lg transition-all">
                            <Plus size={11} /> Add
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-2">{item.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            {filtered.length === 0 && <div className="text-center py-8 text-sm text-gray-600">No MCP servers found</div>}
          </div>

          {/* Manual connect */}
          <div className="pt-3 border-t border-gray-800/30">
            <div className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider mb-2">Connect Custom MCP Server</div>
            <div className="flex items-center gap-2">
              <input value={manualName} onChange={e => setManualName(e.target.value)} placeholder="Server name" className="flex-1 px-3 py-1.5 text-xs bg-gray-800/50 border border-gray-700/50 rounded-lg text-gray-200 placeholder-gray-600 focus:outline-none focus:border-torque-500/50" />
              <input value={manualUrl} onChange={e => setManualUrl(e.target.value)} placeholder="npm:package or http://..." className="flex-[2] px-3 py-1.5 text-xs bg-gray-800/50 border border-gray-700/50 rounded-lg text-gray-200 placeholder-gray-600 font-mono focus:outline-none focus:border-torque-500/50" />
              <button onClick={addManual} disabled={!manualName || !manualUrl} className="px-3 py-1.5 text-xs font-medium text-white bg-torque-600 hover:bg-torque-500 disabled:opacity-40 rounded-lg transition-all">Connect</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
