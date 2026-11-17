import { db, newId, nowIso } from '../db/client';

export type ActivityType = 'CONTACT_UPDATED' | 'TAG_ADDED' | 'TAG_REMOVED';

interface ActivityRow {
  id: string;
  contact_id: string;
  type: ActivityType;
  metadata: string | null;
  created_at: string;
}

export function recordActivity(
  contactId: string,
  type: ActivityType,
  metadata?: Record<string, unknown>
) {
  db.prepare(
    `INSERT INTO activity (id, contact_id, type, metadata, created_at) VALUES (?, ?, ?, ?, ?)`
  ).run(newId(), contactId, type, metadata ? JSON.stringify(metadata) : null, nowIso());
}

export function listActivity(contactId: string, limit = 20) {
  const rows = db
    .prepare(
      `SELECT * FROM activity WHERE contact_id = ? ORDER BY created_at DESC, id DESC LIMIT ?`
    )
    .all(contactId, limit) as unknown as ActivityRow[];

  return rows.map((row) => ({
    id: row.id,
    contactId: row.contact_id,
    type: row.type,
    metadata: row.metadata ? JSON.parse(row.metadata) : null,
    createdAt: row.created_at,
  }));
}
