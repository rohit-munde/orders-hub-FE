import { ApiError } from '../../../services/http/ApiError';
import { httpService } from '../../../services/http/httpService';
import { OrdersResponse, OrdersSyncResponse } from '../types';

export function syncOrders(
  appToken: string,
  force: boolean,
): Promise<OrdersSyncResponse> {
  return httpService.post<OrdersSyncResponse>(
    `/api/v1/orders/sync?force=${force}`,
    { token: appToken },
  );
}

export async function getOrders(appToken: string): Promise<OrdersResponse> {
  const payload = await httpService.get<OrdersResponse>('/api/v1/orders', {
    token: appToken,
  });

  if (!Array.isArray(payload?.orders?.content)) {
    throw new ApiError('The backend returned an invalid orders response.');
  }

  return payload;
}
