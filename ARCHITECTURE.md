# Torque — Architecture & Design v1.0

## Stack

| Layer | Tech | Why |
|-------|------|-----|
| Frontend | React 19 + React Flow (@xyflow/react 12) | Best DAG canvas library, handles drag/drop/connections out of the box |
| Backend | Express 4 + TypeScript (tsx) | Full type safety, shared types with frontend, fast dev iteration |
| Agent runtime | DeepAgentHarness (simulated) | Planning, tool execution, synthesis with structured logging |
| Scheduling | node-cron | Lightweight cron triggers for scheduled workflows |
| Persistence | JSON file system | Workflow definitions, execution history, credentials, connectors |
| Icons | lucide-react + SimpleIcons CDN | UI icons + branded connector/provider logos |
| Styling | Tailwind CSS 3.4 | Utility-first dark theme, DESIGN.md token alignment |
| Onboarding | driver.js | Guided tour on first visit |
| Container | Docker Compose | Backend (Node 22) + frontend (Nginx) |

---

## High-Level Architecture

```

---

## API Endpoints

### Workflows (`/api/workflows`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/workflows` | List all workflows |
| GET | `/api/workflows/:id` | Get workflow by ID |
| POST | `/api/workflows` | Create workflow |
| PUT | `/api/workflows/:id` | Update workflow |
| DELETE | `/api/workflows/:id` | Delete workflow |
| POST | `/api/workflows/:id/run` | Execute workflow |
| GET | `/api/workflows/:id/export` | Export workflow as TypeScript |
| POST | `/api/workflows/export` | Export arbitrary payload as TS |

### Runs

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/runs` | List runs (`?workflow_id=` filter) |
| GET | `/api/runs/:id` | Get run with logs |

### Providers & Credentials

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/providers` | List configured providers |
| GET | `/api/providers/marketplace` | All 14 available LLM providers |
| GET | `/api/credentials` | List (keys masked) |
| POST | `/api/credentials` | Save credential |
| DELETE | `/api/credentials/:id` | Delete credential |

### Connectors

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/connectors` | List installed |
| GET | `/api/connectors/marketplace` | All 31+ available |
| POST | `/api/connectors` | Install connector |
| DELETE | `/api/connectors/:id` | Remove |
| GET | `/api/connectors/:id/discover` | Capabilities |
| GET | `/api/connectors/:type/oauth/start` | Start OAuth 2.0 |
| GET | `/api/connectors/:type/oauth/callback` | OAuth callback |

### MCP Servers

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/mcp-servers` | List connected |
| GET | `/api/mcp-servers/marketplace` | 12 available blueprints |
| POST | `/api/mcp-servers` | Connect server |
| POST | `/api/mcp-servers/:id/discover` | Rediscover tools |
| DELETE | `/api/mcp-servers/:id` | Disconnect |

### MCP Discovery

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/mcp/discover` | Full: servers + tools + resources + prompts |
| GET | `/api/mcp/tools` | All aggregated tools |
| GET | `/api/mcp/resources` | All system + connector resources |
| GET | `/api/mcp/resources/*` | Read resource content |
| GET | `/api/mcp/prompts` | Skill prompt list |
| GET | `/api/mcp/prompts/:name` | Get prompt with `{input}` interpolation |
| GET | `/api/mcp/permissions` | Check tool read/destructive permission |

### Skills & Permissions

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/skills` | List (research, code-gen, data-analysis, computer-use) |
| GET | `/api/permissions/check` | Check connector permission |

### Health

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | `{"status":"ok","version":"0.1.0"}` |

---

## Node Types (23 total)

### Triggers
| Type | Label | Icon | Description |
|------|-------|------|-------------|
| `trigger` | Schedule | `Clock` | Cron or natural-language time-based trigger |
| `webhook_trigger` | Webhook | `Webhook` | HTTP POST trigger (listens on `/webhook`) |

### Flow Control
| Type | Label | Icon | Description |
|------|-------|------|-------------|
| `condition` | IF Condition | `GitBranch` | True/false branching from expression |
| `switch` | Switch | `Shuffle` | Multi-route from cases list |
| `loop` | Loop | `Repeat` | Iterate N times over array |
| `merge` | Merge | `GitMerge` | Combine two data streams |
| `split` | Split | `GitFork` | Chunk array into batches |
| `wait` | Wait | `Timer` | Delay N seconds/minutes |
| `transform` | Transform | `Shuffle` | Map/filter via expression |

### AI & Agents
| Type | Label | Icon | Description |
|------|-------|------|-------------|
| `agent` | Deep Agent | `Brain` | Planning, tools, sub-agents, synthesis |
| `llm` | LLM Call | `Sparkles` | Direct model inference with system prompt |
| `summarize` | Summarize | `AlignLeft` | AI summarization (gpt-4o-mini) |
| `translate` | Translate | `Languages` | AI translation to target language |
| `computer_use` | Computer Use | `Monitor` | Playwright browser automation |
| `code` | Code | `FileCode` | Python/JS/SQL script (sandbox stub) |

### Data
| Type | Label | Icon | Description |
|------|-------|------|-------------|
| `extract` | Extract | `Scan` | Parse JSON/XML/HTML from string |
| `http_request` | HTTP Request | `Globe` | Full HTTP client (any method) |
| `database` | Database | `Database` | Execute SQL queries (stub) |
| `file_io` | File | `FileText` | Read/write local filesystem |

### Outputs
| Type | Label | Icon | Description |
|------|-------|------|-------------|
| `output` | Destination | `Upload` | File, email, Slack, Google Docs, Notion |
| `webhook` | Send Webhook | `Webhook` | Outbound HTTP POST |

---

## Config Panel (4 tabs)

When a node is selected, the right panel opens (320px):

```
┌──────────────────────────────────────────┐
│ ● Agent (a1b2c3d4)                    ✕ │
├──────────────────────────────────────────┤
│  │Configure│ Code │ MCP │ Env           │
├──────────────────────────────────────────┤
│ Label: [Agent                  ]         │
│                                          │
│ Goal:                                    │
│ ┌──────────────────────────────────────┐ │
│ │ Scrape & summarize these URLs...     │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ Model: [GPT-4o     ▾]  Temp: [0.7]      │
│ Skill:  [None       ▾]                  │
│ URLs (one per line)                     │
│ ┌──────────────────────────────────────┐ │
│ │ https://example.com                  │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ ▽ Advanced                               │
│   Connector: [None       ▾]             │
│   MCP Tool:  [tool_name        ]        │
└──────────────────────────────────────────┘
```

- **Code tab**: generated TypeScript for the node
- **MCP tab**: discovered tools, resources, skill prompts
- **Env tab**: required env vars for current config

---

## Data Model

### Workflow
```typescript
Workflow { id, name, nodes: FlowNode[], edges: FlowEdge[], active }
FlowNode { id, type: NodeType, position: {x,y}, config: NodeConfig }
FlowEdge { id, source, target }
NodeConfig { label, goal, model, temperature, schedule, urls, code,
             condition, transform, webhook_url, method, connector_id,
             mcp_server_id, credential_id, skill, ... 40+ fields }
```

### Execution
```typescript
WorkflowRun { id, workflow_id, status, started_at, finished_at, logs, error }
LogEntry { timestamp, step, detail, status }
```

### Extensions
```typescript
Credential { id, name, provider, api_key, base_url, oauth_token,
             oauth_refresh, oauth_expires, oauth_scopes, is_configured }
Connector { id, name, type, config, credential_id, connected,
            readonly, confirm_destructive, operations[] }
MCPServer { id, name, url, transport, tools[], enabled }
Skill { id, name, description, category, icon, prompt_template, tools[] }
```

---

## Execution Flow

1. **User clicks Run** → `POST /api/workflows/:id/run`
2. **WorkflowEngine** creates `WorkflowRun { status: "running" }`
3. Engine finds all `NodeType.agent` nodes in the workflow
4. For each agent node:
   - `_buildContext()`: collects trigger schedule + node URLs
   - `DeepAgentHarness.run(context)`:
     - `_logStep("init")` — agent started with goal
     - `_logStep("plan")` — extracts URLs from goal text, builds step list
     - `_executeStep()` per URL: simulated scrape + hash (stub)
     - `_synthesize()`: formats all results into `# Report` markdown
   - `_handleOutput()` for each output node: writes to `data/outputs/`
5. Run marked `"completed"` or `"failed"`
6. Frontend renders logs with color-coded source tags:
   - `[System]` → gray | `[Workflow]` → torque-blue | `[Agent/step]` → amber | `[error]` → red

---

## TypeScript Code Generation

Every workflow can be exported as a standalone TypeScript program via `engine/codegen.ts`:

1. **Imports**: dotenv, AI SDK (`@ai-sdk/openai`, `@ai-sdk/anthropic`), fs, https, path (conditional)
2. **Context**: `WorkflowContext { lastResult, prevResult }`
3. **Logger**: `log(source, message)` with ISO timestamps
4. **Trigger**: `triggerSchedule()` — cron, webhook server, or manual
5. **Nodes**: per-type async functions using `generateText()` or utility ops
6. **Main**: `async function main()` chains node calls sequentially
7. **Boot**: `triggerSchedule()` starts execution

Run via: `npx tsx workflow.ts`

---

## MCP Ecosystem

### Servers
| Source | Prefix | Examples |
|--------|--------|----------|
| Built-in runtime | `builtin://runtime` | code_interpreter, web_search, web_scrape, file_system, http_request |
| Computer use | `builtin://computer-use` | Browser automation (Playwright) |
| Connectors | `connector://{type}` | google_docs__create_doc, slack__send_message |
| MCP servers | `mcp://{id}` | filesystem, github-mcp, postgres, puppeteer, memory |

### Resources
| URI | Content |
|-----|---------|
| `system://memory` | In-memory KV store |
| `system://config` | Version + provider/connector/workflow counts |
| `system://workflows` | Workflow list |
| `system://credentials` | Provider config status |
| `system://logs` | Last 10 run summaries |
| `connector://{type}/docs` | Connector API docs |
| `connector://{type}/schemas` | Connector JSON schemas |
| `connector://{type}/config` | Connector config state |

### Permissions
- **Readonly**: web_search, sentry, stripe, figma, datadog
- **Confirm-destructive**: computer_use, any connector operation marked destructive
- **Read/write**: all other tools

---

## Design Tokens

| Token | Hex | Tailwind |
|-------|-----|----------|
| `canvas` | `#030712` | `bg-gray-950` |
| `surface` | `#111827` | `bg-gray-900` |
| `surface-soft` | `#1f2937` | `bg-gray-800` |
| `hairline` | `#1f2937` | `border-gray-800` |
| `hairline-soft` | `#374151` | `border-gray-700` |
| `primary` | `#0c8ee9` | `bg-torque-500` |
| `ink` | `#f3f4f6` | `text-gray-100` |
| `charcoal` | `#e5e7eb` | `text-gray-200` |
| `slate` | `#9ca3af` | `text-gray-400` |
| `steel` | `#6b7280` | `text-gray-500` |

Full 763-line design system in `DESIGN.md` (Notion-inspired dark theme).

---

## Deploy

```bash
docker compose up --build
```

| Service | Port | Base |
|---------|------|------|
| backend | 8000 | Node 22 Alpine, `tsx src/index.ts` |
| frontend | 5173 | Vite build served via Nginx |

### Environment
| Variable | Default | Purpose |
|----------|---------|---------|
| `PORT` | `8000` | Backend listen port |
| `DATA_DIR` | `./data` | JSON file persistence |
| `*_CLIENT_ID` | — | OAuth client ID per connector |

### Volumes
- `torque_data` → `/app/data`: persists credentials, connectors, MCP servers, workflows, runs

---

## Directory Structure

```
torque/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Canvas.tsx           # ReactFlow wrapper
│   │   │   ├── NodePalette.tsx      # 5-category node browser
│   │   │   ├── nodes/               # 20 node renderers
│   │   │   └── panels/              # Config panel, 4 modals
│   │   ├── hooks/
│   │   │   ├── useWorkflow.ts       # Core state management
│   │   │   ├── useMCP.ts            # MCP discovery + resources
│   │   │   └── useOnboardingTour.ts # driver.js 10-step tour
│   │   ├── api/workflows.ts         # Typed fetch wrapper
│   │   ├── types/index.ts           # Shared interfaces
│   │   ├── App.tsx                  # Root layout
│   │   └── index.css                # Tailwind + ReactFlow styles
│   ├── tailwind.config.js           # torque color palette
│   ├── vite.config.ts               # /api proxy → :8000
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── index.ts                 # Express server entry
│   │   ├── types.ts                 # All models + defaults
│   │   ├── api/workflows.ts         # CRUD + run + export
│   │   ├── api/extensions.ts        # Providers, connectors, MCP, OAuth, permissions
│   │   ├── engine/stores.ts         # JSON persistence
│   │   ├── engine/workflow-engine.ts # Execution engine
│   │   ├── engine/agent-runner.ts   # Agent node runner
│   │   ├── engine/codegen.ts        # Workflow → TypeScript codegen
│   │   ├── engine/mcp-registry.ts   # MCP capability aggregator
│   │   └── agent/harness.ts         # DeepAgentHarness
│   ├── package.json                 # express, cors, uuid, node-cron
│   ├── tsconfig.json
│   ├── Dockerfile                   # Node 22
│   └── data/                        # JSON persistence dir
├── DESIGN.md                        # Dark theme design system
├── ARCHITECTURE.md                  # This file
└── docker-compose.yml
```
