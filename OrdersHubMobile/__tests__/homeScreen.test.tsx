import React from 'react';
import { ActivityIndicator, FlatList, RefreshControl, Text } from 'react-native';
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
const baseLoadMore = jest.fn();
const orderFixture = {
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
};
const baseHookResult = {
  orders: [orderFixture],
  lastSyncedAt: '2026-08-03T12:00:00Z',
  isInitialLoading: false,
  isRefreshing: false,
  isLoadingMore: false,
  hasNext: false,
  error: null,
  loadMoreError: null,
  load: jest.fn(),
  refresh,
  loadMore: baseLoadMore,
};

beforeEach(() => {
  jest.resetAllMocks();
  refresh.mockResolvedValue(undefined);
  baseLoadMore.mockResolvedValue(undefined);
  (useOrders as jest.Mock).mockReturnValue(baseHookResult);
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
  expect(content).toContain('Aug 3, 3:30 PM');
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
    ...baseHookResult,
    orders: [],
    lastSyncedAt: null,
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

it('loads the next page when the list approaches its end', async () => {
  const loadMore = jest.fn().mockResolvedValue(undefined);
  (useOrders as jest.Mock).mockReturnValue({
    ...baseHookResult,
    loadMore,
    hasNext: true,
  });
  let renderer: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(
      <AppThemeProvider>
        <HomeScreen session={session} onSessionExpired={jest.fn()} />
      </AppThemeProvider>,
    );
  });

  const list = renderer!.root.findByType(FlatList);
  expect(list.props.onEndReachedThreshold).toBe(0.4);
  await ReactTestRenderer.act(async () => list.props.onEndReached());
  expect(loadMore).toHaveBeenCalledTimes(1);
});

it('renders a footer loader while another page is loading', async () => {
  (useOrders as jest.Mock).mockReturnValue({
    ...baseHookResult,
    isLoadingMore: true,
  });
  let renderer: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(
      <AppThemeProvider>
        <HomeScreen session={session} onSessionExpired={jest.fn()} />
      </AppThemeProvider>,
    );
  });
  expect(renderer!.root.findAllByType(ActivityIndicator)).toHaveLength(1);
});

it('retries only load-more from the pagination error footer', async () => {
  const loadMore = jest.fn().mockResolvedValue(undefined);
  (useOrders as jest.Mock).mockReturnValue({
    ...baseHookResult,
    loadMore,
    loadMoreError: 'Could not load more orders.',
  });
  let renderer: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(
      <AppThemeProvider>
        <HomeScreen session={session} onSessionExpired={jest.fn()} />
      </AppThemeProvider>,
    );
  });
  const retry = renderer!.root
    .findAllByProps({ accessibilityRole: 'button' })
    .find(node =>
      node
        .findAllByType(Text)
        .some(text => textContent(text.props.children) === 'Retry'),
    )!;
  await ReactTestRenderer.act(async () => retry.props.onPress());
  expect(loadMore).toHaveBeenCalledTimes(1);
  expect(refresh).not.toHaveBeenCalled();
});

function textContent(children: unknown): string {
  if (Array.isArray(children)) {
    return children.map(textContent).join('');
  }
  return typeof children === 'string' || typeof children === 'number'
    ? String(children)
    : '';
}
