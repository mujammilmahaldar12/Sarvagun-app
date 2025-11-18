import { MD3LightTheme, MD3DarkTheme } from "react-native-paper";
import { COLORS } from "./colors";

export const LightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: COLORS.primary,
    background: COLORS.backgroundLight,
    surface: COLORS.surfaceLight,
    text: COLORS.textLight,
    outline: COLORS.borderLight,

    // elevation values are used by Paper components
    elevation: {
      level1: COLORS.shadowLight,
      level2: COLORS.shadowLight,
    },
  },
};

export const DarkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: COLORS.primarySoft,
    background: COLORS.backgroundDark,
    surface: COLORS.surfaceDark,
    text: COLORS.textDark,
    outline: COLORS.borderDark,

    elevation: {
      level1: COLORS.shadowDark,
      level2: COLORS.shadowDark,
    },
  },
};
