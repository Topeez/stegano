/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://unistyl.es/), etc.
 */

import '../global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: "#003E1F",
    textInverted: "#ffffff",
    textSecondary: "#3F6B55",
    primary: "#003E1F",
    primaryText: "#ffffff",
    accent: "#D90429",
    accentText: "#ffffff",
    background: "#F5FBF8",
    backgroundElement: "#D5F2E3",
    backgroundSelected: "#B7E3CD",
    border: "#9CD3B8",
    gradient: ["#003E1F", "#1F7A52"],
    snow: "#73BA9B",
  },
  dark: {
    text: "#D5F2E3",
    textInverted: "#003E1F",
    textSecondary: "#8FC1AA",
    primary: "#73BA9B",
    primaryText: "#00140A",
    accent: "#EF233C",
    accentText: "#ffffff",
    background: "#00140A",
    backgroundElement: "#07281A",
    backgroundSelected: "#0E3F29",
    border: "#1B5A3D",
    gradient: ["#73BA9B", "#A5DBC1"],
    snow: "#D5F2E3",
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

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
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
