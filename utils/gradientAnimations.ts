/**
 * Gradient Animation Utilities
 * Helper functions for morphing gradients and color interpolation
 */
import { interpolateColor, SharedValue } from 'react-native-reanimated';

// Gradient color presets for different screens
export const GRADIENT_PRESETS = {
  splash: {
    light: ['#FFFFFF', '#F1F5F9', '#E2E8F0', '#CBD5E1'],
    dark: ['#0F172A', '#1E293B', '#334155', '#475569'],
    brand: ['#6366F1', '#8B5CF6', '#A855F7', '#C084FC'],
  },
  login: {
    dark: ['#0A0A0A', '#1A1A2E', '#16213E', '#0F3460'],
    purple: ['#1A0B2E', '#2D1B4E', '#3E2764', '#4A2F7A'],
    blue: ['#0F2027', '#203A43', '#2C5364', '#3F6B7F'],
  },
  celebration: {
    rainbow: ['#FF6B9D', '#C44569', '#7B2869', '#FFA07A', '#FFD93D'],
    sunset: ['#FF6B6B', '#FFB347', '#FFCD3C', '#F59E0B', '#EF4444'],
    ocean: ['#4158D0', '#C850C0', '#FFCC70', '#6DD5FA', '#2980B9'],
  },
} as const;

// Animation duration presets
export const GRADIENT_DURATIONS = {
  fast: 1500,
  normal: 2500,
  slow: 4000,
  ultraSlow: 6000,
} as const;

/**
 * Create animated gradient colors based on progress value
 * @param progress - Shared value (0-1) controlling the gradient transition
 * @param colorStops - Array of color arrays to interpolate between
 */
export const createMorphingGradient = (
  progress: SharedValue<number>,
  colorStops: string[][]
): string[] => {
  'worklet';
  
  if (colorStops.length < 2) return colorStops[0] || [];
  
  const numColors = colorStops[0].length;
  const interpolatedColors: string[] = [];
  
  for (let i = 0; i < numColors; i++) {
    const colors = colorStops.map(stop => stop[i] || stop[0]);
    
    // Interpolate through all color stops
    let interpolatedColor = colors[0];
    const segmentSize = 1 / (colors.length - 1);
    
    for (let j = 0; j < colors.length - 1; j++) {
      const segmentStart = j * segmentSize;
      const segmentEnd = (j + 1) * segmentSize;
      
      if (progress.value >= segmentStart && progress.value <= segmentEnd) {
        const localProgress = (progress.value - segmentStart) / segmentSize;
        interpolatedColor = interpolateColor(
          localProgress,
          [0, 1],
          [colors[j], colors[j + 1]]
        );
        break;
      }
    }
    
    interpolatedColors.push(interpolatedColor);
  }
  
  return interpolatedColors;
};

/**
 * Interpolate between two gradient arrays
 * @param progress - Shared value (0-1)
 * @param startGradient - Starting gradient colors
 * @param endGradient - Ending gradient colors
 */
export const interpolateGradient = (
  progress: SharedValue<number>,
  startGradient: string[],
  endGradient: string[]
): string[] => {
  'worklet';
  
  const maxLength = Math.max(startGradient.length, endGradient.length);
  const interpolated: string[] = [];
  
  for (let i = 0; i < maxLength; i++) {
    const startColor = startGradient[i] || startGradient[startGradient.length - 1];
    const endColor = endGradient[i] || endGradient[endGradient.length - 1];
    
    interpolated.push(
      interpolateColor(progress.value, [0, 1], [startColor, endColor])
    );
  }
  
  return interpolated;
};

/**
 * Create shimmer effect colors
 * @param baseColor - Base gradient color
 * @param highlightColor - Shimmer highlight color
 */
export const createShimmerGradient = (
  baseColor: string,
  highlightColor: string = '#FFFFFF'
): string[] => {
  return [
    baseColor,
    baseColor,
    highlightColor,
    baseColor,
    baseColor,
  ];
};

/**
 * Generate random gradient from preset
 */
export const getRandomGradient = (
  preset: keyof typeof GRADIENT_PRESETS
): string[] => {
  const presetGradients = GRADIENT_PRESETS[preset];
  const keys = Object.keys(presetGradients) as Array<keyof typeof presetGradients>;
  const randomKey = keys[Math.floor(Math.random() * keys.length)];
  return presetGradients[randomKey];
};

/**
 * Create glass morphism gradient
 */
export const createGlassMorphGradient = (
  baseColor: string,
  opacity: number = 0.1
): string[] => {
  return [
    `${baseColor}${Math.floor(opacity * 255).toString(16).padStart(2, '0')}`,
    `${baseColor}${Math.floor(opacity * 0.5 * 255).toString(16).padStart(2, '0')}`,
  ];
};
