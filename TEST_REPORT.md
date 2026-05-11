# Torque — Full Test Report

> Generated: May 10, 2026 | Scope: Full-stack integration test

---

## 1. Compilation Results

| Layer | Check | Result |
|-------|-------|--------|
| Backend | `tsc --noEmit` | ✅ PASS (0 errors) |
| Frontend | `tsc --noEmit` | ✅ PASS (0 errors) |
| Frontend | `vite build` | ✅ PASS (540KB JS, 60KB CSS) |

---

## 2. Unit & Integration Tests

| Suite | Tests | Status |
|-------|-------|--------|
| Workflows API | 5/5 | ✅ All pass |
| — POST /api/workflows creates | 1 | ✅ |
| — POST /api/workflows validation (400) | 1 | ✅ |
| — POST /api/workflows/:id/run | 1 | ✅ |
| — POST /api/workflows/:id/run (404) | 1 | ✅ |
| — Credential masking | 1 | ✅ |

---

## 3. Server Integration Test (live endpoints)

| Endpoint | Method | Status | Response |
|----------|--------|--------|----------|
| `/health` | GET | ✅ 200 | `{"status":"ok","version":"0.1.0"}` |
| `/api/v1/auth/register` | POST | ✅ 201 | `{"ok":true}` |
| `/api/v1/auth/login` | POST | ✅ 200 | JWT access + refresh tokens |
| `/api/v1/workflows` | GET | ✅ 200 | `[]` (empty, auth'd) |
| `/api/v1/connectors/marketplace` | GET | ✅ 200 | **27 connectors** |
| `/api/v1/skills/list` | GET | ✅ 200 | **6 skills** |
| `/api/v1/mcp-marketplace` | GET | ✅ 200 | **10 MCP servers** |

---

## 4. Feature Inventory

### Workflow Engine (39 node types)

| Category | Nodes | Count |
|----------|-------|-------|
| **Triggers** | Schedule, Webhook Trigger | 2 |
| **Flow Control** | IF Condition, Switch, Loop, Merge, Split, Wait, Transform | 7 |
| **AI & Agents** | Deep Agent, LLM Call, Summarize, Translate, Computer Use, MCP Tool, Gemini, Mistral, HuggingFace | 9 |
| **Data** | Extract, HTTP Request, Database, File, RSS Feed, Email, WhatsApp, Twilio SMS, Outlook, Trello, Asana, ClickUp, Vercel, Supabase, Redis, MySQL | 16 |
| **Outputs** | Destination, Send Webhook, Respond to Webhook, Code | 4 |
| **Total** | | **39** |

### Connector Registry (27 connectors)

| Category | Connectors |
|----------|-----------|
| **Utility** | HTTP Request, Code, Transform, RSS, Email (SMTP) |
| **Communication** | Gmail, Slack, Discord, Telegram |
| **Productivity** | Notion, Google Sheets, Google Docs, Google Calendar, Airtable |
| **Developer** | GitHub, GitLab, Jira, Linear, PostgreSQL, MongoDB |
| **Finance** | Stripe |
| **CRM** | HubSpot, Salesforce |
| **Storage** | AWS S3, Google Drive |
| **AI** | OpenAI, Anthropic Claude |

### Agent Skills (6)

web_search, http_request, calculate, extract_structured_data, summarize, format_date

### MCP Marketplace (10 servers)

Filesystem, GitHub MCP, PostgreSQL, Slack MCP, Puppeteer, Brave Search, Fetch, Memory, Playwright, Google Maps

---

## 5. Infrastructure

| Component | Status |
|-----------|--------|
| **Database** | SQLite via better-sqlite3 (11 tables, WAL mode, FK enforced) |
| **Auth** | JWT (jose) + Argon2 password hashing + refresh token rotation |
| **Rate Limiting** | 200/15min global, 20/min runs, 5/min auth |
| **Security** | helmet() headers, CORS origin pinning, parameterized SQL |
| **Real-time** | socket.io wired (engine → frontend via useRunStream hook) |
| **Queue** | better-queue with concurrency 5 |
| **Error Handling** | Global Express handler + uncaughtException/unhandledRejection |
| **Triggers** | Webhook (`POST /webhooks/:id/:secret`), Schedule (node-cron), Polling |
| **Logging** | pino structured JSON logging |
| **Docker** | Multi-stage build, docker-compose.prod.yml with HEALTHCHECK |
| **CI/CD** | GitHub Actions workflow (typecheck → test → build) |

---

## 6. Frontend UI

| Feature | Status |
|---------|--------|
| Canvas (React Flow) | ✅ 39 node types registered |
| Node Creator (Cmd+K) | ✅ Searchable popup with 5 categories |
| Node Palette | ✅ Left sidebar with category groups |
| Config Panel | ✅ Parameters / Settings / Output tabs |
| Log Panel | ✅ Real-time streaming via socket.io |
| Execution Output Viewer | ✅ Per-node JSON output display |
| Dashboard | ✅ Summary cards + recent runs table |
| Page Navigation | ✅ Dashboard / Workflows / Credentials |
| Credentials Manager | ✅ Add/test/delete credentials with masking |
| Onboarding Tour | ✅ driver.js 10-step tour |
| Keyboard Shortcuts | ✅ Cmd+K (node creator), Cmd+Enter (run) |
| Dark Theme | ✅ Consistent gray-950/900/800 palette |

---

## 7. Key Metrics

| Metric | Value |
|--------|-------|
| Backend source files | 34 TypeScript files |
| Backend lines of code | ~4,200 |
| Frontend source files | 45+ TSX/TS files |
| Backend integration tests | 5 passing |
| API endpoints | 45+ (auth, workflows, connectors, MCP, skills, webhooks, health) |
| Database tables | 11 |
| Node types (canvas) | 39 |
| Connectors (registry) | 27 |
| Agent skills | 6 |
| MCP marketplace servers | 10 |
