import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { MD3DarkTheme, MD3LightTheme, PaperProvider, configureFonts } from "react-native-paper";
import { ThemeProvider, useAppTheme } from "@/src/context/ThemeContext";

SplashScreen.preventAutoHideAsync();

const darkTheme = {
  ...MD3DarkTheme,
  dark: true,
  mode: "adaptive" as const,
  roundness: 12,
  colors: {
    ...MD3DarkTheme.colors,

    // Logo blue as primary
    primary: "#b2cbf7",
    onPrimary: "#0d1a2e",
    primaryContainer: "#1e3254",
    onPrimaryContainer: "#d4e4ff",

    secondary: "#a0bef5",
    onSecondary: "#081428",
    secondaryContainer: "#162840",
    onSecondaryContainer: "#c8dcff",

    tertiary: "#c0d8ff",
    onTertiary: "#0a1428",
    tertiaryContainer: "#1a3050",
    onTertiaryContainer: "#dceeff",

    // Neutral dark gray/black
    background: "#0d0d0d",
    onBackground: "#f2f2f2",

    surface: "#1a1a1a",
    onSurface: "#f0f0f0",

    surfaceVariant: "#252525",
    onSurfaceVariant: "#9e9e9e",

    outline: "#333333",
    outlineVariant: "#282828",

    error: "#ff8a80",
    onError: "#2a0001",
    errorContainer: "#93000a",
    onErrorContainer: "#ffdad6",

    shadow: "#000000",
    scrim: "#000000",
    inverseSurface: "#f2f2f2",
    inverseOnSurface: "#1a1a1a",
    inversePrimary: "#3a6aad",
    backdrop: "rgba(0, 0, 0, 0.72)",

    elevation: {
      level0: "transparent",
      level1: "#161616",
      level2: "#1e1e1e",
      level3: "#222222",
      level4: "#252525",
      level5: "#2a2a2a",
    },

    surfaceDisabled: "rgba(242, 242, 242, 0.12)",
    onSurfaceDisabled: "rgba(242, 242, 242, 0.38)",
  },
};

const lightTheme = {
  ...MD3LightTheme,
  dark: false,
  roundness: 12,
  colors: {
    ...MD3LightTheme.colors,

    // Logo green as primary
    primary: "#ccdcac",
    onPrimary: "#1a2e0a",
    primaryContainer: "#b4c896",
    onPrimaryContainer: "#0d1a04",

    secondary: "#d4e8b4",
    onSecondary: "#1a2e0a",
    secondaryContainer: "#c8e0a8",
    onSecondaryContainer: "#0d1a04",

    tertiary: "#dceec0",
    onTertiary: "#1a2e0a",
    tertiaryContainer: "#d0e4b0",
    onTertiaryContainer: "#0d1a04",

    background: "#f5f7f2",
    onBackground: "#1c1f1a",

    surface: "#ffffff",
    onSurface: "#1c1f1a",

    surfaceVariant: "#eef2e8",
    onSurfaceVariant: "#4a5540",

    outline: "#8a9880",
    outlineVariant: "#c8d4bc",

    error: "#ba1a1a",
    onError: "#ffffff",
    errorContainer: "#ffdad6",
    onErrorContainer: "#410002",

    shadow: "#000000",
    scrim: "#000000",
    inverseSurface: "#303830",
    inverseOnSurface: "#f0f4ec",
    inversePrimary: "#ccdcac",
    backdrop: "rgba(0, 0, 0, 0.55)",

    elevation: {
      level0: "transparent",
      level1: "#f0f4ec",
      level2: "#e8f0e4",
      level3: "#e0ecdc",
      level4: "#dcead8",
      level5: "#d4e4d0",
    },

    surfaceDisabled: "rgba(28, 31, 26, 0.12)",
    onSurfaceDisabled: "rgba(28, 31, 26, 0.38)",
  },
};

const fontConfig = {
  default: {
    regular: { fontFamily: "WorkSans-Regular", fontWeight: "400" as const },
    medium:  { fontFamily: "WorkSans-Bold",    fontWeight: "700" as const },
    bold:    { fontFamily: "WorkSans-Bold",    fontWeight: "700" as const },
    heavy:   { fontFamily: "WorkSans-Bold",    fontWeight: "700" as const },
  },
};

function ThemedApp() {
  const { mode } = useAppTheme();

  const [fontsLoaded] = useFonts({
    "WorkSans-Bold":    require("../assets/WorkSans-Bold.ttf"),
    "WorkSans-Regular": require("../assets/WorkSans-Regular.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  const baseTheme = mode === "dark" ? darkTheme : lightTheme;
  const theme = {
    ...baseTheme,
    fonts: configureFonts({ config: fontConfig }),
  };

  return (
    <PaperProvider theme={theme}>
      <Stack screenOptions={{ headerShown: false }} />
    </PaperProvider>
  );
}

export default function Layout() {
  return (
    <ThemeProvider>
      <ThemedApp />
    </ThemeProvider>
  );
}
