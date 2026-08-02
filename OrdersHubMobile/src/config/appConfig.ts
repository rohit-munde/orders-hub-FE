import { Platform } from 'react-native';

export const appConfig = {
  googleWebClientId:
    '519549577564-3i3cth2k7n1093eer7i6g62l58dicctt.apps.googleusercontent.com',
  googleScopes: ['https://www.googleapis.com/auth/gmail.readonly'],
  apiBaseUrl: Platform.select({
    android: 'http://10.0.2.2:8080',
    ios: 'http://localhost:8080',
    default: 'http://localhost:8080',
  }),
} as const;
