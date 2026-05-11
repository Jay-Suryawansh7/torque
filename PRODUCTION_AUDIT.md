# Backend Production Readiness Audit

> 35 files, 3,605 lines of TypeScript analyzed

---

## Overall Score: 5/10 — Pre-production. Usable for dev/demo, needs hardening for production.

---

## 🔴 CRITICAL (fix before any production deployment)

### 1. Hardcoded JWT Secret — `auth/index.ts:7`
```typescript
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "dev-secret...");
```
If `JWT_SECRET` env var is missing, falls back to a hardcoded string. Attacker can forge any JWT.
**Fix**: Remove fallback. Crash on startup with clear error if env var missing (already done in `index.ts:14-15` but the auth module has its own fallback).

### 2. Arbitrary Code Execution (RCE) — `connectors/CodeConnector.ts:32-34`
```typescript
const fn = new Function("$input", "$context", `"use strict";\n${parsed.code}`);
```
User-supplied code is compiled and executed via `new Function()`. No sandbox. Full server access.
**Fix**: Use `vm` module with `vm.Script` in a sandboxed context, or remove inline code execution.

### 3. Arbitrary Code Execution (RCE) — `skills/registry.ts:43`
```typescript
const fn = new Function("return (" + input.expression + ")");
```
Same vulnerability in the `calculate` skill. User expression is evaluated as JS.
**Fix**: Use `mathjs` library (`npm install mathjs`) to evaluate expressions safely.

### 4. SSRF Vulnerability — `mcp/MCPRegistry.ts:51`
```typescript
const res = await fetch(server.url.replace(/\/+$/, "") + "/tools/list", ...);
```
User-provided MCP server URL is fetched directly. Can access internal services (localhost, AWS metadata, internal networks).
**Fix**: Block private IP ranges, restrict to HTTPS, validate URL format.

### 5. Auth Header Leak — `engine/triggers.ts:29`
```typescript
JSON.stringify(req.headers)  // stored in webhook_events table
```
Webhook request headers (including `Authorization`, `Cookie`) are persisted to the database.
**Fix**: Strip sensitive headers before storage.

### 6. Missing Auth — `engine/mcp-registry.ts:118,122`
```typescript
this.svc.list("")  // empty userId returns ALL workflows
```
`WorkflowService.list("")` called with empty string returns every workflow regardless of user.
**Fix**: Require valid userId, reject empty string.

### 7. DAG Race Condition — `engine/workflow-engine.ts:139-154`
`completed` and `remaining` Sets mutated inside `Promise.all` with no synchronization. Nodes can be executed multiple times or skipped.
**Fix**: Use async queue or serialize parallel branches with a lock.

---

## 🟠 HIGH (fix before scaling)

| # | File:Line | Issue |
|---|-----------|-------|
| 8 | `engine/workflow-engine.ts:150` | `catch {}` swallows DAG execution errors silently |
| 9 | `engine/triggers.ts:94` | `.catch(() => {})` in polling trigger — errors lost |
| 10 | `engine/workflow-engine.ts:17` | `emit()` has empty `catch {}` |
| 11 | `mcp/MCPRegistry.ts:97` | `catch {}` in reconnect loop — errors disappear |
| 12 | `auth/index.ts:130-136` | Logout iterates ALL unrevoked tokens — O(n) performance, potential timing attack |
| 13 | `engine/codegen.ts:153-166` | Multiple template interpolation points — if `escapeJS` fails, code injection |
| 14 | `engine/codegen.ts:255-260` | Switch cases and values interpolated into generated code |
| 15 | `engine/codegen.ts:276-278` | URL directly interpolated into generated JS |
| 16 | `engine/codegen.ts:301` | DB query string interpolated into generated code |
| 17 | `agent/harness.ts:96` | API key fallback — any provider without a specific key uses `OPENAI_API_KEY` |
| 18 | `api/extensions.ts:56-75` | `(req as any).user.id` — if auth middleware fails, TypeError crashes route |
| 19 | `api/workflows.ts` entire file | 8 instances of `(req as any).user.id` — fragile pattern |
| 20 | `auth/index.ts:7` | JWT secret has hardcoded fallback (duplicate of #1 in auth module) |

---

## 🟡 MEDIUM (fix for operational readiness)

| # | File:Line | Issue |
|---|-----------|-------|
| 21 | No request ID tracking — can't correlate logs to requests | All files |
| 22 | No database migration system — schema changes are manual | `database/schema.ts` |
| 23 | No pagination on workflow/run listing APIs | `workflow-service.ts:50` |
| 24 | `HttpConnector.ts:49` — Content-Type header override may surprise users | |
| 25 | `workflow-engine.ts:86-91` — retry delay hardcoded (1s, 2s, 4s) | |
| 26 | `skill/registry.ts:43` — heavy dependencies on server startup | |
| 27 | No API versioning strategy beyond `/api/v1/` prefix | |
| 28 | Webhook endpoint has no rate limiting | `index.ts:68` |
| 29 | `index.ts` hardcoded port/data-dir fallbacks | |

---

## 🔵 LOW (nice-to-have)

| # | File:Line | Issue |
|---|-----------|-------|
| 30 | `stores.ts` — 400+ lines of hardcoded connector/provider data | |
| 31 | `batch-connectors.ts` — all operations return mock data | |
| 32 | `SlackConnector.ts:22`, `GmailConnector.ts:27` — unsafe `as z.infer` casts | |
| 33 | No input length limits on any text fields | |
| 34 | `tests/workflows.test.ts` — 5 tests, 0 connector tests | |
| 35 | `mcp-registry.ts` — uses `WorkflowService` but not in constructor | |

---

## Summary by Severity

| Severity | Count | Action |
|----------|-------|--------|
| 🔴 Critical | 7 | Blocking — fix before production |
| 🟠 High | 13 | Required — fix before scaling |
| 🟡 Medium | 9 | Recommended — fix for ops readiness |
| 🔵 Low | 6 | Nice-to-have — next sprint |
