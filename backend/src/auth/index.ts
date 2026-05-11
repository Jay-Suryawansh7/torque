import { Router, type Request, type Response, type NextFunction } from "express";
import { SignJWT, jwtVerify } from "jose";
import { verifyToken } from "@clerk/backend";
import { hash, verify } from "argon2";
import { randomBytes } from "crypto";
import { getDb } from "../database";
import { logger } from "../logger";

if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET environment variable is required");
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);
const ACCESS_TOKEN_TTL = "15m";
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface AuthPayload {
  sub: string;
  email: string;
}

export async function createAccessToken(payload: AuthPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(ACCESS_TOKEN_TTL)
    .setIssuedAt()
    .sign(JWT_SECRET);
}

export async function createRefreshToken(userId: string): Promise<string> {
  const token = randomBytes(40).toString("hex");
  const tokenHash = await hash(token);
  const db = getDb();
  db.prepare(
    "INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, datetime('now', ?))"
  ).run(userId, tokenHash, `${REFRESH_TOKEN_TTL_MS / 1000} seconds`);
  return token;
}

export async function verifyRefreshToken(token: string): Promise<string | null> {
  const db = getDb();
  const rows = db.prepare(
    "SELECT * FROM refresh_tokens WHERE revoked = 0 AND expires_at > datetime('now')"
  ).all() as { id: string; user_id: string; token_hash: string }[];

  for (const row of rows) {
    if (await verify(row.token_hash, token)) {
      db.prepare("UPDATE refresh_tokens SET revoked = 1 WHERE id = ?").run(row.id);
      return row.user_id;
    }
  }
  return null;
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing authorization header" });
    return;
  }
  const rawToken = header.slice(7);

  // Try Clerk verification first (async, but we handle both paths)
  if (process.env.CLERK_SECRET_KEY) {
    verifyToken(rawToken, { secretKey: process.env.CLERK_SECRET_KEY }).then((claims) => {
      (req as any).user = { id: claims.sub, email: (claims as any).email || claims.sub + "@clerk.dev" };
      next();
    }).catch(() => {
      // Fall back to local JWT
      verifyLocalJWT(rawToken, req, res, next);
    });
  } else {
    verifyLocalJWT(rawToken, req, res, next);
  }
}

function verifyLocalJWT(token: string, req: Request, res: Response, next: NextFunction): void {
  jwtVerify(token, JWT_SECRET).then(({ payload }) => {
    (req as any).user = { id: payload.sub as string, email: (payload.email as string) || "user@local.dev" };
    next();
  }).catch(() => {
    res.status(401).json({ error: "Invalid or expired token" });
  });
}

// ── Auth Routes (kept for backward compatibility) ──

export function authRouter(): Router {
  const router = Router();

  router.post("/register", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      if (!email || !password || password.length < 8) {
        res.status(400).json({ error: "Email required and password min 8 chars" });
        return;
      }
      const db = getDb();
      const password_hash = await hash(password);
      db.prepare("INSERT INTO users (email, password_hash) VALUES (?, ?)").run(email, password_hash);
      res.status(201).json({ ok: true });
    } catch (err: any) {
      if (err?.code === "SQLITE_CONSTRAINT_UNIQUE") {
        res.status(409).json({ error: "Email already registered" });
        return;
      }
      logger.error({ err }, "Register failed");
      res.status(500).json({ error: "Registration failed" });
    }
  });

  router.post("/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      const db = getDb();
      const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;
      if (!user || !(await verify(user.password_hash, password))) {
        res.status(401).json({ error: "Invalid email or password" });
        return;
      }
      const payload: AuthPayload = { sub: user.id, email: user.email };
      const accessToken = await createAccessToken(payload);
      const refreshToken = await createRefreshToken(user.id);
      res.json({ accessToken, refreshToken, user: { id: user.id, email: user.email } });
    } catch (err) {
      logger.error({ err }, "Login failed");
      res.status(500).json({ error: "Login failed" });
    }
  });

  router.post("/refresh", async (req: Request, res: Response) => {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) { res.status(400).json({ error: "Refresh token required" }); return; }
      const userId = await verifyRefreshToken(refreshToken);
      if (!userId) { res.status(401).json({ error: "Invalid or expired refresh token" }); return; }
      const db = getDb();
      const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId) as any;
      if (!user) { res.status(401).json({ error: "User not found" }); return; }
      const payload: AuthPayload = { sub: user.id, email: user.email };
      const accessToken = await createAccessToken(payload);
      const newRefreshToken = await createRefreshToken(user.id);
      res.json({ accessToken, refreshToken: newRefreshToken });
    } catch (err) {
      logger.error({ err }, "Refresh failed");
      res.status(500).json({ error: "Refresh failed" });
    }
  });

  router.post("/logout", async (req: Request, res: Response) => {
    try {
      const { refreshToken } = req.body;
      if (refreshToken) {
        const db = getDb();
        const rows = db.prepare("SELECT * FROM refresh_tokens WHERE revoked = 0").all() as any[];
        for (const row of rows) {
          if (await verify(row.token_hash, refreshToken)) {
            db.prepare("UPDATE refresh_tokens SET revoked = 1 WHERE id = ?").run(row.id);
            break;
          }
        }
      }
      res.json({ ok: true });
    } catch (err) { logger.error({ err }, "Logout failed"); res.status(500).json({ error: "Logout failed" }); }
  });

  router.get("/me", authMiddleware, (req: Request, res: Response) => {
    res.json((req as any).user);
  });

  return router;
}
