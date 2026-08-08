import { useWindowDimensions } from 'react-native';

export const BREAKPOINTS = {
  phone: 640,
  tablet: 1024,
  wide: 1280,
} as const;

export const CONTENT_MAX_WIDTH = 1200;

export type ResponsiveBreakpoint = 'phone' | 'tablet' | 'desktop';

export interface ResponsiveInfo {
  width: number;
  height: number;
  breakpoint: ResponsiveBreakpoint;
  isPhone: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isWide: boolean;
  /** Column count for feed grids: 1 / 2 / 3 / 4. */
  gridColumns: number;
  /** Horizontal content padding for the current breakpoint. */
  padding: number;
  contentMaxWidth: number;
}

/**
 * Live viewport info that re-renders on resize / rotation / window drag.
 * Use instead of module-scope `Dimensions.get('window')`.
 */
export const useResponsive = (): ResponsiveInfo => {
  const { width, height } = useWindowDimensions();

  const isPhone = width < BREAKPOINTS.phone;
  const isTablet = width >= BREAKPOINTS.phone && width < BREAKPOINTS.tablet;
  const isDesktop = width >= BREAKPOINTS.tablet;
  const isWide = width >= BREAKPOINTS.wide;

  return {
    width,
    height,
    breakpoint: isPhone ? 'phone' : isTablet ? 'tablet' : 'desktop',
    isPhone,
    isTablet,
    isDesktop,
    isWide,
    gridColumns: isPhone ? 1 : isTablet ? 2 : isWide ? 4 : 3,
    padding: isPhone ? 16 : isTablet ? 24 : 32,
    contentMaxWidth: CONTENT_MAX_WIDTH,
  };
};

/**
 * Width of a single grid cell for `columns` columns laid out inside a
 * container of `width` px with `gap` px gutters and `horizontalPadding` px
 * of outer padding.
 */
export const fluidWidth = (
  width: number,
  columns: number,
  gap: number,
  horizontalPadding = 0
): number => {
  return (width - horizontalPadding * 2 - gap * (columns - 1)) / columns;
};
