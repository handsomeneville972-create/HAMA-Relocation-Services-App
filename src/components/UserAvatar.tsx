import React, { useMemo } from 'react';
import { View, Image, StyleSheet, StyleProp, ImageStyle, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { type ThemeColors } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';

const PRAVATAR_RE = /(^|\.)pravatar\.cc/;

export const isDefaultAvatar = (uri?: string | null): boolean =>
  !uri || PRAVATAR_RE.test(uri);

interface UserAvatarProps {
  uri?: string | null;
  size: number;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
  showDefaultBorder?: boolean;
}

/**
 * User avatar with a universal default fallback.
 * When the user has no photo (or only a legacy pravatar URL),
 * renders the HAMA premium-gradient ring with a neutral person icon.
 */
export const UserAvatar: React.FC<UserAvatarProps> = ({
  uri,
  size,
  style,
  imageStyle,
  showDefaultBorder = false,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const radius = size / 2;
  const innerSize = showDefaultBorder ? size - 8 : size;

  if (!isDefaultAvatar(uri)) {
    return (
      <View
        style={[
          style,
          {
            width: size,
            height: size,
            borderRadius: radius,
            overflow: 'hidden',
          },
        ]}
      >
        <Image source={{ uri: uri as string }} style={[{ width: size, height: size }, imageStyle]} />
      </View>
    );
  }

  const iconSize = size * 0.44;
  const inner = (
    <View
      style={{
        width: innerSize,
        height: innerSize,
        borderRadius: innerSize / 2,
        backgroundColor: colors.bgElevated,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Ionicons name="person" size={iconSize} color={colors.textTertiary} />
    </View>
  );

  return (
    <View
      style={[
        style,
        {
          width: size,
          height: size,
          borderRadius: radius,
          alignItems: 'center',
          justifyContent: 'center',
        },
      ]}
    >
      {showDefaultBorder ? (
        <LinearGradient
          colors={colors.gradientPremium}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.borderGradient,
            {
              width: size,
              height: size,
              borderRadius: radius,
            },
          ]}
        >
          {inner}
        </LinearGradient>
      ) : (
        inner
      )}
    </View>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  borderGradient: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});