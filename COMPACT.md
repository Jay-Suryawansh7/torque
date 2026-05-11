# Torque — Compact Handoff

**Platform**: Visual workflow automation (n8n-like, self-hosted). DAG canvas, 39 node types, 27 connectors, AI agent execution, Socket.IO streaming.

---

## Stack

| Layer | Tech |
|-------|------|
| Backend | Express 4 + TypeScript + SQLite (better-sqlite3, WAL mode) |
| Frontend | React 19 + React Flow 12 + Tailwind + shadcn/ui + motion/react |
| Auth | JWT (jose) + argon2, access 15m / refresh 7d rotation |
| Real-time | Socket.IO (log streaming per run) |
| Validation | Zod 4 |
| Logging | Pino |
| Queue | better-queue (concurrency 5) |
| Infra | Docker Compose, multi-stage build, Nginx with security headers |

---

## Backend: 42 files, ~3,600 LOC

| Dir | Key Files | Purpose |
|-----|-----------|---------|
| `src/index.ts` | 93 lines | Express setup: helmet, cors, rate-limit (200/15min global, 5/min auth, 20/min runs), pino-http, socket.io, routes mounted at `/api/v1` + `/api`, webhook router, health check, SIGTERM handler |
| `src/auth/` | `index.ts` 151 lines | register/login/refresh/logout/me. JWT sync middleware (`.then/.catch` — Express doesn't await async middleware). Refresh token rotation (old revoked on use) |
| `src/database/` | `index.ts` + `schema.ts` | SQLite singleton. 11 tables: users, workflows, workflow_runs, node_executions, run_logs, credentials, mcp_servers, refresh_tokens, webhook_events, workflow_variables, agent_memory |
| `src/api/` | `workflows.ts`, `extensions.ts`, `wrap.ts` | 45+ endpoints. Shared `wrap()` with `responded` flag prevents double-response. AuthMiddleware on all except `/health` and `/webhooks/:id/:secret` |
| `src/engine/` | `workflow-engine.ts` (342L), `workflow-service.ts`, `triggers.ts`, `credential-service.ts`, `agent-runner.ts`, `codegen.ts`, `mcp-registry.ts` | DAG executor (Kahn's algorithm, parallel branches via Promise.all, per-node onError: stop/continue/retry 3x with backoff). Queue. Webhooks with HMAC-SHA256 timingSafeEqual, cron scheduler, polling. AES-256-GCM encryption for credentials |
| `src/connectors/` | `registry.ts`, `BaseConnector.ts`, `HttpConnector.ts` (REAL HTTP), `CodeConnector.ts` (vm.Script sandbox), `GmailConnector.ts`, `SlackConnector.ts`, `batch-connectors.ts` (22 mock), `TransformConnector.ts` | All implement IConnector. HttpConnector is only real one. All 27 registered |
| `src/agent/` | `harness.ts` | LLM tool-calling loop. Sends messages+tools to OpenAI-compatible API, executes skill calls, feeds results back, repeats until done. Max iterations configurable |
| `src/skills/` | `registry.ts` | 6 skills: web_search (mock), http_request (real fetch), calculate (mathjs — safe), extract_structured_data (mock), summarize (mock), format_date |
| `src/mcp/` | `MCPRegistry.ts` | MCP server CRUD, connect (SSE + tools/list), callTool, reconnectLoop 30s. SSRF protection via validateUrl() blocking private IPs |
| `src/core/` | `ConnectorError.ts`, `interfaces/*.ts` | IConnector, IOperation, IAgentSkill, ExecutionContext, ConnectorError with connectorId/operationId/statusCode/retryable |

---

## Frontend: 45 files, ~3,800 LOC

| Dir | Key Files | Purpose |
|-----|-----------|---------|
| `src/App.tsx` | 389 lines | Shell: header with page nav (Dashboard/Workflows/Credentials), canvas with 39 node types, log panel (socket.io streaming), modals, Sonner toasts. Page state in useState |
| `src/api/` | `client.ts`, `workflows.ts` | Centralized fetch with auto-auth (env VITE_DEV_EMAIL/PASSWORD), Bearer token from localStorage, 401 returns empty, 429 toast, 500 toast |
| `src/hooks/` | `useWorkflow.ts`, `useRunStream.ts`, `useMCP.ts`, `useOnboardingTour.ts` | Canvas state, Socket.IO streaming (subscribes "log"/"node:completed"/"node:failed"/"run:completed"), MCP discovery, driver.js tour |
| `src/components/` | `Canvas.tsx` (ReactFlow + 39 node types + MiniMap), `NodeCreator.tsx` (searchable Cmd+K), `NodePalette.tsx`, `AnimatedEmptyState.tsx`, `ErrorBoundary.tsx` | |
| `src/components/nodes/` | 37 node TSX files | All 240px wide, truncated labels, consistent color/icon/border pattern |
| `src/components/panels/` | `AgentConfigPanel.tsx` (3 tabs: Parameters/Settings/Output), `ProviderModal.tsx`, `ConnectorModal.tsx`, `MCPModal.tsx`, `ResourceBrowser.tsx` | All use apiRequest with JWT |
| `src/components/ui/` | 22 shadcn components | button, input, select, textarea, dialog, tabs, badge, sonner, etc. |
| `src/pages/` | `Dashboard.tsx` (animated counter cards + recent runs), `CredentialsPage.tsx` (list/add/test/delete) | |

---

## 42 Tests — All Passing

| File | Tests | What |
|------|-------|------|
| `auth.test.ts` | 8 | Register duplicate 409, wrong pass 401, protected route 401, JWT valid 200, refresh rotation revokes old, logout |
| `workflows.test.ts` | 8 | Create, list user isolation, nonexistent 404, run lifecycle, delete, duplicate, cancel 404, import |
| `connectors.test.ts` | 3 | Marketplace count 27, detail with operations, unknown 404 |
| `credentials.test.ts` | 4 | Encrypted storage (raw key never in DB), masked GET, delete, wrong user 404 |
| `engine.test.ts` | 3 | DAG parallel branches, onError=continue, simple trigger |
| `mcp.test.ts` | 8 | validateUrl blocks 12 private IP patterns, allows HTTPS, rejects non-http, rejects malformed |
| `skills.test.ts` | 8 | mathjs: 2+2=4, 3*7=21, 10/2=5; rejects process.exit, rejects console.log; web_search returns array; http_request; format_date |

---

## Security Fixes Applied (16 items)

| Fix | What Changed |
|-----|-------------|
| JWT fallback removed | Server crashes if JWT_SECRET missing (auth/index.ts + index.ts check) |
| RCE Code connector | `new Function()` → `vm.Script` + `vm.createContext` (require/process/globalThis/setTimeout/setInterval/fetch/__proto__ = undefined) |
| RCE calculate skill | `new Function()` → `mathjs.evaluate()` |
| SSRF MCP | `validateUrl()` blocks 10.x, 172.16-31.x, 192.168.x, 127.x, localhost, ::1, 0.0.0.0, non-http |
| Auth header leak | `sanitizeHeaders()` strips authorization/cookie/x-api-key before webhook event storage |
| Async authMiddleware | `async` → sync with `.then/.catch`. Express now stops chain on 401 instead of proceeding to handler |
| DAG silent catch | All 4 `catch {}` → `logger.error({err})` |
| DAG failed node bug | Failed nodes NOT added to `completed` set — blocks downstream |
| OAuth CSRF | `state` stored in Map (10min TTL), verified on callback, 403 if missing |
| Webhook rate limit | 30 req/min added to public endpoint |
| Dynamic require() in ESM | `require("uuid")` and `require("../mcp/...")` → proper imports |
| Hardcoded dev creds | Moved to VITE_DEV_EMAIL/PASSWORD env vars |
| Modals raw fetch | ProviderModal/ConnectorModal/MCPModal → `apiRequest` with JWT |
| listRuns() isolation | Empty userId → `[]`. All queries scoped to `WHERE user_id = ?` |
| wrap() double-response | `responded` flag prevents `next(err)` after headers sent |
| Protection headers | helmet() middleware on all responses |

---

## Critical Incomplete Items

| Item | Why It Matters | Location |
|------|---------------|----------|
| **Real connectors** | Only HTTP connector is real. Gmail, Slack, GitHub etc return `{mock: true}` | `connectors/batch-connectors.ts` |
| **Login UI** | No login page — auto-auths with hardcoded dev credentials | Needs new component + auth flow |
| **Agent real LLM testing** | Agent loop makes real API calls but untested against actual OpenAI/Anthropic | `agent/harness.ts` |
| **Postgres migration** | SQLite hits limits with concurrent writes | Replace `database/index.ts` with abstracted layer |
| **Frontend execution mode** | Canvas is always "edit" — no way to view past execution data on nodes | `App.tsx` mode toggle |
| **Expression editor** | No `{{ $node.X.output.field }}` syntax for dynamic values | Config panel field type |
| **Pagination** | List endpoints return all records | `workflow-service.ts` |
| **Connector docs** | No README per connector for required scopes/fields | `docs/connectors/` |

---

## How to Run

```bash
# Backend
cd torque/backend
JWT_SECRET="32-char-min-secret!!" ENCRYPTION_KEY="$(node -e "console.log(Buffer.alloc(32,'a').toString('base64'))")" npx tsx src/index.ts

# Frontend (separate terminal)
cd torque/frontend && npm run dev

# Tests
cd torque/backend && npm test
```
