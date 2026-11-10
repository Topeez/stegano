import { create } from "zustand";

type ThemePreference = "system" | "light" | "dark";

type ThemeStore = {
  themePreference: ThemePreference;
  setThemePreference: (value: ThemePreference) => void;
};

export const useThemeStore = create<ThemeStore>((set) => ({
  themePreference: "system",
  setThemePreference: (themePreference) => set({ themePreference }),
}));