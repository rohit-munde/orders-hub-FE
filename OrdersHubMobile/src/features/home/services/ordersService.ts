import { OrderSummary, OrdersPage } from '../types';

const PAGE_SIZE = 5;

const mockOrders: OrderSummary[] = [
  {
    id: 'sony-headphones',
    merchantInitial: 'A',
    merchantColor: '#0B0B0B',
    title: 'Sony WH-1000XM5',
    inbox: 'rohit@gmail.com',
    price: 26990,
    status: 'inTransit',
    otp: '482913',
  },
  {
    id: 'cotton-tee',
    merchantInitial: 'M',
    merchantColor: '#9A6510',
    title: 'Cotton crew tee ×2',
    inbox: 'rohit.shopping@gmail.com',
    price: 1498,
    status: 'outForDelivery',
    otp: '7254',
  },
  {
    id: 'ceramic-planter',
    merchantInitial: 'N',
    merchantColor: '#3D5C8D',
    title: 'Ceramic planter',
    inbox: 'indie.orders@gmail.com',
    price: 899,
    status: 'ordered',
  },
  {
    id: 'running-shoes',
    merchantInitial: 'F',
    merchantColor: '#78474C',
    title: 'Everyday running shoes',
    inbox: 'rohit@gmail.com',
    price: 4299,
    status: 'inTransit',
  },
  {
    id: 'coffee-beans',
    merchantInitial: 'B',
    merchantColor: '#6B5138',
    title: 'Single-origin coffee',
    inbox: 'indie.orders@gmail.com',
    price: 799,
    status: 'outForDelivery',
    otp: '106882',
  },
  {
    id: 'desk-lamp',
    merchantInitial: 'I',
    merchantColor: '#356B68',
    title: 'Minimal desk lamp',
    inbox: 'rohit.shopping@gmail.com',
    price: 2199,
    status: 'ordered',
  },
  {
    id: 'phone-case',
    merchantInitial: 'C',
    merchantColor: '#505050',
    title: 'Protective phone case',
    inbox: 'rohit@gmail.com',
    price: 649,
    status: 'delivered',
  },
  {
    id: 'skincare-set',
    merchantInitial: 'T',
    merchantColor: '#9B5D73',
    title: 'Daily skincare set',
    inbox: 'indie.orders@gmail.com',
    price: 1849,
    status: 'inTransit',
  },
  {
    id: 'keyboard',
    merchantInitial: 'K',
    merchantColor: '#2D4C67',
    title: 'Mechanical keyboard',
    inbox: 'rohit.shopping@gmail.com',
    price: 5899,
    status: 'outForDelivery',
    otp: '349120',
  },
  {
    id: 'notebooks',
    merchantInitial: 'P',
    merchantColor: '#7C583A',
    title: 'Hardcover notebooks ×3',
    inbox: 'rohit@gmail.com',
    price: 1197,
    status: 'ordered',
  },
  {
    id: 'speaker',
    merchantInitial: 'J',
    merchantColor: '#405B49',
    title: 'Portable speaker',
    inbox: 'indie.orders@gmail.com',
    price: 3299,
    status: 'inTransit',
  },
  {
    id: 'water-bottle',
    merchantInitial: 'D',
    merchantColor: '#316B8A',
    title: 'Insulated water bottle',
    inbox: 'rohit.shopping@gmail.com',
    price: 999,
    status: 'delivered',
  },
];

/** Replace this body with the orders endpoint when it is ready. */
export async function getOrdersPage(cursor: string | null): Promise<OrdersPage> {
  const startIndex = cursor ? Number(cursor) : 0;
  const endIndex = Math.min(startIndex + PAGE_SIZE, mockOrders.length);

  await new Promise<void>(resolve => setTimeout(() => resolve(), 250));

  return {
    orders: mockOrders.slice(startIndex, endIndex),
    nextCursor: endIndex < mockOrders.length ? String(endIndex) : null,
  };
}
