import { appConfig } from '../../config/appConfig';
import { ApiError } from './ApiError';
import { ApiSuccessResponse } from './apiTypes';

export type HttpRequestOptions = {
  token?: string;
  body?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function stringValue(value: Record<string, unknown>, key: string): string | null {
  return typeof value[key] === 'string' ? value[key] : null;
}

function validationErrorsFor(value: unknown): Record<string, string> | null {
  if (
    !isRecord(value) ||
    Object.values(value).some(item => typeof item !== 'string')
  ) {
    return null;
  }
  return value as Record<string, string>;
}

function apiErrorFor(responseStatus: number, body: unknown): ApiError {
  if (!isRecord(body)) {
    return new ApiError(`Request failed (${responseStatus}).`, {
      status: responseStatus,
    });
  }

  const bodyStatus = body.status;
  const status =
    typeof bodyStatus === 'number' && Number.isFinite(bodyStatus)
      ? bodyStatus
      : responseStatus;

  return new ApiError(
    stringValue(body, 'message') ?? `Request failed (${responseStatus}).`,
    {
      status,
      error: stringValue(body, 'error'),
      path: stringValue(body, 'path'),
      timeStamp: stringValue(body, 'timeStamp'),
      validationErrors: validationErrorsFor(body.validationErrors),
    },
  );
}

function isSuccessEnvelope<T>(value: unknown): value is ApiSuccessResponse<T> {
  return (
    isRecord(value) &&
    value.success === true &&
    typeof value.message === 'string' &&
    Object.prototype.hasOwnProperty.call(value, 'payload')
  );
}

async function request<T>(
  method: 'GET' | 'POST',
  path: string,
  options: HttpRequestOptions = {},
): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (options.token) headers.Authorization = `Bearer ${options.token}`;
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';

  let response: Response;
  try {
    response = await fetch(`${appConfig.apiBaseUrl}${path}`, {
      method,
      headers,
      ...(options.body !== undefined
        ? { body: JSON.stringify(options.body) }
        : {}),
    });
  } catch {
    throw new ApiError(
      'Could not reach Orders Hub. Check your connection and try again.',
    );
  }

  const body = await response.json().catch(() => null);
  if (!response.ok) throw apiErrorFor(response.status, body);

  if (!isSuccessEnvelope<T>(body)) {
    throw new ApiError('The backend returned an invalid response.');
  }
  return body.payload;
}

export const httpService = {
  get: <T>(path: string, options?: HttpRequestOptions) =>
    request<T>('GET', path, options),
  post: <T>(path: string, options?: HttpRequestOptions) =>
    request<T>('POST', path, options),
};
