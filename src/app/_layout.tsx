import { Stack } from "expo-router";
import React from "react";
import { MD3DarkTheme, PaperProvider } from "react-native-paper";

const theme = {
  ...MD3DarkTheme,
  dark: true,
  mode: "adaptive" as const,
  roundness: 8,
  colors: {
    ...MD3DarkTheme.colors,

    // Brand greens
    primary: "#22c55e",
    onPrimary: "#04150a",
    primaryContainer: "#14532d",
    onPrimaryContainer: "#bbf7d0",

    secondary: "#4ade80",
    onSecondary: "#062814",
    secondaryContainer: "#1b4332",
    onSecondaryContainer: "#d8fbe4",

    tertiary: "#86efac",
    onTertiary: "#07210f",
    tertiaryContainer: "#1f5a3a",
    onTertiaryContainer: "#dcfce7",

    // True dark-mode vibe
    background: "#090d0a",
    onBackground: "#e7f5ec",

    surface: "#101511",
    onSurface: "#e7f5ec",

    surfaceVariant: "#1b241e",
    onSurfaceVariant: "#a9b8ae",

    outline: "#314238",
    outlineVariant: "#243129",

    // Status / utility
    error: "#ff8a80",
    onError: "#2a0001",
    errorContainer: "#93000a",
    onErrorContainer: "#ffdad6",

    shadow: "#000000",
    scrim: "#000000",
    inverseSurface: "#e7f5ec",
    inverseOnSurface: "#1a1f1b",
    inversePrimary: "#1faa59",
    backdrop: "rgba(0, 0, 0, 0.65)",

    // Dark elevated surfaces tinted slightly green
    elevation: {
      level0: "transparent",
      level1: "#141b16",
      level2: "#18201a",
      level3: "#1c261f",
      level4: "#1e2922",
      level5: "#223026",
    },

    surfaceDisabled: "rgba(231, 245, 236, 0.12)",
    onSurfaceDisabled: "rgba(231, 245, 236, 0.38)",
  },
};

export default function Layout() {
  return (
    <PaperProvider theme={theme}>
      <Stack screenOptions={{ headerShown: false }} />
    </PaperProvider>
  );
}