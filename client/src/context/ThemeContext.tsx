import React, { createContext, useContext, useState, useEffect } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Refined teal color scheme for nutrition app (using emerald names)
const tintColorLight = "#0d9488"; // teal-600 (vibrant and professional)
const tintColorDark = "#5eead4"; // teal-300 (softer for dark mode)

export const Colors = {
  light: {
    destructive: "#ef4444",
    // Core text and backgrounds
    text: "#1f2937", // gray-800 (warmer black for readability)
    background: "#ffffff", // pure white for cleanliness
    tint: tintColorLight,

    // Icons and interactive elements
    icon: "#6b7280", // gray-500 (neutral icons)
    tabIconDefault: "#9ca3af", // gray-400 (inactive tabs)
    tabIconSelected: tintColorLight, // teal-600 (active)
    tabInactive: "#d1d5db", // gray-300 (subtle inactive)

    // Borders and surfaces
    border: "#e5e7eb", // gray-200 (clean borders)
    card: "#f9fafb", // gray-50 (subtle card background)
    surface: "#ffffff", // pure white surfaces
    surfaceVariant: "#f3f4f6", // gray-100 (variant surfaces)
    onSurface: "#111827", // gray-900 (strong contrast)
    onSurfaceVariant: "#6b7280", // gray-500 (muted on surface)
    outline: "#d1d5db", // gray-300 (subtle outlines)

    // Brand colors
    primary: tintColorLight, // teal-600
    primaryContainer: "#ccfbf1", // teal-100 (container background)
    onPrimary: "#ffffff", // white text on primary
    onPrimaryContainer: "#042f2e", // teal-900 (text on primary container)
    primaryLight: "#99f6e4", // teal-200 (soft accent)
    success: "#0d9488", // teal-600 (success states)
    disabled: "#d1d5db",

    // Emerald variations (now using teal values)
    emerald: "#0d9488", // teal-600 (main brand)
    emerald50: "#f0fdfa", // teal-50 (very light)
    emerald100: "#ccfbf1", // teal-100 (light)
    emerald200: "#99f6e4", // teal-200 (soft)
    emerald500: "#14b8a6", // teal-500
    emerald600: "#0d9488", // teal-600 (main)
    emerald700: "#0f766e", // teal-700 (dark)

    // Secondary text
    textSecondary: "#6b7280", // gray-500 (muted text)
    textTertiary: "#9ca3af", // gray-400 (very subtle)
    subtext: "#6b7280", // gray-500 (subtext for labels, captions)
    muted: "#9ca3af", // gray-400 (muted elements, placeholders)

    // Special elements
    shadow: "#000000", // shadow color
    glass: "rgba(255, 255, 255, 0.85)",
    glassStroke: "rgba(255, 255, 255, 0.3)",
    backdrop: "rgba(0, 0, 0, 0.05)",

    // Status colors
    error: "#ef4444", // red-500
    warning: "#f59e0b", // amber-500
    info: "#3b82f6", // blue-500
  },
  dark: {
    destructive: "#f87171",
    // Core text and backgrounds
    text: "#f9fafb", // gray-50 (soft white)
    background: "#111827", // gray-900 (rich black)
    tint: tintColorDark,

    // Icons and interactive elements
    icon: "#9ca3af", // gray-400 (visible icons)
    tabIconDefault: "#6b7280", // gray-500 (inactive tabs)
    tabIconSelected: tintColorDark, // teal-300 (active)
    tabInactive: "#4b5563", // gray-600 (muted inactive)

    // Borders and surfaces
    border: "#374151", // gray-700 (visible borders)
    card: "#1f2937", // gray-800 (elevated surfaces)
    surface: "#1f2937", // gray-800 (card surfaces)
    surfaceVariant: "#374151", // gray-700 (variant surfaces)
    onSurface: "#f3f4f6", // gray-100 (high contrast)
    onSurfaceVariant: "#d1d5db", // gray-300 (muted on surface)
    outline: "#4b5563", // gray-600 (subtle outlines)

    // Brand colors
    primary: tintColorDark, // teal-300
    primaryContainer: "#134e4a", // teal-800 (container background)
    onPrimary: "#042f2e", // teal-900 (text on primary)
    onPrimaryContainer: "#ccfbf1", // teal-100 (text on primary container)
    primaryLight: "#042f2e", // teal-900 (dark mode accent)
    success: "#5eead4", // teal-300 (success states)
    disabled: "#4b5563",

    // Emerald variations (now using teal values)
    emerald: "#5eead4", // teal-300 (adjusted for dark)
    emerald50: "#042f2e", // teal-900 (darkest)
    emerald100: "#134e4a", // teal-800
    emerald200: "#0f766e", // teal-700
    emerald500: "#5eead4", // teal-300 (main for dark)
    emerald600: "#14b8a6", // teal-500
    emerald700: "#7dd3fc", // teal-200 (lighter for dark)

    // Secondary text
    textSecondary: "#d1d5db", // gray-300 (readable secondary)
    textTertiary: "#9ca3af", // gray-400 (subtle text)
    subtext: "#9ca3af", // gray-400 (subtext for labels, captions)
    muted: "#6b7280", // gray-500 (muted elements, placeholders)

    // Special elements
    shadow: "#000000", // shadow color
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
  // Teal-based color spectrum (keeping emerald names for compatibility)
  emerald50: "#f0fdfa", // teal-50 - Lightest background
  emerald100: "#ccfbf1", // teal-100 - Very light hover bg
  emerald200: "#99f6e4", // teal-200 - Soft light borders
  emerald300: "#5eead4", // teal-300 - Medium light icons
  emerald400: "#2dd4bf", // teal-400 - Slightly muted base
  emerald500: "#14b8a6", // teal-500 - Main brand color
  emerald600: "#0d9488", // teal-600 - Slightly darker hover
  emerald700: "#0f766e", // teal-700 - Darker active states
  emerald800: "#134e4a", // teal-800 - Much darker text contrast
  emerald900: "#042f2e", // teal-900 - Deep dark mode bg
  emerald950: "#022c22", // Custom deep teal - Very deep headers, dark accents

  // Semantic mappings (still using emerald names for compatibility)
  fresh: "#14b8a6", // teal-500 - main color
  healthy: "#2dd4bf", // teal-400 - slightly lighter
  natural: "#5eead4", // teal-300 - medium-light
  organic: "#99f6e4", // teal-200 - soft & light
  growth: "#0f766e", // teal-700 - deeper tone
  vitality: "#0d9488", // teal-600 - energetic tone

  // Additional mappings
  nutrition: "#14b8a6", // teal-500 - main nutrition accent
  supplement: "#2dd4bf", // teal-400 - secondary
  goal: "#0f766e", // teal-700 - progress tracking
  progress: "#0d9488", // teal-600 - ongoing progress
};

interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
  colors: typeof Colors.light | typeof Colors.dark;
  theme: "light" | "dark";
  emeraldSpectrum: typeof EmeraldSpectrum;
  isLoaded: boolean;
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
      // Fallback to system preference on error
      setIsDark(systemColorScheme === "dark");
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
        isLoaded,
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
