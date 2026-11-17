import type { ActivityType, ContactFormValues } from '@/types';

export const ACTIVITY_LABELS: Record<ActivityType, string> = {
  CONTACT_UPDATED: 'Contact updated',
  TAG_ADDED: 'Tag added',
  TAG_REMOVED: 'Tag removed',
};

export const CONTACT_FIELD_LABELS: Record<keyof ContactFormValues, string> = {
  firstName: 'First name',
  lastName: 'Last name',
  email: 'Email',
  phone: 'Phone',
  company: 'Company',
};
