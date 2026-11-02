# Orders Infinite Scroll and Gmail Sync Pagination Design

## Goal

Load stored orders ten at a time as the user scrolls, and prevent Gmail synchronization from silently ignoring candidate pages after the first Gmail response.

## Confirmed Root Causes

The backend `GET /api/v1/orders` endpoint already accepts Spring page parameters and returns application-owned pagination metadata. The mobile client currently sends no `page` or `size`, omits the metadata from its TypeScript model, replaces its whole order list on every response, and has no `FlatList.onEndReached` handler. It therefore renders only the backend's default first page.

Gmail synchronization currently makes one `users/me/messages` request with `maxResults`, maps only that response's message IDs, and discards Gmail's `nextPageToken`. The observed 21 candidates are the number returned on that first filtered response, not a database limit. Additional candidates are skipped whenever Gmail supplies another page token.

The order sync controller also returns a raw `OrderSyncResponse`, while the shared frontend transport requires successful endpoints to return `ApiSuccessResponse<T>`.

## Orders API Contract

The mobile client calls:

```text
GET /api/v1/orders?page=<zero-based page>&size=10
```

The successful payload remains:

```text
{
  lastSyncedAt: string | null,
  orders: {
    content: Order[],
    pagination: {
      page: number,
      size: number,
      totalElements: number,
      totalPages: number,
      hasNext: boolean,
      hasPrevious: boolean
    }
  }
}
```

The backend's fixed newest-first ordering and authenticated user isolation remain unchanged. The client always requests size `10`; changing the backend's global default size is unnecessary.

## Mobile Data Flow

`getOrders(appToken, page)` requests the given page with size 10 and returns the unwrapped `OrdersResponse`. It validates both `orders.content` and `orders.pagination` before returning.

`useOrders` owns three workflows:

1. Initial load runs a cooldown-aware sync, then requests page 0 and replaces the list.
2. Pull-to-refresh runs a forced sync, resets pagination, requests page 0, and replaces the list.
3. Infinite scroll requests only the next stored-orders page and appends it. It never starts another Gmail sync.

The hook exposes `loadMore`, `isLoadingMore`, and `hasNext` in addition to its existing state. It tracks the next page from backend metadata rather than inferring it from list length. A request guard prevents repeated `onEndReached` events from starting duplicate calls. Appended orders are deduplicated by ID while preserving the server's order.

A refresh or initial load has priority over load-more work. Stale page results must not append after a reset. The implementation may use an operation generation/ref to ignore stale responses, while retaining the current simple hook architecture.

## Mobile UI and Errors

`HomeScreen` connects `FlatList.onEndReached` to `loadMore` and uses a moderate threshold so the next page starts shortly before the final row. The footer shows an activity indicator during page loading.

An initial or refresh failure keeps the existing current behavior. A next-page failure keeps all displayed orders and shows a footer retry action that retries `loadMore` without forcing Gmail sync or clearing the list. A `401` from any page request follows the existing secure-session expiry flow.

When `hasNext` is false, further end-reached events are no-ops and no footer loader is shown.

## Gmail Candidate Pagination

The Gmail list-response model includes both `messages` and `nextPageToken`. `GmailApiClient.findMessageIds(accessToken, query, maxResults)` treats `maxResults` as an overall synchronization cap, not a single-request assumption.

The client repeatedly requests Gmail pages until one of these conditions is met:

- the configured overall cap is reached;
- Gmail returns no `nextPageToken`;
- Gmail returns an empty response;
- Gmail repeats a page token.

Each request asks only for the remaining number of IDs required by the cap and includes `pageToken` after the first request. IDs are deduplicated in Gmail response order. Tokens and query contents are never logged or included in thrown error messages.

The configured default and validated maximum batch size become 100. `GMAIL_SEARCH_BATCH_SIZE` may lower the runtime cap but cannot raise it above 100. The existing 45-day lookback and subject/sender filters remain unchanged.

If Gmail returns 21 matching IDs and no next token, synchronization correctly remains at 21; there is no evidence of more matching messages. The change guarantees that a supplied next token is followed until the bounded cap.

## Sync Response Contract

`POST /api/v1/orders/sync?force=<boolean>` returns:

```text
ApiSuccessResponse<OrderSyncResponse>
```

The payload fields and cooldown behavior remain unchanged. This aligns the endpoint with the already-shared mobile response handler and the backend's general success contract.

## Testing

Backend tests cover:

- the orders controller still forwards explicit `page` and `size`;
- sync responses use the success envelope;
- Gmail list pagination sends the first request without a page token and later requests with it;
- traversal stops at no token, empty response, repeated token, or the 100-ID cap;
- IDs remain ordered and deduplicated;
- the candidate finder defaults to and caps at 100.

Mobile tests cover:

- `getOrders` sends `page=0&size=10` and subsequent page values;
- pagination metadata is preserved and malformed metadata is rejected;
- initial load and refresh replace page 0;
- `loadMore` appends and deduplicates the next page without syncing;
- repeated end-reached events do not duplicate requests;
- no request occurs after `hasNext` becomes false;
- load-more errors preserve rows and can be retried;
- `401` during load-more expires the session;
- `HomeScreen` connects end-reached loading and footer state.

## Non-goals

Opaque cursor pagination, local order caching, offline persistence, changing database ordering, removing the 45-day Gmail lookback, unlimited Gmail traversal, background jobs, and automatic retry/backoff are outside this change.
