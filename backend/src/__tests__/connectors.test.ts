import { describe, it, expect, beforeAll } from "vitest";
import express from "express";
import request from "supertest";
import { authRouter } from "../auth";
import { extensionsRouter } from "../api/extensions";

const app = express();
app.use(express.json());
app.use("/api/auth", authRouter());
app.use("/api", extensionsRouter("/tmp"));

let token: string;

beforeAll(async () => {
  await request(app).post("/api/auth/register").send({ email: "conn@test.com", password: "password123" });
  const r = await request(app).post("/api/auth/login").send({ email: "conn@test.com", password: "password123" });
  token = r.body.accessToken;
});

describe("Connectors", () => {
  it("/connectors/marketplace returns 27 items with required fields", async () => {
    const res = await request(app).get("/api/connectors/marketplace").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(27);
    for (const c of res.body) {
      expect(c.id).toBeTruthy();
      expect(c.name).toBeTruthy();
      expect(c.category).toBeTruthy();
      expect(c.authType).toBeTruthy();
    }
  });

  it("/connectors/:id returns operations with fields", async () => {
    const res = await request(app).get("/api/connectors/http").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.operations.length).toBeGreaterThanOrEqual(1);
    for (const op of res.body.operations) {
      expect(op.id).toBeTruthy();
      expect(op.name).toBeTruthy();
      expect(op.fields).toBeDefined();
      expect(Array.isArray(op.fields)).toBe(true);
    }
  });

  it("/connectors/:id returns 404 for unknown connector", async () => {
    const res = await request(app).get("/api/connectors/nonexistent").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});
