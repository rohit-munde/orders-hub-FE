import React from 'react';
import { RefreshControl, Text } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import { AuthSession } from '../src/features/auth/types';
import { HomeScreen } from '../src/features/home/HomeScreen';
import { useOrders } from '../src/features/home/hooks/useOrders';
import { AppThemeProvider } from '../src/theme/AppThemeProvider';

jest.mock('../src/features/home/hooks/useOrders', () => ({
  useOrders: jest.fn(),
}));

const session: AuthSession = {
  appToken: 'app-jwt',
  user: {
    id: 42,
    name: 'Rohit',
    email: 'rohit@example.com',
    pictureUrl: null,
  },
};

const refresh = jest.fn();

beforeEach(() => {
  jest.resetAllMocks();
  refresh.mockResolvedValue(undefined);
  (useOrders as jest.Mock).mockReturnValue({
    orders: [
      {
        id: 22,
        merchantKey: 'flipkart.com',
        brandName: null,
        orderNo: 'ORDER-22',
        billAmount: 1499,
        currency: 'INR',
        paid: true,
        status: 'OUT_FOR_DELIVERY',
        placedAt: '2026-08-03T10:00:00Z',
        items: [
          {
            id: 31,
            productName: 'USB-C Cable',
            productUrl: null,
            quantity: 2,
            price: 499,
          },
        ],
      },
    ],
    lastSyncedAt: '2026-08-03T12:00:00Z',
    isInitialLoading: false,
    isRefreshing: false,
    error: null,
    load: jest.fn(),
    refresh,
  });
});

it('renders API order fields and keeps pull-to-refresh connected', async () => {
  let renderer: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(
      <AppThemeProvider>
        <HomeScreen session={session} onSessionExpired={jest.fn()} />
      </AppThemeProvider>,
    );
  });

  const content = renderer!.root
    .findAllByType(Text)
    .map(node => textContent(node.props.children))
    .join(' ');
  expect(content).toContain('flipkart.com');
  expect(content).toContain('ORDER-22');
  expect(content).toContain('Out for delivery');
  expect(content).toContain('USB-C Cable ×2');
  expect(content).not.toContain('OTP');

  await ReactTestRenderer.act(async () => {
    await renderer!.root.findByType(RefreshControl).props.onRefresh();
  });
  expect(refresh).toHaveBeenCalledTimes(1);
});

it('renders the required empty state with a force-refresh action', async () => {
  (useOrders as jest.Mock).mockReturnValue({
    orders: [],
    lastSyncedAt: null,
    isInitialLoading: false,
    isRefreshing: false,
    error: null,
    load: jest.fn(),
    refresh,
  });

  let renderer: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(
      <AppThemeProvider>
        <HomeScreen session={session} onSessionExpired={jest.fn()} />
      </AppThemeProvider>,
    );
  });

  const content = renderer!.root
    .findAllByType(Text)
    .map(node => textContent(node.props.children))
    .join(' ');
  expect(content).toContain('No orders found in the last 45 days');
  expect(content).toContain('Refresh');
});

function textContent(children: unknown): string {
  if (Array.isArray(children)) {
    return children.map(textContent).join('');
  }
  return typeof children === 'string' || typeof children === 'number'
    ? String(children)
    : '';
}
