import { ApiError } from '../../../services/http/ApiError';
import { httpService } from '../../../services/http/httpService';
import { OrdersResponse, OrdersSyncResponse, PageMetadata } from '../types';

export const ORDERS_PAGE_SIZE = 10;

export function syncOrders(
  appToken: string,
  force: boolean,
): Promise<OrdersSyncResponse> {
  return httpService.post<OrdersSyncResponse>(
    `/api/v1/orders/sync?force=${force}`,
    { token: appToken },
  );
}

export async function getOrders(
  appToken: string,
  page: number,
): Promise<OrdersResponse> {
  const payload = await httpService.get<OrdersResponse>(
    `/api/v1/orders?page=${page}&size=${ORDERS_PAGE_SIZE}`,
    { token: appToken },
  );

  if (
    !Array.isArray(payload?.orders?.content) ||
    !isPageMetadata(payload?.orders?.pagination)
  ) {
    throw new ApiError('The backend returned an invalid orders response.');
  }

  return payload;
}

function isPageMetadata(value: unknown): value is PageMetadata {
  if (typeof value !== 'object' || value === null) return false;
  const page = value as Record<string, unknown>;
  return (
    isNonNegativeInteger(page.page) &&
    isPositiveInteger(page.size) &&
    isNonNegativeInteger(page.totalElements) &&
    isNonNegativeInteger(page.totalPages) &&
    typeof page.hasNext === 'boolean' &&
    typeof page.hasPrevious === 'boolean'
  );
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}
