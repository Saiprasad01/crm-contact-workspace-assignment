import { useEffect, useMemo, useRef, useState } from 'react';
import { normalizeContact } from '@/models/contact';
import { contactsService } from '@/services/contacts.service';
import type { ApiErrorShape } from '@/types';
import type { ContactsListResult, ContactsQueryState } from '@/types';
import { buildContactsApiParams } from '@/utils/query-params';

/**
 * List + search/filter/sort/pagination. No data-fetching library (see
 * PROJECT_IMPLEMENTATION_PLAN.md Assumption 7) — stale responses are guarded
 * against by hand with an AbortController plus a request-id ref, so a
 * fast-then-slow pair of requests always resolves to the latest query.
 */
export function useContacts(queryState: ContactsQueryState) {
  const [data, setData] = useState<ContactsListResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const requestIdRef = useRef(0);

  // The caller (`pages/index.tsx`) memoizes `queryState` itself off
  // `router.query`'s identity, so depending on the object reference here is
  // safe and avoids a hand-maintained list of its fields.
  const paramsString = useMemo(() => buildContactsApiParams(queryState).toString(), [queryState]);

  useEffect(() => {
    const controller = new AbortController();
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);

    contactsService.list(new URLSearchParams(paramsString), {
      signal: controller.signal,
      onSuccess: (result) => {
        if (requestId !== requestIdRef.current) return; // a newer request already landed
        setData({
          items: result.data.map((raw) => normalizeContact(raw)),
          page: result.page,
          pageSize: result.pageSize,
          total: result.total,
          totalPages: result.totalPages,
        });
        setLoading(false);
      },
      onError: (err: ApiErrorShape) => {
        if (requestId !== requestIdRef.current) return;
        if ('name' in err && err.name === 'AbortError') return; // we cancelled it ourselves
        setError('Could not load contacts. Please try again.');
        setLoading(false);
      },
    });

    return () => controller.abort();
  }, [paramsString, reloadToken]);

  return {
    data,
    loading,
    error,
    refetch: () => setReloadToken((t) => t + 1),
  };
}
