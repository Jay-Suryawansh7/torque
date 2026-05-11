import { Pool } from "pg";
import { readFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { setDb, type Database, type Statement } from "./interface.js";

let pool: Pool | null = null;

class PgStatement implements Statement {
  constructor(private queryText: string) {}
  async run(...params: unknown[]): Promise<{ changes: number }> {
    if (!pool) return { changes: 0 };
    try { const r = await pool.query(this.queryText, params); return { changes: r.rowCount ?? 0 }; } catch { return { changes: 0 }; }
  }
  async get(...params: unknown[]): Promise<unknown> {
    if (!pool) return null;
    try { const r = await pool.query(this.queryText, params); return r.rows.length > 0 ? r.rows[0] : null; } catch { return null; }
  }
  async all(...params: unknown[]): Promise<unknown[]> {
    if (!pool) return [];
    try { const r = await pool.query(this.queryText, params); return r.rows; } catch { return []; }
  }
}

class PgDatabase implements Database {
  prepare(query: string): Statement { return new PgStatement(query); }
  exec(query: string): void { pool?.query(query).catch(() => {}); }
  close(): void { pool?.end().catch(() => {}); pool = null; }
}

export async function initDb(connectionString: string): Promise<void> {
  pool = new Pool({ connectionString, max: 5, idleTimeoutMillis: 30000 });

  // Run schema migration
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const schemaPath = join(__dirname, "schema.pg.sql");

  if (existsSync(schemaPath)) {
    const schema = readFileSync(schemaPath, "utf-8");
    const statements = schema.split(";").filter(s => s.trim().length > 0);
    for (const stmt of statements) {
      try { await pool.query(stmt + ";"); } catch (err) {
        console.error("Schema migration error:", err);
      }
    }
  }

  setDb(new PgDatabase());
}

export function closeDb(): void {
  pool?.end().catch(() => {});
  pool = null;
}

export { getDb } from "./interface.js";
