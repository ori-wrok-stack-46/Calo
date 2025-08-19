import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import en from "./locales/en.json";
import he from "./locales/he.json";

const languageDetector = {
  type: "languageDetector",
  async: true,
  detect: async (callback: (lng: string) => void) => {
    try {
      // Check if running in browser environment (not SSR)
      if (
        typeof window !== "undefined" &&
        typeof localStorage !== "undefined"
      ) {
        const savedLanguage = localStorage.getItem("user-language");
        callback(savedLanguage || "en");
      } else if (typeof window === "undefined") {
        // Server-side or React Native environment
        try {
          const savedLanguage = await AsyncStorage.getItem("user-language");
          callback(savedLanguage || "en");
        } catch {
          callback("en");
        }
      } else {
        // Browser but no localStorage
        callback("en");
      }
    } catch (error) {
      console.error("Error detecting language:", error);
      callback("en");
    }
  },
  cacheUserLanguage: async (lng: string) => {
    try {
      // Check if running in browser environment (not SSR)
      if (
        typeof window !== "undefined" &&
        typeof localStorage !== "undefined"
      ) {
        localStorage.setItem("user-language", lng);
      } else if (typeof window === "undefined") {
        // Server-side or React Native environment
        try {
          await AsyncStorage.setItem("user-language", lng);
        } catch (error) {
          console.error("Error saving language to AsyncStorage:", error);
        }
      }
    } catch (error) {
      console.error("Error saving language:", error);
    }
  },
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      he: { translation: he },
    },
    fallbackLng: "en",
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
