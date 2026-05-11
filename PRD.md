

# Torque — Product Requirements Document




> **Status**: Alpha · **Version**: 0.1.0 · **Last Updated**: May 2026

> **Author**: Product & Engineering Team




---




## Table of Contents




1. [Executive Summary](#1-executive-summary)

2. [Problem Statement](#2-problem-statement)

3. [Target Audience & User Personas](#3-target-audience--user-personas)

4. [User Research Findings](#4-user-research-findings)

5. [Product Vision](#5-product-vision)

6. [User Stories](#6-user-stories)

7. [Functional Requirements](#7-functional-requirements)

8. [Non-Functional Requirements](#8-non-functional-requirements)

9. [Technical Architecture](#9-technical-architecture)

10. [Node Types & Connectors](#10-node-types--connectors)

11. [API Design](#11-api-design)

12. [Security & Compliance](#12-security--compliance)

13. [Monetization Strategy](#13-monetization-strategy)

14. [Release Criteria](#14-release-criteria)

15. [Roadmap](#15-roadmap)

16. [Success Metrics](#16-success-metrics)

17. [Competitive Landscape](#17-competitive-landscape)

18. [Risks & Mitigations](#18-risks--mitigations)

19. [Appendix](#19-appendix)




---




## 1. Executive Summary




Torque is a visual workflow automation platform that enables teams to design, execute, and monitor complex multi-step automations through a drag-and-drop canvas interface. Unlike traditional automation tools that require coding or expensive SaaS subscriptions, Torque runs on your own infrastructure, supports AI-driven agent nodes, and provides complete observability into every execution.




**Key Differentiators:**

- **Visual DAG canvas** — Build workflows by connecting nodes, not writing code

- **AI-native** — Agent nodes with LLM-powered reasoning and skill execution

- **Self-hosted** — Full control over data, no third-party dependency

- **Connector ecosystem** — 27 pre-built SaaS connectors with extensible architecture

- **Complete audit trail** — Every execution logged with input, output, and timing




---




## 2. Problem Statement




### 2.1 The Core Problem




Most companies run their internal automation through a fragmented collection of cron jobs, Lambda functions, CI/CD pipeline scripts, webhook handlers, and manual API calls. This approach has five fundamental flaws:




1. **Invisible** — When a script fails at 3 AM, nobody knows until someone notices something is wrong

2. **Unmaintainable** — The person who wrote the deployment webhook six months ago has left the company, and the code is in an unlabeled GitHub repo

3. **Unauditable** — There is no record of who ran what automation, when, or what data it touched

4. **Brittle** — Every API change at a connected service breaks the integration silently

5. **Expensive** — Engineering teams spend 30–40% of their time building and maintaining integrations instead of shipping product




### 2.2 Why Now




- **SaaS proliferation** — The average company now uses over 40 SaaS tools, all needing integration

- **AI maturity** — LLMs have reached the reliability level where they can meaningfully participate in workflow decisions and data transformations

- **Observability demands** — SOC 2, ISO 27001, and internal compliance requirements demand audit trails for all automated processes

- **Engineering efficiency pressure** — Every headcount decision forces teams to prioritize integration work over product work




### 2.3 Why Not Existing Solutions




| Solution | Problem |

|----------|---------|

| **Zapier / Make** | Per-task pricing that becomes uneconomical at scale. Data passes through third-party servers. Limited control over execution. |

| **n8n** | Requires Postgres + Redis + dedicated ops. Node.js-only execution. Community nodes of inconsistent quality. |

| **Airflow / Prefect** | Requires Python expertise and data engineering team. Overkill for business workflows. No AI node support. |

| **Custom scripts** | No observability, no audit trail, no error handling, no retry logic — every team reinvents the same wheel. |

| **In-house platform** | 6–18 months to build. Ongoing maintenance burden. Usually abandoned after the engineer who built it leaves. |




---




## 3. Target Audience & User Personas




### 3.1 Primary Personas




#### Persona A: The DevOps Engineer (Primary Builder)

**Name**: Priya, 32

**Role**: Senior DevOps Engineer at a mid-stage SaaS company

**Technical level**: Expert — comfortable with APIs, Docker, CI/CD, infrastructure




**Daily frustrations:**

- Maintains 20+ cron jobs and Lambda functions for internal automation

- Spends 2 days per month fixing broken integrations after API changes

- Has no way to show her manager what automations exist or whether they're working

- Gets paged at 2 AM when a webhook handler crashes silently




**What she needs:**

- A visual way to build and debug workflows

- Complete execution logs with timing and error information

- Infrastructure that fits into her existing Docker setup

- Ability to retry failed workflows without manual intervention




#### Persona B: The Engineering Manager (Decision Maker)

**Name**: Marcus, 41

**Role**: Engineering Manager at a Series B company

**Technical level**: Mid — can read code but doesn't write it daily




**Daily frustrations:**

- His team is spending 30% of sprint capacity on integration work

- He has no visibility into which automations exist or their health

- Compliance is asking for audit trails on automated processes

- He can't justify hiring more engineers just to maintain webhook handlers




**What he needs:**

- A platform that reduces integration maintenance time

- Audit logging for compliance

- Cost predictability — no per-execution pricing

- Self-hosted option to keep data on-premises




#### Persona C: The AI/ML Engineer (Advanced User)

**Name**: Aisha, 29

**Role**: ML Engineer working on AI agent pipelines

**Technical level**: Expert — Python, LLM APIs, agent frameworks




**Daily frustrations:**

- Building agent loops requires stitching together LLM calls, data extraction, file I/O, and external API calls

- Existing workflow tools don't support tool-calling loops or skill-based agent execution

- She needs a way to give LLMs controlled access to tools (web search, code execution, database queries)




**What she needs:**

- Agent node type that runs LLM tool-calling loops

- Sandboxed code execution for LLM-generated scripts

- Extensible skill system for adding new tool capabilities

- Execution context that preserves state across agent iterations




### 3.2 Secondary Personas




#### Persona D: The Business Operations Manager (Occasional Builder)

**Name**: Carlos, 38

**Role**: Revenue Operations Manager

**Technical level**: Low — comfortable with spreadsheets and SaaS tools




**What he needs:**

- Pre-built connectors for CRM, email, and calendar tools

- Trigger-based workflows that run when events happen (new deal, new contact)

- Visual canvas that doesn't require reading documentation

- Templates for common business workflows




#### Persona E: The CTO (Buyer/Champion)

**Name**: Sarah, 45

**Role**: CTO at a growth-stage company

**Technical level**: High — was an engineer, now focuses on strategy




**What she needs:**

- Self-hosted deployment for data sovereignty

- Audit trails and execution history for compliance

- Predictable infrastructure cost

- Platform that scales from a single Docker container to a production deployment

- Open architecture that doesn't create vendor lock-in




---




## 4. User Research Findings




### 4.1 Methodology




Research conducted with 12 engineering teams across 8 companies (Oct 2025 – Mar 2026):

- Structured interviews (45 min each) with DevOps engineers, engineering managers, and CTOs

- Diary studies (1 week) with 5 engineers tracking automation maintenance time

- Competitive evaluation of n8n, Airflow, Temporal, and Zapier by internal team




### 4.2 Key Findings




#### Finding 1: Automation Debt Is Real and Growing

- Average team maintains 23 automation scripts/endpoints (median)

- 68% of these have no automated tests

- 41% have no error handling beyond a try/catch

- Estimated maintenance cost: 0.5 FTE per 20 automations




#### Finding 2: Observability Is the #1 Unmet Need

- 92% of respondents said "knowing when something fails" is their primary pain point

- 76% rely on "someone notices and says something" as their failure detection mechanism

- Current tools (GitHub Actions logs, CloudWatch) provide execution output but no structured audit




#### Finding 3: AI Agents Are Coming, But Tools Aren't Ready

- 66% of teams are experimenting with LLM-powered automation

- 58% have built at least one prototype agent pipeline

- 0% have a production deployment — they cite tool reliability, security concerns, and observability gaps as blockers

- Teams want agent nodes that can make decisions and call tools, not just fixed DAGs




#### Finding 4: Self-Hosted Is Non-Negotiable for Serious Use

- 83% of teams said they would not send sensitive data (customer PII, internal metrics, API keys) through a third-party automation platform

- 71% cited compliance requirements (SOC 2, HIPAA considerations) as the reason

- 64% have tried Zapier/Make and migrated away due to cost at scale




#### Finding 5: The "Script in a Repo" Pattern Is Universal

- Every team has a GitHub repo called `infra-scripts`, `automation`, or `ops-tools`

- Every team has at least one script that "nobody knows how it works but it runs in prod"

- Every team has experienced a silent failure that went undetected for days or weeks




### 4.3 User Quotes




> "I have a Slack bot that runs on a Raspberry Pi under someone's desk. It works, but if it goes down, nobody knows how to fix it."

> — DevOps Engineer, Series B company




> "We spent three months building an internal automation platform. Then the engineer who built it left. Now we're maintaining it and it's worse than the problem it solved."

> — Engineering Manager, Series C company




> "I want to give our LLM agent access to our database and our Slack. But I need to be able to say 'show me every query it ran' and have that log available."

> — ML Engineer, AI startup




> "Zapier costs us $12,000/year and we're still hacking around its limitations. At that price, I'd rather run something ourselves."

> — CTO, Series A company




---




## 5. Product Vision




### 5.1 Vision Statement




> **Torque makes automation visible, auditable, and maintainable — so engineering teams can stop building integration infrastructure and start shipping product.**




### 5.2 Principles




1. **Observability by default** — Every execution produces structured logs with input, output, timing, and error information. No opt-in required.

2. **Fail visibly** — A failed workflow produces a clear error message, a stack trace, and a notification. No silent failures.

3. **AI as a tool, not a black box** — Agent nodes expose their reasoning through logs. Every LLM call, every tool execution, every decision is recorded.

4. **Self-hosted first** — The primary deployment model is on your infrastructure. Cloud is a convenience, not a requirement.

5. **Extensible by design** — Every connector implements the same interface. Adding a new integration means implementing one file, not forking the codebase.

6. **Complexity where needed, simplicity where possible** — The visual canvas abstracts execution order and data flow. But every node exposes its real configuration when you need it.




---




## 6. User Stories




### 6.1 Workflow Canvas




| ID | Story | Priority | Persona |

|----|-------|----------|---------|

| W-01 | As a DevOps engineer, I want to drag nodes onto a canvas and connect them visually, so I can build workflows without writing code. | P0 | Priya |

| W-02 | As a DevOps engineer, I want to click a node and configure its parameters in a side panel, so I can customize each step. | P0 | Priya |

| W-03 | As a DevOps engineer, I want to see execution status (running/completed/failed/skipped) on each node, so I can debug failed workflows. | P0 | Priya |

| W-04 | As an engineering manager, I want to see a timeline view of workflow runs, so I can understand execution patterns and failure rates. | P1 | Marcus |

| W-05 | As a DevOps engineer, I want to duplicate a workflow, so I can reuse existing automation patterns. | P1 | Priya |

| W-06 | As a DevOps engineer, I want to import and export workflows as JSON, so I can version-control my automation definitions. | P2 | Priya |

| W-07 | As a business ops manager, I want to search for nodes by name or description, so I can find the right connector without browsing categories. | P1 | Carlos |




### 6.2 Workflow Execution




| ID | Story | Priority | Persona |

|----|-------|----------|---------|

| E-01 | As a DevOps engineer, I want to click "Run" to execute a workflow, so I can test it immediately. | P0 | Priya |

| E-02 | As a DevOps engineer, I want to see real-time logs streaming during execution, so I can monitor progress and catch errors. | P0 | Priya |

| E-03 | As a DevOps engineer, I want failed workflows to automatically retry with exponential backoff, so transient failures don't require manual intervention. | P1 | Priya |

| E-04 | As a DevOps engineer, I want to configure per-node error handling (stop/continue/retry), so critical paths fail closed and non-critical paths can degrade gracefully. | P1 | Priya |

| E-05 | As an engineering manager, I want to see execution history with search and filtering, so I can audit past runs. | P1 | Marcus |

| E-06 | As a DevOps engineer, I want to cancel a running or queued workflow, so I can stop problematic executions. | P1 | Priya |




### 6.3 Connectors & Integrations




| ID | Story | Priority | Persona |

|----|-------|----------|---------|

| C-01 | As a DevOps engineer, I want to connect to Slack and send messages from workflows, so my team gets automated notifications. | P0 | Priya |

| C-02 | As a DevOps engineer, I want to connect to GitHub and create issues from workflows, so I can automate issue triage. | P0 | Priya |

| C-03 | As a DevOps engineer, I want to make arbitrary HTTP requests from workflows, so I can integrate with any REST API. | P0 | Priya |

| C-04 | As a business ops manager, I want to connect to Gmail and send emails, so I can automate customer communications. | P1 | Carlos |

| C-05 | As a DevOps engineer, I want to connect to a database and run SQL queries, so I can build data-driven workflows. | P1 | Priya |

| C-06 | As a DevOps engineer, I want to see all available connectors in a marketplace view, so I know what integrations are available. | P2 | Priya |




### 6.4 AI & Agent Capabilities




| ID | Story | Priority | Persona |

|----|-------|----------|---------|

| A-01 | As an ML engineer, I want to add an Agent node that uses an LLM to reason about inputs and decide which tools to call, so I can build AI-powered automations. | P0 | Aisha |

| A-02 | As an ML engineer, I want to configure which skills (tools) an agent can use, so I control what the LLM has access to. | P0 | Aisha |

| A-03 | As an ML engineer, I want to see the agent's full reasoning trace (LLM calls, tool calls, results), so I can debug and audit AI decisions. | P0 | Aisha |

| A-04 | As an ML engineer, I want to write and execute JavaScript code in a sandboxed environment within a workflow, so I can implement custom logic. | P1 | Aisha |

| A-05 | As a DevOps engineer, I want agent nodes to use the same connectors as regular nodes, so agents can send emails, create tickets, and query databases. | P1 | Priya |




### 6.5 Auth & Credentials




| ID | Story | Priority | Persona |

|----|-------|----------|---------|

| CR-01 | As a DevOps engineer, I want to store API keys securely with encryption at rest, so credentials are never exposed in plaintext. | P0 | Priya |

| CR-02 | As a DevOps engineer, I want to test whether a stored credential is valid, so I can diagnose connection issues. | P1 | Priya |

| CR-03 | As an engineering manager, I want credentials to be masked in the UI and logs, so secrets are never accidentally exposed. | P1 | Marcus |

| CR-04 | As a security engineer, I want all credentials encrypted with AES-256-GCM before being written to the database, so a DB leak doesn't expose secrets. | P0 | Security |




### 6.6 Observability & Monitoring




| ID | Story | Priority | Persona |

|----|-------|----------|---------|

| O-01 | As a DevOps engineer, I want every workflow run to produce a structured log, so I can debug failures. | P0 | Priya |

| O-02 | As a DevOps engineer, I want to see per-node execution time and status, so I can identify performance bottlenecks. | P1 | Priya |

| O-03 | As an engineering manager, I want a dashboard showing workflow health (success rate, run count, failure trends), so I can report on automation reliability. | P1 | Marcus |

| O-04 | As a security engineer, I want a complete audit trail of every workflow execution including who triggered it, so we can pass compliance audits. | P1 | Security |




---




## 7. Functional Requirements




### 7.1 Workflow Canvas (FR-CANVAS)




| ID | Requirement | Priority |

|----|-------------|----------|

| FR-CANVAS-01 | The canvas shall support drag-and-drop placement of nodes from a sidebar palette. | P0 |

| FR-CANVAS-02 | The canvas shall support drawing directed connections between node outputs and inputs. | P0 |

| FR-CANVAS-03 | The canvas shall support keyboard shortcuts: Delete (remove selected), Cmd/Ctrl+K (search nodes), Cmd/Ctrl+Enter (run workflow). | P0 |

| FR-CANVAS-04 | The canvas shall display execution status on each node (running/completed/failed/skipped). | P0 |

| FR-CANVAS-05 | The canvas shall render a minimap, zoom controls, and fit-to-view. | P1 |

| FR-CANVAS-06 | The canvas node configuration panel shall have three tabs: Parameters, Settings, Output. | P0 |

| FR-CANVAS-07 | The canvas shall support undo/redo for node placement and connection changes. | P2 |




### 7.2 Workflow Execution (FR-EXEC)




| ID | Requirement | Priority |

|----|-------------|----------|

| FR-EXEC-01 | The engine shall support DAG-based execution — nodes with no dependencies run first, each node gets upstream outputs as input. | P0 |

| FR-EXEC-02 | Independent branches of the DAG shall execute in parallel using Promise.all. | P0 |

| FR-EXEC-03 | Each node shall have an `onError` setting: stop (halt the run), continue (skip, pass null downstream), retry (up to 3 times with exponential backoff). | P0 |

| FR-EXEC-04 | The engine shall support queue-based execution with configurable concurrency. | P0 |

| FR-EXEC-05 | Run states shall transition through: queued → running → completed | failed | cancelled. | P0 |

| FR-EXEC-06 | Each node execution shall record: input, output, error, startedAt, completedAt, durationMs. | P0 |

| FR-EXEC-07 | Real-time execution logs shall be streamed via Socket.IO to the frontend. | P0 |




### 7.3 Trigger System (FR-TRIGGER)




| ID | Requirement | Priority |

|----|-------------|----------|

| FR-TRIGGER-01 | Webhook triggers shall expose a unique URL at `/webhooks/:workflowId/:secret` that enqueues a run on POST. | P0 |

| FR-TRIGGER-02 | Webhook endpoints shall verify HMAC-SHA256 signatures using `crypto.timingSafeEqual`. | P0 |

| FR-TRIGGER-03 | Webhook endpoints shall redact sensitive headers (Authorization, Cookie, API keys) before persisting. | P0 |

| FR-TRIGGER-04 | Schedule triggers shall use cron expressions via `node-cron`. | P1 |

| FR-TRIGGER-05 | Polling triggers shall run at minimum 1-minute intervals with deduplication via `lastCheckedAt`. | P2 |




### 7.4 Connector System (FR-CONNECTOR)




| ID | Requirement | Priority |

|----|-------------|----------|

| FR-CONNECTOR-01 | Every connector shall implement the `IConnector` interface with id, name, description, icon, category, authType, authConfig, operations, and testConnection. | P0 |

| FR-CONNECTOR-02 | Connectors shall be registered in a central registry at startup — adding a new connector means implementing one class. | P0 |

| FR-CONNECTOR-03 | Every operation shall implement `execute(input, credential, context)` that is independently testable without Express or DB. | P0 |

| FR-CONNECTOR-04 | The HTTP connector shall make real API calls with timeout, retry, and error normalization. | P0 |

| FR-CONNECTOR-05 | Connector errors shall be normalized through a `ConnectorError` class with connectorId, operationId, message, statusCode, and retryable. | P0 |

| FR-CONNECTOR-06 | The connector marketplace shall expose all available connectors with their operations and field schemas via API. | P1 |




### 7.5 Auth & Identity (FR-AUTH)




| ID | Requirement | Priority |

|----|-------------|----------|

| FR-AUTH-01 | Users shall register with email and password (argon2 hashed). | P0 |

| FR-AUTH-02 | Users shall authenticate via JWT access tokens (15 min expiry) + refresh token rotation. | P0 |

| FR-AUTH-03 | All API routes except `/health` and `/webhooks/:id/:secret` shall require JWT authentication. | P0 |

| FR-AUTH-04 | JWT verification shall be synchronous — auth middleware must call `next()` or send response, not return a dangling Promise. | P0 |

| FR-AUTH-05 | Refresh tokens shall be stored hashed in the database and revoked on use (rotation). | P0 |

| FR-AUTH-06 | Rate limiting: 5 requests/min on auth endpoints, 20/min on run endpoints, 200/15min globally. | P0 |




### 7.6 Agent & AI (FR-AI)




| ID | Requirement | Priority |

|----|-------------|----------|

| FR-AI-01 | Agent nodes shall run an LLM in a tool-calling loop — model decides which skills to call, calls them, observes results, repeats until done. | P0 |

| FR-AI-02 | Agent node config shall include: provider, model, system prompt, enabled skills, max iterations, temperature, max tokens, memory mode. | P0 |

| FR-AI-03 | The agent execution loop shall support configurable max iterations (default 10) to prevent infinite loops. | P0 |

| FR-AI-04 | Agent skills shall implement `IAgentSkill` with id, name, description, inputSchema, outputSchema, and execute. | P0 |

| FR-AI-05 | The calculate skill shall use `mathjs` for safe expression evaluation — never `new Function()` or `eval`. | P0 |

| FR-AI-06 | The code execution skill shall run in a Node.js `vm` sandbox with `require`, `process`, `globalThis`, `setTimeout`, `setInterval`, and `fetch` explicitly disabled. | P0 |




### 7.7 MCP (Model Context Protocol) (FR-MCP)




| ID | Requirement | Priority |

|----|-------------|----------|

| FR-MCP-01 | The MCP registry shall support connecting to MCP servers via SSE transport, discovering tools via `tools/list`, and calling tools. | P1 |

| FR-MCP-02 | MCP server URLs shall be validated against SSRF attacks — block private IPs, loopback, and link-local addresses. | P0 |

| FR-MCP-03 | The MCP marketplace shall pre-configure well-known servers (filesystem, GitHub, PostgreSQL, Slack, Puppeteer, Brave Search, etc.) for one-click connection. | P1 |

| FR-MCP-04 | A background reconnect loop shall retry errored connections every 30 seconds with exponential backoff up to 5 minutes. | P2 |




### 7.8 Frontend UI (FR-UI)




| ID | Requirement | Priority |

|----|-------------|----------|

| FR-UI-01 | The app shall have a dark theme with consistent gray-950/900/800 palette. | P0 |

| FR-UI-02 | Pages shall have standardized headers: H1, subtitle, right-aligned action button. | P1 |

| FR-UI-03 | Empty states shall be animated with motion/react: fade-in + scale entrance, icon + heading + description + action button. | P1 |

| FR-UI-04 | Log entries shall animate in with a slide-in-from-bottom effect via motion.div. | P1 |

| FR-UI-05 | Dashboard metric cards shall count up from 0 on mount via motion value animation. | P1 |

| FR-UI-06 | All API calls shall go through a centralized client that handles auth headers, 401 retry, and error toasts. | P0 |

| FR-UI-07 | All canvas nodes shall be standardized to 240px width with truncated labels. | P1 |

| FR-UI-08 | All forms shall use consistent spacing: space-y-4 between fields, Separator above submit row, submit right-aligned. | P2 |




---




## 8. Non-Functional Requirements




### 8.1 Performance




| ID | Requirement | Target |

|----|-------------|--------|

| NFR-PERF-01 | Workflow execution queue throughput | 50 concurrent runs |

| NFR-PERF-02 | Canvas node rendering time (100 nodes) | < 500ms |

| NFR-PERF-03 | API response time (p95) | < 200ms |

| NFR-PERF-04 | Database query time (p99) | < 100ms |

| NFR-PERF-05 | Log streaming latency | < 100ms |




### 8.2 Security




| ID | Requirement | Priority |

|----|-------------|----------|

| NFR-SEC-01 | All credentials encrypted at rest with AES-256-GCM. | P0 |

| NFR-SEC-02 | All API routes except public endpoints require JWT authentication. | P0 |

| NFR-SEC-03 | JWT secrets and encryption keys must be provided via environment variables — no hardcoded fallbacks. | P0 |

| NFR-SEC-04 | All password input fields must use `type="password"`. | P0 |

| NFR-SEC-05 | Webhook secrets must be compared using `crypto.timingSafeEqual`. | P0 |

| NFR-SEC-06 | OAuth state parameter must be verified on callback to prevent CSRF. | P0 |

| NFR-SEC-07 | All user inputs in Zod-validated routes must return 400 with field-level errors on failure. | P0 |

| NFR-SEC-08 | HTTP security headers must be applied via `helmet`. | P0 |




### 8.3 Reliability




| ID | Requirement | Priority |

|----|-------------|----------|

| NFR-REL-01 | Server must start with all required env vars validated — crash with clear message if missing. | P0 |

| NFR-REL-02 | Database must use WAL mode for concurrent read/write safety. | P0 |

| NFR-REL-03 | Graceful shutdown on SIGTERM/SIGINT — close HTTP server and database. | P0 |

| NFR-REL-04 | Uncaught exceptions must be logged and exit with code 1 — never silently hang. | P0 |

| NFR-REL-05 | Workflow runs must be queued — the request returns immediately, execution happens asynchronously. | P0 |

| NFR-REL-06 | Webhook events must be persisted to the database before triggering a run — no in-flight data loss on crash. | P1 |




### 8.4 Maintainability




| ID | Requirement | Priority |

|----|-------------|----------|

| NFR-MAIN-01 | All route handlers must wrap async errors via a centralized `wrap()` function — no individual try/catch in handlers. | P0 |

| NFR-MAIN-02 | Connectors must be self-contained classes implementing `IConnector` — zero Express or DB dependencies in execute(). | P0 |

| NFR-MAIN-03 | Database schema must be defined in a single file with `CREATE TABLE IF NOT EXISTS` — no migration system needed for alpha. | P1 |

| NFR-MAIN-04 | All external URLs must come from constants or environment variables — no hardcoded endpoints. | P1 |




---




## 9. Technical Architecture




### 9.1 High-Level Architecture




```

┌─────────────────────────────────────────────────────────────┐

│                     Frontend (React 19)                      │

│                                                              │

│  ┌───────────────┐  ┌──────────────┐  ┌──────────────────┐  │

│  │  Node Palette  │  │  Canvas      │  │  Config Panel    │  │

│  │  (sidebar)     │  │  (ReactFlow) │  │  (right drawer)  │  │

│  └───────────────┘  └──────┬───────┘  └──────────────────┘  │

│                            │                                  │

│              ┌─────────────▼─────────────┐                   │

│              │  Log Panel (socket.io)    │                   │

│              └───────────────────────────┘                   │

└──────────────────────────┬────────────────────────────────────┘

                           │ HTTP REST + WebSocket

┌──────────────────────────▼────────────────────────────────────┐

│                     Backend (Express + TypeScript)              │

│                                                               │

│  ┌────────────┐  ┌──────────────┐  ┌──────────────────────┐  │

│  │  Auth      │  │  Workflows   │  │  Extensions           │  │

│  │  (JWT)     │  │  CRUD + Run  │  │  (connectors, MCP)   │  │

│  └────────────┘  └──────┬───────┘  └──────────────────────┘  │

│                         │                                      │

│              ┌──────────▼──────────┐                          │

│              │  Workflow Engine    │                          │

│              │  (DAG + Queue)      │                          │

│              └──────────┬──────────┘                          │

│                         │                                      │

│              ┌──────────▼──────────┐                          │

│              │  Database (SQLite)   │                          │

│              │  WAL mode, FK on    │                          │

│              └─────────────────────┘                          │

└──────────────────────────────────────────────────────────────┘

```




### 9.2 Stack Decisions




| Layer | Technology | Rationale |

|-------|-----------|-----------|

| Frontend framework | React 19 | Broad ecosystem, React Flow integration |

| Canvas | @xyflow/react (React Flow 12) | Industry standard for DAG UIs, powers n8n's canvas |

| Backend framework | Express 4 + TypeScript | Minimal runtime overhead, no framework magic |

| Database | SQLite (better-sqlite3) | Zero ops — no server process, file-based, WAL mode for concurrency |

| Auth | jose (JWT) + argon2 | No Passport dependency, direct JWT control |

| Validation | Zod 4 | Runtime type safety, schema reuse between API and DB |

| Real-time | Socket.IO | Reliable WebSocket with HTTP fallback, room-based subscriptions |

| Logging | Pino | Structured JSON logs, low overhead, pino-http for request logging |

| UI components | shadcn/ui (22 components) | Accessible, dark-theme compatible, CSS variable based |

| Animations | motion/react (formerly Framer Motion) | Declarative animations, AnimatePresence for exit animations |

| Queue | better-queue | In-process queue, no Redis dependency, configurable concurrency |




### 9.3 Database Schema (11 tables)




| Table | Purpose | Key Columns |

|-------|---------|-------------|

| `users` | User accounts | id, email, password_hash |

| `workflows` | Workflow definitions | id, user_id, name, definition (JSON), trigger_type, is_active |

| `workflow_runs` | Execution history | id, workflow_id, user_id, status, trigger_source, started_at, duration_ms |

| `node_executions` | Per-node execution data | id, run_id, node_id, status, input (JSON), output (JSON), error, duration_ms |

| `run_logs` | Structured execution logs | id, run_id, node_id, level, message, data (JSON) |

| `credentials` | Encrypted API keys | id, user_id, connector_id, data (AES-256-GCM encrypted), auth_type |

| `mcp_servers` | MCP server connections | id, user_id, url, transport, status, tools (JSON) |

| `refresh_tokens` | JWT refresh token store | id, user_id, token_hash, expires_at, revoked |

| `webhook_events` | Incoming webhook payloads | id, workflow_id, payload (JSON), headers (JSON, sanitized), triggered_run_id |

| `workflow_variables` | Persistent workflow memory | id, workflow_id, key, value (JSON), ttl_expires_at |

| `agent_memory` | Cross-run agent state | id, workflow_id, key, value (JSON), created_at |




---




## 10. Node Types & Connectors




### 10.1 Node Types (39 total)




**Triggers (2):** Schedule, Webhook Trigger




**Flow Control (7):** IF Condition, Switch, Loop, Merge, Split, Wait, Transform




**AI & Agents (9):** Deep Agent, LLM Call, Summarize, Translate, Computer Use, MCP Tool, Gemini, Mistral, HuggingFace




**Data & Services (17):** Extract, HTTP Request, Database, File, RSS Feed, Email, WhatsApp, Twilio SMS, Outlook, Trello, Asana, ClickUp, Vercel, Supabase, Redis, MySQL, MCP Tool




**Outputs (4):** Destination, Send Webhook, Respond to Webhook, Code




### 10.2 Connector Registry (27 connectors)




| Category | Connectors | Real vs Mock |

|----------|-----------|--------------|

| Utility | HTTP Request, Code, Transform, RSS, Email (SMTP) | HTTP = real, others = mock |

| Communication | Gmail, Slack, Discord, Telegram | All mock (stubs ready for API integration) |

| Productivity | Notion, Google Sheets, Google Docs, Google Calendar, Airtable | All mock |

| Developer | GitHub, GitLab, Jira, Linear, PostgreSQL, MongoDB | All mock |

| Finance | Stripe | Mock |

| CRM | HubSpot, Salesforce | Mock |

| Storage | AWS S3, Google Drive | Mock |

| AI | OpenAI, Anthropic Claude | Mock |




### 10.3 Agent Skills (6)




| Skill | Implementation | Safety |

|-------|---------------|--------|

| web_search | Returns mock results | No real API calls |

| http_request | Real HTTP fetch | SSRF risk — public URLs only |

| calculate | mathjs.evaluate() | Sandboxed, CPU-boundary via mathjs |

| extract_structured_data | Mock extraction | No-op |

| summarize | Truncation-based mock | No LLM call |

| format_date | Date parsing via Date() | No external calls |




---




## 11. API Design




### 11.1 Route Structure




All API routes are mounted at `/api/v1/`. Legacy `/api/` routes are maintained for backward compatibility.




### 11.2 Endpoint Summary (45+ endpoints)




**Auth (5):** `POST /register`, `POST /login`, `POST /refresh`, `POST /logout`, `GET /me`




**Workflows (13):** `GET /workflows`, `GET /workflows/:id`, `POST /workflows`, `PUT /workflows/:id`, `DELETE /workflows/:id`, `POST /workflows/:id/run`, `POST /workflows/:id/duplicate`, `POST /workflows/import`, `GET /workflows/:id/export`, `POST /workflows/export`, `GET /runs/:id`, `GET /runs`, `POST /runs/:id/cancel`




**Connectors (5):** `GET /connectors/marketplace`, `GET /connectors/:id`, `GET /connectors/:connectorId/operations/:operationId`, `GET /connectors/:type/oauth/start`, `GET /connectors/:type/oauth/callback`




**Credentials (4):** `GET /credentials`, `POST /credentials`, `DELETE /credentials/:id`, `POST /credentials/:id/test`




**MCP (7):** `GET /mcp-marketplace`, `GET /mcp-servers/v2`, `POST /mcp-servers/v2`, `POST /mcp-servers/v2/:id/connect`, `POST /mcp-servers/v2/:id/disconnect`, `DELETE /mcp-servers/v2/:id`, `GET /mcp/discover`




**Skills & Providers (5):** `GET /skills/list`, `GET /skills/:id`, `GET /providers`, `GET /providers/marketplace`, `GET /permissions/check`




**Public (2):** `GET /health`, `POST /webhooks/:workflowId/:secret`




---




## 12. Security & Compliance




### 12.1 Credential Encryption




- Algorithm: AES-256-GCM

- Key source: `ENCRYPTION_KEY` environment variable (32 bytes, base64-encoded)

- Process: Random 16-byte IV per credential → encrypt → prepend IV:tag:ciphertext format

- Decryption: Split on `:`, extract IV + auth tag + ciphertext, verify tag before returning plaintext

- Key validation: Server refuses to start if `ENCRYPTION_KEY` is missing or invalid




### 12.2 Authentication




- Password hashing: argon2 (memory-hard, resistant to GPU attacks)

- Access tokens: JWT signed with HS256, 15-minute expiry

- Refresh tokens: 40-byte random hex, stored as argon2 hash in DB, 7-day expiry, single-use (rotated on each refresh)

- Token storage: Client-side in localStorage (XSS-vulnerable — planned migration to httpOnly cookies)

- Auth middleware: Synchronous JWT verification — no dangling Promise issues




### 12.3 Webhook Security




- HMAC-SHA256 signature verification via `x-hub-signature-256` header

- Timing-safe comparison via `crypto.timingSafeEqual`

- Sensitive headers (Authorization, Cookie, x-api-key) stripped before persistence

- Rate limited to 30 requests/minute




### 12.4 SSRF Protection




All outbound HTTP calls to user-provided URLs are validated against:

- Blocked host patterns: 127.x.x.x, 10.x.x.x, 172.16-31.x.x, 192.168.x.x, localhost, ::1, 0.0.0.0

- Scheme restriction: http/https only

- Protocol validation: `new URL()` parsing rejects malformed URLs




### 12.5 Request Validation




- All POST/PUT request bodies validated with Zod schemas

- Validation errors return 400 with field-level `error.flatten()` details

- No `req.body as X` casts — all data flows through validated schemas




### 12.6 Rate Limiting




| Scope | Rate | Applied At |

|-------|------|------------|

| Auth endpoints | 5 req/min | Route level |

| Run endpoints | 20 req/min | Route level |

| Webhook endpoints | 30 req/min | Route level |

| Global | 200 req/15min | App level |




---




## 13. Monetization Strategy




### 13.1 Model: Open Core with Commercial License




Torque follows the open-core model where the core workflow engine, canvas, and connector framework are available under a source-available license, with commercial features requiring a paid license.




**Phase 1 — Alpha (Current):**

- Free for all use

- No licensing restrictions

- All features included




**Phase 2 — Community Edition (Q3 2026):**

- Free, source-available license

- Core workflow engine, 39 node types, 27 connectors

- Community support via Discord/GitHub




**Phase 3 — Enterprise Edition (Q4 2026):**

- Commercial license required for:

- SSO/SAML authentication

- Audit logging export (S3, Snowflake)

- Advanced RBAC (role-based access control)

- Priority support SLA

- On-premise deployment assistance




### 13.2 Pricing Tiers (Planned)




| Tier | Price | Includes |

|------|-------|----------|

| Community | Free | All core features, community support |

| Team | $199/mo | Up to 10 users, email support |

| Business | $999/mo | Up to 50 users, SSO, audit export, SLA |

| Enterprise | Custom | Unlimited users, dedicated support, on-prem |




---




## 14. Release Criteria




### 14.1 Alpha Release (v0.1.0) — Current




**Gate criteria:**

- [x] User registration and JWT authentication

- [x] Canvas with drag-and-drop nodes and connections

- [x] 39 node types rendered and functional

- [x] Workflow execution engine with DAG traversal

- [x] 27 connectors registered in marketplace

- [x] 6 agent skills with sandboxed execution

- [x] Webhook trigger with HMAC verification

- [x] Credential encryption (AES-256-GCM)

- [x] SQLite persistence with 11 tables

- [x] OAuth state CSRF protection

- [x] Rate limiting on all endpoints

- [x] Socket.IO real-time log streaming

- [x] 42 passing integration tests

- [x] Docker Compose deployment




### 14.2 Beta Release (v0.2.0) — Target: Q3 2026




**Gate criteria:**

- [ ] Real API integration for top 5 connectors (HTTP, SMTP, GitHub, Slack, Gmail)

- [ ] Pagination on all list endpoints

- [ ] Frontend error boundaries with recovery

- [ ] Workflow templating system

- [ ] Export/import workflow definitions

- [ ] 80% test coverage on critical paths

- [ ] Load testing: 50 concurrent runs

- [ ] Documentation for all connectors




### 14.3 Production Release (v1.0.0) — Target: Q4 2026




**Gate criteria:**

- [ ] SSO/SAML authentication

- [ ] Role-based access control

- [ ] Audit log export to S3

- [ ] PostgreSQL database support

- [ ] Horizontal scaling (multiple workers)

- [ ] 95th percentile API latency < 200ms

- [ ] Security penetration test completed

- [ ] SOC 2 Type II readiness




---




## 15. Roadmap




### Q2 2026 (Alpha)

- Core workflow engine with DAG execution ✅

- Visual canvas with 39 node types ✅

- JWT auth with refresh token rotation ✅

- 27 mock connectors ✅

- Agent node with skill system ✅

- MCP server connectivity ✅

- Socket.IO real-time streaming ✅

- 42 tests passing ✅




### Q3 2026 (Beta)

- Real API integration: HTTP, Gmail, Slack, GitHub

- Workflow templates (pre-built automation patterns)

- Workflow import/export as JSON

- Frontend execution mode toggle (edit/view)

- Per-node input/output preview

- Connector documentation site




### Q4 2026 (v1.0)

- PostgreSQL database support

- SSO/SAML authentication

- RBAC with team management

- Audit log export

- Horizontal scaling

- Performance optimization

- Security audit




### H1 2027

- Webhook receiver with public URL management

- Conditional branching with expression editor

- Sub-workflow execution (workflows calling workflows)

- Plugin marketplace for community connector submissions

- Mobile push notifications via Firebase




---




## 16. Success Metrics




### 16.1 Product Metrics




| Metric | Target (Beta) | Target (v1.0) |

|--------|--------------|---------------|

| Workflows created per active user | 5 / week | 15 / week |

| Workflow execution success rate | > 90% | > 99% |

| Time to create a 5-node workflow | < 5 min | < 2 min |

| Connector adoption (% using ≥ 3 connectors) | 40% | 70% |

| Agent node adoption | 15% | 40% |

| Daily active users / registered users | 30% | 50% |




### 16.2 Engineering Metrics




| Metric | Target |

|--------|--------|

| API p95 latency | < 200ms |

| Test coverage | > 60% lines, > 50% branches |

| Bug report close rate | 90% within 7 days |

| Time to add a new connector | < 2 days |




### 16.3 Business Metrics




| Metric | Target (6 months post-launch) |

|--------|------------------------------|

| Open source GitHub stars | 1,000 |

| Community contributors | 20 |

| Docker pulls | 10,000 |

| Enterprise trial requests | 50 |

| Paid conversions (from trial) | 20% |




---




## 17. Competitive Landscape




### 17.1 Direct Competitors




| Competitor | Our Advantage | Their Advantage |

|-----------|--------------|----------------|

| **n8n** | Lower ops overhead (SQLite vs Postgres+Redis). AI agent node with skill system. Written in TypeScript — same language as most engineering teams. | Larger community. More connectors. Longer track record. |

| **Zapier / Make** | Self-hosted — data never leaves your network. No per-task pricing. Complete execution audit trail. | Zero infrastructure to manage. Hundreds of connectors. Non-technical users comfortable with the UI. |

| **Airflow / Prefect** | Visual canvas — no Python required. Business-user friendly. AI agent support. | Mature scheduling. Massive ecosystem. Production-proven at scale. |

| **Temporal** | Visual workflow definition. Connector marketplace. Simpler deployment. | Stronger durability guarantees. Language-agnostic SDKs. Better for long-running processes. |




### 17.2 Positioning




Torque occupies the space between "too expensive" (Zapier/Make) and "too complex" (Airflow/Temporal). It's for teams that:

- Need self-hosted automation for compliance

- Want AI agent capabilities in their workflows

- Are comfortable running a Docker container but don't want to manage a database cluster

- Need complete execution observability

- Don't want per-execution pricing that scales with usage




---




## 18. Risks & Mitigations




| Risk | Likelihood | Impact | Mitigation |

|------|-----------|--------|------------|

| SQLite concurrency limits at scale | Medium | High | WAL mode enabled. Plan for Postgres migration path. Queue-based execution limits concurrent writes. |

| LLM agents produce incorrect results | Medium | Medium | Full agent trace logging. Human-in-the-loop approval for destructive actions. Configurable max iterations. |

| Node.js vm sandbox escape | Low | Critical | Defense-in-depth: sandbox removes dangerous globals, but not relied upon as sole security boundary. Code node restricted to admin users by default. |

| Mock connectors give false sense of capability | Medium | Medium | Clear labeling of connector status (real vs mock) in marketplace UI. Documentation states integration status. |

| Single-server architecture limits vertical scaling | High (at scale) | Medium | Horizontal scaling planned for v1.0. Queue-based execution enables multi-worker deployment. |

| Frontend auth token stored in localStorage | Medium | High | Migration to httpOnly cookies planned. Token has 15-min expiry window. No sensitive data exposed via API without token. |

| Webhook endpoint abuse without auth | Medium | Medium | Rate limited to 30/min. Secret in URL provides basic access control. HMAC signature verification for authenticated callers. |




---




## 19. Appendix




### 19.1 Glossary




| Term | Definition |

|------|-----------|

| Node | A single step in a workflow (e.g., "Send Email", "Create Issue") |

| Edge | A directed connection between two nodes, representing data flow |

| Workflow | A DAG (Directed Acyclic Graph) of nodes and edges |

| Run | A single execution of a workflow with specific inputs |

| Connector | A integration with an external service exposing operations |

| Operation | A specific action or trigger within a connector |

| Skill | A tool that an AI agent node can call during execution |

| MCP | Model Context Protocol — standard for connecting AI tools |

| DAG | Directed Acyclic Graph — the execution model for workflows |




### 19.2 References




- [React Flow Documentation](https://reactflow.dev)

- [shadcn/ui Components](https://ui.shadcn.com)

- [Model Context Protocol Specification](https://modelcontextprotocol.io)

- [Zod Validation Library](https://zod.dev)

- [better-sqlite3 Documentation](https://github.com/WiseLibs/better-sqlite3)

- [Socket.IO Documentation](https://socket.io/docs/v4)

- [JWT Best Practices (RFC 7519)](https://datatracker.ietf.org/doc/html/rfc7519)




---




*This document is a living specification and will be updated as the product evolves. For questions or contributions, contact the product team.*