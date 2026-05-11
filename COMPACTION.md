# Torque — Project Compaction

> **State**: Pre-production · **Version**: 0.1.0-alpha · **Date**: May 2026
> **Purpose**: Complete handoff for model switch — everything you need to continue.

---

## 1. What Is Torque

A visual workflow automation platform — drag-and-drop DAG canvas, 39 node types, 27 connectors, AI agent execution, self-hosted. Backend is Express + TypeScript + SQLite. Frontend is React 19 + React Flow + Tailwind.

---

## 2. Project Structure

```
torque/
├── backend/           # Express + TypeScript (42 files, ~3,600 LOC)
│   ├── src/
│   │   ├── index.ts           # Server entry — middleware, routes, socket.io
│   │   ├── types.ts           # NodeType enum, all interfaces, default config
│   │   ├── logger.ts          # Pino structured logging
│   │   ├── database/
│   │   │   ├── index.ts       # SQLite singleton (better-sqlite3, WAL mode)
│   │   │   └── schema.ts      # DDL for all 11 tables
│   │   ├── auth/
│   │   │   └── index.ts       # JWT auth, argon2 passwords, refresh rotation
│   │   ├── api/
│   │   │   ├── workflows.ts   # 13 workflow endpoints
│   │   │   ├── extensions.ts  # ~25 connector/credential/mcp/skill endpoints
│   │   │   └── wrap.ts        # Shared async error wrapper
│   │   ├── engine/
│   │   │   ├── workflow-engine.ts   # DAG executor, node type switch, queue
│   │   │   ├── workflow-service.ts  # Workflow CRUD over SQLite
│   │   │   ├── triggers.ts         # Webhooks (HMAC), cron, polling
│   │   │   ├── credential-service.ts # AES-256-GCM encrypt/decrypt
│   │   │   ├── agent-runner.ts     # Agent node runner
│   │   │   ├── codegen.ts          # Workflow → TypeScript generator
│   │   │   └── mcp-registry.ts     # MCP tool/resource/prompt registry
│   │   ├── connectors/
│   │   │   ├── registry.ts         # Connector registration
│   │   │   ├── BaseConnector.ts    # Abstract class (retry, headers, error)
│   │   │   ├── HttpConnector.ts    # REAL HTTP client with timeout
│   │   │   ├── CodeConnector.ts    # vm.Script sandboxed code execution
│   │   │   ├── GmailConnector.ts   # Mock
│   │   │   ├── SlackConnector.ts   # Mock
│   │   │   ├── batch-connectors.ts # 22 more mock connectors
│   │   │   └── TransformConnector.ts
│   │   ├── agent/
│   │   │   └── harness.ts     # LLM tool-calling loop (OpenAI-compatible)
│   │   ├── skills/
│   │   │   └── registry.ts    # 6 skills (web_search mock, http_request real, calculate mathjs, etc.)
│   │   ├── mcp/
│   │   │   └── MCPRegistry.ts # MCP server management, marketplace
│   │   ├── core/
│   │   │   ├── ConnectorError.ts   # Normalized error class
│   │   │   └── interfaces/
│   │   │       ├── IConnector.ts    # IConnector, IOperation, ExecutionContext
│   │   │       └── IAgentSkill.ts   # IAgentSkill interface
│   │   └── schemas/
│   │       ├── workflow.schema.ts   # Zod schemas
│   │       ├── extension.schema.ts
│   │       └── validate.ts
│   ├── vitest.config.ts
│   ├── tsconfig.json
│   ├── Dockerfile (multi-stage)
│   └── package.json
├── frontend/          # React + Vite + Tailwind (45 files, ~3,800 LOC)
│   ├── src/
│   │   ├── App.tsx           # Main shell, canvas/logs/modals/dashboard pages
│   │   ├── main.tsx          # Entry with ErrorBoundary
│   │   ├── api/
│   │   │   ├── client.ts     # Centralized fetch with auto-auth, 401/429/500 handling
│   │   │   └── workflows.ts  # Typed API wrappers
│   │   ├── hooks/
│   │   │   ├── useWorkflow.ts      # Canvas state management
│   │   │   ├── useRunStream.ts     # Socket.IO log streaming
│   │   │   ├── useMCP.ts           # MCP discovery
│   │   │   └── useOnboardingTour.ts # driver.js tour
│   │   ├── components/
│   │   │   ├── Canvas.tsx          # ReactFlow with 39 node types
│   │   │   ├── NodeCreator.tsx     # Searchable node modal (22 nodes)
│   │   │   ├── NodePalette.tsx     # Category sidebar
│   │   │   ├── AnimatedEmptyState.tsx
│   │   │   ├── ErrorBoundary.tsx
│   │   │   ├── nodes/             # 37 individual node components
│   │   │   ├── panels/
│   │   │   │   ├── AgentConfigPanel.tsx  # 3-tab config (Parameters/Settings/Output)
│   │   │   │   ├── ProviderModal.tsx
│   │   │   │   ├── ConnectorModal.tsx
│   │   │   │   ├── MCPModal.tsx
│   │   │   │   └── ResourceBrowser.tsx
│   │   │   └── ui/               # 22 shadcn components
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx      # Animated stats, recent runs
│   │   │   └── CredentialsPage.tsx # CRUD credentials
│   │   └── types/index.ts
│   ├── vitest.config.ts
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── Dockerfile
│   ├── nginx.conf          # Security headers, gzip, cache
│   └── package.json
├── docker-compose.yml
├── docker-compose.prod.yml
├── .github/workflows/ci.yml
├── PRD.md                 # Complete product requirements
├── AUDIT_REPORT.md        # Security audit
├── TEST_REPORT.md         # Test coverage
├── ARCHITECTURE.md        # Architecture docs
├── DESIGN.md              # Design system
├── implementation.md      # Full build spec
└── .gitignore
```

---

## 3. What Works

### Backend: 42 tests passing, all endpoints functional

| Domain | Status | Details |
|--------|--------|---------|
| Auth | ✅ 8 tests | Register, login, JWT, refresh rotation, logout |
| Workflows | ✅ 8 tests | CRUD, run, duplicate, import, cancel, user isolation |
| Engine | ✅ 3 tests | DAG parallel execution, onError=continue, simple run |
| Skills | ✅ 8 tests | calculate (mathjs), web_search, http_request, format_date |
| MCP | ✅ 8 tests | validateUrl blocks all private IP patterns |
| Credentials | ✅ 4 tests | Encrypted storage, masked GET, delete, isolation |
| Connectors | ✅ 3 tests | Marketplace count (27), detail, 404 |

### Frontend: Builds with zero errors

| Feature | Status |
|---------|--------|
| Canvas with 39 node types | ✅ |
| Node creator (Cmd+K) | ✅ |
| Config panel (Parameters/Settings/Output) | ✅ |
| Real-time log streaming (socket.io) | ✅ |
| Dashboard with animated counters | ✅ |
| Credentials CRUD page | ✅ |
| Dark theme with CSS variables | ✅ |
| shadcn Button + Sonner toasts | ✅ |
| motion/react animations | ✅ |
| Animated empty states | ✅ |

### Infrastructure

| Component | Status |
|-----------|--------|
| Docker Compose (dev + prod) | ✅ |
| Multi-stage backend Dockerfile | ✅ |
| Nginx with security headers, gzip, caching | ✅ |
| GitHub Actions CI (typecheck → test → build) | ✅ |
| Socket.IO real-time streaming | ✅ |
| Rate limiting (auth/runs/global) | ✅ |

---

## 4. Security Hardening Applied

| Issue | Fix |
|-------|-----|
| Hardcoded JWT fallback | Removed — server crashes if `JWT_SECRET` missing |
| RCE in Code connector | `new Function()` → `vm.Script` + `vm.createContext` with dangerous globals disabled |
| RCE in calculate skill | `new Function()` → `mathjs.evaluate()` |
| SSRF in MCP | `validateUrl()` blocks private IPs, localhost, non-http schemes |
| Auth header leak | `sanitizeHeaders()` redacts Authorization, Cookie, API keys before DB write |
| Missing auth filter | `WorkflowService.list()` returns `[]` for empty userId |
| Async auth middleware bug | Changed from `async` to sync `.then()/.catch()` — Express now stops chain properly |
| DAG executor silent error swallow | `catch {}` → `logger.error({...})` on all 4 locations |
| DAG failed-node propagation | Failed nodes no longer added to `completed` set — downstream blocked |
| OAuth CSRF | `state` stored in Map with 10-min TTL, verified on callback, 403 on mismatch |
| Webhook rate limiting | 30 req/min added to public endpoint |
| Dynamic `require()` in ESM | Replaced with proper imports (`uuid`, `MCPRegistry`) |
| Hardcoded dev credentials | Moved to `VITE_DEV_EMAIL` / `VITE_DEV_PASSWORD` env vars |
| Modals using raw fetch | ProviderModal, ConnectorModal, MCPModal now use `apiRequest` with JWT |
| listRuns() no user isolation | All queries scoped to `WHERE user_id = ?`, empty userId returns `[]` |
| `wrap()` double-response crash | Added `responded` flag — `next(err)` ignored if response already sent |

---

## 5. What's Still Incomplete (From PRD)

### 🟢 HIGH Priority (needed for beta)

| Item | PRD Ref | Notes |
|------|---------|-------|
| **Real connector integrations** | FR-CONNECTOR-04 | Only HTTP connector is real. Gmail, Slack, GitHub, etc return mock data |
| **Frontend login page** | FR-AUTH-01 | No login UI — auto-auths with dev credentials. Need real login/register pages |
| **Frontend credentials page** | FR-UI — Credentials | Page exists but is basic. Needs proper credential selector on nodes |
| **Frontend workflow management** | FR-CANVAS | Workflow list is a modal. Needs dedicated page with search/filter |
| **Error boundary coverage** | NFR-REL | Only root ErrorBoundary exists. Individual section boundaries missing |
| **Input length limits** | NFR-SEC | No maxLength on any text inputs |
| **Pagination on list endpoints** | NFR-PERF | `/workflows`, `/runs`, `/credentials` return all records — no pagination |

### 🟡 MEDIUM Priority

| Item | PRD Ref | Notes |
|------|---------|-------|
| **PostgreSQL support** | NFR-REL | Only SQLite. Need abstracted DB layer |
| **Workflow templating** | FR-WF | No template system. Every workflow built from scratch |
| **Execution mode toggle** | FR-UI | Canvas is always in edit mode. No "view execution" mode |
| **Per-node input/output preview** | FR-CANVAS | Config panel "Output" tab is a placeholder |
| **Expression editor** | FR-CANVAS | No `{{ $node.X.output.field }}` expression support |
| **Undo/redo** | FR-CANVAS-07 | Not implemented |
| **Copy/paste nodes** | FR-CANVAS-03 | Not implemented |
| **Workflow import/export UI** | FR-WF | API exists but no "Download" or "Upload" button on canvas |
| **Connector operation dynamic options** | FR-CONNECTOR | Fields with `dynamicOptions` not resolved at runtime |
| **Scheduled triggers UI** | FR-TRIGGER-04 | Cron triggers exist in engine but no UI to configure |

### 🔴 CRITICAL (Blocking production)

| Item | Priority | Why |
|------|----------|-----|
| Real connector implementations (Gmail, Slack, GitHub) | P0 | Core value prop is broken without real integrations |
| Login/Auth UI | P0 | No user can access the app without auto-auth or a login page |
| MongoDB connector → replace with proper DB | P0 | SQLite works for dev but needs migration path to Postgres |
| Agent node real LLM integration testing | P0 | Agent loop makes real API calls but untested against actual OpenAI/Anthropic endpoints |
| Webhook public URL management | P1 | Webhooks need a way to see/regenerate public URLs |

---

## 6. Known Issues

### Security (AUDIT_REPORT.md)

1. **Code sandbox escape** — Node.js `vm` module is not a security boundary. Prototype pollution can escape. Mitigation: defense-in-depth, code node restricted to admin.
2. **LocalStorage JWT** — Tokens in localStorage are XSS-vulnerable. Migration to httpOnly cookies planned.
3. **Mock OAuth tokens** — `OAuthHandler.exchangeCode()` returns mock tokens. No real OAuth flow works end-to-end.
4. **Webhook endpoint** — `POST /webhooks/:id/:secret` is public with only rate limiting. No IP allowlisting.

### Code Quality

1. `(req as any).user.id` used extensively (20+ locations) — needs Express type augmentation
2. Mock operations in batch-connectors.ts return `{ data: { result: input, mock: true } }` — not real API calls
3. `stores.ts` has 437 lines of hardcoded provider/connector data — should be externalized
4. `console.error()` calls in 3 frontend files (useMCP, useOnboardingTour, ErrorBoundary)

---

## 7. Architecture Decisions Not Yet Made

| Decision | Options | Who Decides |
|----------|---------|-------------|
| **Database** | SQLite (current) vs PostgreSQL | Architecture team |
| **Auth method** | JWT in localStorage vs httpOnly cookies | Security team |
| **Deployment model** | Docker Compose vs Kubernetes | Ops team |
| **Licensing** | MIT vs AGPL vs BSL | Legal + Business |
| **Plugin system** | npm packages vs custom registry | Engineering |
| **LLM provider defaults** | OpenAI vs self-hosted (Ollama) | Product |
| **Expression language** | Custom `{{ }}` vs JSONata vs n8n-style | Product + Engineering |

---

## 8. Quick Start

```bash
# Backend
cd torque/backend
JWT_SECRET="your-secret-32-chars-min!!" \
  ENCRYPTION_KEY="$(node -e "console.log(Buffer.alloc(32,'a').toString('base64'))")" \
  npx tsx src/index.ts

# Frontend (separate terminal)
cd torque/frontend
npm run dev

# Tests
cd torque/backend && npm test
```

---

## 9. Key Files to Read First

| File | Purpose |
|------|---------|
| `PRD.md` | Complete product specification |
| `ARCHITECTURE.md` | Technical architecture overview |
| `AUDIT_REPORT.md` | Security findings and status |
| `TEST_REPORT.md` | Test coverage and results |
| `implementation.md` | Original build specification |
| `backend/src/index.ts` | Server entry point |
| `frontend/src/App.tsx` | Application shell |
| `backend/src/engine/workflow-engine.ts` | Core execution engine |
| `backend/src/connectors/registry.ts` | Connector architecture |
| `backend/src/agent/harness.ts` | Agent execution loop |
