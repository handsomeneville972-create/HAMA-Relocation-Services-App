import React from 'react';
import { View, ViewStyle } from 'react-native';
import { useResponsive } from '../utils/responsive';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  /** Override the desktop max width (defaults to 1200). */
  maxWidth?: number;
  /** Override the breakpoint padding entirely (defaults to 16/24/32). */
  padding?: number;
}

/**
 * Centers content and caps its width so feeds and forms don't stretch
 * into unusable slabs on tablets and desktop.
 */
export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  style,
  maxWidth,
  padding,
}) => {
  const { contentMaxWidth, padding: basePadding } = useResponsive();
  return (
    <View
      style={[
        {
          width: '100%',
          maxWidth: maxWidth ?? contentMaxWidth,
          alignSelf: 'center',
          paddingHorizontal: padding ?? basePadding,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};
