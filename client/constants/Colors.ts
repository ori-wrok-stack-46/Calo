// Pure emerald color scheme
const tintColorLight = "#059669"; // emerald-600
const tintColorDark = "#10b981"; // emerald-500

// Status colors
const successColor = "#10b981";
const errorColor = "#ef4444";
const warningColor = "#f59e0b";

export const Colors = {
  light: {
    text: "#064e3b", // emerald-900 for better readability
    background: "#FAFBFC", // emerald-50 for subtle emerald background
    surface: "#f8fafc",
    tint: tintColorLight,
    icon: "#6ee7b7", // emerald-300
    tabIconDefault: "#6ee7b7", // emerald-300
    tabIconSelected: tintColorLight,
    tabInactive: "#6b7280", // gray-500 for contrast
    border: "#a7f3d0", // emerald-200
    card: "#d1fae5", // emerald-100
    primary: tintColorLight,
    emerald: "#059669", // emerald-600
    emerald50: "#ecfdf5", // emerald-50
    emerald500: "#10b981", // emerald-500
    emerald600: "#059669", // emerald-600
    emerald700: "#047857", // emerald-700
    onSurface: "#064e3b", // emerald-900
    outline: "#a7f3d0", // emerald-200
    shadow: "rgba(5, 150, 105, 0.15)", // emerald-600 with opacity
    error: "#dc2626", // red-600 (keeping for contrast)
    primaryLight: "#a7f3d0", // emerald-200
    textSecondary: "#047857", // emerald-700
    success: successColor,
    glass: "rgba(255, 255, 255, 0.8)",
    glassStroke: "rgba(255, 255, 255, 0.2)",
    backdrop: "rgba(0, 0, 0, 0.1)",
    destructive: errorColor,
    warning: warningColor,
  },
  dark: {
    text: "#d1fae5", // emerald-100
    background: "#022c22", // emerald-950
    surface: "#1e293b",
    tint: tintColorDark,
    icon: "#34d399", // emerald-400
    tabIconDefault: "#34d399", // emerald-400
    tabIconSelected: tintColorDark,
    tabInactive: "#6b7280", // gray-500
    border: "#064e3b", // emerald-900
    card: "#065f46", // emerald-800
    primary: tintColorDark,
    emerald: "#10b981", // emerald-500
    emerald50: "#022c22", // emerald-950 (darkest)
    emerald500: "#10b981", // emerald-500
    emerald600: "#059669", // emerald-600
    emerald700: "#047857", // emerald-700
    onSurface: "#d1fae5", // emerald-100
    outline: "#065f46", // emerald-800
    shadow: "rgba(16, 185, 129, 0.25)", // emerald-500 with opacity
    error: "#ef4444", // red-500 (keeping for contrast)
    primaryLight: "#065f46", // emerald-800
    textSecondary: "#6ee7b7", // emerald-300
    success: successColor,
    glass: "rgba(6, 78, 59, 0.8)", // emerald-900 with opacity
    glassStroke: "rgba(110, 231, 183, 0.1)", // emerald-300 with opacity
    backdrop: "rgba(0, 0, 0, 0.3)",
    destructive: errorColor,
    warning: warningColor,
  },
};
export const EmeraldSpectrum = {
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

  // Additional emerald variations for more design flexibility
  emeraldLight: "#6ee7b7", // emerald-300
  emeraldMedium: "#10b981", // emerald-500
  emeraldDark: "#047857", // emerald-700
  emeraldDeep: "#064e3b", // emerald-900
  emeraldPale: "#ecfdf5", // emerald-50
  emeraldRich: "#059669", // emerald-600
  emeraldBright: "#34d399", // emerald-400
  emeraldSubtle: "#d1fae5", // emerald-100
  emeraldAccent: "#a7f3d0", // emerald-200
  emeraldIntense: "#065f46", // emerald-800
  emeraldDeepest: "#022c22", // emerald-950
};

// Pure emerald spectrum utility colors
