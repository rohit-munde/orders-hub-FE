import { Text, View, Button } from "react-native"

import { useStyles } from '../../../../theme/AppThemeProvider';

export interface IProfileIconProps {
    firstName: string;
    onProfilePress: () => void;
}

export const ProfileIcon = (props: IProfileIconProps) => {
    const styles = useStyles().homeHeader;
    const { firstName, onProfilePress } = props;

    const clickProfile = () => {
        onProfilePress();
    }

    return <View style={styles.avatar}>
        <Button
            onPress={clickProfile}
            title={firstName.charAt(0).toUpperCase()}
            color="#00000000"
            accessibilityLabel="Open profile"
        />
    </View>
}