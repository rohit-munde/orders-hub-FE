import { NativeModules, Platform } from 'react-native';

const LOCAL_BACKEND_PORT = 8080;

export function resolveLocalApiBaseUrl(
  scriptUrl: string | undefined,
  _platform: string,
): string {
  const metroHost = scriptUrl?.match(/^https?:\/\/(\[[^\]]+\]|[^/:]+)/i)?.[1];
  // Using 'localhost' as fallback for both platforms. On Android, this supports
  // physical device debugging via `adb reverse tcp:8080 tcp:8080` (which is needed
  // when scriptURL is undefined under Bridgeless mode or certain debugging configs).
  const fallbackHost = 'localhost';

  return `http://${metroHost ?? fallbackHost}:${LOCAL_BACKEND_PORT}`;
}

const metroScriptUrl = NativeModules.SourceCode?.scriptURL as string | undefined;

export const appConfig = {
  googleWebClientId:
    '519549577564-3i3cth2k7n1093eer7i6g62l58dicctt.apps.googleusercontent.com',
  googleScopes: ['https://www.googleapis.com/auth/gmail.readonly'],
  apiBaseUrl: resolveLocalApiBaseUrl(metroScriptUrl, Platform.OS),
} as const;
