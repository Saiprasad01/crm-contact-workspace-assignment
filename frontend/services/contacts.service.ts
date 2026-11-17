import { API_BASE_PATH, CONTACTS_URLS } from '@/constants/url.constants';
import type { ContactsListResponse, RawContact } from '@/types';
import type { ApiErrorHandler, ApiSuccessHandler } from './api.service';
import { apiService, JSON_HEADERS } from './api.service';

interface ListHandlers {
  signal?: AbortSignal;
  onSuccess: ApiSuccessHandler<ContactsListResponse>;
  onError: ApiErrorHandler;
}

interface GetByIdHandlers {
  signal?: AbortSignal;
  onSuccess: ApiSuccessHandler<RawContact>;
  onError: ApiErrorHandler;
}

interface UpdateHandlers {
  onSuccess: ApiSuccessHandler<RawContact>;
  onError: ApiErrorHandler;
}

export interface ContactUpdatePayload {
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  version: number;
}

export const contactsService = {
  list(params: URLSearchParams, { signal, onSuccess, onError }: ListHandlers): void {
    const url = `${API_BASE_PATH}${CONTACTS_URLS.list}?${params.toString()}`;
    apiService.getRequest(url, undefined, onSuccess, onError, { signal });
  },

  getById(id: string, { signal, onSuccess, onError }: GetByIdHandlers): void {
    const url = `${API_BASE_PATH}${CONTACTS_URLS.detail}/${id}`;
    apiService.getRequest(url, undefined, onSuccess, onError, { signal });
  },

  update(id: string, payload: ContactUpdatePayload, { onSuccess, onError }: UpdateHandlers): void {
    const url = `${API_BASE_PATH}${CONTACTS_URLS.update}/${id}`;
    apiService.patchRequest(url, JSON_HEADERS, JSON.stringify(payload), onSuccess, onError);
  },
};
