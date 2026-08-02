export type OrderStatus = 'ordered' | 'inTransit' | 'outForDelivery' | 'delivered';

export type OrderSummary = {
  id: string;
  merchantInitial: string;
  merchantColor: string;
  title: string;
  inbox: string;
  price: number;
  status: OrderStatus;
  otp?: string;
};

export type OrdersPage = {
  orders: OrderSummary[];
  nextCursor: string | null;
};
