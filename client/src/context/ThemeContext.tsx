import React, { createContext, useContext, useState, useEffect } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Refined emerald color scheme for nutrition app
const tintColorLight = "#10b981"; // emerald-500 (more vibrant)
const tintColorDark = "#34d399"; // emerald-400 (softer for dark mode)

export const Colors = {
  light: {
    detructive: "#ef4444",
    // Core text and backgrounds
    text: "#1f2937", // gray-800 (warmer black for readability)
    background: "#ffffff", // pure white for cleanliness
    tint: tintColorLight,

    // Icons and interactive elements
    icon: "#6b7280", // gray-500 (neutral icons)
    tabIconDefault: "#9ca3af", // gray-400 (inactive tabs)
    tabIconSelected: tintColorLight, // emerald-500 (active)
    tabInactive: "#d1d5db", // gray-300 (subtle inactive)

    // Borders and surfaces
    border: "#e5e7eb", // gray-200 (clean borders)
    card: "#f9fafb", // gray-50 (subtle card background)
    surface: "#ffffff", // pure white surfaces
    onSurface: "#111827", // gray-900 (strong contrast)
    outline: "#d1d5db", // gray-300 (subtle outlines)

    // Brand colors
    primary: tintColorLight, // emerald-500
    primaryLight: "#a7f3d0", // emerald-200 (soft accent)
    success: "#10b981", // emerald-500 (success states)
    disabled: "#d1d5db",
    // Emerald variations
    emerald: "#10b981", // emerald-500 (main brand)
    emerald50: "#ecfdf5", // very light emerald
    emerald100: "#d1fae5", // light emerald
    emerald200: "#a7f3d0", // soft emerald
    emerald500: "#10b981", // main emerald
    emerald600: "#059669", // deeper emerald
    emerald700: "#047857", // dark emerald

    // Secondary text
    textSecondary: "#6b7280", // gray-500 (muted text)
    textTertiary: "#9ca3af", // gray-400 (very subtle)
    subtext: "#6b7280", // gray-500 (subtext for labels, captions)
    muted: "#9ca3af", // gray-400 (muted elements, placeholders)

    // Special elements
    shadow: "rgba(0, 0, 0, 0.08)", // subtle shadow
    glass: "rgba(255, 255, 255, 0.85)",
    glassStroke: "rgba(255, 255, 255, 0.3)",
    backdrop: "rgba(0, 0, 0, 0.05)",

    // Status colors
    error: "#ef4444", // red-500
    warning: "#f59e0b", // amber-500
    info: "#3b82f6", // blue-500
  },
  dark: {
    // Core text and backgrounds
    text: "#f9fafb", // gray-50 (soft white)
    background: "#111827", // gray-900 (rich black)
    tint: tintColorDark,

    // Icons and interactive elements
    icon: "#9ca3af", // gray-400 (visible icons)
    tabIconDefault: "#6b7280", // gray-500 (inactive tabs)
    tabIconSelected: tintColorDark, // emerald-400 (active)
    tabInactive: "#4b5563", // gray-600 (muted inactive)

    // Borders and surfaces
    border: "#374151", // gray-700 (visible borders)
    card: "#1f2937", // gray-800 (elevated surfaces)
    surface: "#1f2937", // gray-800 (card surfaces)
    onSurface: "#f3f4f6", // gray-100 (high contrast)
    outline: "#4b5563", // gray-600 (subtle outlines)

    // Brand colors
    primary: tintColorDark, // emerald-400
    primaryLight: "#065f46", // emerald-800 (dark mode accent)
    success: "#34d399", // emerald-400 (success states)
    isabled: "#d1d5db",
    // Emerald variations
    emerald: "#34d399", // emerald-400 (adjusted for dark)
    emerald50: "#064e3b", // emerald-900 (darkest)
    emerald100: "#065f46", // emerald-800
    emerald200: "#047857", // emerald-700
    emerald500: "#34d399", // emerald-400 (main for dark)
    emerald600: "#10b981", // emerald-500
    emerald700: "#6ee7b7", // emerald-300 (lighter for dark)

    // Secondary text
    textSecondary: "#d1d5db", // gray-300 (readable secondary)
    textTertiary: "#9ca3af", // gray-400 (subtle text)
    subtext: "#9ca3af", // gray-400 (subtext for labels, captions)
    muted: "#6b7280", // gray-500 (muted elements, placeholders)

    // Special elements
    shadow: "rgba(0, 0, 0, 0.25)", // deeper shadow
    glass: "rgba(31, 41, 55, 0.8)", // gray-800 glass
    glassStroke: "rgba(75, 85, 99, 0.3)", // gray-600 stroke
    backdrop: "rgba(0, 0, 0, 0.4)",

    // Status colors
    error: "#f87171", // red-400 (softer for dark)
    warning: "#fbbf24", // amber-400
    info: "#60a5fa", // blue-400
  },
};

export const EmeraldSpectrum = {
  // Core emerald palette
  emerald50: "#ecfdf5", // lightest - backgrounds
  emerald100: "#d1fae5", // very light - subtle highlights
  emerald200: "#a7f3d0", // light - accents and borders
  emerald300: "#6ee7b7", // medium light - icons
  emerald400: "#34d399", // medium - primary for dark mode
  emerald500: "#10b981", // main - primary brand color
  emerald600: "#059669", // medium dark - hover states
  emerald700: "#047857", // dark - active states
  emerald800: "#065f46", // darker - text on light backgrounds
  emerald900: "#064e3b", // darkest - strong text
  emerald950: "#022c22", // deepest - dark mode backgrounds

  // Semantic emerald colors for nutrition app
  fresh: "#10b981", // emerald-500 (fresh foods, vegetables)
  healthy: "#34d399", // emerald-400 (health indicators)
  natural: "#6ee7b7", // emerald-300 (natural ingredients)
  organic: "#a7f3d0", // emerald-200 (organic labels)
  growth: "#047857", // emerald-700 (progress, goals)
  vitality: "#059669", // emerald-600 (energy, nutrients)

  // Additional utility colors
  nutrition: "#10b981", // main nutrition color
  supplement: "#34d399", // supplement indicators
  goal: "#047857", // goal achievement
  progress: "#059669", // progress tracking
};

interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
  colors: typeof Colors.light | typeof Colors.dark;
  theme: "light" | "dark";
  emeraldSpectrum: typeof EmeraldSpectrum;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const systemColorScheme = useColorScheme();
  const [isDark, setIsDark] = useState(systemColorScheme === "dark");
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem("theme_preference");
      if (savedTheme !== null) {
        setIsDark(savedTheme === "dark");
      } else {
        // Use system preference if no saved preference
        setIsDark(systemColorScheme === "dark");
      }
    } catch (error) {
      console.error("Error loading theme preference:", error);
    } finally {
      setIsLoaded(true);
    }
  };

  const toggleTheme = async () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    try {
      await AsyncStorage.setItem(
        "theme_preference",
        newTheme ? "dark" : "light"
      );
    } catch (error) {
      console.error("Error saving theme preference:", error);
    }
  };

  const colors = isDark ? Colors.dark : Colors.light;
  const theme = isDark ? "dark" : "light";

  // Don't render children until theme is loaded to prevent flash
  if (!isLoaded) {
    return null;
  }

  return (
    <ThemeContext.Provider
      value={{
        isDark,
        toggleTheme,
        colors,
        theme,
        emeraldSpectrum: EmeraldSpectrum,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
