import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useResponsive, CONTENT_MAX_WIDTH } from '../utils/responsive';
import { COLORS, RADIUS, SHADOWS } from '../constants/theme';

/**
 * Breakpoint-aware tab bar.
 * - Phone: floating 85px bottom bar (same look as before).
 * - Tablet/desktop: in-flow top bar with brand mark + labeled links.
 */
export const ResponsiveTabBar: React.FC<BottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const { isDesktop } = useResponsive();

  const visibleRoutes = state.routes.filter((route) => {
    const style = descriptors[route.key]?.options.tabBarItemStyle as
      | { display?: string }
      | undefined;
    return style?.display !== 'none';
  });

  const renderTab = (
    route: (typeof state.routes)[number],
    index: number,
    { compact }: { compact: boolean }
  ) => {
    const { options } = descriptors[route.key];
    const labelRaw = options.tabBarLabel ?? options.title ?? route.name;
    const label = typeof labelRaw === 'string' ? labelRaw : route.name;
    const isFocused = state.index === index;
    const color = isFocused
      ? options.tabBarActiveTintColor ?? COLORS.primary
      : options.tabBarInactiveTintColor ?? 'rgba(255, 255, 255, 0.65)';
    const badge = options.tabBarBadge;

    const onPress = () => {
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });
      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(route.name, route.params);
      }
    };

    const onLongPress = () => {
      navigation.emit({ type: 'tabLongPress', target: route.key });
    };

    if (compact) {
      return (
        <Pressable
          key={route.key}
          accessibilityRole="button"
          accessibilityState={isFocused ? { selected: true } : {}}
          accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
          onPress={onPress}
          onLongPress={onLongPress}
          style={({ pressed }) => [
            styles.bottomTab,
            { opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <View style={[styles.tabIconContainer, isFocused && styles.tabIconActive]}>
            {options.tabBarIcon?.({ focused: isFocused, color, size: 22 })}
          </View>
          <Text style={[styles.tabLabel, { color }]} numberOfLines={1}>
            {label}
          </Text>
          {badge != null && Number(badge) > 0 && (
            <View style={styles.bottomBadge}>
              <Text style={styles.bottomBadgeText}>
                {Number(badge) > 99 ? '99+' : badge}
              </Text>
            </View>
          )}
        </Pressable>
      );
    }

    return (
      <Pressable
        key={route.key}
        accessibilityRole="button"
        accessibilityState={isFocused ? { selected: true } : {}}
        accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
        onPress={onPress}
        onLongPress={onLongPress}
        style={({ pressed }) => [
          styles.topTab,
          isFocused && styles.topTabActive,
          pressed && styles.topTabPressed,
        ]}
      >
        {options.tabBarIcon?.({ focused: isFocused, color, size: 18 })}
        <Text style={[styles.topTabLabel, { color }]} numberOfLines={1}>
          {label}
        </Text>
        {badge != null && Number(badge) > 0 && (
          <View style={styles.topBadge}>
            <Text style={styles.topBadgeText}>
              {Number(badge) > 99 ? '99+' : badge}
            </Text>
          </View>
        )}
      </Pressable>
    );
  };

  if (isDesktop) {
    return (
      <LinearGradient
        colors={['#0A0A0F', '#050508']}
        style={[styles.topBar, { paddingTop: insets.top }]}
      >
        <View style={styles.topBarInner}>
          <View style={styles.brand}>
            <View style={styles.brandIcon}>
              <Ionicons name="home" size={16} color={COLORS.primary} />
            </View>
            <Text style={styles.brandText}>HAMA</Text>
          </View>
          <View style={styles.topTabs}>
            {visibleRoutes.map((route, index) => renderTab(route, index, { compact: false }))}
          </View>
        </View>
      </LinearGradient>
    );
  }

  return (
    <View style={[styles.bottomBar, { paddingBottom: 28, height: 85 }]}>
      {visibleRoutes.map((route, index) => renderTab(route, index, { compact: true }))}
    </View>
  );
};

const styles = StyleSheet.create({
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 8,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    elevation: 0,
    shadowOpacity: 0,
  },
  bottomTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  tabIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabIconActive: {
    backgroundColor: 'rgba(255, 107, 0, 0.15)',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  bottomBadge: {
    position: 'absolute',
    top: 2,
    right: '22%',
    backgroundColor: COLORS.secondary,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  bottomBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  topBar: {
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  topBarInner: {
    maxWidth: CONTENT_MAX_WIDTH,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    paddingVertical: 10,
    gap: 16,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 107, 0, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 2,
  },
  topTabs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  topTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
  },
  topTabActive: {
    backgroundColor: 'rgba(255, 107, 0, 0.12)',
  },
  topTabPressed: {
    opacity: 0.7,
  },
  topTabLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  topBadge: {
    backgroundColor: COLORS.secondary,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  topBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
});
