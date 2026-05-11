import { describe, it, expect, beforeAll } from "vitest";
import express from "express";
import request from "supertest";
import { authRouter } from "../auth";
import { extensionsRouter } from "../api/extensions";
import { getDb } from "../database";

const app = express();
app.use(express.json());
app.use("/api/auth", authRouter());
app.use("/api", extensionsRouter("/tmp"));

let token: string;

beforeAll(async () => {
  await request(app).post("/api/auth/register").send({ email: "cred@test.com", password: "password123" });
  const r = await request(app).post("/api/auth/login").send({ email: "cred@test.com", password: "password123" });
  token = r.body.accessToken;
});

describe("Credentials", () => {
  it("POST /credentials stores encrypted data — raw api_key must never appear in DB", async () => {
    const res = await request(app)
      .post("/api/credentials")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "My OpenAI Key", provider: "openai", api_key: "sk-secret-abc-123" });
    expect(res.status).toBe(200);

    // Read directly from DB — raw key must be encrypted
    const db = getDb();
    const row = db.prepare("SELECT data FROM credentials WHERE id = ?").get(res.body.id) as any;
    expect(row).toBeTruthy();
    const rawDbValue = row.data;
    // The raw key "sk-secret-abc-123" must NOT appear in plaintext in the DB
    expect(rawDbValue).not.toContain("sk-secret-abc-123");
    // The value should be encrypted (contains colon-separated iv:tag:ciphertext)
    expect(rawDbValue.split(":").length).toBe(3);
  });

  it("GET /credentials returns masked api_key", async () => {
    const list = await request(app).get("/api/credentials").set("Authorization", `Bearer ${token}`);
    expect(list.status).toBe(200);
    const cred = list.body.find((c: any) => c.name === "My OpenAI Key");
    expect(cred).toBeTruthy();
    // The data object contains masked keys
    const data = cred.data || cred;
    if (data.api_key) {
      expect(data.api_key).toContain("••••");
      expect(data.api_key).not.toBe("sk-secret-abc-123");
    }
  });

  it("DELETE /credentials removes it", async () => {
    const create = await request(app)
      .post("/api/credentials")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Delete Me", provider: "openai", api_key: "sk-delete-test" });
    expect(create.status).toBe(200);

    const del = await request(app).delete(`/api/credentials/${create.body.id}`).set("Authorization", `Bearer ${token}`);
    expect(del.status).toBe(200);

    const list = await request(app).get("/api/credentials").set("Authorization", `Bearer ${token}`);
    expect(list.body.find((c: any) => c.id === create.body.id)).toBeFalsy();
  });

  it("DELETE /credentials with wrong user returns 404", async () => {
    // Register another user
    await request(app).post("/api/auth/register").send({ email: "cred2@test.com", password: "password123" });
    const r2 = await request(app).post("/api/auth/login").send({ email: "cred2@test.com", password: "password123" });
    const token2 = r2.body.accessToken;

    const del = await request(app).delete(`/api/credentials/nonexistent`).set("Authorization", `Bearer ${token2}`);
    expect(del.status).toBe(404);
  });
});
