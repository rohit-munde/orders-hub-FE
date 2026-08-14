import React, { useState } from "react";
import { Text, Pressable, Image, StyleSheet } from "react-native";
import { useStyles } from '../../../../theme/AppThemeProvider';

export interface IProfileIconProps {
  firstName: string;
  pictureUrl?: string | null;
  onProfilePress: () => void;
}

export const ProfileIcon = (props: IProfileIconProps) => {
  const styles = useStyles().homeHeader;
  const { firstName, pictureUrl, onProfilePress } = props;
  const [imageError, setImageError] = useState(false);

  const clickProfile = () => {
    onProfilePress();
  };

  const showImage = pictureUrl && !imageError;

  return (
    <Pressable
      onPress={clickProfile}
      accessibilityRole="button"
      accessibilityLabel="Open profile"
      style={[styles.avatar, { overflow: 'hidden' }]}
    >
      {showImage ? (
        <Image
          source={{ uri: pictureUrl }}
          style={StyleSheet.absoluteFill}
          onError={() => setImageError(true)}
          testID="profile-image"
        />
      ) : (
        <Text style={styles.avatarText} testID="fallback-avatar-text">
          {firstName.charAt(0).toUpperCase()}
        </Text>
      )}
    </Pressable>
  );
};