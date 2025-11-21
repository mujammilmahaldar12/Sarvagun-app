/**
 * Enhanced useTheme hook
 * Integrates with the new design system and theme store
 */
import { useThemeStore } from '@/store/themeStore';
import { designSystem } from '@/constants/designSystem';

export function useTheme() {
  const themeStore = useThemeStore();
  
  return {
    // Theme colors - direct access to current theme
    theme: themeStore.colors,
    
    // Theme state
    isDark: themeStore.isDark,
    mode: themeStore.mode,
    
    // Theme actions
    toggleTheme: themeStore.toggleMode,
    setTheme: themeStore.setMode,
    
    // Design system access
    spacing: designSystem.spacing,
    typography: designSystem.typography,
    borderRadius: designSystem.borderRadius,
    shadows: designSystem.shadows,
    layout: designSystem.layout,
    iconSizes: designSystem.iconSizes,
    
    // Helper functions from store
    getStatusColor: themeStore.getStatusColor,
    getCardStyle: themeStore.getCardStyle,
    getInputStyle: themeStore.getInputStyle,
    getButtonStyle: themeStore.getButtonStyle,
  };
}
