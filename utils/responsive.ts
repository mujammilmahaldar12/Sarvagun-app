import { Dimensions, Platform } from 'react-native';
import { useState, useEffect } from 'react';

const { width, height } = Dimensions.get('window');

// Breakpoints based on common mobile device sizes
export const breakpoints = {
  xs: 320,   // Small phones
  sm: 375,   // iPhone SE, smaller Android
  md: 414,   // iPhone Pro, standard Android
  lg: 768,   // Tablets (portrait)
  xl: 1024,  // Tablets (landscape)
  xxl: 1200, // Large tablets/desktop
} as const;

// Device type detection
export const deviceType = {
  isSmallPhone: width <= breakpoints.xs,
  isPhone: width < breakpoints.lg,
  isTablet: width >= breakpoints.lg,
  isLargeTablet: width >= breakpoints.xl,
  isLandscape: width > height,
  isPortrait: width <= height,
} as const;

// Responsive dimension helpers
export const responsive = {
  // Screen dimensions
  screenWidth: width,
  screenHeight: height,
  
  // Responsive width (percentage of screen width)
  wp: (percentage: number) => (width * percentage) / 100,
  
  // Responsive height (percentage of screen height)
  hp: (percentage: number) => (height * percentage) / 100,
  
  // Responsive font size based on screen width
  rf: (size: number) => {
    if (deviceType.isSmallPhone) return size * 0.9;
    if (deviceType.isTablet) return size * 1.2;
    return size;
  },
  
  // Responsive spacing based on screen size
  rs: (size: number) => {
    if (deviceType.isSmallPhone) return size * 0.9;
    if (deviceType.isTablet) return size * 1.3;
    return size;
  },
  
  // Grid columns based on screen width
  getGridCols: () => {
    if (deviceType.isSmallPhone) return 1;
    if (deviceType.isTablet && deviceType.isLandscape) return 3;
    if (deviceType.isTablet) return 2;
    return 2;
  },
  
  // Safe area padding
  getSafeAreaPadding: () => {
    const base = 16;
    if (Platform.OS === 'ios') {
      return {
        paddingTop: deviceType.isPhone ? 44 : 24, // iPhone notch consideration
        paddingBottom: deviceType.isPhone ? 34 : base, // Home indicator
        paddingHorizontal: base,
      };
    }
    return {
      paddingTop: Platform.OS === 'android' ? 24 : base,
      paddingBottom: base,
      paddingHorizontal: base,
    };
  },
  
  // Container max width for large screens
  getContainerMaxWidth: () => {
    if (deviceType.isLargeTablet) return 1200;
    if (deviceType.isTablet) return 768;
    return width;
  },
  
  // Responsive card width for grids
  getCardWidth: (columns: number = 2, spacing: number = 16) => {
    const totalSpacing = spacing * (columns + 1);
    return (width - totalSpacing) / columns;
  },
} as const;

// Breakpoint-based responsive styles
export const createResponsiveStyles = <T extends Record<string, any>>(styles: {
  xs?: T;
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
  default: T;
}): T => {
  if (width >= breakpoints.xl && styles.xl) return { ...styles.default, ...styles.xl };
  if (width >= breakpoints.lg && styles.lg) return { ...styles.default, ...styles.lg };
  if (width >= breakpoints.md && styles.md) return { ...styles.default, ...styles.md };
  if (width >= breakpoints.sm && styles.sm) return { ...styles.default, ...styles.sm };
  if (width >= breakpoints.xs && styles.xs) return { ...styles.default, ...styles.xs };
  return styles.default;
};

// Orientation change handler
export const useResponsiveDimensions = () => {
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });

    return () => subscription?.remove?.();
  }, []);

  return {
    ...dimensions,
    isLandscape: dimensions.width > dimensions.height,
    isPortrait: dimensions.width <= dimensions.height,
    isTablet: dimensions.width >= breakpoints.lg,
    isPhone: dimensions.width < breakpoints.lg,
  };
};

// Export commonly used values
export const SCREEN_WIDTH = width;
export const SCREEN_HEIGHT = height;
export const IS_SMALL_PHONE = deviceType.isSmallPhone;
export const IS_TABLET = deviceType.isTablet;