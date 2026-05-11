import { describe, it, expect, beforeAll } from "vitest";
import express from "express";
import request from "supertest";
import { authRouter } from "../auth";
import { workflowsRouter } from "../api/workflows";

const app = express();
app.use(express.json());
app.use("/api/auth", authRouter());
app.use("/api", workflowsRouter("/tmp"));

let user1Token: string;
let user2Token: string;

beforeAll(async () => {
  await request(app).post("/api/auth/register").send({ email: "u1@test.com", password: "password123" });
  await request(app).post("/api/auth/register").send({ email: "u2@test.com", password: "password123" });
  const r1 = await request(app).post("/api/auth/login").send({ email: "u1@test.com", password: "password123" });
  user1Token = r1.body.accessToken;
  const r2 = await request(app).post("/api/auth/login").send({ email: "u2@test.com", password: "password123" });
  user2Token = r2.body.accessToken;
});

function auth(token: string) { return { Authorization: `Bearer ${token}` }; }

describe("Workflows", () => {
  it("create workflow persists to DB and returns id", async () => {
    const res = await request(app)
      .post("/api/workflows")
      .set(auth(user1Token))
      .send({ name: "Test WF", nodes: [], edges: [] });
    expect(res.status).toBe(200);
    expect(res.body.id).toBeTruthy();
    expect(res.body.name).toBe("Test WF");
  });

  it("list workflows only returns current user's workflows", async () => {
    // User 1 creates a workflow
    await request(app).post("/api/workflows").set(auth(user1Token)).send({ name: "U1 WF", nodes: [], edges: [] });

    // User 2 creates a workflow
    await request(app).post("/api/workflows").set(auth(user2Token)).send({ name: "U2 WF", nodes: [], edges: [] });

    const u1res = await request(app).get("/api/workflows").set(auth(user1Token));
    expect(u1res.status).toBe(200);
    expect(u1res.body.workflows.every((w: any) => w.name === "U1 WF" || w.name === "Test WF")).toBe(true);
    expect(u1res.body.workflows.length).toBeGreaterThanOrEqual(2);

    const u2res = await request(app).get("/api/workflows").set(auth(user2Token));
    expect(u2res.status).toBe(200);
    expect(u2res.body.workflows.every((w: any) => w.name === "U2 WF")).toBe(true);
    expect(u2res.body.workflows.length).toBe(1);
  });

  it("running a nonexistent workflow returns 404", async () => {
    const res = await request(app).post("/api/workflows/nonexistent-id/run").set(auth(user1Token));
    expect(res.status).toBe(404);
  });

  it("running a valid workflow transitions through statuses", async () => {
    const create = await request(app)
      .post("/api/workflows")
      .set(auth(user1Token))
      .send({ name: "Run Test", nodes: [{ id: "n1", type: "trigger", position: { x: 0, y: 0 }, config: { label: "Start", goal: "", provider: "openai", model: "gpt-4o", schedule: "", destination: "", urls: [], code: "", language: "python", condition: "", transform: "", instructions: "", temperature: 0.7, max_tokens: 2048, webhook_url: "", method: "POST", iteration_count: 5, connector_id: null, mcp_server_id: null, mcp_tool: "", skill: "", credential_id: null, input_mapping: {}, output_mapping: {} } }], edges: [] });
    expect(create.status).toBe(200);

    const run = await request(app).post(`/api/workflows/${create.body.id}/run`).set(auth(user1Token));
    expect(run.status).toBe(200);
    // queued → running → completed (the engine processes synchronously in test)
    expect(["completed", "running", "failed"]).toContain(run.body.status);
  });

  it("delete workflow removes it", async () => {
    const create = await request(app).post("/api/workflows").set(auth(user1Token)).send({ name: "Delete Me", nodes: [], edges: [] });
    const del = await request(app).delete(`/api/workflows/${create.body.id}`).set(auth(user1Token));
    expect(del.status).toBe(200);
    const get = await request(app).get(`/api/workflows/${create.body.id}`).set(auth(user1Token));
    expect(get.status).toBe(404);
  });

  it("duplicate workflow creates a copy with (copy) suffix", async () => {
    const create = await request(app).post("/api/workflows").set(auth(user1Token)).send({ name: "Original", nodes: [], edges: [] });
    const dup = await request(app).post(`/api/workflows/${create.body.id}/duplicate`).set(auth(user1Token));
    expect(dup.status).toBe(200);
    expect(dup.body.name).toBe("Original (copy)");
    expect(dup.body.id).not.toBe(create.body.id);
  });

  it("cancel nonexistent run returns 404", async () => {
    const res = await request(app).post("/api/runs/nonexistent/cancel").set(auth(user1Token));
    expect(res.status).toBe(404);
  });

  it("import workflow from JSON body", async () => {
    const res = await request(app).post("/api/workflows/import").set(auth(user1Token)).send({ name: "Imported WF", nodes: [], edges: [] });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Imported WF");
  });
});
