// Emerald and green color scheme
const tintColorLight = "#059669"; // emerald-600
const tintColorDark = "#10b981"; // emerald-500

export const Colors = {
  light: {
    text: "#064e3b", // emerald-900 for better readability
    background: "#f0fdf4", // green-50 for subtle green background
    tint: tintColorLight,
    icon: "#86efac", // green-300
    tabIconDefault: "#86efac", // green-300
    tabIconSelected: tintColorLight,
    tabInactive: "#6b7280", // gray-500 for contrast
    border: "#bbf7d0", // green-200
    card: "#dcfce7", // green-100
    primary: tintColorLight,
    emerald: "#059669", // emerald-600
    emerald50: "#ecfdf5", // emerald-50
    emerald500: "#10b981", // emerald-500
    emerald600: "#059669", // emerald-600
    emerald700: "#047857", // emerald-700
    surface: "#f7fee7", // lime-50 for variation
    onSurface: "#064e3b", // emerald-900
    outline: "#bbf7d0", // green-200
    shadow: "rgba(5, 150, 105, 0.15)", // emerald-600 with opacity
    error: "#dc2626", // red-600 (keeping for contrast)
    primaryLight: "#a7f3d0", // emerald-200
    textSecondary: "#047857", // emerald-700
    success: "#16a34a", // green-600
  },
  dark: {
    text: "#d1fae5", // green-100
    background: "#011b17",
    tint: tintColorDark,
    icon: "#4ade80", // green-400
    tabIconDefault: "#4ade80", // green-400
    tabIconSelected: tintColorDark,
    tabInactive: "#6b7280", // gray-500
    border: "#064e3b", // emerald-900
    card: "#053f34", // Custom dark emerald
    primary: tintColorDark,
    emerald: "#10b981", // emerald-500
    emerald50: "#022c22", // emerald-950 (darkest)
    emerald500: "#10b981", // emerald-500
    emerald600: "#059669", // emerald-600
    emerald700: "#047857", // emerald-700
    surface: "#064e3b", // emerald-900
    onSurface: "#d1fae5", // green-100
    outline: "#065f46", // emerald-800
    shadow: "rgba(16, 185, 129, 0.25)", // emerald-500 with opacity
    error: "#ef4444", // red-500 (keeping for contrast)
    primaryLight: "#065f46", // emerald-800
    textSecondary: "#6ee7b7", // emerald-300
    success: "#22c55e", // green-500
  },
};

// Additional emerald/green utility colors you might want to use
export const EmraldGreenExtended = {
  // Green spectrum
  green50: "#f0fdf4",
  green100: "#dcfce7",
  green200: "#bbf7d0",
  green300: "#86efac",
  green400: "#4ade80",
  green500: "#22c55e",
  green600: "#16a34a",
  green700: "#15803d",
  green800: "#166534",
  green900: "#14532d",
  green950: "#052e16",

  // Emerald spectrum
  emerald50: "#ecfdf5",
  emerald100: "#d1fae5",
  emerald200: "#a7f3d0",
  emerald300: "#6ee7b7",
  emerald400: "#34d399",
  emerald500: "#10b981",
  emerald600: "#059669",
  emerald700: "#047857",
  emerald800: "#065f46",
  emerald900: "#064e3b",
  emerald950: "#022c22",

  // Lime spectrum (for accents)
  lime50: "#f7fee7",
  lime100: "#ecfccb",
  lime200: "#d9f99d",
  lime300: "#bef264",
  lime400: "#a3e635",
  lime500: "#84cc16",
  lime600: "#65a30d",
  lime700: "#4d7c0f",
  lime800: "#365314",
  lime900: "#1a2e05",
  lime950: "#0f1629",
};
