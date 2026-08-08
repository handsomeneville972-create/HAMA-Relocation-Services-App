import React, { useState } from 'react';
import { View, ViewStyle, LayoutChangeEvent } from 'react-native';
import { useResponsive, fluidWidth } from '../utils/responsive';

interface ResponsiveGridProps {
  children: React.ReactNode;
  /** Override the breakpoint-derived column count. */
  columns?: number;
  /** Gap between cells, default 12. */
  gap?: number;
  style?: ViewStyle;
}

/**
 * Wraps children into a wrapping row grid. Cell width is measured live from
 * the grid's own layout, so nesting inside ResponsiveContainer (or anywhere
 * else) just works. Children should be `width: '100%'`-style cards.
 */
export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  columns,
  gap = 12,
  style,
}) => {
  const { gridColumns } = useResponsive();
  const [gridWidth, setGridWidth] = useState(0);

  const colCount = Math.max(1, columns ?? gridColumns);
  const itemWidth =
    gridWidth > 0 ? fluidWidth(gridWidth, colCount, gap) : '48%';

  const handleLayout = (e: LayoutChangeEvent) => {
    const next = e.nativeEvent.layout.width;
    if (Math.abs(next - gridWidth) > 0.5) setGridWidth(next);
  };

  return (
    <View
      onLayout={handleLayout}
      style={[
        {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap,
          width: '100%',
        },
        style,
      ]}
    >
      {React.Children.map(children, (child) => (
        <View style={{ width: itemWidth }}>{child}</View>
      ))}
    </View>
  );
};
