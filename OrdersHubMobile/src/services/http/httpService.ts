import { appConfig } from '../../config/appConfig';
import { ApiError } from './ApiError';
import { ApiSuccessResponse } from './apiTypes';

export type HttpRequestOptions = {
  token?: string;
  body?: unknown;
};

async function request<T>(
  method: 'GET' | 'POST',
  path: string,
  options: HttpRequestOptions = {},
): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (options.token) headers.Authorization = `Bearer ${options.token}`;
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';

  const response = await fetch(`${appConfig.apiBaseUrl}${path}`, {
    method,
    headers,
    ...(options.body !== undefined
      ? { body: JSON.stringify(options.body) }
      : {}),
  });
  const body = (await response.json()) as ApiSuccessResponse<T>;

  if (!response.ok) {
    throw new ApiError(`Request failed (${response.status}).`, {
      status: response.status,
    });
  }
  return body.payload;
}

export const httpService = {
  get: <T>(path: string, options?: HttpRequestOptions) =>
    request<T>('GET', path, options),
  post: <T>(path: string, options?: HttpRequestOptions) =>
    request<T>('POST', path, options),
};
