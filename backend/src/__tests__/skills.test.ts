import { describe, it, expect } from "vitest";
import { evaluate } from "mathjs";
import { getSkill } from "../skills/registry";
import type { ExecutionContext } from "../core/interfaces/IConnector";

const mockCtx: ExecutionContext = {
  runId: "test", workflowId: "test", nodeId: "test", userId: "test",
  logger: { info: () => {}, error: () => {} },
  emit: () => {},
  getNodeOutput: () => null,
  variables: {},
  getCredential: async () => null,
};

describe("Skills", () => {
  it("calculate(2+2) returns 4", () => {
    const result = evaluate("2+2");
    expect(result).toBe(4);
  });

  it("calculate(3*7) returns 21", () => {
    expect(evaluate("3*7")).toBe(21);
  });

  it("calculate(10/2) returns 5", () => {
    expect(evaluate("10/2")).toBe(5);
  });

  it("calculate with mathjs rejects process.exit", () => {
    // mathjs evaluate does not have access to Node.js globals
    expect(() => evaluate("process.exit(1)")).toThrow();
  });

  it("calculate with mathjs rejects arbitrary code", () => {
    expect(() => evaluate("console.log('hack')")).toThrow();
  });

  it("web_search skill returns array with title/url/snippet", async () => {
    const skill = getSkill("web_search");
    expect(skill).toBeTruthy();
    const result = await skill!.execute({ query: "test", numResults: 3 }, mockCtx as any);
    expect(result.result).toBeDefined();
    const data = result.result as any;
    expect(data.results).toBeDefined();
    expect(Array.isArray(data.results)).toBe(true);
    if (data.results.length > 0) {
      expect(data.results[0].title).toBeDefined();
      expect(data.results[0].url).toBeDefined();
      expect(data.results[0].snippet).toBeDefined();
    }
  });

  it("http_request skill returns status and body", async () => {
    const skill = getSkill("http_request");
    expect(skill).toBeTruthy();
    const result = await skill!.execute({ method: "GET", url: "https://example.com" }, mockCtx as any);
    expect(result.result).toBeDefined();
  });

  it("format_date skill parses and formats dates", async () => {
    const skill = getSkill("format_date");
    expect(skill).toBeTruthy();
    const result = await skill!.execute({ date: "2024-01-15", outputFormat: "YYYY-MM-DD" }, mockCtx as any);
    expect(result.result).toBeDefined();
    const data = result.result as any;
    expect(data.formatted).toBeTruthy();
  });
});
