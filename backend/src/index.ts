import "dotenv/config";
import express, { type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import pinoHttp from "pino-http";
import helmet from "helmet";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { logger } from "./logger.js";
import { initDb } from "./database/index.js";
import { authRouter } from "./auth/index.js";
import { workflowsRouter } from "./api/workflows.js";
import { extensionsRouter } from "./api/extensions.js";
import { webhookRouter, startScheduler } from "./engine/triggers.js";
import { setEmitter } from "./engine/workflow-engine.js";
import { templatesRouter } from "./api/templates.js";

const PORT = parseInt(process.env.PORT || "8000", 10);

if (!process.env.JWT_SECRET) { logger.error("JWT_SECRET required"); process.exit(1); }
if (!process.env.ENCRYPTION_KEY) { logger.error("ENCRYPTION_KEY required (32 bytes base64)"); process.exit(1); }
if (!process.env.DATABASE_URL) { logger.error("DATABASE_URL required (Neon Postgres connection string)"); process.exit(1); }
if (isNaN(PORT) || PORT < 1 || PORT > 65535) { logger.error({ port: process.env.PORT }, "Invalid PORT"); process.exit(1); }

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

async function main() {
  await initDb(process.env.DATABASE_URL!);
  logger.info("Database connected (Neon Postgres)");

  const app = express();
  const httpServer = createServer(app);

  io = new SocketIOServer(httpServer, {
    cors: { origin: FRONTEND_URL, methods: ["GET", "POST"] },
  });

  io.on("connection", (socket) => {
    logger.info({ socketId: socket.id }, "Client connected");
    socket.on("subscribe:run", (runId: string) => {
      socket.join(`run:${runId}`);
      logger.info({ socketId: socket.id, runId }, "Subscribed to run");
    });
    socket.on("disconnect", () => logger.info({ socketId: socket.id }, "Disconnected"));
  });

  setEmitter((runId: string, event: string, data: unknown) => {
    io.to(`run:${runId}`).emit(event, data);
  });

  app.use(helmet());
  app.use(cors({ origin: FRONTEND_URL, credentials: false }));
  app.use(express.json({ limit: "1mb" }));
  // app.use(pinoHttp({ logger })); // Disabled: type incompatibility with NodeNext module

  const globalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200, message: { error: "Too many requests" } });
  const authLimiter = rateLimit({ windowMs: 60 * 1000, max: 5, message: { error: "Too many requests" } });
  const runLimiter = rateLimit({ windowMs: 60 * 1000, max: 20, message: { error: "Too many requests" } });

  app.get("/health", (_req: Request, res: Response) => { res.json({ status: "ok", version: "0.1.0" }); });

  app.use("/api/v1/auth", authLimiter, authRouter());
  app.use("/api/v1", globalLimiter, workflowsRouter(""));
  app.use("/api/v1", extensionsRouter(""));
  app.use("/api/v1/templates", globalLimiter, templatesRouter(""));
  app.use("/api/v1/workflows/:id/run", runLimiter);
  app.use("/", webhookRouter());
  app.use("/api/auth", authLimiter, authRouter());
  app.use("/api", globalLimiter, workflowsRouter(""));
  app.use("/api", extensionsRouter(""));

  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    logger.error({ err }, "Unhandled error");
    res.status(500).json({ error: "Internal server error" });
  });

  httpServer.listen(PORT, () => {
    logger.info({ port: PORT }, "Backend started");
    startScheduler();
  });

  process.on("uncaughtException", (err) => { logger.fatal({ err }, "Uncaught exception"); process.exit(1); });
  process.on("unhandledRejection", (reason) => { logger.fatal({ reason }, "Unhandled rejection"); process.exit(1); });
  process.on("SIGTERM", () => { logger.info("Shutting down"); httpServer.close(() => process.exit(0)); });
  process.on("SIGINT", () => { logger.info("Shutting down"); httpServer.close(() => process.exit(0)); });
}

main().catch(err => { logger.fatal({ err }, "Failed to start"); process.exit(1); });

export let io: SocketIOServer;

