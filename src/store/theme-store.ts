import { create } from "zustand";

type ThemePreference = "system" | "light" | "dark";

type ThemeStore = {
  themePreference: ThemePreference;
  setThemePreference: (value: ThemePreference) => void;
  snow: boolean;
  toggleSnow: () => void;
};

export const useThemeStore = create<ThemeStore>((set) => ({
  themePreference: "system",
  setThemePreference: (themePreference) => set({ themePreference }),
  snow: true,
  toggleSnow: () => set((s) => ({ snow: !s.snow })),
}));