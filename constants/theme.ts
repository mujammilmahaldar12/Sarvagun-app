/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';
export const THEME = {
  default: {
    light: {
      background: "#ffffff",
      foreground: "#000000",
      primary: "#7f16ff",
    },
    dark: {
      background: "#000000",
      foreground: "#ffffff",
      primary: "#a855f7",
    }
  },

  winter: {
    light: {
      background: "#E0F7FA",
      foreground: "#004D40",
      primary: "#00ACC1",
    },
    dark: {
      background: "#004D40",
      foreground: "#E0F7FA",
      primary: "#26C6DA",
    }
  },

  ganpati: {
    light: {
      background: "#FFF3E0",
      foreground: "#BF360C",
      primary: "#E65100",
    },
    dark: {
      background: "#3E2723",
      foreground: "#FFCCBC",
      primary: "#FF7043",
    }
  }
};


export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
