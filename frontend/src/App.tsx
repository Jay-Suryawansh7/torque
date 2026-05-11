import { useState, useCallback, useEffect, useRef } from "react";
import type { Node } from "@xyflow/react";
import { ReactFlowProvider, useReactFlow } from "@xyflow/react";
import { motion, AnimatePresence } from "motion/react";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/react";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AnimatedEmptyState } from "./components/AnimatedEmptyState";
import {
  Save, Play, FileText, Plus, Code, Download,
  Terminal, History, PanelBottomOpen, PanelBottomClose, Zap,
} from "lucide-react";
import { Canvas } from "./components/Canvas";
import { NodePalette } from "./components/NodePalette";
import { NodeCreator } from "./components/NodeCreator";
import { AgentConfigPanel } from "./components/panels/AgentConfigPanel";
import { ProviderModal } from "./components/panels/ProviderModal";
import { ConnectorModal } from "./components/panels/ConnectorModal";
import { MCPModal } from "./components/panels/MCPModal";
import { ResourceBrowser } from "./components/panels/ResourceBrowser";
import { Dashboard } from "./pages/Dashboard";
import { CredentialsPage } from "./pages/CredentialsPage";
import { useWorkflow } from "./hooks/useWorkflow";
import { useOnboardingTour, restartTour } from "./hooks/useOnboardingTour";
import { apiRequest } from "./api/client";

function AppContent() {
  const [page, setPage] = useState<"canvas" | "dashboard" | "credentials">("canvas");
  const {
    workflowId, name, setName, nodes, edges, selectedNode, setSelectedNode,
    onNodesChange, onEdgesChange, onConnect, addNode,
    updateNodeConfig, deleteSelected, save, run, load, reset,
  } = useWorkflow();
  const reactFlowInstance = useReactFlow();

  const [workflows, setWorkflows] = useState<{ id: string; name: string }[]>([]);
  const [showList, setShowList] = useState(false);
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState<{ source: string; message: string; time: string }[]>([]);
  const [exportedCode, setExportedCode] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [showLogPanel, setShowLogPanel] = useState(true);
  const [logTab, setLogTab] = useState<"logs" | "history" | "output">("logs");
  const [showNodeCreator, setShowNodeCreator] = useState(false);
  const [nodeOutputs, setNodeOutputs] = useState<Record<string, string>>({});

  const [showProviders, setShowProviders] = useState(false);
  const [showConnectors, setShowConnectors] = useState(false);
  const [showMCP, setShowMCP] = useState(false);
  const [showResources, setShowResources] = useState(false);

  useEffect(() => {
    apiRequest<{ id: string; name: string }[]>("GET", "/workflows").then(setWorkflows).catch(() => {});
  }, []);

  useEffect(() => {
    const onAuth = () => { toast.error("Session expired — please log in"); };
    const onToast = (e: Event) => { const d = (e as CustomEvent).detail; const fn = d.type === "error" ? toast.error : toast.warning; fn(d.message); };
    window.addEventListener("torque:auth-required", onAuth);
    window.addEventListener("torque:toast", onToast);
    return () => { window.removeEventListener("torque:auth-required", onAuth); window.removeEventListener("torque:toast", onToast); };
  }, []);

  useOnboardingTour();

  const addLog = useCallback((source: string, message: string) => {
    setLogs(prev => [...prev, { source, message, time: new Date().toLocaleTimeString() }]);
  }, []);

  const handleNodeClick = useCallback((node: Node) => setSelectedNode(node), [setSelectedNode]);

  const handleSave = useCallback(async () => {
    addLog("System", "Saving workflow...");
    try {
      const saved = await save();
      setWorkflows(prev => {
        const exists = prev.find(w => w.id === saved.id);
        return exists ? prev.map(w => w.id === saved.id ? saved : w) : [...prev, saved];
      });
      addLog("System", `Saved (${saved.id.slice(0, 8)})`);
    } catch (err) {
      addLog("System", `Save failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, [save, addLog]);

  const handleRun = useCallback(async () => {
    setRunning(true);
    addLog("Workflow", "Starting...");
    setNodeOutputs({});
    try {
      const result = await run();
      result.logs?.forEach((l: { step?: string; detail?: string }) => addLog(l.step || "Agent", l.detail || "step"));
      setNodeOutputs(prev => ({
        ...prev,
        _result: JSON.stringify(result, null, 2).slice(0, 2000),
      }));
      addLog("Workflow", result.error ? `Failed: ${result.error}` : "Completed");
    } catch (e) {
      addLog("Workflow", `Error: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setRunning(false);
    }
  }, [run, addLog]);

  const handleExport = useCallback(async () => {
    setExporting(true); setExportedCode(null);
    try {
      const wfPayload = {
        id: workflowId || "", name,
        nodes: nodes.map(n => ({ id: n.id, type: n.type, position: n.position, config: n.data.config })),
        edges: edges.map(e => ({ id: e.id, source: e.source, target: e.target })),
        active: false,
      };
      const code = await apiRequest<string>("POST", "/workflows/export", wfPayload, { raw: true });
      setExportedCode(code);
      addLog("System", "TypeScript code generated");
    } catch (e) {
      setExportedCode(`// Error:\n// ${e instanceof Error ? e.message : String(e)}`);
    } finally { setExporting(false); }
  }, [workflowId, name, nodes, edges, addLog]);

  const clearCanvas = useCallback(() => { reset(); addLog("System", "Canvas cleared"); setNodeOutputs({}); }, [reset, addLog]);

  const handleAddNode = useCallback((type: string) => {
    const center = reactFlowInstance.screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
    addNode(type, { x: center.x - 100, y: center.y - 50 });
  }, [addNode, reactFlowInstance]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setShowNodeCreator(true); }
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); handleRun(); }
  }, [handleRun]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-950 text-gray-100 overflow-hidden">
        {/* Top Bar */}
        <header id="tour-toolbar" className="flex items-center justify-between h-12 px-4 border-b border-gray-800 bg-gray-950 backdrop-blur shrink-0 z-20">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-torque-400 to-torque-600 flex items-center justify-center text-[10px] font-bold text-white">n</div>
              <span className="text-sm font-bold text-white tracking-tight">Torque</span>
            </div>
            <div className="h-4 w-px bg-gray-800" />
            <Button onClick={() => setPage("dashboard")} variant={page === "dashboard" ? "default" : "ghost"} size="sm" className="text-xs">Dashboard</Button>
            <Button onClick={() => setPage("canvas")} variant={page === "canvas" ? "default" : "ghost"} size="sm" className="text-xs">Workflows</Button>
            <Button onClick={() => setPage("credentials")} variant={page === "credentials" ? "default" : "ghost"} size="sm" className="text-xs">Credentials</Button>
            {page === "canvas" && (
              <div className="h-4 w-px bg-gray-800" />
            )}
            {page === "canvas" && workflowId && <span className="text-[10px] text-gray-600 font-mono">{workflowId.slice(0, 8)}</span>}
          </div>
          <div className="flex items-center gap-2">
            <Show when="signed-out">
              <SignInButton mode="modal" />
              <SignUpButton mode="modal" />
            </Show>
            <Show when="signed-in">
              <UserButton />
            </Show>
            {page === "canvas" && (
              <>
              <Button onClick={() => setShowNodeCreator(true)} variant="secondary" size="sm">
                <Plus size={13} /> Add Node
              </Button>
              <div className="w-px h-5 bg-gray-800 mx-1" />
              <Btn icon={Save} label="Save" onClick={handleSave} />
              <Btn icon={Code} label="Export" onClick={handleExport} disabled={exporting || nodes.length === 0} />
              <div className="w-px h-5 bg-gray-800 mx-1" />
              <Button id="tour-run" onClick={handleRun} disabled={running || nodes.length === 0} size="sm">
                <Play size={13} /> {running ? "Running..." : "Run"}
              </Button>
              </>
            )}
          </div>
        </header>

        {/* Main */}
        <div className="flex-1 flex overflow-hidden">
          {page === "canvas" ? (
            <>
            <aside id="tour-palette" className="w-56 border-r border-gray-800 bg-gray-950 flex flex-col shrink-0">
              <NodePalette
                onAdd={addNode}
                onOpenProviders={() => setShowProviders(true)}
                onOpenConnectors={() => setShowConnectors(true)}
                onOpenMCP={() => setShowMCP(true)}
                onOpenResources={() => setShowResources(true)}
              />
            </aside>

            <main id="tour-canvas" className="flex-1 relative">
              <Canvas nodes={nodes} edges={edges}
                onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
                onConnect={onConnect} onNodeClick={handleNodeClick} />
              {nodes.length === 0 && (
                <div className="absolute inset-0 pointer-events-none">
                  <AnimatedEmptyState
                    icon={<Zap size={48} />}
                    title="No nodes yet"
                    description="Add a node to start building your workflow"
                    action={<Button onClick={() => setShowNodeCreator(true)}><Plus size={16} /> Add Node</Button>}
                  />
                </div>
              )}
              {nodes.length > 0 && (
                <button onClick={() => setShowNodeCreator(true)}
                  className="absolute bottom-4 left-4 z-10 w-10 h-10 rounded-full bg-torque-500 hover:bg-torque-600 text-white shadow-lg shadow-torque-500/30 flex items-center justify-center transition-all active:scale-90 hover:scale-105"
                  title="Add node (Cmd+K)">
                  <Plus size={20} />
                </button>
              )}
            </main>

            {selectedNode && (
              <aside className="w-80 border-l border-gray-800 bg-gray-950 shrink-0">
                <AgentConfigPanel node={selectedNode} onClose={() => setSelectedNode(null)} onUpdate={updateNodeConfig} />
              </aside>
            )}
            </>
          ) : page === "credentials" ? (
            <div className="flex-1 overflow-y-auto"><CredentialsPage /></div>
          ) : (
            <Dashboard onNavigate={(p, id) => { setPage("canvas"); if (id === "new") clearCanvas(); }} />
          )}
        </div>

        {/* Bottom Panel */}
        <div id="tour-logs" className={`border-t border-gray-800 bg-gray-900 backdrop-blur transition-all ${showLogPanel ? "h-48" : "h-0 overflow-hidden border-0"}`}>
          <div className="flex items-center justify-between h-8 px-4 border-b border-gray-800/50">
            <div className="flex items-center gap-3">
              {(["logs", "output", "history"] as const).map(t => (
                <button key={t} onClick={() => setLogTab(t)}
                  className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${logTab === t ? "text-torque-400" : "text-gray-600 hover:text-gray-400"}`}>
                  {t === "logs" ? <Terminal size={12} /> : t === "output" ? <Code size={12} /> : <History size={12} />}
                  {t === "logs" ? "Logs" : t === "output" ? "Output" : "History"}
                  {t === "logs" && logs.length > 0 && <span className="text-[10px] text-gray-600 ml-0.5">({logs.length})</span>}
                </button>
              ))}
            </div>
            <button onClick={() => setShowLogPanel(false)} className="p-1 rounded hover:bg-gray-800 text-gray-600 hover:text-gray-300"><PanelBottomClose size={13} /></button>
          </div>
          <div className="overflow-y-auto h-[calc(100%-2rem)] p-2">
            {logTab === "logs" ? (
              logs.length === 0 ? (
                <div className="flex items-center justify-center h-full text-xs text-gray-700">Run a workflow to see logs</div>
              ) : (
                <div className="space-y-0.5 font-mono">
                  <AnimatePresence>
                  {logs.map((l, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
                      className="flex items-start gap-2 text-[11px] leading-5 font-mono">
                      <span className="text-gray-600 shrink-0 w-16">{l.time}</span>
                      <span className={`shrink-0 px-1 rounded ${
                        l.source === "System" ? "text-gray-500" :
                        l.source === "Workflow" ? "text-torque-400" : "text-amber-400"
                      }`}>[{l.source}]</span>
                      <span className={`${l.message.startsWith("Error") || l.message.startsWith("Failed") ? "text-red-400" :
                        l.message === "Completed" ? "text-emerald-400" : "text-gray-400"}`}>{l.message}</span>
                    </motion.div>
                  ))}
                </AnimatePresence>
                </div>
              )
            ) : logTab === "output" ? (
              Object.keys(nodeOutputs).length === 0 ? (
                <div className="flex items-center justify-center h-full text-xs text-gray-700">Run a workflow to see node output</div>
              ) : (
                <div className="space-y-2">
                  {Object.entries(nodeOutputs).map(([key, val]) => (
                    <div key={key} className="bg-gray-950 rounded-lg p-2 border border-gray-800">
                      <div className="text-[10px] text-torque-400 font-mono mb-1">{key}</div>
                      <pre className="text-[10px] text-gray-300 font-mono whitespace-pre-wrap leading-relaxed max-h-32 overflow-y-auto">{val}</pre>
                    </div>
                  ))}
                </div>
              )
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-gray-700">Run history coming soon</div>
            )}
          </div>
        </div>

        {!showLogPanel && (
          <button onClick={() => setShowLogPanel(true)}
            className="absolute bottom-3 right-3 z-10 flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-500 bg-gray-900 border border-gray-800 rounded-lg hover:text-gray-300 transition-all">
            <PanelBottomOpen size={13} /> Logs {logs.length > 0 && <span className="text-torque-400">({logs.length})</span>}
          </button>
        )}

        {/* Status Bar */}
        <footer className="flex items-center justify-between h-7 px-4 border-t border-gray-800 bg-gray-950 text-[10px] text-gray-600 shrink-0">
          <div className="flex items-center gap-3">
            <span>{nodes.length} node{nodes.length !== 1 ? "s" : ""}</span>
            <span>{edges.length} edge{edges.length !== 1 ? "s" : ""}</span>
            {selectedNode && <span>· editing {selectedNode.type}</span>}
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />API</span>
            <span className="text-gray-700"><kbd className="px-1 py-0.5 rounded bg-gray-800 font-mono">⌘K</kbd> Add node</span>
            <span>v0.1.0</span>
            <button onClick={restartTour} className="w-4 h-4 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-500 hover:text-gray-300 flex items-center justify-center text-[9px] font-bold transition-colors" title="Restart tour">?</button>
          </div>
        </footer>

        {/* Modals */}
        {showList && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="w-96 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-medium text-gray-200">Workflows</h2>
                <button onClick={() => setShowList(false)} className="text-gray-500 hover:text-gray-300">✕</button>
              </div>
              {workflows.length === 0 ? (
                <p className="text-sm text-gray-600 text-center py-8">No workflows yet</p>
              ) : (
                <div className="space-y-1">
                  {workflows.map(wf => (
                    <button key={wf.id} onClick={async () => { try { await load(wf.id); setShowList(false); } catch (err) { addLog("System", `Load failed: ${err instanceof Error ? err.message : String(err)}`); } }}
                      className="w-full text-left px-3 py-2.5 text-sm text-gray-200 hover:bg-gray-900 rounded-lg transition-colors">
                      {wf.name} <span className="text-[10px] text-gray-700 ml-2 font-mono">{wf.id.slice(0, 8)}</span>
                    </button>
                  ))}
                </div>
              )}
              <button onClick={() => { reset(); setShowList(false); }}
                className="flex items-center gap-1.5 mt-3 px-3 py-1.5 text-xs text-torque-400 hover:text-torque-300 rounded-lg hover:bg-gray-800 transition-colors">
                <Plus size={14} /> New Workflow
              </button>
            </div>
          </div>
        )}

        {showNodeCreator && <NodeCreator onSelect={handleAddNode} onClose={() => setShowNodeCreator(false)} />}

        <Toaster position="top-right" richColors closeButton />
        {showProviders && <ProviderModal onClose={() => setShowProviders(false)} />}
        {showConnectors && <ConnectorModal onClose={() => setShowConnectors(false)} />}
        {showMCP && <MCPModal onClose={() => setShowMCP(false)} />}
        {showResources && <ResourceBrowser onClose={() => setShowResources(false)} />}

        {/* Export Modal */}
        {exportedCode && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="w-[800px] max-h-[600px] bg-gray-900 border border-gray-800 rounded-xl shadow-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Code size={16} className="text-torque-400" />
                  <h2 className="text-sm font-medium text-gray-200">{name}.ts</h2>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => {
                    const blob = new Blob([exportedCode], { type: "text/plain" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a"); a.href = url;
                    a.download = `${name.replace(/\s+/g, "_").toLowerCase()}.ts`;
                    a.click(); URL.revokeObjectURL(url);
                  }} className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-400 hover:text-gray-200 rounded-lg hover:bg-gray-800 transition-colors">
                    <Download size={13} /> Download
                  </button>
                  <button onClick={() => { navigator.clipboard.writeText(exportedCode); addLog("System", "Code copied"); }}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-400 hover:text-gray-200 rounded-lg hover:bg-gray-800 transition-colors">Copy</button>
                  <button onClick={() => setExportedCode(null)} className="text-gray-500 hover:text-gray-300 ml-1">✕</button>
                </div>
              </div>
              <div className="relative">
                <div className="flex items-center gap-1 px-3 py-1.5 border-b border-gray-800/50 text-[10px] text-gray-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/50" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/50" />
                  <span className="ml-2 font-mono">{name.toLowerCase().replace(/\s+/g, "-")}.ts</span>
                </div>
                <pre className="text-[11px] text-gray-300 font-mono bg-gray-950 rounded-b-lg p-4 overflow-auto max-h-[450px] whitespace-pre-wrap leading-relaxed">{exportedCode}</pre>
              </div>
            </div>
          </div>
        )}
      </div>
  );
}

export default function App() {
  return <ReactFlowProvider><AppContent /></ReactFlowProvider>;
}

function Btn({ icon: Icon, label, onClick, disabled }: { icon: typeof Save; label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <Button onClick={onClick} disabled={disabled} variant="ghost" size="sm" className="h-8">
      <Icon size={13} /> <span className="hidden md:inline">{label}</span>
    </Button>
  );
}
