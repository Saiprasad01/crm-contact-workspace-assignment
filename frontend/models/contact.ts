import { CONTACT_FIELD_LABELS } from '@/constants/activity.constants';
import type { Contact, ContactDiffRow, ContactFormValues, RawContact } from '@/types';
import { format } from 'date-fns';

/**
 * API response normalizer. Feature logic (diffing, payload building) lives
 * here, not in components — same convention as
 * ai-media-cpcm-frontend-ui/models/*.
 */
export function normalizeContact(raw: RawContact): Contact;
export function normalizeContact(raw: null | undefined): null;
export function normalizeContact(raw: RawContact | null | undefined): Contact | null {
  if (!raw) return null;
  return {
    id: raw.id,
    firstName: raw.firstName || '',
    lastName: raw.lastName || '',
    email: raw.email || '',
    phone: raw.phone || '',
    company: raw.company || '',
    version: raw.version,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    tags: Array.isArray(raw.tags) ? raw.tags : [],
  };
}

export function formatContactDate(value: string | null | undefined): string {
  if (!value) return '';
  try {
    return format(new Date(value), 'd MMM yyyy, HH:mm');
  } catch {
    return '';
  }
}

export const EDITABLE_CONTACT_FIELDS: Array<keyof ContactFormValues> = [
  'firstName',
  'lastName',
  'email',
  'phone',
  'company',
];

/**
 * Builds the PATCH body from the form's current values plus the version the
 * form was loaded with, so the server can detect a stale submit.
 */
export function buildContactUpdatePayload(formValues: ContactFormValues, version: number) {
  return {
    firstName: (formValues.firstName || '').trim(),
    lastName: (formValues.lastName || '').trim(),
    email: (formValues.email || '').trim() || null,
    phone: (formValues.phone || '').trim() || null,
    company: (formValues.company || '').trim() || null,
    version,
  };
}

/**
 * Field-level diff between the user's unsaved draft and the latest server
 * copy, driving the conflict modal. Only fields that actually differ are
 * returned.
 */
export function diffContactFields(
  draft: ContactFormValues,
  latest: ContactFormValues
): ContactDiffRow[] {
  return EDITABLE_CONTACT_FIELDS.filter(
    (field) => (draft[field] || '') !== (latest[field] || '')
  ).map((field) => ({
    field,
    label: CONTACT_FIELD_LABELS[field] || field,
    draftValue: draft[field] || '—',
    latestValue: latest[field] || '—',
  }));
}
