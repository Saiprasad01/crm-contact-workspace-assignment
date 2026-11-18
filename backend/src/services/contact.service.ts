import { db, newId, nowIso } from '../db/client';
import { ApiError } from '../utils/apiError';
import type { ContactUpdateInput, ContactsQueryInput } from '../validation/contact.schema';
import { recordActivity } from './activity.service';

interface ContactRow {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  version: number;
  created_at: string;
  updated_at: string;
}

interface TagRow {
  id: string;
  name: string;
}

function getTagsForContacts(contactIds: string[]): Map<string, TagRow[]> {
  const map = new Map<string, TagRow[]>();
  if (contactIds.length === 0) return map;

  const placeholders = contactIds.map(() => '?').join(',');
  const rows = db
    .prepare(
      `SELECT ct.contact_id as contact_id, t.id as id, t.name as name
       FROM contact_tags ct JOIN tags t ON t.id = ct.tag_id
       WHERE ct.contact_id IN (${placeholders})
       ORDER BY t.name ASC`
    )
    .all(...contactIds) as unknown as Array<TagRow & { contact_id: string }>;

  for (const row of rows) {
    const list = map.get(row.contact_id) ?? [];
    list.push({ id: row.id, name: row.name });
    map.set(row.contact_id, list);
  }
  return map;
}

function toContactDTO(row: ContactRow, tags: TagRow[] = []) {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    company: row.company,
    version: row.version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    tags,
  };
}

export function listContacts(query: ContactsQueryInput) {
  const { q, tags, company, sortBy, sortDir, page, pageSize } = query;

  const conditions: string[] = [];
  const params: Array<null | number | bigint | string | NodeJS.ArrayBufferView> = [];

  if (q) {
    // SQLite's LIKE is case-insensitive for ASCII by default, so this behaves
    // close enough to a case-insensitive search without needing collation tricks.
    conditions.push('(first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR phone LIKE ?)');
    const like = `%${q}%`;
    params.push(like, like, like, like);
  }

  if (company) {
    conditions.push('company LIKE ?');
    params.push(`%${company}%`);
  }

  if (tags) {
    const tagNames = tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    if (tagNames.length > 0) {
      const placeholders = tagNames.map(() => '?').join(',');
      conditions.push(
        `id IN (SELECT ct.contact_id FROM contact_tags ct JOIN tags t ON t.id = ct.tag_id WHERE t.name IN (${placeholders}))`
      );
      params.push(...tagNames);
    }
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const sortDirSql = sortDir.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
  const orderByClause =
    sortBy === 'name'
      ? `last_name ${sortDirSql}, first_name ${sortDirSql}`
      : `created_at ${sortDirSql}`;

  const totalRow = db.prepare(`SELECT COUNT(*) as count FROM contacts ${whereClause}`).get(
    ...params
  ) as { count: number };
  const total = totalRow.count;

  const rows = db
    .prepare(`SELECT * FROM contacts ${whereClause} ORDER BY ${orderByClause} LIMIT ? OFFSET ?`)
    .all(...params, pageSize, (page - 1) * pageSize) as unknown as ContactRow[];

  const tagsByContact = getTagsForContacts(rows.map((r) => r.id));

  return {
    data: rows.map((row) => toContactDTO(row, tagsByContact.get(row.id) ?? [])),
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export interface CreateContactInput {
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  createdAt?: string;
}

// Not exposed over HTTP (the brief only requires browse/update, not create —
// see PROJECT_IMPLEMENTATION_PLAN.md Assumption 3), but used by the seed
// script and by tests to set up fixtures without going through the API.
export function createContact(input: CreateContactInput) {
  const id = newId();
  const createdAt = input.createdAt ?? nowIso();
  db.prepare(
    `INSERT INTO contacts (id, first_name, last_name, email, phone, company, version, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)`
  ).run(
    id,
    input.firstName,
    input.lastName,
    input.email ?? null,
    input.phone ?? null,
    input.company ?? null,
    createdAt,
    createdAt
  );
  return getContactById(id);
}

export function getContactById(id: string) {
  const row = db.prepare('SELECT * FROM contacts WHERE id = ?').get(id) as
    | ContactRow
    | undefined;
  if (!row) throw ApiError.notFound('Contact not found');
  const tags = getTagsForContacts([id]).get(id) ?? [];
  return toContactDTO(row, tags);
}

const EDITABLE_FIELDS = ['firstName', 'lastName', 'email', 'phone', 'company'] as const;
const FIELD_TO_COLUMN: Record<(typeof EDITABLE_FIELDS)[number], keyof ContactRow> = {
  firstName: 'first_name',
  lastName: 'last_name',
  email: 'email',
  phone: 'phone',
  company: 'company',
};

export function updateContact(id: string, input: ContactUpdateInput) {
  const existing = db.prepare('SELECT * FROM contacts WHERE id = ?').get(id) as
    | ContactRow
    | undefined;
  if (!existing) throw ApiError.notFound('Contact not found');

  if (input.email) {
    const duplicate = db
      .prepare('SELECT id FROM contacts WHERE email = ? AND id != ?')
      .get(input.email, id);
    if (duplicate) {
      throw ApiError.conflict('EMAIL_TAKEN', 'Another contact already uses this email address');
    }
  }

  const changedFields = EDITABLE_FIELDS.filter((field) => {
    const existingValue = existing[FIELD_TO_COLUMN[field]] ?? null;
    const inputValue = input[field] ?? null;
    return existingValue !== inputValue;
  });

  // The atomic guard against a stale write: this UPDATE only touches a row
  // whose version still matches what the client last read. If another update
  // already bumped it, `changes` comes back 0 and nothing is written.
  let result;
  try {
    result = db
      .prepare(
        `UPDATE contacts
         SET first_name = ?, last_name = ?, email = ?, phone = ?, company = ?, version = version + 1, updated_at = ?
         WHERE id = ? AND version = ?`
      )
      .run(
        input.firstName,
        input.lastName,
        input.email,
        input.phone,
        input.company,
        nowIso(),
        id,
        input.version
      );
  } catch (err) {
    if (err instanceof Error && err.message.includes('UNIQUE constraint failed')) {
      // Two concurrent requests both passed the pre-check above with
      // different emails that collide once committed; the DB's unique
      // constraint is the real guard, this just surfaces the same shape.
      throw ApiError.conflict('EMAIL_TAKEN', 'Another contact already uses this email address');
    }
    throw err;
  }

  if (result.changes === 0) {
    const latestRow = db.prepare('SELECT * FROM contacts WHERE id = ?').get(id) as
      | ContactRow
      | undefined;
    if (!latestRow) throw ApiError.notFound('Contact not found');
    const latestTags = getTagsForContacts([id]).get(id) ?? [];
    throw ApiError.conflict(
      'VERSION_CONFLICT',
      'This contact was updated by someone else since you loaded it',
      { latest: toContactDTO(latestRow, latestTags) }
    );
  }

  if (changedFields.length > 0) {
    recordActivity(id, 'CONTACT_UPDATED', { changedFields });
  }

  const updatedRow = db.prepare('SELECT * FROM contacts WHERE id = ?').get(id) as unknown as ContactRow;
  const updatedTags = getTagsForContacts([id]).get(id) ?? [];
  return toContactDTO(updatedRow, updatedTags);
}
