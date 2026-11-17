import { useCallback, useEffect, useRef, useState } from 'react';
import { activityService } from '@/services/activity.service';
import type { RawActivityItem } from '@/types';

export function useActivity(contactId: string | undefined) {
  const [items, setItems] = useState<RawActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const load = useCallback(() => {
    if (!contactId) return;
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    activityService.list(contactId, {
      onSuccess: (result) => {
        if (requestId !== requestIdRef.current) return;
        setItems(result.data || []);
        setLoading(false);
      },
      onError: () => {
        if (requestId !== requestIdRef.current) return;
        setError('Could not load activity.');
        setLoading(false);
      },
    });
  }, [contactId]);

  useEffect(() => {
    load();
  }, [load]);

  return { items, loading, error, reload: load };
}
