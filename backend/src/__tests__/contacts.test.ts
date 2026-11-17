import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../app';
import {
  createTag,
  createTestContact,
  getActivityForContact,
  linkContactTag,
  resetDb,
} from './testUtils';

const app = createApp();

describe('GET /api/v1/contacts', () => {
  beforeEach(resetDb);

  it('returns paginated results with defaults', async () => {
    await createTestContact({ email: 'a@example.com' });
    await createTestContact({ email: 'b@example.com', firstName: 'Grace', lastName: 'Hopper' });

    const res = await request(app).get('/api/v1/contacts');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.page).toBe(1);
    expect(res.body.total).toBe(2);
  });

  it('searches by name, email, and phone', async () => {
    await createTestContact({ email: 'grace.hopper@example.com', firstName: 'Grace', lastName: 'Hopper', phone: '+15559990000' });
    await createTestContact({ email: 'ada@example.com', firstName: 'Ada', lastName: 'Lovelace', phone: '+15551112222' });

    const byName = await request(app).get('/api/v1/contacts?q=Grace');
    expect(byName.body.data).toHaveLength(1);
    expect(byName.body.data[0].lastName).toBe('Hopper');

    const byEmail = await request(app).get('/api/v1/contacts?q=ada@example.com');
    expect(byEmail.body.data).toHaveLength(1);

    const byPhone = await request(app).get('/api/v1/contacts?q=5559990000');
    expect(byPhone.body.data).toHaveLength(1);
    expect(byPhone.body.data[0].firstName).toBe('Grace');
  });

  it('filters by company', async () => {
    await createTestContact({ email: 'a@example.com', company: 'Acme Corp' });
    await createTestContact({ email: 'b@example.com', company: 'Globex Inc' });

    const res = await request(app).get('/api/v1/contacts?company=Acme');
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].company).toBe('Acme Corp');
  });

  it('filters by tags', async () => {
    const tag = createTag('VIP');
    const tagged = createTestContact({ email: 'a@example.com' });
    createTestContact({ email: 'b@example.com' });
    linkContactTag(tagged.id, tag.id);

    const res = await request(app).get('/api/v1/contacts?tags=VIP');
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].id).toBe(tagged.id);
  });

  it('sorts by name', async () => {
    await createTestContact({ email: 'a@example.com', firstName: 'Zed', lastName: 'Zephyr' });
    await createTestContact({ email: 'b@example.com', firstName: 'Ada', lastName: 'Albright' });

    const res = await request(app).get('/api/v1/contacts?sortBy=name&sortDir=asc');
    expect(res.body.data.map((c: { lastName: string }) => c.lastName)).toEqual(['Albright', 'Zephyr']);
  });

  it('paginates', async () => {
    for (let i = 0; i < 5; i++) {
      await createTestContact({ email: `c${i}@example.com`, firstName: `Person${i}` });
    }

    const res = await request(app).get('/api/v1/contacts?page=2&pageSize=2');
    expect(res.body.data).toHaveLength(2);
    expect(res.body.page).toBe(2);
    expect(res.body.totalPages).toBe(3);
  });
});

describe('GET /api/v1/contacts/:id', () => {
  beforeEach(resetDb);

  it('404s for an unknown id', async () => {
    const res = await request(app).get('/api/v1/contacts/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('returns a single contact with its tags', async () => {
    const tag = createTag('Lead');
    const contact = createTestContact({ email: 'a@example.com' });
    linkContactTag(contact.id, tag.id);

    const res = await request(app).get(`/api/v1/contacts/${contact.id}`);
    expect(res.status).toBe(200);
    expect(res.body.tags).toEqual([{ id: tag.id, name: 'Lead' }]);
  });
});

describe('PATCH /api/v1/contacts/:id', () => {
  beforeEach(resetDb);

  it('updates a contact and increments its version', async () => {
    const contact = await createTestContact({ email: 'a@example.com' });

    const res = await request(app)
      .patch(`/api/v1/contacts/${contact.id}`)
      .send({ firstName: 'Augusta', lastName: contact.lastName, email: contact.email, phone: contact.phone, company: contact.company, version: contact.version });

    expect(res.status).toBe(200);
    expect(res.body.firstName).toBe('Augusta');
    expect(res.body.version).toBe(contact.version + 1);

    const activity = getActivityForContact(contact.id);
    expect(activity).toHaveLength(1);
    expect(activity[0].type).toBe('CONTACT_UPDATED');
    expect(JSON.parse(activity[0].metadata ?? '{}').changedFields).toContain('firstName');
  });

  it('rejects an update that would duplicate another contact\'s email', async () => {
    await createTestContact({ email: 'taken@example.com' });
    const contact = await createTestContact({ email: 'free@example.com', firstName: 'Second' });

    const res = await request(app)
      .patch(`/api/v1/contacts/${contact.id}`)
      .send({ firstName: contact.firstName, lastName: contact.lastName, email: 'taken@example.com', phone: contact.phone, company: contact.company, version: contact.version });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('EMAIL_TAKEN');
  });

  it('rejects a payload missing required fields', async () => {
    const contact = await createTestContact({ email: 'a@example.com' });

    const res = await request(app)
      .patch(`/api/v1/contacts/${contact.id}`)
      .send({ firstName: '', lastName: contact.lastName, version: contact.version });

    expect(res.status).toBe(400);
  });
});
