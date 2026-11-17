import { db, newId, nowIso } from '../db/client';
import { ApiError } from '../utils/apiError';
import { recordActivity } from './activity.service';

interface TagRow {
  id: string;
  name: string;
}

export function listTags(): TagRow[] {
  return db.prepare('SELECT * FROM tags ORDER BY name ASC').all() as unknown as TagRow[];
}

function findOrCreateTag(tagName: string): TagRow {
  const name = tagName.trim();
  const existing = db.prepare('SELECT * FROM tags WHERE name = ?').get(name) as
    | TagRow
    | undefined;
  if (existing) return existing;

  const id = newId();
  db.prepare('INSERT INTO tags (id, name) VALUES (?, ?)').run(id, name);
  return { id, name };
}

export function addTagToContact(contactId: string, tagName: string): TagRow {
  const contact = db.prepare('SELECT id FROM contacts WHERE id = ?').get(contactId);
  if (!contact) throw ApiError.notFound('Contact not found');

  const tag = findOrCreateTag(tagName);

  const existingLink = db
    .prepare('SELECT 1 FROM contact_tags WHERE contact_id = ? AND tag_id = ?')
    .get(contactId, tag.id);

  // Idempotent: adding a tag that's already assigned is a no-op (and shouldn't
  // spam the activity log with duplicate TAG_ADDED entries).
  if (!existingLink) {
    db.prepare('INSERT INTO contact_tags (contact_id, tag_id, created_at) VALUES (?, ?, ?)').run(
      contactId,
      tag.id,
      nowIso()
    );
    recordActivity(contactId, 'TAG_ADDED', { tag: tag.name });
  }

  return tag;
}

export function removeTagFromContact(contactId: string, tagId: string): void {
  const link = db
    .prepare('SELECT 1 FROM contact_tags WHERE contact_id = ? AND tag_id = ?')
    .get(contactId, tagId);
  if (!link) throw ApiError.notFound('Tag is not assigned to this contact');

  const tag = db.prepare('SELECT * FROM tags WHERE id = ?').get(tagId) as TagRow | undefined;
  db.prepare('DELETE FROM contact_tags WHERE contact_id = ? AND tag_id = ?').run(contactId, tagId);
  recordActivity(contactId, 'TAG_REMOVED', { tag: tag?.name ?? tagId });
}

export function bulkAssignTag(contactIds: string[], tagName: string) {
  const tag = findOrCreateTag(tagName);

  const idPlaceholders = contactIds.map(() => '?').join(',');
  const existingLinks = contactIds.length
    ? (db
        .prepare(
          `SELECT contact_id FROM contact_tags WHERE tag_id = ? AND contact_id IN (${idPlaceholders})`
        )
        .all(tag.id, ...contactIds) as unknown as Array<{ contact_id: string }>)
    : [];
  const alreadyTagged = new Set(existingLinks.map((l) => l.contact_id));
  const candidates = contactIds.filter((id) => !alreadyTagged.has(id));

  if (candidates.length === 0) {
    return { updated: 0, skipped: contactIds.length };
  }

  // Silently drop ids that don't correspond to a real contact instead of
  // failing the whole bulk action for one bad id.
  const candidatePlaceholders = candidates.map(() => '?').join(',');
  const existingContacts = db
    .prepare(`SELECT id FROM contacts WHERE id IN (${candidatePlaceholders})`)
    .all(...candidates) as unknown as Array<{ id: string }>;
  const validIds = existingContacts.map((c) => c.id);

  const insert = db.prepare(
    'INSERT INTO contact_tags (contact_id, tag_id, created_at) VALUES (?, ?, ?)'
  );
  const now = nowIso();
  for (const contactId of validIds) {
    insert.run(contactId, tag.id, now);
    recordActivity(contactId, 'TAG_ADDED', { tag: tag.name });
  }

  return { updated: validIds.length, skipped: contactIds.length - validIds.length };
}
