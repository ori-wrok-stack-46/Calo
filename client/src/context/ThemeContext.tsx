import React, { createContext, useContext, useState, useEffect } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors } from "@/constants/Colors";

interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
  colors: typeof Colors.light | typeof Colors.dark;
  theme: "light" | "dark";
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

  // Enhanced colors object with additional properties
  const enhancedColors = {
    ...colors,
    // Ensure we have all the properties needed by components
    emerald: colors.emerald || colors.emerald500,
    emerald500: colors.emerald500,
    emerald600: colors.emerald600,
    emerald700: colors.emerald700,
    primary: colors.primary || colors.emerald,
    textSecondary: colors.textSecondary || colors.icon,
    card: colors.card || colors.surface,
    border: colors.border || colors.outline,
    shadow: colors.shadow || "rgba(0, 0, 0, 0.1)",
  };

  // Don't render children until theme is loaded to prevent flash
  if (!isLoaded) {
    return null;
  }

  return (
    <ThemeContext.Provider
      value={{ isDark, toggleTheme, colors: enhancedColors, theme }}
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
