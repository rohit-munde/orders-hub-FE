import { resolveLocalApiBaseUrl } from '../src/config/appConfig';

describe('resolveLocalApiBaseUrl', () => {
  it('uses the Metro host for a physical device', () => {
    expect(
      resolveLocalApiBaseUrl(
        'http://192.168.1.42:8081/index.bundle?platform=android',
        'android',
      ),
    ).toBe('http://192.168.1.42:8080');
  });

  it.each([
    ['android', 'http://10.0.2.2:8080'],
    ['ios', 'http://localhost:8080'],
  ])('uses the %s fallback when Metro is unavailable', (platform, expected) => {
    expect(resolveLocalApiBaseUrl(undefined, platform)).toBe(expected);
  });
});
