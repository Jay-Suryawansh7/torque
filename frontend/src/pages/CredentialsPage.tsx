import { useState, useEffect } from "react";
import { Plus, Trash2, Check, X, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from "../api/client";

interface Cred {
  id: string; name: string; connectorId: string; authType: string;
  data: Record<string, unknown>; createdAt: string; lastUsedAt: string | null;
  testStatus: string | null;
}

export function CredentialsPage() {
  const [creds, setCreds] = useState<Cred[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [formName, setFormName] = useState("");
  const [formConnector, setFormConnector] = useState("openai");
  const [formKey, setFormKey] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, boolean | null>>({});

  useEffect(() => { apiRequest<Cred[]>("GET", "/credentials").then(setCreds).catch(() => {}); }, []);

  const addCred = async () => {
    if (!formName || !formKey) { setFormError("Name and API key required"); return; }
    setFormError(null);
    try {
      await apiRequest("POST", "/credentials", { name: formName, connectorId: formConnector, api_key: formKey, provider: formConnector });
      const updated = await apiRequest<Cred[]>("GET", "/credentials");
      setCreds(updated); setShowAdd(false); setFormName(""); setFormKey("");
    } catch { setFormError("Network error"); }
  };

  const deleteCred = async (id: string) => {
    try {
      await apiRequest("DELETE", `/credentials/${id}`);
      setCreds(prev => prev.filter(c => c.id !== id));
    } catch {}
  };

  const testCred = async (id: string, connectorId: string) => {
    try {
      const data = await apiRequest<{ ok: boolean }>("POST", `/credentials/${id}/test?connectorId=${connectorId}`);
      setTestResults(prev => ({ ...prev, [id]: data.ok }));
    } catch { setTestResults(prev => ({ ...prev, [id]: false })); }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-100">Credentials</h1>
          <p className="text-sm text-gray-500">Manage API keys and authentication for connectors</p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Plus size={14} /> Add Credential
        </Button>
      </div>

      {showAdd && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-4 max-w-md">
          <h3 className="text-sm font-medium text-gray-200">New Credential</h3>
          {formError && <div className="text-xs text-red-400">{formError}</div>}
          <input value={formName} onChange={e => setFormName(e.target.value)} placeholder="Name" className="w-full px-3 py-1.5 text-xs bg-gray-800 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-600 focus:outline-none focus:border-torque-500/50" />
          <select value={formConnector} onChange={e => setFormConnector(e.target.value)}
            className="w-full px-3 py-1.5 text-xs bg-gray-800 border border-gray-700 rounded-lg text-gray-200 focus:outline-none focus:border-torque-500/50">
            <option value="openai">OpenAI</option><option value="anthropic">Anthropic</option>
            <option value="groq">Groq</option><option value="slack">Slack</option>
            <option value="github">GitHub</option>
          </select>
          <input value={formKey} onChange={e => setFormKey(e.target.value)} placeholder="API Key" type="password"
            className="w-full px-3 py-1.5 text-xs bg-gray-800 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-600 font-mono focus:outline-none focus:border-torque-500/50" />
          <Separator />
          <div className="flex justify-end gap-2">
            <Button onClick={addCred}>Save</Button>
            <Button onClick={() => setShowAdd(false)} variant="outline">Cancel</Button>
          </div>
        </div>
      )}

      {creds.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Key size={40} className="text-gray-700 mb-4" />
          <h3 className="text-lg font-semibold text-gray-200 mb-1">No credentials yet</h3>
          <p className="text-sm text-gray-500 mb-6">Add API keys to connect your services</p>
          <Button onClick={() => setShowAdd(true)}><Plus size={14} /> Add Credential</Button>
        </div>
      ) : (
        <div className="space-y-2">
          {creds.map(c => (
            <div key={c.id} className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-torque-500/10"><Key size={14} className="text-torque-400" /></div>
                <div>
                  <div className="text-sm font-medium text-gray-200">{c.name}</div>
                  <div className="text-[10px] text-gray-600">ID: {c.id.slice(0, 8)} · {c.connectorId}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {testResults[c.id] === true && <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full"><Check size={10} /> OK</span>}
                {testResults[c.id] === false && <span className="text-[10px] text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded-full"><X size={10} /> Failed</span>}
                <Button onClick={() => testCred(c.id, c.connectorId)} variant="outline" size="sm" className="h-7 text-[10px]">Test</Button>
                <Button onClick={() => deleteCred(c.id)} variant="ghost" size="sm" className="h-7 text-gray-600 hover:text-red-400"><Trash2 size={12} /></Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
