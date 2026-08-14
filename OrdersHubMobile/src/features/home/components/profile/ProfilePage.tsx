import React, { useEffect } from "react";
import { View, Text, StyleSheet, BackHandler, Pressable } from "react-native";
import { AppScreen } from "../../../../components/layout/AppScreen";
import { useAppTheme } from "../../../../theme/AppThemeProvider";
import { AuthSession } from "../../../auth/types";
import { spacing, radii, typography } from "../../../../theme/tokens";
import { clearAuthSession } from "../../../auth/services/secureTokenStorage";
import { GoogleSignin } from "@react-native-google-signin/google-signin";

interface ProfilePageProps {
    session: AuthSession;
    onBack: () => void;
    onLogout: () => void;
}

export const ProfilePage = ({ session, onBack, onLogout }: ProfilePageProps) => {
    const { theme } = useAppTheme();
    const colors = theme.colors;

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

    const firstName = session.user.name.trim().split(/\s+/)[0] || 'U';
    const firstLetter = firstName.charAt(0).toUpperCase();

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
            marginBottom: spacing.sm,
        },
        sectionTitle: {
            color: colors.text,
            fontSize: typography.label,
            fontWeight: "600",
        },
        manageText: {
            color: colors.textMuted,
            fontSize: typography.caption,
        },
        inboxPlaceholder: {
            paddingVertical: spacing.md,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderStyle: "dashed",
            borderColor: colors.border,
            borderRadius: radii.md,
            marginBottom: spacing.xl,
        },
        placeholderText: {
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
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{firstLetter}</Text>
                    </View>
                    <View style={styles.infoContainer}>
                        <Text style={styles.name}>{session.user.name}</Text>
                        <Text style={styles.stats}>3 inboxes · 230 orders tracked</Text>
                    </View>
                </View>

                {/* Connected Inboxes Header */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Connected inboxes</Text>
                    <Text style={styles.manageText}>Manage</Text>
                </View>

                {/* Commented space / Placeholder for Connected Inboxes List */}
                <View style={styles.inboxPlaceholder}>
                    {/* TODO: Connected accounts component list goes here */}
                    <Text style={styles.placeholderText}>Connected inboxes list component goes here</Text>
                </View>

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