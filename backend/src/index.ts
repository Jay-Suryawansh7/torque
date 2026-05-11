import "dotenv/config";
import express, { type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import pinoHttp from "pino-http";
import helmet from "helmet";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { logger } from "./logger";
import { initDb } from "./database";
import { authRouter } from "./auth";
import { workflowsRouter } from "./api/workflows";
import { extensionsRouter } from "./api/extensions";
import { webhookRouter, startScheduler } from "./engine/triggers";
import { setEmitter } from "./engine/workflow-engine";
import { templatesRouter } from "./api/templates";

const PORT = parseInt(process.env.PORT || "8000", 10);
const DATA_DIR = process.env.DATA_DIR || "./data";

if (!process.env.JWT_SECRET) { logger.error("JWT_SECRET required"); process.exit(1); }
if (!process.env.ENCRYPTION_KEY) { logger.error("ENCRYPTION_KEY required (32 bytes base64)"); process.exit(1); }
if (isNaN(PORT) || PORT < 1 || PORT > 65535) { logger.error({ port: process.env.PORT }, "Invalid PORT"); process.exit(1); }

initDb(DATA_DIR);

const app = express();
const httpServer = createServer(app);

// ── Socket.IO for real-time streaming ──
const io = new SocketIOServer(httpServer, {
  cors: { origin: process.env.FRONTEND_URL || "http://localhost:5173", methods: ["GET", "POST"] },
});

io.on("connection", (socket) => {
  logger.info({ socketId: socket.id }, "Client connected");
  socket.on("subscribe:run", (runId: string) => {
    socket.join(`run:${runId}`);
    logger.info({ socketId: socket.id, runId }, "Subscribed to run");
  });
  socket.on("disconnect", () => logger.info({ socketId: socket.id }, "Disconnected"));
});

// Wire socket.io emit function into workflow engine for real-time log streaming
setEmitter((runId: string, event: string, data: unknown) => {
  io.to(`run:${runId}`).emit(event, data);
});

// ── Express middleware ──
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
app.use(helmet());
app.use(cors({ origin: FRONTEND_URL, credentials: false }));
app.use(express.json({ limit: "1mb" }));
app.use(pinoHttp({ logger }));

const globalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200, message: { error: "Too many requests" } });
const authLimiter = rateLimit({ windowMs: 60 * 1000, max: 5, message: { error: "Too many requests" } });
const runLimiter = rateLimit({ windowMs: 60 * 1000, max: 20, message: { error: "Too many requests" } });

// ── Routes ──
app.get("/health", (_req: Request, res: Response) => { res.json({ status: "ok", version: "0.1.0" }); });

app.use("/api/v1/auth", authLimiter, authRouter());
app.use("/api/v1", globalLimiter, workflowsRouter(DATA_DIR));
app.use("/api/v1", extensionsRouter(DATA_DIR));
app.use("/api/v1/templates", globalLimiter, templatesRouter(DATA_DIR));
app.use("/api/v1/workflows/:id/run", runLimiter);

// Public webhook endpoint (no auth, no rate limit — but could abuse)
app.use("/", webhookRouter());

// Legacy /api/ routes (backward compat)
app.use("/api/auth", authLimiter, authRouter());
app.use("/api", globalLimiter, workflowsRouter(DATA_DIR));
app.use("/api", extensionsRouter(DATA_DIR));

// ── Error handler ──
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error({ err }, "Unhandled error");
  res.status(500).json({ error: "Internal server error" });
});

// ── Start ──
httpServer.listen(PORT, () => {
  logger.info({ port: PORT, dataDir: DATA_DIR }, "Backend started");
  startScheduler();
  logger.info("Schedule triggers initialized");
});

process.on("uncaughtException", (err) => { logger.fatal({ err }, "Uncaught exception"); process.exit(1); });
process.on("unhandledRejection", (reason) => { logger.fatal({ reason }, "Unhandled rejection"); process.exit(1); });
process.on("SIGTERM", () => { logger.info("Shutting down"); httpServer.close(() => process.exit(0)); });
process.on("SIGINT", () => { logger.info("Shutting down"); httpServer.close(() => process.exit(0)); });

export { io };
