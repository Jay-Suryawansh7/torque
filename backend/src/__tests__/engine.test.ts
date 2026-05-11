import { describe, it, expect, beforeAll } from "vitest";
import { WorkflowEngine } from "../engine/workflow-engine";
import { getDb } from "../database";

function makeUser(id: string, email: string) {
  const db = getDb();
  db.prepare("INSERT INTO users (id, email, password_hash) VALUES (?,?,?)").run(id, email, "hash");
}

function makeFullConfig(overrides: Record<string, unknown> = {}) {
  return {
    label: "", goal: "", provider: "openai", model: "gpt-4o",
    schedule: "", destination: "", urls: [], code: "", language: "python",
    condition: "", transform: "", instructions: "", temperature: 0.7,
    max_tokens: 2048, webhook_url: "", method: "POST", iteration_count: 5,
    connector_id: null, mcp_server_id: null, mcp_tool: "", skill: "",
    credential_id: null, input_mapping: {}, output_mapping: {},
    browser_url: "", browser_action: "", screenshot_quality: 0.8,
    confirm_destructive: true, readonly: false,
    switch_cases: ["case_1"], switch_value: "",
    headers: "", body: "", query_params: "",
    wait_time: 1, wait_unit: "seconds", merge_mode: "combine",
    split_by: "size", split_size: 10, file_path: "", file_content: "",
    file_format: "json", database_type: "postgres", connection_string: "",
    query: "", source_format: "json", target_language: "spanish",
    ...overrides,
  };
}

describe("WorkflowEngine", () => {
  beforeAll(() => {
    makeUser("test-user", "engine-test@test.com");
  });

  it("DAG parser correctly identifies parallel branches — both complete", async () => {
    const db = getDb();
    const wfId = "test-parallel-" + Date.now();
    const userId = "test-user";

    // Use simple nodes (trigger + output) to avoid API key requirements
    db.prepare("INSERT INTO workflows (id, user_id, name, definition) VALUES (?,?,?,?)").run(wfId, userId, "Parallel", JSON.stringify({
      nodes: [
        { id: "t1", type: "trigger", position: { x: 0, y: 0 }, config: makeFullConfig({ schedule: "" }) },
        { id: "c1", type: "condition", position: { x: -200, y: 100 }, config: makeFullConfig({ condition: "true" }) },
        { id: "c2", type: "condition", position: { x: 200, y: 100 }, config: makeFullConfig({ condition: "true" }) },
        { id: "o1", type: "output", position: { x: -200, y: 200 }, config: makeFullConfig({ destination: "file" }) },
        { id: "o2", type: "output", position: { x: 200, y: 200 }, config: makeFullConfig({ destination: "file" }) },
      ],
      edges: [
        { id: "e1", source: "t1", target: "c1" }, { id: "e2", source: "t1", target: "c2" },
        { id: "e3", source: "c1", target: "o1" }, { id: "e4", source: "c2", target: "o2" },
      ],
    }));

    const engine = new WorkflowEngine();
    const run = await engine.runWorkflow(wfId, userId);
    expect(run.status).toBe("completed");

    // Both condition nodes should have run in parallel and completed
    const executions = db.prepare("SELECT * FROM node_executions WHERE run_id = ?").all(run.id) as any[];
    const condNodes = executions.filter((e: any) => e.node_id === "c1" || e.node_id === "c2");
    expect(condNodes.length).toBe(2);
    expect(condNodes.every((e: any) => e.status === "completed")).toBe(true);

    // Outputs should also have run
    const outputs = executions.filter((e: any) => e.node_id === "o1" || e.node_id === "o2");
    expect(outputs.length).toBe(2);
  });

  it("node with onError=continue allows workflow to complete despite failure", async () => {
    const db = getDb();
    const wfId = "test-continue-" + Date.now();
    const userId = "test-user";

    db.prepare("INSERT INTO workflows (id, user_id, name, definition) VALUES (?,?,?,?)").run(wfId, userId, "Continue", JSON.stringify({
      nodes: [
        { id: "t1", type: "trigger", position: { x: 0, y: 0 }, config: makeFullConfig() },
        { id: "c1", type: "condition", position: { x: 0, y: 100 }, config: makeFullConfig({ onError: "continue" }) },
        { id: "o1", type: "output", position: { x: 0, y: 200 }, config: makeFullConfig({ destination: "file" }) },
      ],
      edges: [
        { id: "e1", source: "t1", target: "c1" },
        { id: "e2", source: "c1", target: "o1" },
      ],
    }));

    const engine = new WorkflowEngine();
    const run = await engine.runWorkflow(wfId, userId);
    expect(run.status).toBe("completed");
  });

  it("simple workflow with just trigger completes", async () => {
    const db = getDb();
    const wfId = "test-simple-" + Date.now();
    const userId = "test-user";

    db.prepare("INSERT INTO workflows (id, user_id, name, definition) VALUES (?,?,?,?)").run(wfId, userId, "Simple", JSON.stringify({
      nodes: [{ id: "t1", type: "trigger", position: { x: 0, y: 0 }, config: makeFullConfig() }],
      edges: [],
    }));

    const engine = new WorkflowEngine();
    const run = await engine.runWorkflow(wfId, userId);
    expect(run.status).toBe("completed");
  });
});
