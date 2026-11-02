import { StyleSheet, View } from "react-native";

export function CopyIcon({
    color,
    backgroundColor,
}: {
    color: string;
    backgroundColor: string;
}): React.JSX.Element {
    return (
        <View style={copyStyles.container}>
            <View style={[copyStyles.sheetBack, { borderColor: color }]} />
            <View
                style={[
                    copyStyles.sheetFront,
                    { borderColor: color, backgroundColor: backgroundColor },
                ]}
            />
        </View>
    );
}

const copyStyles = StyleSheet.create({
    container: {
        width: 11,
        height: 12,
        position: 'relative',
    },
    sheetBack: {
        width: 7,
        height: 9,
        borderWidth: 1.0,
        borderRadius: 1,
        backgroundColor: 'transparent',
        position: 'absolute',
        top: 0,
        left: 0,
    },
    sheetFront: {
        width: 7,
        height: 9,
        borderWidth: 1.0,
        borderRadius: 1,
        position: 'absolute',
        bottom: 0,
        right: 0,
    },
});
