import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { RADIUS, SPACING, type ThemeColors } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';

interface Category {
  name: string;
  icon: string;
  subcategories?: string[];
}

interface CategoryGridProps {
  categories: Category[];
  selected?: string;
  onSelect: (name: string) => void;
  variant?: 'grid' | 'list';
}

export const CategoryGrid: React.FC<CategoryGridProps> = ({ categories, selected, onSelect, variant = 'grid' }) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (variant === 'list') {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.listContainer}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.name}
            onPress={() => onSelect(cat.name)}
            activeOpacity={0.8}
          >
            <View style={[styles.listItem, selected === cat.name && styles.listItemSelected]}>
              <LinearGradient
                colors={selected === cat.name ? [colors.primary, colors.primaryLight] : colors.gradientCard}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.listGradient}
              >
                <Text style={[styles.listItemText, selected === cat.name && styles.listItemTextSelected]}>
                  {cat.name}
                </Text>
              </LinearGradient>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  }

  return (
    <View style={styles.grid}>
      {categories.map((cat) => (
        <TouchableOpacity
          key={cat.name}
          onPress={() => onSelect(cat.name)}
          activeOpacity={0.8}
          style={[styles.gridItem, selected === cat.name && styles.gridItemSelected]}
        >
          <LinearGradient
            colors={selected === cat.name ? [colors.primary, colors.primaryDark] : colors.gradientCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gridGradient}
          >
            <Ionicons
              name={(cat.icon || 'grid-outline') as any}
              size={24}
              color={selected === cat.name ? '#fff' : colors.primaryLight}
            />
            <Text style={[styles.gridLabel, selected === cat.name && styles.gridLabelSelected]}>
              {cat.name}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: SPACING.md,
  },
  gridItem: {
    width: '47%',
    aspectRatio: 1.6,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  gridItemSelected: {
    borderColor: colors.primary,
    borderWidth: 1.5,
  },
  gridGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  gridLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  gridLabelSelected: {
    color: '#fff',
  },
  // List variant
  listContainer: {
    paddingHorizontal: SPACING.md,
    gap: 8,
    paddingBottom: SPACING.sm,
  },
  listItem: {
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  listItemSelected: {
    borderColor: colors.primary,
  },
  listGradient: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  listItemText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  listItemTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
});
