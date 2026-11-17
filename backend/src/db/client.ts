import { randomUUID } from 'node:crypto';
import fs from 'fs';
import path from 'path';

// Vitest's Vite-powered transform doesn't yet recognize `node:sqlite` as a
// builtin specifier (it's very new) and tries to resolve it as an npm
// package named "sqlite", which fails. Building the specifier at runtime
// keeps it invisible to that static analysis; Node resolves it natively.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { DatabaseSync }: typeof import('node:sqlite') = require(['node', 'sqlite'].join(':'));

function resolveDbPath(): string {
  const raw = process.env.DATABASE_URL ?? 'file:./data/dev.db';
  const withoutScheme = raw.startsWith('file:') ? raw.slice(5) : raw;
  return path.resolve(process.cwd(), withoutScheme);
}

const dbPath = resolveDbPath();
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

// Node's built-in SQLite driver (stable since Node 22) — no native module to
// build and no external binary to download, which matters on a network that
// blocks everything outside the npm registry (see README "Why no Prisma").
export const db = new DatabaseSync(dbPath);
db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA journal_mode = WAL;');

db.exec(`
  CREATE TABLE IF NOT EXISTS contacts (
    id TEXT PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT UNIQUE,
    phone TEXT,
    company TEXT,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_contacts_name ON contacts(last_name, first_name);
  CREATE INDEX IF NOT EXISTS idx_contacts_company ON contacts(company);
  CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON contacts(created_at);

  CREATE TABLE IF NOT EXISTS tags (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS contact_tags (
    contact_id TEXT NOT NULL,
    tag_id TEXT NOT NULL,
    created_at TEXT NOT NULL,
    PRIMARY KEY (contact_id, tag_id),
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS activity (
    id TEXT PRIMARY KEY,
    contact_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('CONTACT_UPDATED','TAG_ADDED','TAG_REMOVED')),
    metadata TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS idx_activity_contact_created ON activity(contact_id, created_at);
`);

export function newId(): string {
  return randomUUID();
}

export function nowIso(): string {
  return new Date().toISOString();
}
