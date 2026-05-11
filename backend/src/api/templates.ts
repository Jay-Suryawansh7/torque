import { Router, type Request, type Response } from "express";
import { WorkflowService } from "../engine/workflow-service.js";
import { TEMPLATES, getTemplate } from "../engine/templates.js";
import { authMiddleware } from "../auth/index.js";
import { wrap } from "./wrap.js";

export function templatesRouter(_dataDir: string): Router {
  const router = Router();
  const svc = new WorkflowService();

  router.get("/", authMiddleware, wrap((_req: Request, res: Response) => {
    res.json(TEMPLATES.map(t => ({ id: t.id, name: t.name, description: t.description, category: t.category, icon: t.icon })));
  }));

  router.get("/:id", authMiddleware, wrap((req: Request, res: Response) => {
    const t = getTemplate(req.params.id);
    if (!t) { res.status(404).json({ detail: "Template not found" }); return; }
    res.json(t);
  }));

  router.post("/:id/use", authMiddleware, wrap((req: Request, res: Response) => {
    const t = getTemplate(req.params.id);
    if (!t) { res.status(404).json({ detail: "Template not found" }); return; }
    const wf = svc.save(t.workflow, (req as any).user.id);
    res.json(wf);
  }));

  return router;
}
