import path from 'path';

const backendRoot = path.resolve(__dirname, '../..');
const testDbPath = path.join(backendRoot, 'data', 'test.db');

// Point every test at a dedicated SQLite file, never the dev.db a developer
// has seeded by hand, so `npm test` can never wipe demo data. db/client.ts
// creates the schema itself (CREATE TABLE IF NOT EXISTS) on first import.
// The file is intentionally left in place between runs (and between the
// isolated module registries Vitest gives each test file) rather than
// deleted here — on Windows, unlinking a SQLite file that another still-open
// connection in the same process holds fails with EBUSY. Each test's own
// `beforeEach(resetDb)` clears every row, which is enough isolation.
process.env.DATABASE_URL = `file:${testDbPath}`;
