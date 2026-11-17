import { useCallback, useEffect, useRef, useState } from 'react';
import { normalizeContact } from '@/models/contact';
import { contactsService } from '@/services/contacts.service';
import type { ApiErrorShape, Contact } from '@/types';

export function useContact(id: string | undefined) {
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<'not-found' | 'error' | null>(null);
  const requestIdRef = useRef(0);

  const load = useCallback((): (() => void) | undefined => {
    if (!id) return undefined;
    const controller = new AbortController();
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);

    contactsService.getById(id, {
      signal: controller.signal,
      onSuccess: (result) => {
        if (requestId !== requestIdRef.current) return;
        setContact(normalizeContact(result));
        setLoading(false);
      },
      onError: (err: ApiErrorShape) => {
        if (requestId !== requestIdRef.current) return;
        if ('name' in err && err.name === 'AbortError') return;
        setError('status' in err && err.status === 404 ? 'not-found' : 'error');
        setLoading(false);
      },
    });

    return () => controller.abort();
  }, [id]);

  useEffect(() => {
    const cleanup = load();
    return cleanup;
  }, [load]);

  return { contact, loading, error, setContact, reload: load };
}
