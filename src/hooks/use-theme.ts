import { Colors } from "@/constants/theme";
import { useThemeStore } from "@/store/theme-store";
import { useColorScheme } from "react-native";

export function useTheme() {
  const systemScheme = useColorScheme();
  const { themePreference } = useThemeStore();
  const scheme = themePreference === "system" ? (systemScheme ?? "light") : themePreference;
  return Colors[scheme === "dark" ? "dark" : "light"];
}