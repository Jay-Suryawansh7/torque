import { Router, type Request, type Response } from "express";
import { getDb } from "../database/index.js";
import type { Workflow } from "../types.js";
import { WorkflowService } from "../engine/workflow-service.js";
import { enqueueWorkflowRun } from "../engine/workflow-engine.js";
import { generateTS } from "../engine/codegen.js";
import { WorkflowSchema } from "../schemas/workflow.schema.js";
import { validate } from "../schemas/validate.js";
import { authMiddleware } from "../auth/index.js";
import { wrap } from "./wrap.js";
import { registerSchedule, unregisterSchedule } from "../engine/triggers.js";
import { TEMPLATES, getTemplate } from "../engine/templates.js";

export function workflowsRouter(_dataDir: string): Router {
  const router = Router();
  const svc = new WorkflowService();

  router.get("/workflows", authMiddleware, wrap(async (req: Request, res: Response) => {
    const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 100, 1), 500);
    const offset = Math.max(parseInt(req.query.offset as string) || 0, 0);
    const result = await svc.list((req as any).user.id, limit, offset);
    res.json({ workflows: result.workflows, total: result.total, limit, offset });
  }));

  router.get("/workflows/:id", authMiddleware, wrap(async (req: Request, res: Response) => {
    const wf = await svc.get(req.params.id, (req as any).user.id);
    if (!wf) { res.status(404).json({ detail: "Workflow not found" }); return; }
    res.json(wf);
  }));

  router.post("/workflows", authMiddleware, validate(WorkflowSchema), wrap(async (req: Request, res: Response) => {
    const wf = await svc.save(req.body, (req as any).user.id);
    if (wf.active && req.body.trigger_type === "cron") {
      const schedule = JSON.parse(req.body.trigger_config || "{}").schedule;
      if (schedule) registerSchedule(wf.id, schedule, (req as any).user.id);
    }
    res.json(wf);
  }));

  router.put("/workflows/:id", authMiddleware, validate(WorkflowSchema), wrap(async (req: Request, res: Response) => {
    const wf = req.body;
    wf.id = req.params.id;
    const saved = await svc.save(wf, (req as any).user.id);
    unregisterSchedule(req.params.id);
    if (saved.active && wf.trigger_type === "cron") {
      const schedule = JSON.parse(wf.trigger_config || "{}").schedule;
      if (schedule) registerSchedule(saved.id, schedule, (req as any).user.id);
    }
    res.json(saved);
  }));

  router.delete("/workflows/:id", authMiddleware, wrap(async (req: Request, res: Response) => {
    if (!await svc.delete(req.params.id, (req as any).user.id)) {
      res.status(404).json({ detail: "Workflow not found" }); return;
    }
    unregisterSchedule(req.params.id);
    res.json({ ok: true });
  }));

  router.put("/workflows/:id", authMiddleware, validate(WorkflowSchema), wrap(async (req: Request, res: Response) => {
    const wf = req.body;
    wf.id = req.params.id;
    res.json(await svc.save(wf, (req as any).user.id));
  }));

  router.delete("/workflows/:id", authMiddleware, wrap(async (req: Request, res: Response) => {
    if (!await svc.delete(req.params.id, (req as any).user.id)) {
      res.status(404).json({ detail: "Workflow not found" }); return;
    }
    res.json({ ok: true });
  }));

  router.post("/workflows/:id/run", authMiddleware, wrap(async (req: Request, res: Response) => {
    try {
      const run = await enqueueWorkflowRun(req.params.id, (req as any).user.id);
      res.json(run);
    } catch (err) {
      if (err instanceof Error && err.message.includes("not found")) {
        res.status(404).json({ detail: err.message });
      } else {
        throw err;
      }
    }
  }));

  router.get("/runs/:id", authMiddleware, wrap(async (req: Request, res: Response) => {
    const run = await svc.getRun(req.params.id);
    if (!run) { res.status(404).json({ detail: "Run not found" }); return; }
    res.json(run);
  }));

  router.get("/runs", authMiddleware, wrap(async (req: Request, res: Response) => {
    const workflowId = typeof req.query.workflow_id === "string" ? req.query.workflow_id : undefined;
    const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 50, 1), 500);
    const offset = Math.max(parseInt(req.query.offset as string) || 0, 0);
    const result = await svc.listRuns(workflowId, (req as any).user.id, limit, offset);
    res.json({ runs: result.runs, total: result.total, limit, offset });
  }));

  router.get("/workflows/:id/export", authMiddleware, wrap(async (req: Request, res: Response) => {
    const wf = await svc.get(req.params.id, (req as any).user.id);
    if (!wf) { res.status(404).json({ detail: "Workflow not found" }); return; }
    const code = generateTS(wf);
    res.type("text/plain").send(code);
  }));

  router.post("/workflows/export", authMiddleware, validate(WorkflowSchema), wrap((req: Request, res: Response) => {
    const code = generateTS(req.body);
    res.type("text/plain").send(code);
  }));

  // ── Missing endpoints ──
  router.post("/workflows/:id/duplicate", authMiddleware, wrap(async (req: Request, res: Response) => {
    const original = await svc.get(req.params.id, (req as any).user.id);
    if (!original) { res.status(404).json({ detail: "Workflow not found" }); return; }
    const duplicate: Workflow = { ...original, id: "", name: `${original.name} (copy)`, active: false };
    const saved = await svc.save(duplicate, (req as any).user.id);
    res.json(saved);
  }));

  router.post("/workflows/import", authMiddleware, validate(WorkflowSchema), wrap(async (req: Request, res: Response) => {
    const wf = await svc.save(req.body, (req as any).user.id);
    res.json(wf);
  }));

  router.post("/runs/:id/cancel", authMiddleware, wrap(async (req: Request, res: Response) => {
    const db = getDb();
    const run = await db.prepare("SELECT * FROM workflow_runs WHERE id = ?").get(req.params.id) as any;
    if (!run) { res.status(404).json({ detail: "Run not found" }); return; }
    if (run.status !== "queued" && run.status !== "running") { res.status(400).json({ detail: "Run cannot be cancelled" }); return; }
    await db.prepare("UPDATE workflow_runs SET status = 'cancelled', completed_at = NOW() WHERE id = ?").run(req.params.id);
    res.json({ ok: true, status: "cancelled" });
  }));

  return router;
}
