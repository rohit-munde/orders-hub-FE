import { useEffect } from "react";
import { BackHandler, Text, View } from "react-native"

interface ProfilePageProps {
    onBack: () => void;
}

export const ProfilePage = (props: ProfilePageProps) => {

    useEffect(() => {
        const backAction = (): boolean => {
            props.onBack();

            return true;
        }

        const backHandler = BackHandler.addEventListener(
            "hardwareBackPress",
            backAction
        );

        return () => backHandler.remove();
    }, [props.onBack]);

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: 20 }}>Profile Screen</Text>
            {/* No manual back button needed now! */}
        </View>
    );
}