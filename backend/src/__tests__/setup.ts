import { beforeAll, afterAll } from "vitest";
import { mkdtempSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { initDb, closeDb } from "../database";

const dataDir = mkdtempSync(join(tmpdir(), "torque-test-"));

beforeAll(() => {
  process.env.DATA_DIR = dataDir;
  process.env.JWT_SECRET = "test-jwt-secret-at-least-32-characters-long!!";
  process.env.ENCRYPTION_KEY = Buffer.from("a".repeat(32)).toString("base64");
  process.env.FRONTEND_URL = "http://localhost:5173";
  initDb(dataDir);
});

afterAll(() => {
  closeDb();
  try { const { rmSync } = require("fs"); rmSync(dataDir, { recursive: true, force: true }); } catch {}
});
