export const CREATE_TABLES = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS workflows (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Untitled',
  description TEXT DEFAULT '',
  definition TEXT NOT NULL DEFAULT '{}',
  is_active INTEGER NOT NULL DEFAULT 0,
  trigger_type TEXT DEFAULT NULL,
  trigger_config TEXT DEFAULT '{}',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS workflow_runs (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  workflow_id TEXT NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'queued',
  trigger_source TEXT DEFAULT 'manual',
  trigger_data TEXT DEFAULT '{}',
  started_at TEXT DEFAULT NULL,
  completed_at TEXT DEFAULT NULL,
  duration_ms INTEGER DEFAULT NULL,
  error TEXT DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS node_executions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  run_id TEXT NOT NULL REFERENCES workflow_runs(id) ON DELETE CASCADE,
  node_id TEXT NOT NULL,
  node_name TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  input TEXT DEFAULT 'null',
  output TEXT DEFAULT 'null',
  error TEXT DEFAULT NULL,
  started_at TEXT DEFAULT NULL,
  completed_at TEXT DEFAULT NULL,
  duration_ms INTEGER DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS run_logs (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  run_id TEXT NOT NULL REFERENCES workflow_runs(id) ON DELETE CASCADE,
  node_id TEXT DEFAULT NULL,
  level TEXT NOT NULL DEFAULT 'info',
  message TEXT NOT NULL,
  data TEXT DEFAULT '{}',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS credentials (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  connector_id TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  data TEXT NOT NULL DEFAULT '{}',
  auth_type TEXT NOT NULL DEFAULT 'api_key',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  last_used_at TEXT DEFAULT NULL,
  last_tested_at TEXT DEFAULT NULL,
  test_status TEXT DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS mcp_servers (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  url TEXT NOT NULL,
  transport TEXT NOT NULL DEFAULT 'sse',
  status TEXT NOT NULL DEFAULT 'disconnected',
  tools TEXT NOT NULL DEFAULT '[]',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  last_ping_at TEXT DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS workflow_variables (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  workflow_id TEXT NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value TEXT NOT NULL DEFAULT 'null',
  ttl_expires_at TEXT DEFAULT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(workflow_id, key)
);

CREATE TABLE IF NOT EXISTS webhook_events (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  workflow_id TEXT NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  payload TEXT NOT NULL DEFAULT '{}',
  headers TEXT NOT NULL DEFAULT '{}',
  triggered_run_id TEXT DEFAULT NULL,
  received_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  revoked INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);
`;
