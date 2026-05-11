# Torque — Complete Audit Report

> Generated: May 11, 2026 | 42 backend files, 45 frontend files, 42 tests

---

## Project Health

| Metric | Value |
|--------|-------|
| Backend files | 42 TypeScript (3,600+ LOC) |
| Frontend files | 45 TSX/TS (3,800+ LOC) |
| API endpoints | 45+ (auth, workflows, connectors, MCP, webhooks, skills) |
| Node types | 39 canvas-rendered |
| Connectors | 27 registered (3 real, 24 mock) |
| Agent skills | 6 (2 real HTTP/mathjs, 4 mock) |
| Tests | 42 passing across 7 test files |
| shadcn components | 22 installed |
| Database tables | 11 (SQLite) |

---

## 🔴 Critical Issues (fix immediately)

| # | Issue | File | Impact |
|---|-------|------|--------|
| 1 | **Hardcoded dev credentials in API client** | `frontend/src/api/client.ts:30-40` | Ships `email: "dev@torque.local"` / `password: "devpassword123"` to every user. Anyone can auth. |
| 2 | **3 modals use raw `fetch()` without JWT** | `ProviderModal.tsx`, `ConnectorModal.tsx`, `MCPModal.tsx` | These call `/api/...` directly without auth headers. Works in dev (Vite proxy) but fails in production. |
| 3 | **OAuth callback has no auth + no CSRF** | `extensions.ts:110-129` | Callback accepts any `code` without auth or state verification. Token theft possible. |
| 4 | **Webhook endpoint: no auth, no rate limit** | `triggers.ts:22`, `index.ts:68` | Public POST endpoint with no auth, no rate limiting. Can be abused for DDoS. |
| 5 | **VM sandbox is escapable** | `CodeConnector.ts:33-46` | `vm.createContext` is NOT a security boundary. Prototype pollution can escape. |
| 6 | **DAG executor: failed nodes marked completed** | `workflow-engine.ts:150` | Failed nodes added to `completed` set — downstream nodes run despite upstream failures. |
| 7 | **`listRuns()` without userId returns ALL data** | `workflow-service.ts:51` | No user isolation when `userId` is empty. All users' runs leaked. |
| 8 | **Dynamic `require()` in ESM modules** | `workflow-engine.ts:252`, `credential-service.ts:103` | Will fail at runtime in strict ESM environments. |

---

## 🟠 High Priority

| # | Issue | File |
|---|-------|------|
| 9 | `(req as any).user.id` used 20+ times across codebase | `workflows.ts`, `extensions.ts` |
| 10 | Engine `onError=continue` test passes but logic is unproven | `engine.test.ts` |
| 11 | All LLM/DB/file/translate/summarize nodes return mock data | `workflow-engine.ts` executor |
| 12 | Agent loop has no `maxIterations` enforcement (relies on LLM) | `agent/harness.ts` |
| 13 | `setInterval` for MCP reconnect never cleaned up | `extensions.ts:230` |
| 14 | No frontend tests exist | — |
| 15 | 3 `console.error` calls in production frontend code | `useMCP.ts`, `useOnboardingTour.ts`, `ErrorBoundary.tsx` |

---

## 🟡 Medium Priority

| # | Issue | File |
|---|-------|------|
| 16 | Rate limiter for runs applied at wrong middleware level | `index.ts:65` |
| 17 | Credentials encrypted at rest but no key rotation | `credential-service.ts` |
| 18 | No pagination on workflow/list API endpoints | `workflow-service.ts` |
| 19 | Coverage thresholds low (lines 40%, branches 15%) | `vitest.config.ts` |
| 20 | OAuth `state` generated but never verified | `extensions.ts:100-108` |
| 21 | Webhook HMAC verification is optional (missing header = no check) | `triggers.ts:37-51` |

---

## 🔵 Low Priority / Nice to Have

| # | Issue |
|---|-------|
| 22 | 22 shadcn components installed but only `Button` and `Sonner` are used |
| 23 | No input length limits on any text fields |
| 24 | `stores.ts` has 437 lines of hardcoded provider/connector data |
| 25 | No proper logout in frontend (token stored in localStorage permanently) |

---

## Key Metrics

| Backend | Count |
|---------|-------|
| Auth routes | 5 |
| Workflow routes | 13 |
| Extension/connector routes | 27 |
| Public routes | 2 (health, webhooks) |
| Node types (engine) | 39 |
| Connector operations | ~60 (across 27 connectors) |
| Agent skills | 6 |
| Database tables | 11 |
| Tests passing | 42/42 |

| Frontend | Count |
|----------|-------|
| Node components | 37 |
| shadcn components | 22 |
| Modal components | 4 |
| Page components | 2 (Dashboard, Credentials) |
| Hooks | 4 |
| API calls (direct) | 32 |
| Unique API endpoints consumed | 23 |
