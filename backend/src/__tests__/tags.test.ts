import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../app';
import {
  createTag,
  createTestContact,
  findTagByName,
  getActivityForContact,
  getContactTagLinksByContact,
  getContactTagLinksByTag,
  linkContactTag,
  resetDb,
} from './testUtils';

const app = createApp();

describe('Tag management', () => {
  beforeEach(resetDb);

  it('adds a tag, creating it if it does not exist yet', async () => {
    const contact = createTestContact({ email: 'a@example.com' });

    const res = await request(app).post(`/api/v1/contacts/${contact.id}/tags`).send({ tagName: 'VIP' });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('VIP');

    const activity = getActivityForContact(contact.id);
    expect(activity).toHaveLength(1);
    expect(activity[0].type).toBe('TAG_ADDED');
  });

  it('is idempotent when adding a tag that is already assigned', async () => {
    const contact = createTestContact({ email: 'a@example.com' });

    await request(app).post(`/api/v1/contacts/${contact.id}/tags`).send({ tagName: 'VIP' });
    await request(app).post(`/api/v1/contacts/${contact.id}/tags`).send({ tagName: 'VIP' });

    const links = getContactTagLinksByContact(contact.id);
    expect(links).toHaveLength(1);

    const activity = getActivityForContact(contact.id);
    expect(activity).toHaveLength(1);
  });

  it('removes a tag and logs TAG_REMOVED', async () => {
    const contact = createTestContact({ email: 'a@example.com' });
    const tag = createTag('Prospect');
    linkContactTag(contact.id, tag.id);

    const res = await request(app).delete(`/api/v1/contacts/${contact.id}/tags/${tag.id}`);
    expect(res.status).toBe(204);

    const links = getContactTagLinksByContact(contact.id);
    expect(links).toHaveLength(0);

    const activity = getActivityForContact(contact.id).filter((a) => a.type === 'TAG_REMOVED');
    expect(activity).toHaveLength(1);
  });

  it('bulk-assigns a tag to multiple contacts, skipping ones that already have it', async () => {
    const c1 = createTestContact({ email: 'a@example.com' });
    const c2 = createTestContact({ email: 'b@example.com' });
    const tag = createTag('Customer');
    linkContactTag(c1.id, tag.id);

    const res = await request(app)
      .post('/api/v1/contacts/bulk/tags')
      .send({ contactIds: [c1.id, c2.id], tagName: 'Customer' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ updated: 1, skipped: 1 });

    const links = getContactTagLinksByTag(tag.id);
    expect(links).toHaveLength(2);
  });
});

describe('GET /api/v1/contacts/:id/activity', () => {
  beforeEach(resetDb);

  it('returns activity newest-first', async () => {
    const contact = createTestContact({ email: 'a@example.com' });
    await request(app).post(`/api/v1/contacts/${contact.id}/tags`).send({ tagName: 'Lead' });
    const tag = findTagByName('Lead')!;
    await request(app).delete(`/api/v1/contacts/${contact.id}/tags/${tag.id}`);

    const res = await request(app).get(`/api/v1/contacts/${contact.id}/activity`);
    expect(res.status).toBe(200);
    expect(res.body.data.map((a: { type: string }) => a.type)).toEqual(['TAG_REMOVED', 'TAG_ADDED']);
  });
});
