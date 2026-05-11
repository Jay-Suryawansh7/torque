# Torque — Production Readiness Audit

> Generated: May 2026 | Scope: Full-stack audit (frontend + backend + infra)

## Executive Summary

| Dimension | Score | Verdict |
|-----------|-------|---------|
| Architecture | 7/10 | Sound structure, needs isolation |
| Error Handling | 4/10 | 51 missing boundaries |
| Input Validation | 3/10 | 15 routes without shape checks |
| Security | 5/10 | CORS misconfigured, creds leaked via `get()`, codegen injection |
| Data Integrity | 2/10 | No atomic writes, race conditions, corruption risk |
| Testing | 0/10 | Zero tests, no test framework |
| Observability | 2/10 | console.log, no metrics, no tracing |
| Accessibility | 2/10 | No ARIA, no focus mgmt, 0 keyboard shortcuts |
| UX (Loading/Empty/Error) | 5/10 | 12 missing loading states, 23 unhandled fetch errors |
| Type Safety | 6/10 | 7 `any`, 22+ unsafe `as` casts |
| Infrastructure | 3/10 | No CI/CD, no rate limiting, no TLS, no health checks |

**Overall: 3.5/10 — Prototype-grade. Production requires significant hardening.**

---

## 1. Error Handling (Critical)

### Backend — 51 Missing Error Boundaries

| Location | Count | Details |
|----------|-------|---------|
| Route handlers (workflows) | 9/9 | No try/catch on any route |
| Route handlers (extensions) | 20/22 | Only `/workflows/:id/run` has any protection |
| Global Express middleware | — | **None** — every unhandled exception crashes the process |
| `stores.ts` (JSON parse/write) | 5 | `readJSON` throws on corrupted file => server won't start |
| `workflow-engine.ts` (load/run) | 8 | Startup crash on corrupted workflows.json/runs.json |
| `mcp-registry.ts` (public methods) | 7 | No try/catch on any method |
| `agent-runner.ts` | 1 | `runNode()` no try/catch |
| `harness.ts` | 1 | `run()` no try/catch |
| **Total** | **51** | |

### Frontend — 23 Unhandled Fetch Calls

| File | Unhandled fetches |
|------|-------------------|
| `ConnectorModal.tsx` | 8 (marketplace + CRUD) |
| `MCPModal.tsx` | 7 (marketplace + CRUD) |
| `ProviderModal.tsx` | 5 (marketplace + CRUD) |
| `App.tsx` | 2 (workflow list, load workflow) |
| `useWorkflow.ts` | 1 (load) |
| **Total** | **23** |

### Empty Catch Blocks (silent failures)

- `App.tsx:41` — workflow list fetch silently swallowed
- `useMCP.ts:34` — MCP discovery errors silently ignored
- `useOnboardingTour.ts:110` — tour cleanup errors swallowed

---

## 2. Input Validation (Critical)

### Backend — 15 Routes With Zero Shape Validation

Every route handler uses `req.body as X` pattern — a TypeScript cast that provides zero runtime protection. Malformed/malicious JSON payloads are written directly to persisted storage.

**Files affected**: `workflows.ts`, `extensions.ts` (every POST/PUT route)

**No validation library** (zod, joi, class-validator) in dependencies.

### Frontend — No Client-Side Validation

- No form field validation on node config inputs
- No required field checking before save/run
- No type coersion or sanitization on user inputs

---

## 3. Security (High)

### CORS Misconfiguration — CRITICAL

```typescript
cors({ origin: "*", credentials: true })
```
- `*` with `credentials: true` violates CORS spec — browsers reject it
- No production origin whitelist
- Vulnerable to CSRF-style attacks in any non-CORS context

### Credential Leakage — HIGH

```typescript
// stores.ts:47 get() returns UNREDACTED secrets
get(id): Credential | undefined { return this._data[id]; }
```
- `list()` and `save()` properly mask keys as `"••••••"`
- But `get()` returns full `api_key`, `oauth_token`, `oauth_refresh` in plaintext
- `extensions.ts` never calls `get()` directly, but any future code that does leaks secrets

### OAuth Open Redirect — MEDIUM

```typescript
// extensions.ts:65
const redirectUri = `${req.protocol}://${req.hostname}:${process.env.PORT}/...`
```
- `req.hostname` is attacker-controllable via `Host` header if behind a misconfigured proxy
- Can be used for phishing (OAuth redirect to attacker site after authorization)

### Code Injection via Codegen — MEDIUM

```typescript
// codegen.ts:482 — user `condition` field interpolated directly into generated TS
return Boolean(${cond});
// codegen.ts:497 — user `transform` field executed as code  
return (${transform})(data);
```
- `escapeJS()` only escapes `` \ ` $ `` — insufficient
- `'`, `"`, newlines, `\n`, `\r`, `\0` all pass through unescaped
- Generated code is user-downloaded, but if auto-executed on backend, enables RCE

---

## 4. Data Integrity (Critical)

### No Atomic Writes — 7 Locations

Every `save()` / `delete()` / `runWorkflow()` writes the entire JSON file directly via `writeFileSync`. A crash mid-write permanently corrupts the file:

| File | Records | Risk |
|------|---------|------|
| `credentials.json` | API keys, OAuth tokens | Permanent credential loss |
| `connectors.json` | Connection configs | Re-authentication required |
| `mcp_servers.json` | MCP server URLs | Reconnection required |
| `workflows.json` | All workflow definitions | Complete data loss |
| `runs.json` | Execution history | Operational data loss |

**Fix**: Write to `file.tmp` then `fs.renameSync(file.tmp, file)` — atomic on all OS filesystems.

### Race Conditions — 7 Locations

Two concurrent `save()` calls both read the full file, modify in memory, then write. The second write overwrites the first's changes:

| File | Pattern |
|------|---------|
| All store `save()` | Read full JSON → modify one entry → write full JSON |
| `workflow-engine.ts:78,115` | `_saveRuns()` called twice during `runWorkflow()` |
| `mcp-registry.ts:113,123` | Creates duplicate `CredentialStore` instance racing with main store |

### No Backup Strategy

- No WAL (write-ahead log)
- No periodic snapshots
- No rollback capability
- Single file per collection (no sharding)

---

## 5. Testing (Critical — Zero Coverage)

| Type | Status |
|------|--------|
| Unit tests | 0 |
| Integration tests | 0 |
| E2E tests | 0 |
| Test framework | Not installed |
| Test scripts | Not configured |
| Coverage tool | Not configured |

---

## 6. Observability (High)

| Capability | Status | Details |
|------------|--------|---------|
| Structured logging | ❌ | Raw `console.log` in `index.ts:23-24` |
| Request logging | ❌ | No morgan/pino-http middleware |
| Metrics | ❌ | No /metrics endpoint, no Prometheus |
| Error tracking | ❌ | No Sentry, no Rollbar |
| Tracing | ❌ | No OpenTelemetry |
| Health check | ⚠️ | `/api/health` exists but no Docker HEALTHCHECK uses it |
| Client-side monitoring | ❌ | No frontend error boundary, no RUM |

---

## 7. Infrastructure (High)

### Docker

| Issue | Severity |
|-------|----------|
| Dev volumes (`./backend:/app`) in compose | CRITICAL — mounts source, not build |
| Runs via `npx tsx` not compiled JS | HIGH — runtime dependency on tsx in production |
| No restart policy | MEDIUM |
| No resource limits | MEDIUM |
| No HEALTHCHECK on any service | MEDIUM |
| No docker-compose.prod.yml override | LOW |

### Nginx

| Issue | Severity |
|-------|----------|
| No TLS/HTTPS | CRITICAL |
| No security headers (CSP, HSTS, X-Frame-Options, etc.) | HIGH |
| No gzip/brotli compression | MEDIUM |
| No caching headers for static assets | MEDIUM |
| No rate limiting | MEDIUM |
| No upstream health checks | MEDIUM |

### CI/CD

| Gap | Impact |
|-----|--------|
| No CI pipeline | Every deploy is manual, no gates |
| No lint stage | Quality regressions undetected |
| No test stage | Broken code ships |
| No build stage | No artifact verification |
| No deploy automation | Rollbacks are manual and slow |

---

## 8. Frontend UX (Medium)

### Missing Loading States — 12 Instances

| Location | When |
|----------|------|
| `App.tsx:41` | Initial workflow list |
| `App.tsx:52-60` | Save operation |
| `ProviderModal.tsx:22-23` | Provider marketplace + credentials load |
| `ProviderModal.tsx:37-43` | Credential save |
| `ConnectorModal.tsx:39-40` | Connector marketplace load |
| `ConnectorModal.tsx:46-62` | All connector CRUD operations |
| `MCPModal.tsx:15-16` | MCP marketplace load |
| `MCPModal.tsx:20-34` | All MCP CRUD operations |
| `AgentConfigPanel.tsx:293` | MCP tab content (loading prop ignored) |

### Missing Error States — 23 Instances

- 23 fetch calls across `ConnectorModal`, `MCPModal`, `ProviderModal`, `App.tsx`, `useWorkflow.ts` with no error handling
- Network failures result in silent no-ops or blank UIs

### Accessibility — 2/10

| Category | Count |
|----------|-------|
| `aria-*` attributes | **0** |
| `role` attributes | **0** |
| Keyboard shortcuts | **1** (Cmd+K only) |
| Focus trap on modals | **0** |
| Escape-to-close on modals | **0** |
| `autoFocus` on modals | **0** |
| Focus outline removal (`focus:outline-none`) | Present on search inputs |

---

## 9. Type Safety (Medium)

| Category | Count | Files |
|----------|-------|-------|
| `as any` / `: any` | 7 | App.tsx(3), ConnectorModal.tsx, MCPModal.tsx(2), types/index.ts |
| Unsafe `as X` casts | 22+ | Every route handler, every node component, engine methods |
| Locally duplicated types | 2 | ConnectorModal, useMCP redefine interfaces from types/index.ts |
| MCPServer.tools type | 1 | `any[]` instead of defined interface |

---

## 10. Priority Remediation Roadmap

### Phase 1 — Ship-Blocking (week 1)

1. **Atomic JSON writes** — `writeFileSync` → `writeFileSync(tmp)` + `renameSync`
2. **Global Express error middleware** — catch-all `(err, req, res, next)`
3. **Fix CORS** — `origin: "*"` → explicit frontend URL, remove incompatible `credentials: true`
4. **Redact credentials in `get()`** — mask `api_key`/`oauth_token` like `list()` does
5. **try/catch on all JSON.parse** — prevent startup crash on corrupted data
6. **Add loading states** — to ConnectorModal, MCPModal, ProviderModal
7. **Add error states** — to all 23 unhandled fetch calls

### Phase 2 — Hardening (week 2)

8. **Input validation** — Add zod schemas for all request bodies
9. **Race condition fix** — File locking or per-entry persistence instead of full-file writes
10. **Docker production profile** — `docker-compose.prod.yml` with compiled JS, no volumes, restart policy, HEALTHCHECK
11. **Nginx hardening** — TLS, security headers, gzip, caching, rate limiting
12. **Structured logging** — Replace `console.log` with pino
13. **Rate limiting** — Add `express-rate-limit` to all API routes
14. **Duplicate store instance fix** — `mcp-registry.ts` should reuse, not recreate stores

### Phase 3 — Platform (week 3-4)

15. **Test framework** — Install vitest/playwright, write integration tests for critical paths
16. **CI/CD pipeline** — GitHub Actions: lint → typecheck → test → build → deploy
17. **Database migration** — Replace JSON files with SQLite (lite) or Postgres (production)
18. **Accessibility audit** — ARIA labels, focus trapping, keyboard navigation, Escape handlers
19. **Monitoring** — Sentry error tracking, health check endpoint, uptime monitoring
20. **Backup strategy** — Periodic snapshots of data directory to S3/object storage

### Phase 4 — Scale (month 2+)

21. **Horizontal scaling** — Stateless backend (move sessions out of memory), shared DB
22. **WebSocket support** — Real-time log streaming instead of HTTP poll
23. **Agent sandboxing** — Isolated container/VM for code execution nodes
24. **Multi-tenant auth** — JWT/OAuth with per-user workflow isolation
25. **Rate limit tiers** — Free/pro API key rate limiting
26. **Frontend code-splitting** — Dynamic imports for large node type modules
