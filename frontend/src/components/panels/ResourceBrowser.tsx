import React, { useState } from "react";
import { X, FileText, Database, Settings, MemoryStick as Memory, Terminal, Globe } from "lucide-react";
import { useMCPDiscovery, useMCPResource } from "../../hooks/useMCP";

const RESOURCE_ICONS: Record<string, React.ComponentType<{ size?: number }>> = {
  "system://memory": Memory, "system://config": Settings,
  "system://workflows": FileText, "system://credentials": Database,
  "system://logs": Terminal,
};

export function ResourceBrowser({ onClose }: { onClose: () => void }) {
  const { resources } = useMCPDiscovery();
  const [selectedUri, setSelectedUri] = useState<string | null>(null);
  const { content, loading } = useMCPResource(selectedUri);

  const groups = resources.reduce<Record<string, typeof resources>>((acc, r) => {
    const prefix = r.uri.split("://")[0];
    (acc[prefix] = acc[prefix] || []).push(r);
    return acc;
  }, {});

  return (
    <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="modal-title" onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}>
      <div className="w-[800px] h-[600px] bg-gray-900 border border-gray-800 rounded-xl shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <div>
            <h2 id="modal-title" className="text-sm font-semibold text-gray-200">Resource Browser</h2>
            <p className="text-[11px] text-gray-600 mt-0.5">Knowledge, configs, schemas, and memory via MCP resources</p>
          </div>
          <button onClick={onClose} aria-label="Close modal" className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-500 hover:text-gray-300"><X size={16} /></button>
        </div>
        <div className="flex-1 flex overflow-hidden">
          <div className="w-56 border-r border-gray-800/50 overflow-y-auto p-2 space-y-3">
            {Object.entries(groups).map(([prefix, items]) => (
              <div key={prefix}>
                <div className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider px-2 mb-1">{prefix}</div>
                {items.map(r => {
                  const Icon = RESOURCE_ICONS[r.uri] || Globe;
                  return (
                    <button key={r.uri} onClick={() => setSelectedUri(r.uri)}
                      className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left transition-colors focus:ring-1 focus:ring-torque-500 ${
                        selectedUri === r.uri ? "bg-torque-500/15 text-torque-300" : "text-gray-400 hover:bg-gray-800/50 hover:text-gray-200"
                      }`}>
                      <div className="shrink-0 w-6 h-6 rounded bg-gray-800 flex items-center justify-center">
                        <Icon size={12} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-medium truncate">{r.name}</div>
                        <div className="text-[9px] text-gray-600 truncate">{r.mime_type}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {!selectedUri && <div className="flex items-center justify-center h-full text-sm text-gray-700">Select a resource to view</div>}
            {loading && <div className="flex items-center justify-center h-full text-sm text-gray-700">Loading...</div>}
            {content && !loading && (
              <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap leading-relaxed">{content}</pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
