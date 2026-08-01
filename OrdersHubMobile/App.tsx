import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  GoogleSignin,
  isErrorWithCode,
  statusCodes,
  User,
} from '@react-native-google-signin/google-signin';
import { BackendUser } from './common/types/BackendUser';
import { authenticateWithBackend } from './auth/authService';
import { WEB_CLIENT_ID } from './common/constants';


const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'An unexpected error occurred.';


function App(): React.JSX.Element {
  const [userInfo, setUserInfo] = useState<User | null>(null);
  const [backendUser, setBackendUser] = useState<BackendUser | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('Processing...');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const verifyWithBackend = useCallback(async (googleUser: User) => {
    if (!googleUser.idToken) {
      throw new Error(
        'Google Sign-In succeeded, but no ID token was returned. Check the Google web client configuration.',
      );
    }

    setLoadingMessage('Verifying your account with the backend...');
    const verifiedUser = await authenticateWithBackend(googleUser.idToken);
    console.log('Verified backend user:', verifiedUser);
    setBackendUser(verifiedUser);
  }, []);

  const checkSignInStatus = useCallback(async () => {
    try {
      setErrorMsg(null);
      setLoadingMessage('Restoring your Google sign-in...');
      setLoading(true);
      const hasPrevious = GoogleSignin.hasPreviousSignIn();
      if (hasPrevious) {
        const response = await GoogleSignin.signInSilently();
        if (response.type === 'success') {
          setUserInfo(response.data);
          await verifyWithBackend(response.data);
        }
      }
    } catch (error) {
      console.error('Error checking sign-in status:', error);
      setErrorMsg(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [verifyWithBackend]);

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: WEB_CLIENT_ID,
      offlineAccess: true,
    });
    checkSignInStatus();
  }, [checkSignInStatus]);

  const handleSignIn = async () => {
    setErrorMsg(null);
    setBackendUser(null);
    setLoadingMessage('Signing in with Google...');
    setLoading(true);
    try {
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });
      const response = await GoogleSignin.signIn();
      if (response.type === 'success') {
        setUserInfo(response.data);
        await verifyWithBackend(response.data);
      } else {
        setErrorMsg('Sign-in was cancelled or returned no data.');
      }
    } catch (error: unknown) {
      console.error('Google Sign-In error details:', error);
      if (
        isErrorWithCode(error) &&
        error.code === statusCodes.SIGN_IN_CANCELLED
      ) {
        setErrorMsg('Sign-in was cancelled by the user.');
      } else if (
        isErrorWithCode(error) &&
        error.code === statusCodes.IN_PROGRESS
      ) {
        setErrorMsg('Sign-in is already in progress.');
      } else if (
        isErrorWithCode(error) &&
        error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE
      ) {
        setErrorMsg('Google Play Services are not available or outdated.');
      } else {
        setErrorMsg(getErrorMessage(error));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBackendRetry = async () => {
    if (!userInfo) {
      return;
    }

    setErrorMsg(null);
    setLoading(true);
    try {
      await verifyWithBackend(userInfo);
    } catch (error: unknown) {
      console.error('Backend authentication error:', error);
      setErrorMsg(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      await GoogleSignin.signOut();
      setUserInfo(null);
      setBackendUser(null);
    } catch (error: unknown) {
      console.error('Google Sign-Out error:', error);
      setErrorMsg(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.headerSubtitle}>ORDERS HUB</Text>
          <Text style={styles.headerTitle}>Google Sign-In</Text>
        </View>

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6200EE" />
            <Text style={styles.loadingText}>{loadingMessage}</Text>
          </View>
        )}

        {errorMsg && (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Error Encountered</Text>
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        )}

        {!userInfo && !loading && (
          <View style={styles.authContainer}>
            <Text style={styles.introText}>
              Sign in with Google to verify your identity with the Orders Hub
              backend.
            </Text>
            <TouchableOpacity
              style={styles.googleButton}
              onPress={handleSignIn}
            >
              <View style={styles.googleIconWrapper}>
                <Image
                  source={{
                    uri: 'https://developers.google.com/static/identity/images/g-logo.png',
                  }}
                  style={styles.googleIcon}
                />
              </View>
              <Text style={styles.googleButtonText}>Sign in with Google</Text>
            </TouchableOpacity>
          </View>
        )}

        {userInfo && !backendUser && !loading && (
          <View style={styles.authContainer}>
            <Text style={styles.introText}>
              Google Sign-In succeeded, but backend verification has not
              completed.
            </Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={handleBackendRetry}
            >
              <Text style={styles.retryButtonText}>
                Retry backend verification
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.signOutButton}
              onPress={handleSignOut}
            >
              <Text style={styles.signOutButtonText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        )}

        {backendUser && !loading && (
          <View style={styles.profileCard}>
            <Text style={styles.sectionTitle}>Verified User</Text>

            <View style={styles.avatarRow}>
              {backendUser.pictureUrl ? (
                <Image
                  source={{ uri: backendUser.pictureUrl }}
                  style={styles.avatar}
                />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarPlaceholderText}>
                    {backendUser.name ? backendUser.name[0] : 'U'}
                  </Text>
                </View>
              )}
              <View style={styles.avatarDetails}>
                <Text style={styles.userName}>{backendUser.name}</Text>
                <Text style={styles.userEmail}>{backendUser.email}</Text>
              </View>
            </View>

            <View style={styles.detailsList}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>User Name</Text>
                <Text style={styles.detailValue} selectable={true}>
                  {backendUser.name || 'N/A'}
                </Text>
              </View>

              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Email Address</Text>
                <Text style={styles.detailValue} selectable={true}>
                  {backendUser.email || 'N/A'}
                </Text>
              </View>

              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Subject</Text>
                <Text
                  style={[styles.detailValue, styles.codeText]}
                  selectable={true}
                >
                  {backendUser.subject}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.signOutButton}
              onPress={handleSignOut}
            >
              <Text style={styles.signOutButtonText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#121212',
  },
  scrollContainer: {
    padding: 24,
    flexGrow: 1,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  headerSubtitle: {
    color: '#03DAC6',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 4,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
  },
  loadingContainer: {
    padding: 24,
    alignItems: 'center',
  },
  loadingText: {
    color: '#BB86FC',
    marginTop: 12,
    fontSize: 14,
  },
  errorCard: {
    backgroundColor: '#331616',
    borderColor: '#CF6679',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  errorTitle: {
    color: '#CF6679',
    fontWeight: '700',
    fontSize: 15,
    marginBottom: 4,
  },
  errorText: {
    color: '#E0E0E0',
    fontSize: 13,
  },
  authContainer: {
    alignItems: 'center',
  },
  introText: {
    color: '#A0A0A0',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  googleButton: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingRight: 16,
    height: 48,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  googleIconWrapper: {
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },
  googleIcon: {
    width: 24,
    height: 24,
  },
  googleButtonText: {
    color: '#1f1f1f',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
  profileCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2C2C2C',
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2C',
    paddingBottom: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarPlaceholder: {
    backgroundColor: '#6200EE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
  },
  avatarDetails: {
    marginLeft: 16,
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  userEmail: {
    color: '#A0A0A0',
    fontSize: 14,
    marginTop: 2,
  },
  detailsList: {
    marginBottom: 20,
  },
  detailItem: {
    marginBottom: 14,
  },
  detailLabel: {
    color: '#03DAC6',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  detailValue: {
    color: '#E0E0E0',
    fontSize: 14,
    backgroundColor: '#262626',
    padding: 8,
    borderRadius: 6,
  },
  codeText: {
    fontFamily: 'monospace',
    fontSize: 12,
  },
  signOutButton: {
    borderWidth: 1,
    borderColor: '#CF6679',
    borderRadius: 8,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  signOutButtonText: {
    color: '#CF6679',
    fontSize: 14,
    fontWeight: '600',
  },
  retryButton: {
    backgroundColor: '#6200EE',
    borderRadius: 8,
    paddingHorizontal: 18,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default App;
