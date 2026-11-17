// Minimal ambient typing for Node's built-in `node:sqlite` (stable enough in
// Node 22, but not yet shipped in every `@types/node` version we might
// resolve to) — just the surface this project actually uses.
declare module 'node:sqlite' {
  export interface SQLiteRunResult {
    lastInsertRowid: number | bigint;
    changes: number;
  }

  export class StatementSync {
    run(...params: unknown[]): SQLiteRunResult;
    get(...params: unknown[]): Record<string, unknown> | undefined;
    all(...params: unknown[]): Record<string, unknown>[];
  }

  export class DatabaseSync {
    constructor(path: string, options?: Record<string, unknown>);
    exec(sql: string): void;
    prepare(sql: string): StatementSync;
    close(): void;
  }
}
