import { randomBytes, createCipheriv, createDecipheriv } from "crypto";
import { v4 as uuid } from "uuid";
import { getDb } from "../database/index.js";
import { logger } from "../logger.js";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY || "";
  // Accept either base64 or raw 32-byte string
  try {
    const buf = Buffer.from(raw, "base64");
    if (buf.length === 32) return buf;
  } catch {}
  if (raw.length === 32) return Buffer.from(raw);
  throw new Error("ENCRYPTION_KEY must be 32 bytes (base64 or raw)");
}

export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decrypt(ciphertext: string): string {
  const key = getEncryptionKey();
  const parts = ciphertext.split(":");
  if (parts.length !== 3) throw new Error("Invalid encrypted format");
  const iv = Buffer.from(parts[0], "hex");
  const tag = Buffer.from(parts[1], "hex");
  const encrypted = Buffer.from(parts[2], "hex");
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return decipher.update(encrypted) + decipher.final("utf8");
}

export interface CredentialRecord {
  id: string;
  userId: string;
  connectorId: string;
  name: string;
  data: Record<string, unknown>;
  authType: string;
  createdAt: string;
  updatedAt: string;
  lastUsedAt: string | null;
  lastTestedAt: string | null;
  testStatus: string | null;
}

export class CredentialService {
  async list(userId: string): Promise<CredentialRecord[]> {
    const db = getDb();
    const rows = await db.prepare(
      "SELECT * FROM credentials WHERE user_id = ? ORDER BY updated_at DESC"
    ).all(userId) as any[];
    return rows.map(r => ({
      id: r.id, userId: r.user_id, connectorId: r.connector_id,
      name: r.name,
      data: this.maskSensitive(JSON.parse(decrypt(r.data))),
      authType: r.auth_type,
      createdAt: r.created_at, updatedAt: r.updated_at,
      lastUsedAt: r.last_used_at, lastTestedAt: r.last_tested_at,
      testStatus: r.test_status,
    }));
  }

  async get(id: string, userId: string): Promise<CredentialRecord | null> {
    const db = getDb();
    const r = await db.prepare("SELECT * FROM credentials WHERE id = ? AND user_id = ?").get(id, userId) as any;
    if (!r) return null;
    return {
      id: r.id, userId: r.user_id, connectorId: r.connector_id,
      name: r.name,
      data: this.maskSensitive(JSON.parse(decrypt(r.data))),
      authType: r.auth_type,
      createdAt: r.created_at, updatedAt: r.updated_at,
      lastUsedAt: r.last_used_at, lastTestedAt: r.last_tested_at,
      testStatus: r.test_status,
    };
  }

  async getDecrypted(id: string, userId: string): Promise<Record<string, unknown> | null> {
    const db = getDb();
    const r = await db.prepare("SELECT * FROM credentials WHERE id = ? AND user_id = ?").get(id, userId) as any;
    if (!r) return null;
    await db.prepare("UPDATE credentials SET last_used_at = NOW() WHERE id = ?").run(id);
    try {
      return JSON.parse(decrypt(r.data));
    } catch (err) {
      logger.error({ err, credentialId: id }, "Failed to decrypt credential");
      return null;
    }
  }

  async save(input: { name: string; connectorId: string; data: Record<string, unknown>; authType: string }, userId: string): Promise<CredentialRecord> {
    const db = getDb();
    const encrypted = encrypt(JSON.stringify(input.data));
    const id = uuid();
    await db.prepare(
      "INSERT INTO credentials (id, user_id, connector_id, name, data, auth_type) VALUES (?,?,?,?,?,?)"
    ).run(id, userId, input.connectorId, input.name, encrypted, input.authType);
    const saved = await this.get(id, userId);
    return saved!;
  }

  async update(id: string, userId: string, data: Record<string, unknown>): Promise<boolean> {
    const db = getDb();
    const encrypted = encrypt(JSON.stringify(data));
    const result = await db.prepare(
      "UPDATE credentials SET data = ?, updated_at = NOW() WHERE id = ? AND user_id = ?"
    ).run(encrypted, id, userId);
    return result.changes > 0;
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const db = getDb();
    const result = await db.prepare("DELETE FROM credentials WHERE id = ? AND user_id = ?").run(id, userId);
    return result.changes > 0;
  }

  private maskSensitive(data: Record<string, unknown>): Record<string, unknown> {
    const masked: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(data)) {
      if (typeof val === "string" && (key.toLowerCase().includes("key") || key.toLowerCase().includes("token") || key.toLowerCase().includes("secret") || key.toLowerCase().includes("password"))) {
        masked[key] = val.length > 4 ? val.slice(0, 4) + "••••" : "••••";
      } else {
        masked[key] = val;
      }
    }
    return masked;
  }
}
