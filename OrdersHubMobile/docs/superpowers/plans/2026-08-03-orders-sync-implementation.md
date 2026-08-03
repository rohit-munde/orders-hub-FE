# Orders Sync and List Implementation Plan

> Execute this plan test-first in the current frontend branch.

**Goal:** Replace Home screen mock orders with the authenticated sync/list APIs while retaining a separate `OrderRow` component and the existing lightweight architecture.

**Architecture:** A typed service performs both HTTP calls, a single `useOrders` hook coordinates initial load and forced refresh, and `HomeScreen` renders the hook state. `App` remains the owner of authentication state and handles expired sessions.

**Tech stack:** React Native, TypeScript, React hooks, Jest, react-test-renderer.

---

## Task 1: Define API models and service behavior

**Files:**
- Modify: `src/features/home/types.ts`
- Modify: `src/features/home/services/ordersService.ts`
- Create: `__tests__/ordersService.test.ts`

1. Add failing tests for authenticated sync and list requests, force query values, response parsing, and status-aware failures.
2. Run only the service tests and confirm they fail for the missing implementation.
3. Replace mock models with the exact nullable backend models.
4. Implement `syncOrders`, `getOrders`, and `OrdersApiError` using the central base URL.
5. Run the service tests until green.

## Task 2: Implement the screen workflow hook

**Files:**
- Replace: `src/features/home/hooks/useInfiniteOrders.ts` with `src/features/home/hooks/useOrders.ts`
- Create: `__tests__/useOrders.test.tsx`

1. Add failing hook tests for initial `force=false`, forced refresh, `COOLDOWN`, order preservation, backend ordering, and `401` session expiry.
2. Run only the hook tests and confirm they fail.
3. Implement one guarded workflow shared by `load()` and `refresh()`.
4. Always attempt GET after a recoverable sync failure and never clear existing orders on failure.
5. Clear secure auth and notify `App` on `401`.
6. Run the hook tests until green.

## Task 3: Connect Home UI and session expiry

**Files:**
- Modify: `src/features/home/HomeScreen.tsx`
- Modify: `src/features/home/components/OrderRow.tsx`
- Modify: `src/app/App.tsx`
- Modify: `src/theme/styles.ts`
- Modify: `__tests__/App.test.tsx`

1. Add/adjust failing UI tests for restored-session rendering and session expiry.
2. Render API orders without local sorting or pagination.
3. Add first-load, pull-to-refresh, empty, last-synced, inline error, and retry states.
4. Keep `OrderRow` separate and render merchant fallback, order number, localized amount, readable status/date, and items.
5. Remove fake spending data from the rendered Home screen and omit OTP/Gmail content.
6. Wire `HomeScreen` session expiry to `App`.
7. Run affected UI tests until green.

## Task 4: Update centralized local backend port

**Files:**
- Modify: `src/config/appConfig.ts`
- Modify: `__tests__/appConfig.test.ts`

1. Update failing expectations to port `8081`.
2. Change the centralized local backend port to `8081`.
3. Run configuration tests until green.

## Task 5: Full verification

1. Run all Jest tests.
2. Run TypeScript compilation without emitting files.
3. Run ESLint.
4. Run `git diff --check` and review the complete diff for unrelated changes or unnecessary abstractions.
5. Report exact results and any remaining manual device checks.
