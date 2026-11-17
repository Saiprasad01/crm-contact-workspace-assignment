import { API_BASE_PATH, CONTACTS_URLS, TAGS_URLS } from '@/constants/url.constants';
import type { BulkTagResult, Tag, TagsListResponse } from '@/types';
import type { ApiErrorHandler, ApiSuccessHandler } from './api.service';
import { apiService, JSON_HEADERS } from './api.service';

interface Handlers<T> {
  onSuccess: ApiSuccessHandler<T>;
  onError: ApiErrorHandler;
}

export const tagsService = {
  listAll({ onSuccess, onError }: Handlers<TagsListResponse>): void {
    apiService.getRequest(`${API_BASE_PATH}${TAGS_URLS.list}`, undefined, onSuccess, onError);
  },

  addTag(contactId: string, tagName: string, { onSuccess, onError }: Handlers<Tag>): void {
    const url = `${API_BASE_PATH}${CONTACTS_URLS.add_tag}/${contactId}/tags`;
    apiService.postRequest(url, JSON_HEADERS, JSON.stringify({ tagName }), onSuccess, onError);
  },

  removeTag(contactId: string, tagId: string, { onSuccess, onError }: Handlers<null>): void {
    const url = `${API_BASE_PATH}${CONTACTS_URLS.remove_tag}/${contactId}/tags/${tagId}`;
    apiService.deleteRequest(url, undefined, undefined, onSuccess, onError);
  },

  bulkAssignTag(
    contactIds: string[],
    tagName: string,
    { onSuccess, onError }: Handlers<BulkTagResult>
  ): void {
    const url = `${API_BASE_PATH}${CONTACTS_URLS.bulk_tags}`;
    apiService.postRequest(
      url,
      JSON_HEADERS,
      JSON.stringify({ contactIds, tagName }),
      onSuccess,
      onError
    );
  },
};
