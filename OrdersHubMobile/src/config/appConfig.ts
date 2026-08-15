import { NativeModules, Platform } from 'react-native';

const PRODUCTION_BACKEND_URL = 'https://orders-hub-be-production.up.railway.app';
const LOCAL_BACKEND_PORT = 8081;

// Developer toggle to intentionally run against the local backend in development.
// By default, this is false, so physical devices/production use the production URL by default.
const FORCE_LOCAL_BACKEND = false;

export function resolveLocalApiBaseUrl(
  scriptUrl: string | undefined,
  platform: string,
  forceLocal: boolean = FORCE_LOCAL_BACKEND,
): string {
  // Check if we are in development mode (__DEV__ is true).
  // Note: We use typeof __DEV__ check to avoid crashes in non-react-native environments.
  const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : true;
  if (!isDev || !forceLocal) {
    return PRODUCTION_BACKEND_URL;
  }

  // Attempt to parse Metro host to determine dynamic local IP
  const metroHost = scriptUrl?.match(/^https?:\/\/(\[[^\]]+\]|[^/:]+)/i)?.[1];
  
  if (metroHost) {
    // If it's localhost or 127.0.0.1, map to 10.0.2.2 on Android
    if ((metroHost === 'localhost' || metroHost === '127.0.0.1') && platform === 'android') {
      return `http://10.0.2.2:${LOCAL_BACKEND_PORT}`;
    }
    return `http://${metroHost}:${LOCAL_BACKEND_PORT}`;
  }

  // Fallbacks when scriptUrl is undefined
  const fallbackHost = platform === 'android' ? '10.0.2.2' : 'localhost';
  return `http://${fallbackHost}:${LOCAL_BACKEND_PORT}`;
}

const metroScriptUrl = NativeModules.SourceCode?.scriptURL as string | undefined;

export const appConfig = {
  googleWebClientId:
    '519549577564-3i3cth2k7n1093eer7i6g62l58dicctt.apps.googleusercontent.com',
  googleScopes: ['https://www.googleapis.com/auth/gmail.readonly'],
  apiBaseUrl: resolveLocalApiBaseUrl(metroScriptUrl, Platform.OS),
} as const;
