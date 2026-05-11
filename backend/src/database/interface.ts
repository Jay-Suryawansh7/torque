export interface Database {
  prepare(sql: string): Statement;
  exec(sql: string): void;
  close(): void;
}

export interface Statement {
  run(...params: unknown[]): Promise<{ changes: number }>;
  get(...params: unknown[]): Promise<unknown>;
  all(...params: unknown[]): Promise<unknown[]>;
}

let _impl: Database | null = null;

export function setDb(impl: Database): void {
  _impl = impl;
}

export function getDb(): Database {
  if (!_impl) throw new Error("Database not initialized");
  return _impl;
}
