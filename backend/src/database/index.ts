import Database from "better-sqlite3";
import { join } from "path";
import { mkdirSync } from "fs";
import { CREATE_TABLES } from "./schema";
import { setDb, type Database as DbInterface, type Statement } from "./interface";

let db: Database.Database;

class SqliteStatement implements Statement {
  constructor(private stmt: Database.Statement) {}
  run(...params: unknown[]): { changes: number } {
    const result = this.stmt.run(...params);
    return { changes: result.changes };
  }
  get(...params: unknown[]): unknown { return this.stmt.get(...params); }
  all(...params: unknown[]): unknown[] { return this.stmt.all(...params); }
}

class SqliteDatabase implements DbInterface {
  constructor(private db: Database.Database) {}
  prepare(sql: string): Statement { return new SqliteStatement(this.db.prepare(sql)); }
  exec(sql: string): void { this.db.exec(sql); }
  close(): void { this.db.close(); }
}

export function initDb(dataDir: string): void {
  mkdirSync(dataDir, { recursive: true });
  const dbPath = join(dataDir, "torque.db");
  db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(CREATE_TABLES);
  setDb(new SqliteDatabase(db));
}

export function closeDb(): void {
  if (db) db.close();
}

// Re-export for backward compatibility during migration
export { getDb } from "./interface";
