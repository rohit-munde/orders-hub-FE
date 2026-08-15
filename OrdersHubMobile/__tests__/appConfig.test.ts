import { resolveLocalApiBaseUrl } from '../src/config/appConfig';

describe('resolveLocalApiBaseUrl', () => {
  const prodUrl = 'https://orders-hub-be-production.up.railway.app';
  let devBackup: boolean;

  beforeEach(() => {
    // Preserve current global.__DEV__ value
    devBackup = global.__DEV__;
  });

  afterEach(() => {
    // Restore global.__DEV__
    global.__DEV__ = devBackup;
  });

  describe('when __DEV__ is false (production build)', () => {
    beforeEach(() => {
      global.__DEV__ = false;
    });

    it('always returns the production URL regardless of forceLocal or platform config', () => {
      expect(resolveLocalApiBaseUrl('http://localhost:8081', 'android', true)).toBe(prodUrl);
      expect(resolveLocalApiBaseUrl(undefined, 'ios', true)).toBe(prodUrl);
      expect(resolveLocalApiBaseUrl('http://192.168.1.42:8081', 'android', false)).toBe(prodUrl);
    });
  });

  describe('when __DEV__ is true (development build)', () => {
    beforeEach(() => {
      global.__DEV__ = true;
    });

    describe('when forceLocal is false (default dev behavior)', () => {
      it('returns the production URL by default', () => {
        expect(resolveLocalApiBaseUrl('http://localhost:8081', 'android', false)).toBe(prodUrl);
        expect(resolveLocalApiBaseUrl(undefined, 'ios', false)).toBe(prodUrl);
        expect(resolveLocalApiBaseUrl('http://192.168.1.42:8081', 'ios', false)).toBe(prodUrl);
      });
    });

    describe('when forceLocal is true (intentionally running against local backend)', () => {
      it('uses the Metro host LAN IP with port 8081 if provided', () => {
        expect(
          resolveLocalApiBaseUrl(
            'http://192.168.1.42:8081/index.bundle?platform=android',
            'android',
            true,
          ),
        ).toBe('http://192.168.1.42:8081');
      });

      it('maps localhost or 127.0.0.1 to 10.0.2.2 on Android', () => {
        expect(
          resolveLocalApiBaseUrl(
            'http://localhost:8081/index.bundle?platform=android',
            'android',
            true,
          ),
        ).toBe('http://10.0.2.2:8081');

        expect(
          resolveLocalApiBaseUrl(
            'http://127.0.0.1:8081/index.bundle?platform=android',
            'android',
            true,
          ),
        ).toBe('http://10.0.2.2:8081');
      });

      it('keeps localhost for iOS/web when Metro host is localhost', () => {
        expect(
          resolveLocalApiBaseUrl(
            'http://localhost:8081/index.bundle?platform=ios',
            'ios',
            true,
          ),
        ).toBe('http://localhost:8081');
      });

      it('uses correct fallback IP when scriptUrl is undefined', () => {
        expect(resolveLocalApiBaseUrl(undefined, 'android', true)).toBe('http://10.0.2.2:8081');
        expect(resolveLocalApiBaseUrl(undefined, 'ios', true)).toBe('http://localhost:8081');
      });
    });
  });
});
