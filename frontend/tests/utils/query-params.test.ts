import {
  buildContactsApiParams,
  buildContactsQuery,
  CONTACTS_QUERY_DEFAULTS,
  parseContactsQuery,
} from '@/utils/query-params';
import { describe, expect, it } from 'vitest';

describe('parseContactsQuery', () => {
  it('fills in defaults for an empty query', () => {
    expect(parseContactsQuery({})).toEqual(CONTACTS_QUERY_DEFAULTS);
  });

  it('parses tags from a csv string', () => {
    expect(parseContactsQuery({ tags: 'VIP, Lead' }).tags).toEqual(['VIP', 'Lead']);
  });

  it('falls back to defaults for an invalid sort/page', () => {
    const result = parseContactsQuery({
      sortBy: 'bogus',
      sortDir: 'bogus',
      page: '-1',
      pageSize: 'nan',
    });
    expect(result.sortBy).toBe('createdAt');
    expect(result.sortDir).toBe('desc');
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(20);
  });
});

describe('buildContactsQuery', () => {
  it('omits values equal to their default', () => {
    expect(buildContactsQuery(CONTACTS_QUERY_DEFAULTS)).toEqual({});
  });

  it('includes non-default values', () => {
    const query = buildContactsQuery({ ...CONTACTS_QUERY_DEFAULTS, q: 'ada', tags: ['VIP'], page: 2 });
    expect(query).toEqual({ q: 'ada', tags: 'VIP', page: '2' });
  });
});

describe('buildContactsApiParams', () => {
  it('always sets sort/page/pageSize even at defaults', () => {
    const params = buildContactsApiParams(CONTACTS_QUERY_DEFAULTS);
    expect(params.get('sortBy')).toBe('createdAt');
    expect(params.get('page')).toBe('1');
    expect(params.has('q')).toBe(false);
  });

  it('round-trips a full filter state', () => {
    const state = {
      q: 'ada',
      tags: ['VIP', 'Lead'],
      company: 'Acme',
      sortBy: 'name' as const,
      sortDir: 'asc' as const,
      page: 3,
      pageSize: 50,
    };
    const params = buildContactsApiParams(state);
    expect(params.get('q')).toBe('ada');
    expect(params.get('tags')).toBe('VIP,Lead');
    expect(params.get('company')).toBe('Acme');
    expect(params.get('sortBy')).toBe('name');
    expect(params.get('sortDir')).toBe('asc');
    expect(params.get('page')).toBe('3');
    expect(params.get('pageSize')).toBe('50');
  });
});
