import { useCallback, useState } from 'react';
import { tagsService } from '@/services/tags.service';
import type { BulkTagResult, Tag } from '@/types';

export function useTagActions() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addTag = useCallback(
    (contactId: string, tagName: string, { onSuccess }: { onSuccess?: (tag: Tag) => void } = {}) => {
      setPending(true);
      setError(null);
      tagsService.addTag(contactId, tagName, {
        onSuccess: (tag) => {
          setPending(false);
          onSuccess?.(tag);
        },
        onError: () => {
          setPending(false);
          setError('Could not add the tag. Please try again.');
        },
      });
    },
    []
  );

  const removeTag = useCallback(
    (contactId: string, tagId: string, { onSuccess }: { onSuccess?: () => void } = {}) => {
      setPending(true);
      setError(null);
      tagsService.removeTag(contactId, tagId, {
        onSuccess: () => {
          setPending(false);
          onSuccess?.();
        },
        onError: () => {
          setPending(false);
          setError('Could not remove the tag. Please try again.');
        },
      });
    },
    []
  );

  const bulkAssignTag = useCallback(
    (
      contactIds: string[],
      tagName: string,
      { onSuccess }: { onSuccess?: (result: BulkTagResult) => void } = {}
    ) => {
      setPending(true);
      setError(null);
      tagsService.bulkAssignTag(contactIds, tagName, {
        onSuccess: (result) => {
          setPending(false);
          onSuccess?.(result);
        },
        onError: () => {
          setPending(false);
          setError('Could not assign the tag. Please try again.');
        },
      });
    },
    []
  );

  return { addTag, removeTag, bulkAssignTag, pending, error, setError };
}
