export const API_BASE_PATH: string =
  process.env.NEXT_PUBLIC_API_BASE_PATH || 'http://localhost:4000/api/v1';

export const CONTACTS_URLS = {
  list: '/contacts',
  detail: '/contacts',
  update: '/contacts',
  activity: '/contacts',
  add_tag: '/contacts',
  remove_tag: '/contacts',
  bulk_tags: '/contacts/bulk/tags',
} as const;

export const TAGS_URLS = {
  list: '/tags',
} as const;
