import React from 'react';
import { Clipboard, Platform, ToastAndroid } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import { OrderRow } from '../src/features/home/components/OrderRow/OrderRow';
import { Order } from '../src/features/home/types';
import { AppThemeProvider } from '../src/theme/AppThemeProvider';

function order(overrides: Partial<Order> = {}): Order {
  return {
    id: 1,
    merchantKey: 'amazon.in',
    logoUrl: null,
    brandName: 'Amazon',
    orderNo: 'ORDER-1',
    billAmount: 1499,
    refundAmount: null,
    currency: 'INR',
    paid: true,
    status: 'OUT_FOR_DELIVERY',
    placedAt: '2026-08-03T10:00:00Z',
    items: [],
    ...overrides,
  };
}

async function render(value: Order) {
  let component: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    component = ReactTestRenderer.create(
      <AppThemeProvider>
        <OrderRow order={value} />
      </AppThemeProvider>,
    );
  });
  return component!;
}

describe('OrderRow delivery OTP', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('shows the OTP and copies it with feedback', async () => {
    Platform.OS = 'android';
    const setString = jest.spyOn(Clipboard, 'setString').mockImplementation(() => {});
    const toast = jest.spyOn(ToastAndroid, 'show').mockImplementation(() => {});
    const component = await render(order({ deliveryOtp: '482913' }));

    expect(JSON.stringify(component.toJSON())).toContain('482913');

    await ReactTestRenderer.act(async () => {
      component.root.findByProps({ testID: 'copy-delivery-otp' }).props.onPress();
    });

    expect(setString).toHaveBeenCalledWith('482913');
    expect(toast).toHaveBeenCalledWith('OTP copied', ToastAndroid.SHORT);
  });

  it('shows nothing when the order has no OTP', async () => {
    const withoutField = await render(order());
    const withNull = await render(order({ deliveryOtp: null }));

    expect(withoutField.root.findAllByProps({ testID: 'delivery-otp' })).toHaveLength(0);
    expect(withNull.root.findAllByProps({ testID: 'delivery-otp' })).toHaveLength(0);
  });
});
