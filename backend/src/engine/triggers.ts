import { Router, type Request, type Response } from "express";
import rateLimit from "express-rate-limit";
import { getDb } from "../database";
import { enqueueWorkflowRun } from "./workflow-engine";
import { randomBytes, createHmac, timingSafeEqual as tsEqual } from "crypto";
import { logger } from "../logger";

const SENSITIVE_HEADERS = new Set(["authorization", "cookie", "set-cookie", "x-api-key", "x-auth-token", "proxy-authorization"]);

function sanitizeHeaders(headers: Record<string, unknown>): Record<string, unknown> {
  const safe: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(headers)) {
    safe[key] = SENSITIVE_HEADERS.has(key.toLowerCase()) ? "[REDACTED]" : val;
  }
  return safe;
}

// ── Webhook Trigger ──
const webhookLimiter = rateLimit({ windowMs: 60 * 1000, max: 30, message: { error: "Too many webhook requests" } });

export function webhookRouter(): Router {
  const router = Router();

  // POST /webhooks/:workflowId/:secret — public, no auth, rate limited
  router.post("/webhooks/:workflowId/:secret", webhookLimiter, async (req: Request, res: Response) => {
    try {
      const { workflowId, secret } = req.params;
      const db = getDb();
      const wf = db.prepare("SELECT * FROM workflows WHERE id = ? AND is_active = 1").get(workflowId) as any;
      if (!wf) { res.status(404).json({ error: "Workflow not found or inactive" }); return; }

      // Verify webhook secret using timingSafeEqual
      const triggerConfig = JSON.parse(wf.trigger_config || "{}");
      if (triggerConfig.secret && !timingSafeEqual(secret, triggerConfig.secret)) {
        res.status(403).json({ error: "Invalid secret" });
        return;
      }

      // Verify HMAC-SHA256 signature if provided
      const signature = req.headers["x-hub-signature-256"] || req.headers["x-signature-256"];
      if (signature && triggerConfig.secret) {
        const hmac = createHmac("sha256", triggerConfig.secret).update(JSON.stringify(req.body)).digest("hex");
        const expected = `sha256=${hmac}`;
        const actual = Array.isArray(signature) ? signature[0] : signature;
        try {
          if (!tsEqual(Buffer.from(expected), Buffer.from(actual))) {
            res.status(403).json({ error: "Invalid HMAC signature" });
            return;
          }
        } catch {
          res.status(403).json({ error: "Signature verification failed" });
          return;
        }
      }

      // Store webhook event (sensitive headers redacted)
      const eventId = randomBytes(8).toString("hex");
      db.prepare("INSERT INTO webhook_events (id, workflow_id, payload, headers) VALUES (?,?,?,?)")
        .run(eventId, workflowId, JSON.stringify(req.body), JSON.stringify(sanitizeHeaders(req.headers as Record<string, unknown>)));

      // Enqueue run asynchronously
      enqueueWorkflowRun(workflowId, wf.user_id).catch(err => logger.error({ err }, "Webhook-triggered run failed"));

      res.json({ ok: true, eventId });
    } catch (err) {
      logger.error({ err }, "Webhook handler error");
      res.status(500).json({ error: "Internal server error" });
    }
  });

  return router;
}

// ── Schedule Trigger (node-cron) ──
import cron from "node-cron";

const scheduledJobs = new Map<string, cron.ScheduledTask>();

export function startScheduler(): void {
  const db = getDb();
  const activeWorkflows = db.prepare("SELECT * FROM workflows WHERE is_active = 1 AND trigger_type = 'cron'").all() as any[];

  for (const wf of activeWorkflows) {
    const config = JSON.parse(wf.trigger_config || "{}");
    const cronExp = config.schedule;
    if (!cronExp || !cron.validate(cronExp)) {
      logger.warn({ workflowId: wf.id, cronExp }, "Invalid cron expression, skipping schedule");
      continue;
    }

    const job = cron.schedule(cronExp, () => {
      logger.info({ workflowId: wf.id }, "Cron trigger firing");
      enqueueWorkflowRun(wf.id, wf.user_id).catch(err => logger.error({ err }, "Cron-triggered run failed"));
    }, { timezone: config.timezone || "UTC" });

    scheduledJobs.set(wf.id, job);
    logger.info({ workflowId: wf.id, cronExp }, "Scheduled workflow");
  }
}

export function registerSchedule(workflowId: string, cronExp: string, userId: string): void {
  if (scheduledJobs.has(workflowId)) {
    scheduledJobs.get(workflowId)!.stop();
    scheduledJobs.delete(workflowId);
  }
  if (!cron.validate(cronExp)) { logger.warn({ workflowId, cronExp }, "Invalid cron"); return; }
  const job = cron.schedule(cronExp, () => {
    enqueueWorkflowRun(workflowId, userId).catch(err => logger.error({ err }, "Schedule run failed"));
  });
  scheduledJobs.set(workflowId, job);
}

export function unregisterSchedule(workflowId: string): void {
  const job = scheduledJobs.get(workflowId);
  if (job) { job.stop(); scheduledJobs.delete(workflowId); }
}

// ── Polling Trigger ──
const pollIntervals = new Map<string, ReturnType<typeof setInterval>>();

export function startPolling(workflowId: string, intervalMs: number, userId: string): void {
  stopPolling(workflowId);
  const interval = setInterval(() => {
    enqueueWorkflowRun(workflowId, userId).catch((err) => logger.error({ err, workflowId }, "Polling trigger run failed"));
  }, Math.max(intervalMs, 60000)); // minimum 1 minute
  pollIntervals.set(workflowId, interval);
}

export function stopPolling(workflowId: string): void {
  const interval = pollIntervals.get(workflowId);
  if (interval) { clearInterval(interval); pollIntervals.delete(workflowId); }
}

// ── Timing-safe string comparison ──
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    // Compare against self to prevent length-based timing leak
    try { tsEqual(Buffer.from(a), Buffer.from(a)); } catch {}
    return false;
  }
  return tsEqual(Buffer.from(a), Buffer.from(b));
}
