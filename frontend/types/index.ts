/** Shared domain types. "Raw*" shapes are what the backend actually sends
 * (nullable fields); normalized shapes (used everywhere else in the UI) are
 * produced by `models/contact.ts`. */

export interface Tag {
  id: string;
  name: string;
}

export type ActivityType = 'CONTACT_UPDATED' | 'TAG_ADDED' | 'TAG_REMOVED';

export interface RawContact {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
  tags: Tag[];
}

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  tags: Tag[];
}

export interface RawActivityItem {
  id: string;
  contactId: string;
  type: ActivityType;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface ContactsListResponse {
  data: RawContact[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ContactsListResult {
  items: Contact[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ActivityListResponse {
  data: RawActivityItem[];
}

export interface TagsListResponse {
  data: Tag[];
}

export interface BulkTagResult {
  updated: number;
  skipped: number;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/** Thrown by `apiService` on a non-OK HTTP response. */
export interface ApiHttpError {
  status: number;
  errorPromise: Promise<ApiErrorBody>;
}

export type ApiErrorShape = ApiHttpError | (Error & { name: string });

export type SortBy = 'name' | 'createdAt';
export type SortDir = 'asc' | 'desc';

export interface ContactsQueryState {
  q: string;
  tags: string[];
  company: string;
  sortBy: SortBy;
  sortDir: SortDir;
  page: number;
  pageSize: number;
}

export interface ContactFormValues {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
}

export interface ContactDiffRow {
  field: keyof ContactFormValues;
  label: string;
  draftValue: string;
  latestValue: string;
}
