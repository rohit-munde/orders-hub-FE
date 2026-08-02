import * as Keychain from 'react-native-keychain';

const TOKEN_SERVICE = 'com.ordershubmobile.app-token';
const TOKEN_USERNAME = 'ordershub-session';

export async function saveAppToken(appToken: string): Promise<void> {
  const stored = await Keychain.setGenericPassword(TOKEN_USERNAME, appToken, {
    service: TOKEN_SERVICE,
  });

  if (!stored) {
    throw new Error('The Orders Hub session could not be stored securely.');
  }
}
