/**
 * Ported from ai-media-cpcm-frontend-ui/services/api.service.js. Callback-based
 * on purpose (successHandler/errorHandler, not a Promise) to match that
 * repo's "core pattern" — see PROJECT_IMPLEMENTATION_PLAN.md Assumption 7.
 *
 * Watch the argument order: getRequest has no body parameter. A non-OK
 * response throws `{ status, errorPromise }`, where `errorPromise` is the
 * unresolved `response.json()` of the error body (this backend's error
 * shape is `{ error: { code, message, details } }`).
 */
import type { ApiErrorShape } from '@/types';

export type ApiSuccessHandler<T = unknown> = (result: T) => void;
export type ApiErrorHandler = (error: ApiErrorShape) => void;

function processRequest<T>(
  url: string,
  requestOptions: RequestInit,
  successHandler: ApiSuccessHandler<T>,
  errorHandler: ApiErrorHandler
): void {
  fetch(url, requestOptions)
    .then((response) => {
      if (!response.ok) {
        throw { status: response.status, errorPromise: response.json() };
      }
      if (response.status === 204) return null;
      return response.json();
    })
    .then((result) => successHandler(result as T))
    .catch((error) => errorHandler(error as ApiErrorShape));
}

class APIService {
  getRequest<T = unknown>(
    url: string,
    headers: HeadersInit | undefined,
    successHandler: ApiSuccessHandler<T>,
    errorHandler: ApiErrorHandler,
    otherRequestOptions: RequestInit = {}
  ): void {
    processRequest(url, { method: 'GET', headers, ...otherRequestOptions }, successHandler, errorHandler);
  }

  postRequest<T = unknown>(
    url: string,
    headers: HeadersInit | undefined,
    body: BodyInit | null | undefined,
    successHandler: ApiSuccessHandler<T>,
    errorHandler: ApiErrorHandler,
    otherRequestOptions: RequestInit = {}
  ): void {
    processRequest(
      url,
      { method: 'POST', headers, body, ...otherRequestOptions },
      successHandler,
      errorHandler
    );
  }

  patchRequest<T = unknown>(
    url: string,
    headers: HeadersInit | undefined,
    body: BodyInit | null | undefined,
    successHandler: ApiSuccessHandler<T>,
    errorHandler: ApiErrorHandler,
    otherRequestOptions: RequestInit = {}
  ): void {
    processRequest(
      url,
      { method: 'PATCH', headers, body, ...otherRequestOptions },
      successHandler,
      errorHandler
    );
  }

  deleteRequest<T = unknown>(
    url: string,
    headers: HeadersInit | undefined,
    body: BodyInit | null | undefined,
    successHandler: ApiSuccessHandler<T>,
    errorHandler: ApiErrorHandler,
    otherRequestOptions: RequestInit = {}
  ): void {
    const requestOptions: RequestInit = { method: 'DELETE', headers, ...otherRequestOptions };
    if (body) requestOptions.body = body;
    processRequest(url, requestOptions, successHandler, errorHandler);
  }
}

export const apiService = new APIService();
export const JSON_HEADERS: HeadersInit = { 'Content-Type': 'application/json' };
