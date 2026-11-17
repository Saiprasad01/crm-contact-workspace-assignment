import { db, newId, nowIso } from '../db/client';
import { createContact, type CreateContactInput } from '../services/contact.service';

export function resetDb() {
  db.exec(
    'DELETE FROM activity; DELETE FROM contact_tags; DELETE FROM contacts; DELETE FROM tags;'
  );
}

export function createTestContact(overrides: Partial<CreateContactInput> = {}) {
  return createContact({
    firstName: 'Ada',
    lastName: 'Lovelace',
    email: 'ada@example.com',
    phone: '+15551234567',
    company: 'Analytical Engines Ltd',
    ...overrides,
  });
}

export function createTag(name: string) {
  const id = newId();
  db.prepare('INSERT INTO tags (id, name) VALUES (?, ?)').run(id, name);
  return { id, name };
}

export function linkContactTag(contactId: string, tagId: string) {
  db.prepare('INSERT INTO contact_tags (contact_id, tag_id, created_at) VALUES (?, ?, ?)').run(
    contactId,
    tagId,
    nowIso()
  );
}

export function findTagByName(name: string) {
  return db.prepare('SELECT * FROM tags WHERE name = ?').get(name) as
    | { id: string; name: string }
    | undefined;
}

export function getActivityForContact(contactId: string) {
  return db.prepare('SELECT * FROM activity WHERE contact_id = ?').all(contactId) as Array<{
    id: string;
    contact_id: string;
    type: string;
    metadata: string | null;
    created_at: string;
  }>;
}

export function getContactTagLinksByContact(contactId: string) {
  return db.prepare('SELECT * FROM contact_tags WHERE contact_id = ?').all(contactId);
}

export function getContactTagLinksByTag(tagId: string) {
  return db.prepare('SELECT * FROM contact_tags WHERE tag_id = ?').all(tagId);
}
