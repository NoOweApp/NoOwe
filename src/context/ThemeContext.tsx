import { Directory, File, Paths } from "expo-file-system/next";
import React, { createContext, useCallback, useContext } from "react";

export type ThemeMode = "dark" | "light";

interface ThemeContextValue {
  mode: ThemeMode;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: "dark",
  toggleMode: () => {},
});

function getPrefsFile() {
  const folder = new Directory(Paths.document, "NoOwe");
  if (!folder.exists) folder.create();
  const file = new File(folder, "preferences.json");
  return file;
}

function readSavedMode(): ThemeMode {
  try {
    const folder = new Directory(Paths.document, "NoOwe");
    if (!folder.exists) return "dark";
    const file = new File(folder, "preferences.json");
    if (!file.exists) return "dark";
    const text = file.textSync();
    if (text && text.trim()) {
      const parsed = JSON.parse(text);
      if (parsed.mode === "light" || parsed.mode === "dark") return parsed.mode;
    }
  } catch {}
  return "dark";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = React.useState<ThemeMode>(() => readSavedMode());

  const toggleMode = useCallback(() => {
    setMode((current) => {
      const next: ThemeMode = current === "dark" ? "light" : "dark";
      try {
        const file = getPrefsFile();
        if (!file.exists) file.create();
        file.write(JSON.stringify({ mode: next }));
      } catch {}
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ mode, toggleMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useAppTheme = () => useContext(ThemeContext);
