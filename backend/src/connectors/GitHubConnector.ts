import { z } from "zod";
import { BaseConnector } from "./BaseConnector";
import { ConnectorError } from "../core/ConnectorError";
import type { IOperation, OperationOutput, ExecutionContext, ConnectionTestResult, AuthConfig } from "../core/interfaces/IConnector";

async function ghFetch(token: string, method: string, path: string, body?: unknown): Promise<any> {
  const res = await fetch(`https://api.github.com${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "User-Agent": "torque-automation/1.0", Accept: "application/vnd.github.v3+json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new ConnectorError({ connectorId: "github", operationId: path, message: `GitHub API error ${res.status}: ${text.slice(0, 200)}`, statusCode: res.status, retryable: res.status >= 500 });
  }
  if (res.status === 204) return {};
  return res.json();
}

const createIssueOp: IOperation = {
  id: "create_issue",
  name: "Create Issue",
  description: "Create a GitHub issue in a repository",
  type: "action",
  inputSchema: z.object({ owner: z.string().min(1), repo: z.string().min(1), title: z.string().min(1), body: z.string().optional().default(""), labels: z.array(z.string()).optional().default([]), assignees: z.array(z.string()).optional().default([]) }),
  outputSchema: z.object({ id: z.number(), number: z.number(), html_url: z.string(), state: z.string() }),
  fields: [
    { id: "owner", label: "Owner", type: "text", required: true, placeholder: "octocat" },
    { id: "repo", label: "Repository", type: "text", required: true, placeholder: "hello-world" },
    { id: "title", label: "Title", type: "text", required: true },
    { id: "body", label: "Body", type: "textarea", placeholder: "Issue description" },
    { id: "labels", label: "Labels", type: "tags", placeholder: "bug,enhancement" },
  ],
  async execute(input, credential, _context): Promise<OperationOutput> {
    const parsed = createIssueOp.inputSchema.parse(input) as { owner: string; repo: string; title: string; body: string; labels: string[]; assignees: string[] };
    const token = (credential.access_token || credential.accessToken || credential.api_key || "") as string;
    if (!token) throw new ConnectorError({ connectorId: "github", operationId: "create_issue", message: "Missing token", statusCode: 401 });

    const body: Record<string, unknown> = { title: parsed.title };
    if (parsed.body) body.body = parsed.body;
    if (parsed.labels.length > 0) body.labels = parsed.labels;
    if (parsed.assignees.length > 0) body.assignees = parsed.assignees;

    const data = await ghFetch(token, "POST", `/repos/${parsed.owner}/${parsed.repo}/issues`, body);
    return { data: { id: data.id as number, number: data.number as number, html_url: data.html_url as string, state: data.state as string } };
  },
};

const listIssuesOp: IOperation = {
  id: "list_issues",
  name: "List Issues",
  description: "List issues in a repository",
  type: "action",
  inputSchema: z.object({ owner: z.string().min(1), repo: z.string().min(1), state: z.enum(["open", "closed", "all"]).default("open"), limit: z.number().min(1).max(100).default(30) }),
  outputSchema: z.object({ issues: z.array(z.object({ id: z.number(), number: z.number(), title: z.string(), state: z.string(), html_url: z.string() })) }),
  fields: [
    { id: "owner", label: "Owner", type: "text", required: true },
    { id: "repo", label: "Repository", type: "text", required: true },
    { id: "state", label: "State", type: "select", default: "open", options: [{ label: "Open", value: "open" }, { label: "Closed", value: "closed" }, { label: "All", value: "all" }] },
  ],
  async execute(input, credential, _context): Promise<OperationOutput> {
    const parsed = listIssuesOp.inputSchema.parse(input) as { owner: string; repo: string; state: string; limit: number };
    const token = (credential.access_token || credential.accessToken || credential.api_key || "") as string;
    if (!token) throw new ConnectorError({ connectorId: "github", operationId: "list_issues", message: "Missing token", statusCode: 401 });

    const params = new URLSearchParams({ state: parsed.state, per_page: String(parsed.limit), sort: "updated", direction: "desc" });
    const data = await ghFetch(token, "GET", `/repos/${parsed.owner}/${parsed.repo}/issues?${params}`);
    const issues = (data as any[]).filter((i: any) => !i.pull_request).map((i: any) => ({ id: i.id as number, number: i.number as number, title: i.title as string, state: i.state as string, html_url: i.html_url as string }));
    return { data: { issues } };
  },
};

export class GitHubConnector extends BaseConnector {
  id = "github";
  name = "GitHub";
  description = "Create and manage issues, PRs via GitHub REST API";
  icon = "https://cdn.simpleicons.org/github";
  category = "developer" as const;
  authType = "oauth2" as const;
  authConfig: AuthConfig = {
    oauth2: { authUrl: "https://github.com/login/oauth/authorize", tokenUrl: "https://github.com/login/oauth/access_token", scopes: ["repo", "issues:write"] },
  };
  operations = [createIssueOp, listIssuesOp];

  async testConnection(credential: Record<string, unknown>): Promise<ConnectionTestResult> {
    try {
      const token = (credential.access_token || credential.accessToken || credential.api_key || "") as string;
      if (!token) return { ok: false, message: "No token provided" };
      const data = await ghFetch(token, "GET", "/user");
      return { ok: true, message: `Authenticated as @${(data as any).login || "unknown"}` };
    } catch (err) {
      return { ok: false, message: err instanceof Error ? err.message : "Connection failed" };
    }
  }
}
