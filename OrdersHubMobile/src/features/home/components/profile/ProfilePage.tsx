import React, { useEffect } from "react";
import { View, Text, StyleSheet, BackHandler } from "react-native";
import { AppScreen } from "../../../../components/layout/AppScreen";
import { useAppTheme, useStyles } from "../../../../theme/AppThemeProvider";
import { AuthSession } from "../../../auth/types";
import { spacing, radii, typography } from "../../../../theme/tokens";

interface ProfilePageProps {
    session: AuthSession;
    onBack: () => void;
}

export const ProfilePage = ({ session, onBack }: ProfilePageProps) => {
    const styles = useStyles().ProfilePage;

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

    const firstName = session.user.name.trim().split(/\s+/)[0] || 'U';
    const firstLetter = firstName.charAt(0).toUpperCase();

    return (
        <AppScreen>
            <View style={styles.container}>
                <Text style={styles.title}>Profile</Text>

                <View style={styles.profileRow}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{firstLetter}</Text>
                    </View>

                    <View style={styles.infoContainer}>
                        <Text style={styles.name}>{session.user.name}</Text>
                        {/* Using mock values matching the design screenshot */}
                        <Text style={styles.stats}>3 inboxes · 230 orders tracked</Text>
                    </View>
                </View>

                <View>
                    <Text style={styles.name}>Connected accounts</Text>
                    {/* List 
                        reusable component for account -> disconnect button as well
                    List */}
                </View>
            </View>
        </AppScreen>
    );
};