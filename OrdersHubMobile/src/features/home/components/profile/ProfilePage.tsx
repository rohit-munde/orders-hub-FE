import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, BackHandler, Pressable, ActivityIndicator, Alert, Image } from "react-native";
import { AppScreen } from "../../../../components/layout/AppScreen";
import { useAppTheme } from "../../../../theme/AppThemeProvider";
import { AuthSession } from "../../../auth/types";
import { spacing, radii, typography } from "../../../../theme/tokens";
import { clearAuthSession } from "../../../auth/services/secureTokenStorage";
import { GoogleSignin, statusCodes, isErrorWithCode } from "@react-native-google-signin/google-signin";
import { appConfig } from "../../../../config/appConfig";
import { httpService } from "../../../../services/http/httpService";
import { ApiError } from "../../../../services/http/ApiError";
import { formatDate } from "../../HomeScreen";
import { UserDetails } from "../../../auth/services/userApi";

export type ConnectedAccount = {
  id: number;
  provider: "GOOGLE";
  email: string;
  status: "SYNCING" | "SYNCED" | "FAILED";
  lastSyncedAt: string | null;
};

interface ProfilePageProps {
  session: AuthSession;
  userDetails: UserDetails | null;
  onBack: () => void;
  onLogout: () => void;
  onAccountsChanged: () => void;
}

export const ProfilePage = ({ session, userDetails, onBack, onLogout, onAccountsChanged }: ProfilePageProps) => {
  const { theme } = useAppTheme();
  const colors = theme.colors;

  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
  const [accountsError, setAccountsError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [disconnectingId, setDisconnectingId] = useState<number | null>(null);
  const [imageError, setImageError] = useState(false);

  const fetchAccounts = async () => {
    setIsLoadingAccounts(true);
    setAccountsError(null);
    try {
      const response = await httpService.get<any>(
        "/api/v1/connected-accounts",
        { token: session.appToken }
      );
      
      // Resilient handling of the API response wrapper
      if (Array.isArray(response)) {
        setAccounts(response);
      } else if (response && Array.isArray(response.data)) {
        setAccounts(response.data);
      } else {
        setAccounts([]);
      }
    } catch (err: any) {
      setAccountsError(err.message || "Failed to load connected accounts.");
    } finally {
      setIsLoadingAccounts(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    const backAction = () => {
      onBack();
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, [onBack]);

  const handleLogout = async () => {
    try {
      await GoogleSignin.signOut();
    } catch (error) {
      // Ignore if not logged in or fails
    }
    await clearAuthSession();
    onLogout();
  };

  const handleAddEmail = async () => {
    if (isConnecting) return;
    setIsConnecting(true);

    try {
      // Configure Google Sign-In with forceCodeForRefreshToken: true to get a fresh serverAuthCode
      GoogleSignin.configure({
        webClientId: appConfig.googleWebClientId,
        offlineAccess: true,
        forceCodeForRefreshToken: true,
        scopes: [...appConfig.googleScopes],
      });

      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      // Force account chooser by signing out from Google first.
      await GoogleSignin.signOut().catch(() => {});

      const result = await GoogleSignin.signIn();

      if (result.type !== "success") {
        // User cancelled or login didn't succeed
        return;
      }

      const serverAuthCode = result.data.serverAuthCode;
      if (!serverAuthCode) {
        throw new Error("Google did not return a server auth code.");
      }

      // Call backend to connect the additional Google account
      const response = await httpService.post<{ email?: string }>(
        "/api/v1/connected-accounts/google",
        {
          token: session.appToken,
          body: { serverAuthCode },
        }
      );

      const connectedEmail = response?.email ?? result.data.user.email;
      Alert.alert(
        "Success",
        connectedEmail 
          ? `Successfully connected ${connectedEmail}` 
          : "Successfully connected Gmail account"
      );

      // Refresh both user details and connected accounts list
      onAccountsChanged();
      fetchAccounts();
    } catch (error) {
      if (isErrorWithCode(error)) {
        if (error.code === statusCodes.SIGN_IN_CANCELLED) {
          return;
        }
      }
      const message = (error as any).message || String(error);
      if (message.toLowerCase().includes("cancelled") || message.toLowerCase().includes("cancel")) {
        return;
      }

      if (error instanceof ApiError && error.status === 409) {
        Alert.alert("Conflict", "This Gmail is already connected to another user");
      } else {
        Alert.alert("Error", message || "Failed to connect Gmail account");
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = (id: number, email: string) => {
    Alert.alert(
      "Disconnect Email",
      `Are you sure you want to disconnect ${email}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Disconnect",
          style: "destructive",
          onPress: () => performDisconnect(id, email),
        },
      ]
    );
  };

  const performDisconnect = async (id: number, email: string) => {
    setDisconnectingId(id);
    try {
      // TODO: Connect your backend disconnect API here when ready.
      // Example:
      // await httpService.post(`/api/v1/connected-accounts/${id}/disconnect`, {
      //   token: session.appToken,
      // });

      // Simulating API delay for UI demonstration
      await new Promise<void>(resolve => setTimeout(resolve, 800));

      Alert.alert("Success", `Successfully disconnected ${email}`);
      
      // Refresh both user details and connected accounts list
      onAccountsChanged();
      setAccounts(prev => prev.filter(item => item.id !== id));
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to disconnect account.");
    } finally {
      setDisconnectingId(null);
    }
  };

  const displayName = userDetails?.name ?? session.user.name;
  const firstName = displayName.trim().split(/\s+/)[0] || 'U';
  const firstLetter = firstName.charAt(0).toUpperCase();

  // Avatar Image rendering logic
  const pictureUrl = userDetails?.pictureUrl ?? session.user.pictureUrl;
  const showImage = pictureUrl && !imageError;

  // Helper function to assign background colors to the email avatars
  const getEmailAvatarStyle = (index: number) => {
    const bgColors = ['#1E6B4F', '#8C6D58', '#3F5A82', '#673AB7'];
    return {
      backgroundColor: bgColors[index % bgColors.length],
    };
  };

  const getSyncStatusText = (account: ConnectedAccount) => {
    const status = account.status?.toUpperCase();
    if (status === "SYNCING") {
      return "Syncing";
    }
    if (status === "FAILED") {
      return "Needs attention";
    }
    
    // SYNCED status
    if (account.lastSyncedAt) {
      return `Synced · ${formatDate(account.lastSyncedAt)}`;
    }
    return "Synced";
  };

  // Determine dynamic connected inboxes and tracked orders counts
  const inboxCount = userDetails ? userDetails.connectedInboxCount : accounts.length;
  const orderCount = userDetails ? userDetails.trackedOrderCount : 0;
  const inboxesText = `${inboxCount} ${inboxCount === 1 ? 'inbox' : 'inboxes'}`;
  const ordersText = `${orderCount} ${orderCount === 1 ? 'order' : 'orders'} tracked`;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
    },
    title: {
      color: colors.text,
      fontSize: typography.title,
      fontWeight: "700",
      marginBottom: spacing.xl,
    },
    profileRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: spacing.xl,
    },
    avatar: {
      width: 64,
      height: 64,
      borderRadius: radii.pill,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      marginRight: spacing.md,
    },
    avatarText: {
      color: colors.onPrimary,
      fontSize: 26,
      fontWeight: "600",
    },
    infoContainer: {
      justifyContent: "center",
    },
    name: {
      color: colors.text,
      fontSize: typography.body + 2,
      fontWeight: "700",
      lineHeight: 26,
    },
    stats: {
      color: colors.textMuted,
      fontSize: typography.caption,
      marginTop: spacing.xs,
    },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: spacing.md,
      marginBottom: spacing.md,
    },
    sectionTitle: {
      color: colors.text,
      fontSize: typography.label + 2,
      fontWeight: "700",
    },
    addBtn: {
      padding: spacing.xs,
      alignItems: "center",
      justifyContent: "center",
      minWidth: 32,
      minHeight: 32,
    },
    addBtnText: {
      color: colors.text,
      fontSize: 24,
      fontWeight: "300",
    },
    emailList: {
      marginBottom: spacing.lg,
    },
    emailCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.md,
      padding: spacing.md,
      marginBottom: spacing.sm,
    },
    emailAvatar: {
      width: 48,
      height: 48,
      borderRadius: radii.pill,
      alignItems: "center",
      justifyContent: "center",
      marginRight: spacing.md,
    },
    emailAvatarText: {
      color: "#FFFFFF",
      fontSize: 18,
      fontWeight: "600",
    },
    emailInfo: {
      flex: 1,
      justifyContent: "center",
    },
    emailAddress: {
      color: colors.text,
      fontSize: typography.label,
      fontWeight: "600",
    },
    emailStatusRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 2,
    },
    statusIcon: {
      marginRight: 4,
      fontSize: 12,
    },
    statusText: {
      fontSize: 12,
    },
    disconnectBtn: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      justifyContent: "center",
      alignItems: "center",
    },
    disconnectBtnText: {
      color: colors.danger,
      fontSize: 12,
      fontWeight: "600",
    },
    loadingContainer: {
      paddingVertical: spacing.xl,
      alignItems: "center",
      justifyContent: "center",
    },
    errorContainer: {
      paddingVertical: spacing.lg,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.md,
      paddingHorizontal: spacing.md,
      marginBottom: spacing.xl,
    },
    errorText: {
      color: colors.danger,
      fontSize: typography.caption,
      marginBottom: spacing.sm,
      textAlign: "center",
    },
    retryBtn: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.md,
      backgroundColor: colors.surface,
    },
    retryBtnText: {
      color: colors.text,
      fontSize: typography.caption,
      fontWeight: "600",
    },
    emptyContainer: {
      paddingVertical: spacing.xl,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderStyle: "dashed",
      borderColor: colors.border,
      borderRadius: radii.md,
      marginBottom: spacing.xl,
    },
    emptyText: {
      color: colors.textMuted,
      fontSize: typography.caption,
      fontStyle: "italic",
    },
    menuList: {
      marginTop: spacing.md,
    },
    menuItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    menuItemLeft: {
      flexDirection: "row",
      alignItems: "center",
    },
    menuIcon: {
      color: colors.text,
      fontSize: typography.body,
      marginRight: spacing.md,
      width: 24,
      textAlign: "center",
    },
    menuLabel: {
      color: colors.text,
      fontSize: typography.body,
      fontWeight: "500",
    },
    chevron: {
      color: colors.textMuted,
      fontSize: typography.body,
    },
    logoutItem: {
      borderBottomWidth: 0,
      marginTop: spacing.lg,
    },
    logoutLabel: {
      color: colors.danger,
      fontWeight: "600",
    },
    logoutIcon: {
      color: colors.danger,
    },
  });

  return (
    <AppScreen>
      <View style={styles.container}>
        <Text style={styles.title}>Profile</Text>

        {/* User Profile Header */}
        <View style={styles.profileRow}>
          <View style={[styles.avatar, { overflow: 'hidden' }]}>
            {showImage ? (
              <Image
                source={{ uri: pictureUrl }}
                style={StyleSheet.absoluteFill}
                onError={() => setImageError(true)}
              />
            ) : (
              <Text style={styles.avatarText}>{firstLetter}</Text>
            )}
          </View>
          <View style={styles.infoContainer}>
            <Text style={styles.name}>{displayName}</Text>
            <Text style={styles.stats}>
              {inboxesText} · {ordersText}
            </Text>
          </View>
        </View>

        {/* Connected Emails Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Connected emails</Text>
          <Pressable style={styles.addBtn} onPress={handleAddEmail} disabled={isConnecting}>
            {isConnecting ? (
              <ActivityIndicator size="small" color={colors.text} />
            ) : (
              <Text style={styles.addBtnText}>+</Text>
            )}
          </Pressable>
        </View>

        {/* Connected Emails List Section */}
        {isLoadingAccounts ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.text} />
          </View>
        ) : accountsError ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{accountsError}</Text>
            <Pressable style={styles.retryBtn} onPress={fetchAccounts}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </Pressable>
          </View>
        ) : accounts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No connected emails yet</Text>
          </View>
        ) : (
          <View style={styles.emailList}>
            {accounts.map((item, index) => {
              const letter = item.email.charAt(0).toUpperCase();
              const status = item.status?.toUpperCase();
              const isSyncing = status === 'SYNCING';
              const isFailed = status === 'FAILED';
              const isDeletingThis = disconnectingId === item.id;
              
              // Text color & icon styling depending on status
              let statusTextColor = colors.textMuted;
              if (isSyncing) statusTextColor = '#955800';
              if (isFailed) statusTextColor = colors.danger;

              return (
                <View key={item.id} style={styles.emailCard}>
                  <View style={[styles.emailAvatar, getEmailAvatarStyle(index)]}>
                    <Text style={styles.emailAvatarText}>{letter}</Text>
                  </View>
                  <View style={styles.emailInfo}>
                    <Text style={styles.emailAddress}>{item.email}</Text>
                    <View style={styles.emailStatusRow}>
                      {isSyncing ? (
                        <ActivityIndicator
                          size="small"
                          color="#955800"
                          style={{ marginRight: 4, transform: [{ scale: 0.8 }] }}
                        />
                      ) : (
                        <Text style={[styles.statusIcon, { color: statusTextColor }]}>
                          {isFailed ? '⚠' : '✓'}
                        </Text>
                      )}
                      <Text style={[styles.statusText, { color: statusTextColor }]}>
                        {getSyncStatusText(item)}
                      </Text>
                    </View>
                  </View>

                  {/* Disconnect button is only visible when we have 2 or more emails */}
                  {accounts.length > 1 && (
                    <Pressable 
                      style={styles.disconnectBtn} 
                      onPress={() => handleDisconnect(item.id, item.email)}
                      disabled={disconnectingId !== null}
                    >
                      {isDeletingThis ? (
                        <ActivityIndicator size="small" color={colors.danger} style={{ transform: [{ scale: 0.8 }] }} />
                      ) : (
                        <Text style={styles.disconnectBtnText}>Disconnect</Text>
                      )}
                    </Pressable>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* Options List */}
        <View style={styles.menuList}>
          <Pressable style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Text style={styles.menuIcon}>🛡</Text>
              <Text style={styles.menuLabel}>Privacy & data</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>

          <Pressable style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Text style={styles.menuIcon}>🔔</Text>
              <Text style={styles.menuLabel}>Notifications</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>

          <Pressable style={styles.menuItem}>
            <View style={styles.menuItemLeft}>
              <Text style={styles.menuIcon}>👤</Text>
              <Text style={styles.menuLabel}>Account</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>

          {/* Simple Log Out Option */}
          <Pressable style={[styles.menuItem, styles.logoutItem]} onPress={handleLogout}>
            <View style={styles.menuItemLeft}>
              <Text style={[styles.menuIcon, styles.logoutIcon]}>↪</Text>
              <Text style={[styles.menuLabel, styles.logoutLabel]}>Log out</Text>
            </View>
          </Pressable>
        </View>
      </View>
    </AppScreen>
  );
};