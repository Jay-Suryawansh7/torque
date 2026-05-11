/**
 * Database abstraction layer. Currently backed by SQLite (better-sqlite3).
 * To add Postgres support, implement this interface using pg (node-postgres).
 */

export interface Database {
  prepare(sql: string): Statement;
  exec(sql: string): void;
  close(): void;
}

export interface Statement {
  run(...params: unknown[]): { changes: number };
  get(...params: unknown[]): unknown;
  all(...params: unknown[]): unknown[];
}

let _impl: Database | null = null;

export function setDb(impl: Database): void {
  _impl = impl;
}

export function getDb(): Database {
  if (!_impl) throw new Error("Database not initialized. Call initDb() first.");
  return _impl;
}

export function hasDb(): boolean {
  return _impl !== null;
}
