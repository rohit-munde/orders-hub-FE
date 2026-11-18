import React from 'react';
import { Clipboard, Platform, ToastAndroid } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import { canHaveDeliveryOtp, OrderRow } from '../src/features/home/components/OrderRow/OrderRow';
import { DeliveryOtp, Order } from '../src/features/home/types';
import { ApiError } from '../src/services/http/ApiError';
import { AppThemeProvider } from '../src/theme/AppThemeProvider';

function order(overrides: Partial<Order> = {}): Order {
  return {
    id: 21,
    merchantKey: 'amazon.in',
    logoUrl: null,
    brandName: 'Amazon',
    orderNo: 'ORDER-1',
    billAmount: 1499,
    refundAmount: null,
    currency: 'INR',
    paid: true,
    status: 'OUT_FOR_DELIVERY',
    placedAt: new Date(Date.now() - 2 * 24 * 3600e3).toISOString(),
    items: [],
    ...overrides,
  };
}

async function render(value: Order, requestOtp?: (orderId: number) => Promise<DeliveryOtp>) {
  let component: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    component = ReactTestRenderer.create(
      <AppThemeProvider>
        <OrderRow order={value} onRequestDeliveryOtp={requestOtp} />
      </AppThemeProvider>,
    );
  });
  return component!;
}

function otpValue(component: ReactTestRenderer.ReactTestRenderer) {
  return component.root.findByProps({ testID: 'delivery-otp-value' }).props.children;
}

async function tapShowOtp(component: ReactTestRenderer.ReactTestRenderer) {
  await ReactTestRenderer.act(async () => {
    await component.root.findByProps({ testID: 'show-delivery-otp' }).props.onPress();
  });
}

describe('OrderRow delivery OTP', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('looks up the OTP only when tapped, then shows and copies it', async () => {
    Platform.OS = 'android';
    const setString = jest.spyOn(Clipboard, 'setString').mockImplementation(() => {});
    const toast = jest.spyOn(ToastAndroid, 'show').mockImplementation(() => {});
    const requestOtp = jest.fn().mockResolvedValue({ otp: '482913', receivedAt: '2026-08-03T08:15:00Z' });
    const component = await render(order(), requestOtp);

    expect(requestOtp).not.toHaveBeenCalled();
    expect(otpValue(component)).toBe('••••••');
    expect(JSON.stringify(component.toJSON())).not.toContain('482913');

    await tapShowOtp(component);

    expect(requestOtp).toHaveBeenCalledWith(21);
    expect(otpValue(component)).toBe('482913');

    await ReactTestRenderer.act(async () => {
      component.root.findByProps({ testID: 'copy-delivery-otp' }).props.onPress();
    });
    expect(setString).toHaveBeenCalledWith('482913');
    expect(toast).toHaveBeenCalledWith('OTP copied', ToastAndroid.SHORT);
  });

  it('hides the OTP again and re-shows it without another Gmail lookup', async () => {
    const requestOtp = jest.fn().mockResolvedValue({ otp: '482913', receivedAt: null });
    const component = await render(order(), requestOtp);

    await tapShowOtp(component);
    await ReactTestRenderer.act(async () => {
      component.root.findByProps({ testID: 'hide-delivery-otp' }).props.onPress();
    });
    expect(otpValue(component)).toBe('••••••');

    await tapShowOtp(component);
    expect(otpValue(component)).toBe('482913');
    expect(requestOtp).toHaveBeenCalledTimes(1);
  });

  it('explains when the email has no OTP and lets the user retry', async () => {
    const requestOtp = jest
      .fn()
      .mockRejectedValueOnce(new ApiError('No delivery OTP found', { status: 404 }))
      .mockResolvedValueOnce({ otp: '7254', receivedAt: null });
    const component = await render(order(), requestOtp);

    await tapShowOtp(component);
    const message = component.root.findByProps({ testID: 'delivery-otp-message' });
    expect(message.props.children).toBe('No OTP in your email yet. Couriers often send it by SMS.');
    expect(otpValue(component)).toBe('••••••');

    await tapShowOtp(component);
    expect(otpValue(component)).toBe('7254');
  });

  it('asks the user to reconnect Gmail when the connection has expired', async () => {
    const requestOtp = jest.fn().mockRejectedValue(new ApiError('Gmail account must be reconnected', { status: 409 }));
    const component = await render(order(), requestOtp);

    await tapShowOtp(component);

    expect(component.root.findByProps({ testID: 'delivery-otp-message' }).props.children)
      .toBe('Reconnect Gmail in Profile to look up OTPs.');
  });

  it('only offers an OTP while the parcel is on its way', () => {
    const now = Date.parse('2026-11-18T10:00:00Z');
    const daysAgo = (days: number) => new Date(now - days * 24 * 3600e3).toISOString();
    expect(canHaveDeliveryOtp(order({ status: 'SHIPPED', placedAt: daysAgo(3) }), now)).toBe(true);
    expect(canHaveDeliveryOtp(order({ status: 'OUT_FOR_DELIVERY', placedAt: daysAgo(1) }), now)).toBe(true);
    expect(canHaveDeliveryOtp(order({ status: 'DISPATCHED', placedAt: null }), now)).toBe(true);
    expect(canHaveDeliveryOtp(order({ status: 'SHIPPED', placedAt: daysAgo(45) }), now)).toBe(false);
    for (const status of ['UNKNOWN', 'CONFIRMED', 'DELIVERED', 'CANCELLED', 'REFUNDED'] as const) {
      expect(canHaveDeliveryOtp(order({ status, placedAt: daysAgo(1) }), now)).toBe(false);
    }
  });

  it('does not offer an OTP for finished, unconfirmed or unknown orders', async () => {
    const requestOtp = jest.fn();
    for (const status of ['UNKNOWN', 'CONFIRMED', 'DELIVERED', 'CANCELLED', 'REFUNDED'] as const) {
      const component = await render(order({ status }), requestOtp);
      expect(component.root.findAllByProps({ testID: 'delivery-otp' })).toHaveLength(0);
    }
    expect(requestOtp).not.toHaveBeenCalled();
  });

  it('does not offer an OTP when no lookup is provided', async () => {
    const component = await render(order());

    expect(component.root.findAllByProps({ testID: 'delivery-otp' })).toHaveLength(0);
  });

  it('shows a quiet dash when the email had no amount', async () => {
    const component = await render(order({ billAmount: null, status: 'DELIVERED' }));

    expect(component.root.findByProps({ testID: 'amount-missing' }).props.children).toBe('—');
    expect(JSON.stringify(component.toJSON())).not.toContain('Amount unavailable');
  });
});
