export type OrderStatus =
  | 'UNKNOWN'
  | 'CONFIRMED'
  | 'DISPATCHED'
  | 'SHIPPED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED';

export type OrderItem = {
  id: number;
  productName: string;
  productUrl: string | null;
  quantity: number;
  price: number | null;
};

export type Order = {
  id: number;
  merchantKey: string | null;
  brandName: string | null;
  orderNo: string;
  billAmount: number | null;
  refundAmount: number | null;
  currency: string | null;
  paid: boolean | null;
  status: OrderStatus;
  placedAt: string | null;
  items: OrderItem[];
};

export type PageMetadata = {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
};

export type OrdersResponse = {
  lastSyncedAt: string | null;
  orders: {
    content: Order[];
    pagination: PageMetadata;
  };
};

export type SyncOutcome = 'COMPLETED' | 'COOLDOWN';

export type OrdersSyncResponse = {
  outcome: SyncOutcome;
  lastSyncedAt: string | null;
  candidateCount: number;
  savedCount: number;
  skippedCount: number;
  ignoredCount: number;
  failedCount: number;
};
