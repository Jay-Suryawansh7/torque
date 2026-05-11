import { useState, useEffect } from "react";
import { X, Search, ExternalLink, Check, Trash2, Plus, Plug, Power } from "lucide-react";
import { apiRequest } from "../../api/client";

interface Provider {
  id: string; name: string; icon: string; docs: string; endpoint: string; models: string[];
}

interface Credential {
  id: string; name: string; provider: string; api_key: string; base_url: string; is_configured: boolean;
}

export function ProviderModal({ onClose }: { onClose: () => void }) {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [search, setSearch] = useState("");
  const [configuring, setConfiguring] = useState<string | null>(null);
  const [formKey, setFormKey] = useState("");
  const [formUrl, setFormUrl] = useState("");
  const [formName, setFormName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [providers, creds] = await Promise.all([
          apiRequest<any[]>("GET", "/providers/marketplace").catch(() => []),
          apiRequest<any[]>("GET", "/credentials").catch(() => []),
        ]);
        setProviders(providers);
        setCredentials(creds);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load providers");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const startConfigure = (p: Provider) => {
    const existing = credentials.find(c => c.provider === p.id);
    if (existing) {
      setConfiguring(p.id); setFormName(existing.name); setFormKey(""); setFormUrl(existing.base_url);
    } else {
      setConfiguring(p.id); setFormName(p.name); setFormKey(""); setFormUrl(p.endpoint);
    }
  };

  const saveCred = async () => {
    if (!formKey) return;
    try {
      setError(null);
      await apiRequest("POST", "/credentials", { name: formName, provider: configuring, api_key: formKey, base_url: formUrl });
      const updated = await apiRequest<any[]>("GET", "/credentials").catch(() => []);
      setCredentials(updated);
      setConfiguring(null); setFormKey(""); setFormUrl("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save credential");
    }
  };

  const deleteCred = async (id: string) => {
    try {
      setError(null);
      await apiRequest("DELETE", `/credentials/${id}`);
      setCredentials(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete credential");
    }
  };

  const filtered = providers.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.id.includes(search.toLowerCase())
  );

  const credFor = (pid: string) => credentials.find(c => c.provider === pid);
  const G = (p: string) => credentials.some(c => c.provider === p && c.is_configured);

  return (
    <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="modal-title" onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}>
      <div className="w-[720px] max-h-[85vh] bg-gray-900 border border-gray-800 rounded-xl shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <div>
            <h2 id="modal-title" className="text-sm font-semibold text-gray-200">🛒 Provider Marketplace</h2>
            <p className="text-[11px] text-gray-600 mt-0.5">Configure LLM providers — cloud, local, and open-source</p>
          </div>
          <button onClick={onClose} aria-label="Close modal" className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-500 hover:text-gray-300 transition-colors"><X size={16} /></button>
        </div>

        <div className="px-4 py-3 border-b border-gray-800/50">
          {error && <div className="text-xs text-red-400 mb-2 px-1">{error}</div>}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search providers..." className="w-full pl-9 pr-3 py-2 text-xs bg-gray-800/50 border border-gray-700/50 rounded-lg text-gray-200 placeholder-gray-600 focus:outline-none focus:border-torque-500/50" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 gap-2.5">
            {filtered.map(p => {
              const cred = credFor(p.id);
              return (
                <div key={p.id} className={`rounded-xl border transition-all ${
                  configuring === p.id ? "border-torque-500/50 bg-torque-950/20" :
                  G(p.id) ? "border-emerald-800/30 bg-emerald-950/15" :
                  "border-gray-800/30 bg-gray-800/10 hover:border-gray-700/50"
                }`}>
                  {configuring === p.id ? (
                    <div className="p-4 space-y-3">
                      <div className="flex items-center gap-2.5 mb-2">
                        <span className="text-xl">{p.icon}</span>
                        <span className="text-sm font-semibold text-gray-200">{p.name}</span>
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-600 mb-1 block">API Key</label>
                        <input value={formKey} onChange={e => setFormKey(e.target.value)} placeholder="sk-..." className="w-full px-3 py-1.5 text-xs bg-gray-800 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-600 font-mono focus:outline-none focus:border-torque-500/50 transition-colors" />
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-600 mb-1 block">Base URL (endpoint)</label>
                        <input value={formUrl} onChange={e => setFormUrl(e.target.value)} className="w-full px-3 py-1.5 text-xs bg-gray-800 border border-gray-700 rounded-lg text-gray-200 font-mono focus:outline-none focus:border-torque-500/50" />
                      </div>
                      <div className="text-[10px] text-gray-600">Default: <code className="text-torque-400/70">{p.endpoint}</code></div>
                      <div className="flex items-center gap-2 pt-1">
                        <button onClick={saveCred} disabled={!formKey} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-torque-600 hover:bg-torque-500 disabled:opacity-40 rounded-lg transition-all"><Plug size={12} /> Connect</button>
                        <button onClick={() => setConfiguring(null)} className="text-xs text-gray-500 hover:text-gray-300 px-3 py-1.5">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2.5">
                          <span className="text-xl">{p.icon}</span>
                          <div>
                            <div className="text-sm font-semibold text-gray-200">{p.name}</div>
                            <div className="text-[10px] text-gray-600">{p.id}</div>
                          </div>
                        </div>
                        {G(p.id) ? (
                          <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full"><Check size={10} /> Connected</span>
                        ) : (
                          <span className="text-[10px] text-gray-700 bg-gray-800 px-2 py-0.5 rounded-full">Not configured</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap mb-2">
                        {p.models.slice(0, 3).map(m => <span key={m} className="text-[9px] text-gray-600 bg-gray-800/50 px-1.5 py-0.5 rounded font-mono">{m}</span>)}
                        {p.models.length > 3 && <span className="text-[9px] text-gray-700">+{p.models.length - 3}</span>}
                      </div>
                      <div className="flex items-center justify-between">
                        <a href={`https://${p.docs}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] text-torque-400/60 hover:text-torque-400 transition-colors">
                          <ExternalLink size={10} /> Get Key
                        </a>
                        <div className="flex items-center gap-1">
                          {cred && G(p.id) ? (
                            <>
                              <button onClick={() => startConfigure(p)} className="p-1 rounded hover:bg-gray-800 text-gray-600 hover:text-gray-300 transition-colors" aria-label="Reconfigure" title="Reconfigure"><Power size={12} /></button>
                              <button onClick={() => deleteCred(cred.id)} className="p-1 rounded hover:bg-gray-800 text-gray-600 hover:text-red-400 transition-colors" aria-label="Remove" title="Remove"><Trash2 size={12} /></button>
                            </>
                          ) : (
                            <button onClick={() => startConfigure(p)} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-200 bg-gray-800/50 hover:bg-gray-800 px-2.5 py-1 rounded-lg transition-all">
                              <Plus size={12} /> Configure
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {filtered.length === 0 && <div className="text-center py-12 text-sm text-gray-600">No providers found for "{search}"</div>}
        </div>

        <div className="px-4 py-3 border-t border-gray-800/50 text-[10px] text-gray-700 flex items-center justify-between">
          <span className="flex items-center gap-2">{providers.length} providers · {credentials.filter(c => c.is_configured).length} connected{isLoading && <span className="text-[10px] text-gray-500">Loading...</span>}</span>
          <span className="flex items-center gap-1">Local models via <strong className="text-gray-600">Ollama</strong>, <strong className="text-gray-600">LM Studio</strong>, <strong className="text-gray-600">LiteLLM</strong></span>
        </div>
      </div>
    </div>
  );
}
