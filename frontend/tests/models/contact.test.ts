import { buildContactUpdatePayload, diffContactFields, normalizeContact } from '@/models/contact';
import type { RawContact } from '@/types';
import { describe, expect, it } from 'vitest';

describe('normalizeContact', () => {
  it('fills in defaults for missing fields', () => {
    const raw = { id: '1', firstName: 'Ada', lastName: 'Lovelace' } as unknown as RawContact;
    const result = normalizeContact(raw);
    expect(result).toEqual({
      id: '1',
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: '',
      phone: '',
      company: '',
      version: undefined,
      createdAt: undefined,
      updatedAt: undefined,
      tags: [],
    });
  });

  it('returns null for a falsy input', () => {
    expect(normalizeContact(null)).toBeNull();
  });
});

describe('buildContactUpdatePayload', () => {
  it('trims strings and nulls out empty optional fields', () => {
    const payload = buildContactUpdatePayload(
      { firstName: ' Ada ', lastName: ' Lovelace ', email: '', phone: '  ', company: '' },
      3
    );
    expect(payload).toEqual({
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: null,
      phone: null,
      company: null,
      version: 3,
    });
  });
});

describe('diffContactFields', () => {
  it('only reports fields that differ', () => {
    const draft = {
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'a@x.com',
      phone: '',
      company: '',
    };
    const latest = {
      firstName: 'Augusta',
      lastName: 'Lovelace',
      email: 'a@x.com',
      phone: '',
      company: '',
    };

    expect(diffContactFields(draft, latest)).toEqual([
      { field: 'firstName', label: 'First name', draftValue: 'Ada', latestValue: 'Augusta' },
    ]);
  });

  it('returns an empty array when nothing differs', () => {
    const contact = { firstName: 'Ada', lastName: 'Lovelace', email: '', phone: '', company: '' };
    expect(diffContactFields(contact, contact)).toEqual([]);
  });
});
