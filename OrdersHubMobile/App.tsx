import React, { useEffect, useState } from 'react';
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
import {
  SafeAreaView,
} from 'react-native-safe-area-context';
import {
  GoogleSignin,
  statusCodes,
  User,
} from '@react-native-google-signin/google-signin';

// IMPORTANT: Replace this placeholder with your actual Web Client ID from the Google Cloud Console.
// You can configure this ID in this file.
const WEB_CLIENT_ID = '519549577564-3i3cth2k7n1093eer7i6g62l58dicctt.apps.googleusercontent.com';

function App(): React.JSX.Element {
  const [userInfo, setUserInfo] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: WEB_CLIENT_ID,
      offlineAccess: true,
    });
    checkSignInStatus();
  }, []);

  const checkSignInStatus = async () => {
    try {
      setLoading(true);
      const hasPrevious = GoogleSignin.hasPreviousSignIn();
      if (hasPrevious) {
        const currentUser = GoogleSignin.getCurrentUser();
        if (currentUser) {
          setUserInfo(currentUser);
        } else {
          const response = await GoogleSignin.signInSilently();
          if (response.type === 'success') {
            setUserInfo(response.data);
          }
        }
      }
    } catch (error) {
      console.error('Error checking sign-in status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const response = await GoogleSignin.signIn();
      console.log('Google Sign-In response:', response);
      if (response.type === 'success') {
        setUserInfo(response.data);
        console.log('User Name:', response.data.user.name);
        console.log('Email:', response.data.user.email);
        console.log('Photo:', response.data.user.photo);
        console.log('ID Token:', response.data.idToken);
        console.log('Server Auth Code:', response.data.serverAuthCode);
      } else {
        setErrorMsg('Sign-in was cancelled or returned no data.');
      }
    } catch (error: any) {
      console.error('Google Sign-In error details:', error);
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        setErrorMsg('Sign-in was cancelled by the user.');
      } else if (error.code === statusCodes.IN_PROGRESS) {
        setErrorMsg('Sign-in is already in progress.');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        setErrorMsg('Google Play Services are not available or outdated.');
      } else {
        setErrorMsg(error.message || 'An unknown error occurred during sign-in.');
      }
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
    } catch (error: any) {
      console.error('Google Sign-Out error:', error);
      setErrorMsg(error.message || 'An error occurred during sign-out.');
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
            <Text style={styles.loadingText}>Processing...</Text>
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
              Please sign in to configure and authorize your backend access. Offline Access is enabled to retrieve a server auth code.
            </Text>
            <TouchableOpacity style={styles.googleButton} onPress={handleSignIn}>
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

        {userInfo && !loading && (
          <View style={styles.profileCard}>
            <Text style={styles.sectionTitle}>User Profile Info</Text>

            <View style={styles.avatarRow}>
              {userInfo.user.photo ? (
                <Image source={{ uri: userInfo.user.photo }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarPlaceholderText}>
                    {userInfo.user.name ? userInfo.user.name[0] : 'U'}
                  </Text>
                </View>
              )}
              <View style={styles.avatarDetails}>
                <Text style={styles.userName}>{userInfo.user.name}</Text>
                <Text style={styles.userEmail}>{userInfo.user.email}</Text>
              </View>
            </View>

            <View style={styles.detailsList}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>User Name</Text>
                <Text style={styles.detailValue} selectable={true}>
                  {userInfo.user.name || 'N/A'}
                </Text>
              </View>

              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Email Address</Text>
                <Text style={styles.detailValue} selectable={true}>
                  {userInfo.user.email || 'N/A'}
                </Text>
              </View>

              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Photo URL</Text>
                <Text style={[styles.detailValue, styles.codeText]} selectable={true}>
                  {userInfo.user.photo || 'N/A'}
                </Text>
              </View>

              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>ID Token</Text>
                <Text style={[styles.detailValue, styles.codeText]} selectable={true}>
                  {userInfo.idToken || 'N/A'}
                </Text>
              </View>

              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Server Auth Code</Text>
                <Text style={[styles.detailValue, styles.codeText]} selectable={true}>
                  {userInfo.serverAuthCode || 'N/A'}
                </Text>
              </View>
            </View>

            <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
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
});

export default App;
