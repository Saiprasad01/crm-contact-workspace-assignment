import { useCallback, useState } from 'react';
import { buildContactUpdatePayload, normalizeContact } from '@/models/contact';
import { contactsService } from '@/services/contacts.service';
import type { ApiErrorShape, Contact, ContactFormValues, RawContact } from '@/types';

interface SaveHandlers {
  onSuccess?: (updated: Contact) => void;
  onConflict?: (draft: ContactFormValues, latest: Contact) => void;
}

/**
 * Saves a contact edit and routes the two failure shapes that matter:
 * 409 VERSION_CONFLICT (someone else saved first — hand back their latest
 * copy so the caller can open the conflict modal) and 409 EMAIL_TAKEN /
 * 400 validation (surfaced as a plain server error message).
 */
export function useUpdateContact(contactId: string | undefined) {
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const save = useCallback(
    (formValues: ContactFormValues, version: number, { onSuccess, onConflict }: SaveHandlers = {}) => {
      if (!contactId) return;
      setSaving(true);
      setServerError(null);
      const payload = buildContactUpdatePayload(formValues, version);

      contactsService.update(contactId, payload, {
        onSuccess: (result) => {
          setSaving(false);
          onSuccess?.(normalizeContact(result));
        },
        onError: (err: ApiErrorShape) => {
          setSaving(false);
          if ('status' in err && (err.status === 409 || err.status === 400) && err.errorPromise) {
            err.errorPromise.then((body) => {
              const code = body?.error?.code;
              if (code === 'VERSION_CONFLICT') {
                const details = body.error.details as { latest?: RawContact } | undefined;
                const latestRaw = details?.latest;
                if (latestRaw) onConflict?.(formValues, normalizeContact(latestRaw));
              } else {
                setServerError(body?.error?.message || 'Could not save changes.');
              }
            });
          } else {
            setServerError('Could not save changes. Please try again.');
          }
        },
      });
    },
    [contactId]
  );

  return { save, saving, serverError, setServerError };
}
