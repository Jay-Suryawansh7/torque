import { apiRequest } from "../../api/client";
import { useState, useEffect } from "react";
import { X, Search, Plus, Trash2, Check, ExternalLink, Plug, Zap, Shield, ShieldOff, Wifi, Lock } from "lucide-react";

interface ConnectorItem {
  id: string; name: string; icon: string; category: string; description: string;
  auth_type: string; readonly: boolean; operations: string[];
}
interface Connector {
  id: string; name: string; type: string; config: Record<string, string>;
  credential_id: string | null; connected: boolean; readonly: boolean;
  confirm_destructive: boolean; operations: string[];
}

const CATEGORY_COLORS: Record<string, string> = {
  Google: "text-blue-400 bg-blue-500/10", Communication: "text-purple-400 bg-purple-500/10",
  Productivity: "text-emerald-400 bg-emerald-500/10", Development: "text-cyan-400 bg-cyan-500/10",
  DevOps: "text-red-400 bg-red-500/10", CRM: "text-orange-400 bg-orange-500/10",
  Support: "text-rose-400 bg-rose-500/10", Payments: "text-indigo-400 bg-indigo-500/10",
  "E-commerce": "text-yellow-400 bg-yellow-500/10", Design: "text-pink-400 bg-pink-500/10",
  Database: "text-lime-400 bg-lime-500/10", Storage: "text-violet-400 bg-violet-500/10",
  Custom: "text-gray-400 bg-gray-500/10",
};

const AUTH_BADGES: Record<string, { label: string; color: string }> = {
  oauth: { label: "OAuth 2.0", color: "text-blue-400 bg-blue-500/10" },
  token: { label: "Bearer Token", color: "text-purple-400 bg-purple-500/10" },
  api_key: { label: "API Key", color: "text-amber-400 bg-amber-500/10" },
  custom: { label: "Custom", color: "text-gray-400 bg-gray-500/10" },
  none: { label: "No Auth", color: "text-gray-600 bg-gray-800" },
};

export function ConnectorModal({ onClose }: { onClose: () => void }) {
  const [marketplace, setMarketplace] = useState<ConnectorItem[]>([]);
  const [installedList, setInstalledList] = useState<Connector[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [marketplace, installed] = await Promise.all([
          apiRequest<ConnectorItem[]>("GET", "/connectors/marketplace"),
          apiRequest<Connector[]>("GET", "/connectors"),
        ]);
        setMarketplace(marketplace || []);
        setInstalledList(installed || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load connectors");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const install = async (item: ConnectorItem) => {
    setError(null);
    try {
      const body: Record<string, unknown> = { name: item.name, type: item.id, config: {}, readonly: item.readonly, confirm_destructive: !item.readonly, connected: true };
      if (item.auth_type === "oauth") {
        const data = await apiRequest<{ auth_url?: string }>("GET", `/connectors/${item.id}/oauth/start`);
        if (data.auth_url) { window.open(data.auth_url, "_blank"); return; }
      }
      await apiRequest("POST", "/connectors", body);
      setInstalledList(await apiRequest("GET", "/connectors"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to install connector");
    }
  };

  const remove = async (id: string) => {
    setError(null);
    try {
      await apiRequest("DELETE", `/connectors/${id}`);
      setInstalledList(installedList.filter(c => c.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove connector");
    }
  };

  const togglePermission = async (conn: Connector, field: "readonly" | "confirm_destructive") => {
    setError(null);
    try {
      await apiRequest("POST", "/connectors", { ...conn, [field]: !conn[field] });
      setInstalledList(await apiRequest("GET", "/connectors"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update permissions");
    }
  };

  const categories = [...new Set(marketplace.map(c => c.category))];
  const isInstalled = (id: string) => installedList.some(c => c.type === id);
  const filtered = marketplace.filter(c => {
    const ms = c.name.toLowerCase().includes(search.toLowerCase()) || c.description.toLowerCase().includes(search.toLowerCase());
    return ms && (!category || c.category === category);
  });

  return (
    <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="modal-title" onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}>
      <div className="w-[840px] max-h-[88vh] bg-gray-900 border border-gray-800 rounded-xl shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <div>
            <h2 id="modal-title" className="text-sm font-semibold text-gray-200">🧩 App Connector Marketplace</h2>
            <p className="text-[11px] text-gray-600 mt-0.5">Connect your workflows to 31+ services with real app logos</p>
          </div>
          <button onClick={onClose} aria-label="Close modal" className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-500 hover:text-gray-300"><X size={16} /></button>
        </div>

        <div className="px-4 py-3 border-b border-gray-800/50 flex items-center gap-3">
          {error && <div className="text-xs text-red-400 mb-2 px-1">{error}</div>}
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search connectors..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-gray-800/50 border border-gray-700/50 rounded-lg text-gray-200 placeholder-gray-600 focus:outline-none focus:border-torque-500/50" />
          </div>
          <div className="flex gap-1 overflow-x-auto">
            <button onClick={() => setCategory(null)}
              className={`px-2.5 py-1.5 rounded-lg text-[10px] font-medium whitespace-nowrap transition-colors ${!category ? "bg-torque-500/20 text-torque-400" : "bg-gray-800/50 text-gray-600 hover:text-gray-400"}`}>All</button>
            {categories.slice(0, 7).map(c => (
              <button key={c} onClick={() => setCategory(c)}
                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-medium whitespace-nowrap transition-colors ${category === c ? "bg-torque-500/20 text-torque-400" : "bg-gray-800/50 text-gray-600 hover:text-gray-400"}`}>{c}</button>
            ))}
          </div>
          <span className="text-[10px] text-gray-700 whitespace-nowrap">{installedList.length}/{marketplace.length}</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 gap-2.5">
            {filtered.map(item => {
              const alreadyInstalled = isInstalled(item.id);
              const inst = installedList.find(c => c.type === item.id);
              const authBadge = AUTH_BADGES[item.auth_type] || AUTH_BADGES.custom;
              return (
                <div key={item.id} className={`rounded-xl border transition-all ${
                  alreadyInstalled ? "border-emerald-800/30 bg-emerald-950/10" : "border-gray-800/30 bg-gray-800/10 hover:border-gray-700/50"
                }`}>
                  <div className="p-3.5">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <img src={item.icon} alt={item.name} className="w-8 h-8 rounded-lg bg-gray-800/50 p-1" loading="lazy"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; (e.target as HTMLImageElement).parentElement!.innerHTML = "🔌"; }} />
                        <div>
                          <div className="text-sm font-semibold text-gray-200">{item.name}</div>
                          <div className="text-[10px] text-gray-600">{item.category}</div>
                        </div>
                      </div>
                      {alreadyInstalled ? (
                        <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full"><Check size={10} /> Connected</span>
                      ) : (
                        <button onClick={() => install(item)} className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-gray-200 bg-gray-800 hover:bg-gray-700 px-2.5 py-1 rounded-lg transition-all">
                          <Plus size={11} /> {item.auth_type === "oauth" ? "Connect" : "Install"}
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500 leading-relaxed mb-2 line-clamp-2">{item.description}</p>
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${authBadge.color}`}>{authBadge.label}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${item.readonly ? "text-amber-400 bg-amber-500/10" : "text-emerald-400 bg-emerald-500/10"}`}>
                        {item.readonly ? "Read Only" : "Read + Write"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 flex-wrap">
                      {item.operations.slice(0, 4).map(op => (
                        <span key={op} className="text-[9px] text-gray-600 bg-gray-800/50 px-1.5 py-0.5 rounded font-mono">{op}</span>
                      ))}
                      {item.operations.length > 4 && <span className="text-[9px] text-gray-700">+{item.operations.length - 4}</span>}
                    </div>
                    {alreadyInstalled && inst && (
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-800/30">
                        <div className="flex items-center gap-2">
                          <button onClick={() => togglePermission(inst, "readonly")}
                            className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full transition-colors ${inst.readonly ? "text-amber-400 bg-amber-500/10" : "text-emerald-400 bg-emerald-500/10"}`}>
                            {inst.readonly ? <ShieldOff size={10} /> : <Shield size={10} />}
                            {inst.readonly ? "Read Only" : "Read/Write"}
                          </button>
                          {!inst.readonly && (
                            <button onClick={() => togglePermission(inst, "confirm_destructive")}
                              className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full transition-colors ${inst.confirm_destructive ? "text-rose-400 bg-rose-500/10" : "text-gray-600 bg-gray-800"}`}>
                              <Lock size={10} />
                              {inst.confirm_destructive ? "Confirm Writes" : "Auto Writes"}
                            </button>
                          )}
                        </div>
                        <button onClick={() => remove(inst.id)} className="text-[10px] text-gray-600 hover:text-red-400 transition-colors">Remove</button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {filtered.length === 0 && <div className="text-center py-12 text-sm text-gray-600">No connectors found</div>}
        </div>
      </div>
    </div>
  );
}
