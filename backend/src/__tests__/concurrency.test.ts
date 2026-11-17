import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../app';
import { createTestContact, resetDb } from './testUtils';

const app = createApp();

describe('Concurrent updates (optimistic concurrency)', () => {
  beforeEach(resetDb);

  it('detects a stale update after another user already saved', async () => {
    const contact = await createTestContact({ email: 'a@example.com' });

    // User B loads the contact, then saves an edit.
    const userBUpdate = await request(app)
      .patch(`/api/v1/contacts/${contact.id}`)
      .send({
        firstName: contact.firstName,
        lastName: 'Hopper',
        email: contact.email,
        phone: contact.phone,
        company: contact.company,
        version: contact.version,
      });
    expect(userBUpdate.status).toBe(200);
    expect(userBUpdate.body.version).toBe(contact.version + 1);

    // User A loaded the contact at the same time as User B, and submits with
    // the version they originally fetched — now stale.
    const userAUpdate = await request(app)
      .patch(`/api/v1/contacts/${contact.id}`)
      .send({
        firstName: 'Augusta',
        lastName: contact.lastName,
        email: contact.email,
        phone: contact.phone,
        company: contact.company,
        version: contact.version,
      });

    expect(userAUpdate.status).toBe(409);
    expect(userAUpdate.body.error.code).toBe('VERSION_CONFLICT');
    // The server hands back the latest row so the client can render a diff.
    expect(userAUpdate.body.error.details.latest.lastName).toBe('Hopper');
    expect(userAUpdate.body.error.details.latest.version).toBe(contact.version + 1);
  });

  it('allows the second writer through once they resubmit with the refreshed version', async () => {
    const contact = await createTestContact({ email: 'a@example.com' });

    await request(app)
      .patch(`/api/v1/contacts/${contact.id}`)
      .send({ firstName: 'First Edit', lastName: contact.lastName, email: contact.email, phone: contact.phone, company: contact.company, version: contact.version });

    const retry = await request(app)
      .patch(`/api/v1/contacts/${contact.id}`)
      .send({ firstName: 'Second Edit', lastName: contact.lastName, email: contact.email, phone: contact.phone, company: contact.company, version: contact.version + 1 });

    expect(retry.status).toBe(200);
    expect(retry.body.firstName).toBe('Second Edit');
    expect(retry.body.version).toBe(contact.version + 2);
  });
});
