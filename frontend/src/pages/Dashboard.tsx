import { useState, useEffect } from "react";
import { motion, useMotionValue, animate } from "motion/react";
import { Plus, FileText, Activity, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "../api/client";

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  const motionValue = useMotionValue(0);

  useEffect(() => {
    const unsubscribe = motionValue.on("change", (v) => setDisplay(Math.round(v)));
    const controls = animate(motionValue, value, { duration: 0.6, ease: "easeOut" });
    return () => { unsubscribe(); controls.stop(); };
  }, [value, motionValue]);

  return <span>{display}</span>;
}

export function Dashboard({ onNavigate }: { onNavigate?: (page: string, id?: string) => void }) {
  const [stats, setStats] = useState({ workflows: 0, runsToday: 0, successRate: 0, activeWebhooks: 0 });
  const [recent, setRecent] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      apiRequest<any[]>("GET", "/workflows").catch(() => []),
      apiRequest<any[]>("GET", "/runs").catch(() => []),
    ]).then(([wfs, runs]) => {
      setStats({ workflows: wfs.length, runsToday: runs.length, successRate: 100, activeWebhooks: 0 });
      setRecent(runs.slice(0, 10));
    });
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-100">Dashboard</h1>
          <p className="text-sm text-gray-500">Overview of your workflows and runs</p>
        </div>
        <Button onClick={() => onNavigate?.("workflow", "new")}>
          <Plus size={14} /> New Workflow
        </Button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { icon: FileText, label: "Workflows", value: stats.workflows, color: "text-torque-400", bg: "bg-torque-500/10", suffix: "" },
          { icon: Activity, label: "Runs Today", value: stats.runsToday, color: "text-emerald-400", bg: "bg-emerald-500/10", suffix: "" },
          { icon: CheckCircle, label: "Success Rate", value: stats.successRate, color: "text-green-400", bg: "bg-green-500/10", suffix: "%" },
          { icon: AlertCircle, label: "Active Webhooks", value: stats.activeWebhooks, color: "text-amber-400", bg: "bg-amber-500/10", suffix: "" },
        ].map(card => (
          <div key={card.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2 rounded-lg ${card.bg}`}><card.icon size={16} className={card.color} /></div>
              <span className="text-xs text-gray-500">{card.label}</span>
            </div>
            <div className="text-2xl font-bold text-gray-100">
              <AnimatedNumber value={card.value} />{card.suffix}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl">
        <div className="px-4 py-3 border-b border-gray-800">
          <h2 className="text-sm font-medium text-gray-200">Recent Runs</h2>
        </div>
        <div className="divide-y divide-gray-800">
          {recent.length === 0 ? (
            <div className="px-4 py-12 text-center text-sm text-gray-600">No runs yet. Create and run a workflow.</div>
          ) : recent.map((r: any, i: number) => (
            <motion.div key={r.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className="px-4 py-2.5 flex items-center justify-between text-xs">
              <span className="text-gray-400 font-mono">{r.id?.slice(0, 8)}</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${r.status === "completed" ? "bg-emerald-500/10 text-emerald-400" : r.status === "failed" ? "bg-red-500/10 text-red-400" : "bg-amber-500/10 text-amber-400"}`}>{r.status}</span>
              <span className="text-gray-600">{r.started_at}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
