import { API_BASE_PATH, CONTACTS_URLS } from '@/constants/url.constants';
import type { ActivityListResponse } from '@/types';
import type { ApiErrorHandler, ApiSuccessHandler } from './api.service';
import { apiService } from './api.service';

interface ActivityHandlers {
  limit?: number;
  onSuccess: ApiSuccessHandler<ActivityListResponse>;
  onError: ApiErrorHandler;
}

export const activityService = {
  list(contactId: string, { limit = 20, onSuccess, onError }: ActivityHandlers): void {
    const url = `${API_BASE_PATH}${CONTACTS_URLS.activity}/${contactId}/activity?limit=${limit}`;
    apiService.getRequest(url, undefined, onSuccess, onError);
  },
};
