# Orders Sync and List Design

## Goal

Replace the dummy orders currently rendered on `HomeScreen` with authenticated backend data while keeping `OrderRow` as a separate reusable component.

## Existing Architecture

The frontend is intentionally small and currently uses services, hooks, screens, and shared theme styles. It has no repository, dependency-injection, navigation, or global state library. The authenticated session is securely stored in Keychain, but orders have no local cache. The bottom navigation is currently presentational.

## Architecture

- `ordersService` owns HTTP requests, response parsing, and status-aware API errors.
- `useOrders` owns the initial-load and forced-refresh workflows and their screen state.
- `HomeScreen` renders loading, error, empty, and populated states.
- `OrderRow` remains a separate component and renders one backend order.
- `App` handles session expiry by returning the user to the existing login flow.

No repository, controller, view-model, cache, or navigation abstraction will be added for this MVP.

## API and Models

- `syncOrders(appToken, force)` calls `POST /api/v1/orders/sync?force=<boolean>`.
- `getOrders(appToken)` calls `GET /api/v1/orders`.
- Both requests send only `Authorization: Bearer <appToken>` plus required standard headers.
- Every backend-nullable field is nullable in the TypeScript API model.
- The API model is used directly by this screen to avoid duplicate mapping layers.
- The existing centralized backend URL configuration remains the single source of truth, with local port `8081`.

## Data Flow

### Initial load

1. Keep any currently displayed orders visible.
2. Call sync with `force=false`.
3. Call `GET /orders` after `COMPLETED`, `COOLDOWN`, or a recoverable sync failure.
4. Replace the list only after a successful GET response.
5. Preserve backend order exactly; never sort locally.
6. Show the full-screen loader only when no orders are available yet.

### Pull-to-refresh

1. Keep the current list visible.
2. Call sync with `force=true`.
3. Call `GET /orders`.
4. Replace the list only after a successful GET response.
5. Stop the refresh indicator in `finally`.

`COOLDOWN` is a successful outcome and never produces an error.

## State

`useOrders` exposes:

- `orders`
- `lastSyncedAt`
- `isInitialLoading`
- `isRefreshing`
- `error`
- `load()`
- `refresh()`

An in-flight guard prevents duplicate sync/list sequences.

## Error Handling

- `401`: clear the Keychain session and notify `App`, which returns to login.
- `409`: show that Gmail must be connected or reconnected.
- `502`: keep existing orders visible and show a retryable Gmail sync error.
- Other network/API failures: keep existing orders visible and show a retry action.
- A failed sync still attempts GET; a failed GET never clears displayed orders.
- Errors use a small status-aware `OrdersApiError` rather than spreading response handling through UI code.

## UI

- Keep the existing home header, separate `OrderRow`, and bottom navigation.
- Do not render the fake spending overview as if it were backend data.
- Show merchant using `brandName`, then `merchantKey`, then `Unknown merchant`.
- Show order number, localized amount, readable status, local placed date, and items.
- Show `Last synced ...` when the backend provides a timestamp.
- Show `No orders found in the last 45 days` with a force-refresh action for an empty list.
- Do not display OTP, Gmail identifiers/content, or Google tokens.

## Tests

Cover:

- screen load syncs with `force=false`, then loads orders;
- pull-to-refresh syncs with `force=true`, then reloads orders;
- `COOLDOWN` still loads orders;
- sync/list failure preserves existing orders;
- backend order is preserved exactly;
- `401` invokes existing session-expiry handling;
- API requests use the expected path, query, and bearer authorization.

## Non-goals

Local order caching, pagination, new navigation infrastructure, local sorting, order editing, OTP display, Google-token handling, and spending analytics are outside this change.
