/**
 * URL <-> filter-state translation for the contacts list. Keeping this pure
 * and dependency-free means the list page's search/filter/sort/pagination
 * state lives entirely in `router.query` (shareable/restorable URLs) while
 * staying unit-testable without touching Next's router or the DOM.
 */
import type { ContactsQueryState, SortBy, SortDir } from '@/types';

export const CONTACTS_QUERY_DEFAULTS: ContactsQueryState = {
  q: '',
  tags: [],
  company: '',
  sortBy: 'createdAt',
  sortDir: 'desc',
  page: 1,
  pageSize: 20,
};

type RouterQueryValue = string | string[] | undefined;
export type RouterQuery = Record<string, RouterQueryValue>;

function firstValue(value: RouterQueryValue): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function parseContactsQuery(query: RouterQuery = {}): ContactsQueryState {
  const q = firstValue(query.q) ?? CONTACTS_QUERY_DEFAULTS.q;
  const company = firstValue(query.company) ?? CONTACTS_QUERY_DEFAULTS.company;

  const tagsRaw = firstValue(query.tags);
  const tags = tagsRaw
    ? tagsRaw
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
    : CONTACTS_QUERY_DEFAULTS.tags;

  const sortByRaw = firstValue(query.sortBy);
  const sortBy: SortBy = sortByRaw === 'name' ? 'name' : CONTACTS_QUERY_DEFAULTS.sortBy;

  const sortDirRaw = firstValue(query.sortDir);
  const sortDir: SortDir = sortDirRaw === 'asc' ? 'asc' : CONTACTS_QUERY_DEFAULTS.sortDir;

  const pageRaw = Number(firstValue(query.page));
  const page = Number.isInteger(pageRaw) && pageRaw > 0 ? pageRaw : CONTACTS_QUERY_DEFAULTS.page;

  const pageSizeRaw = Number(firstValue(query.pageSize));
  const pageSize =
    Number.isInteger(pageSizeRaw) && pageSizeRaw > 0
      ? pageSizeRaw
      : CONTACTS_QUERY_DEFAULTS.pageSize;

  return { q, tags, company, sortBy, sortDir, page, pageSize };
}

/**
 * Filter state -> a query object for `router.push({ query })`. Omits values
 * equal to their default so the URL stays clean for the common case.
 */
export function buildContactsQuery(state: ContactsQueryState): Record<string, string> {
  const query: Record<string, string> = {};
  if (state.q) query.q = state.q;
  if (state.tags.length > 0) query.tags = state.tags.join(',');
  if (state.company) query.company = state.company;
  if (state.sortBy !== CONTACTS_QUERY_DEFAULTS.sortBy) query.sortBy = state.sortBy;
  if (state.sortDir !== CONTACTS_QUERY_DEFAULTS.sortDir) query.sortDir = state.sortDir;
  if (state.page !== CONTACTS_QUERY_DEFAULTS.page) query.page = String(state.page);
  if (state.pageSize !== CONTACTS_QUERY_DEFAULTS.pageSize) query.pageSize = String(state.pageSize);
  return query;
}

/**
 * Filter state -> the query string the backend's `GET /contacts` expects.
 */
export function buildContactsApiParams(state: ContactsQueryState): URLSearchParams {
  const params = new URLSearchParams();
  if (state.q) params.set('q', state.q);
  if (state.tags.length > 0) params.set('tags', state.tags.join(','));
  if (state.company) params.set('company', state.company);
  params.set('sortBy', state.sortBy || CONTACTS_QUERY_DEFAULTS.sortBy);
  params.set('sortDir', state.sortDir || CONTACTS_QUERY_DEFAULTS.sortDir);
  params.set('page', String(state.page || CONTACTS_QUERY_DEFAULTS.page));
  params.set('pageSize', String(state.pageSize || CONTACTS_QUERY_DEFAULTS.pageSize));
  return params;
}
