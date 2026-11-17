import { contactsService } from '@/services/contacts.service';
import type { ApiHttpError } from '@/types';
import { afterEach, describe, expect, it, vi } from 'vitest';

describe('contactsService.list', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('builds the request URL from the given params and calls onSuccess with the parsed body', async () => {
    const payload = { data: [], page: 1, pageSize: 20, total: 0, totalPages: 1 };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => payload,
    }) as unknown as typeof fetch;

    const onSuccess = vi.fn();
    const onError = vi.fn();
    const params = new URLSearchParams({ q: 'ada', page: '1' });

    contactsService.list(params, { onSuccess, onError });
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/contacts?q=ada&page=1'),
      expect.objectContaining({ method: 'GET' })
    );
    expect(onSuccess).toHaveBeenCalledWith(payload);
    expect(onError).not.toHaveBeenCalled();
  });

  it('calls onError with the status and an errorPromise on a non-OK response', async () => {
    const errorBody = { error: { code: 'NOT_FOUND', message: 'Contact not found' } };
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => errorBody,
    }) as unknown as typeof fetch;

    const onSuccess = vi.fn();
    const onError = vi.fn();

    contactsService.getById('missing-id', { onSuccess, onError });
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(onSuccess).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledTimes(1);
    const err = onError.mock.calls[0][0] as ApiHttpError;
    expect(err.status).toBe(404);
    await expect(err.errorPromise).resolves.toEqual(errorBody);
  });
});
