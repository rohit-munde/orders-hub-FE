# Shared HTTP Service Design

## Goal

Centralize backend response handling in a small reusable `fetch`-based HTTP service. Feature services should describe endpoints and domain payloads without duplicating URL construction, JSON parsing, authorization headers, network-error mapping, or backend-envelope handling.

## Backend Contracts

Successful responses use this envelope:

```text
ApiSuccessResponse<T> {
  success: boolean
  message: string
  payload: T
}
```

Failed responses use this envelope:

```text
ApiErrorResponse {
  timeStamp: string
  status: number
  error: string
  message: string
  path: string
  validationErrors: Record<string, string> | null
}
```

`timeStamp` is represented as a string because JSON transports the backend `LocalDateTime` value as text. `validationErrors` is nullable because non-validation failures may omit it or return `null`.

## Architecture

Add a shared API module containing:

- `ApiSuccessResponse<T>` and `ApiErrorResponse` transport types;
- one shared `ApiError` class for HTTP, network, malformed-response, and empty-response failures;
- a functional `httpService` exposing the HTTP methods currently needed by the app.

The service uses the existing `appConfig.apiBaseUrl` and the platform's `fetch` implementation. Axios, request/response interceptor classes, dependency injection, retries, refresh-token flows, and global state are outside this change.

Feature services remain responsible for endpoint paths, request payload types, response payload types, and domain-specific payload validation. They do not call `fetch` or parse transport envelopes.

## Request Flow

Each shared request accepts a relative path plus optional request data and bearer token.

1. Prefix the relative path with `appConfig.apiBaseUrl`.
2. Add `Accept: application/json`.
3. Add `Content-Type: application/json` and serialize the body when request data is present.
4. Add `Authorization: Bearer <token>` only when the caller supplies a token.
5. Execute `fetch` with the requested HTTP method.

Tokens remain explicit feature-service arguments. The shared service will not read Keychain, which keeps transport code independent of authentication storage and makes public endpoints unambiguous.

## Response Flow

For a successful HTTP response, the shared service parses `ApiSuccessResponse<T>`, validates that it is a success envelope, and returns only `payload`. Screens, hooks, and feature services therefore work with domain values rather than transport wrappers.

An HTTP response is considered malformed when it is successful but has no JSON body, does not declare `success: true`, or does not contain a `payload` property. The shared service throws `ApiError` for these cases rather than returning an unsafe cast.

The success-envelope `message` is not returned to callers because current consumers do not use it. It remains part of the transport type so the contract matches the backend and can be exposed later if a concrete requirement appears.

## Error Handling

For a non-successful HTTP response, the shared service parses `ApiErrorResponse` and throws `ApiError`. The error exposes:

- `status`, using the response status if the body does not contain a valid status;
- `error`;
- `message`;
- `path`;
- `timeStamp`;
- `validationErrors`.

If an error body is absent or malformed, the service still throws `ApiError` with the HTTP status and a safe fallback message. It never includes bearer tokens or request bodies in error messages.

Network failures become `ApiError` instances with a `null` status and a retryable connection message. Malformed successful responses also use a `null` status because they do not represent an HTTP failure status.

Feature hooks may translate known statuses into user-facing copy. They identify all API failures through the shared `ApiError`; feature-specific error subclasses are removed.

## Feature Migration

`authenticateWithGoogle` will call the shared POST helper without a bearer token and return the unwrapped `AuthSession` payload. Its existing minimal domain validation remains in the auth feature.

`syncOrders` will call the shared POST helper with the bearer token and return the unwrapped `OrdersSyncResponse` payload.

`getOrders` will call the shared GET helper with the bearer token and return the unwrapped orders payload. Its domain validation checks the nested orders collection before returning it.

`useOrders` will consume the unwrapped orders payload directly and replace `OrdersApiError` checks with `ApiError` checks. Existing session-expiry and status-specific presentation behavior remains unchanged.

Localized `fetch` calls, local error-response types, envelope parsing, and `OrdersApiError` will be removed after migration.

## Testing

Tests will be changed test-first and cover:

- successful envelopes are unwrapped to their payload;
- optional JSON bodies and bearer headers are constructed correctly;
- public requests omit authorization;
- backend error envelopes become metadata-preserving `ApiError` instances;
- malformed or absent error bodies receive safe fallbacks;
- network failures become status-less `ApiError` instances;
- malformed successful envelopes are rejected;
- auth and orders services use the shared behavior and return domain payloads;
- existing `401`, `409`, and `502` hook behavior continues using `ApiError`.

## Non-goals

Axios, interceptor classes, automatic Keychain access, token refresh, automatic retry, cancellation, request logging, caching, runtime schema libraries, and changes to backend contracts are not included.
