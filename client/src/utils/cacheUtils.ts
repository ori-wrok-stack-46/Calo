import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { queryClient } from "@/src/services/queryClient";

export class CacheUtils {
  /**
   * Clear all application data and caches
   */
  static async clearAllData(): Promise<void> {
    try {
      console.log("🧹 Starting complete data clearance...");

      // 1. Clear TanStack Query cache
      queryClient.clear();
      queryClient.invalidateQueries();
      console.log("✅ TanStack Query cleared");

      // 2. Clear AsyncStorage
      await AsyncStorage.clear();
      console.log("✅ AsyncStorage cleared");

      // 3. Clear SecureStore (mobile only)
      if (Platform.OS !== "web") {
        try {
          const SecureStore = require("expo-secure-store");
          const commonKeys = [
            "auth_token_secure",
            "user_data",
            "questionnaire_data",
            "app_preferences",
            "notification_settings",
            "language_preference",
            "theme_preference",
          ];

          for (const key of commonKeys) {
            try {
              await SecureStore.deleteItemAsync(key);
            } catch (e) {
              // Key might not exist, continue
            }
          }
          console.log("✅ SecureStore cleared");
        } catch (error) {
          console.warn("⚠️ SecureStore cleanup failed:", error);
        }
      }

      // 4. Clear web storage (if on web)
      if (Platform.OS === "web") {
        try {
          localStorage.clear();
          sessionStorage.clear();
          // Clear IndexedDB if used
          if ("indexedDB" in window) {
            // Note: This is a simplified approach
            // In production, you might want to clear specific databases
          }
          console.log("✅ Web storage cleared");
        } catch (error) {
          console.warn("⚠️ Web storage cleanup failed:", error);
        }
      }

      // 5. Clear any cached images or files
      // This would depend on your specific image caching implementation

      console.log("✅ Complete data clearance successful");
    } catch (error) {
      console.error("❌ Error during data clearance:", error);
      throw error;
    }
  }

  /**
   * Clear only user-specific data (keep app preferences)
   */
  static async clearUserData(): Promise<void> {
    try {
      console.log("🧹 Starting user data clearance...");

      // Clear user-specific queries
      queryClient.invalidateQueries({ queryKey: ["user"] });
      queryClient.invalidateQueries({ queryKey: ["questionnaire"] });
      queryClient.invalidateQueries({ queryKey: ["nutrition"] });
      queryClient.invalidateQueries({ queryKey: ["meals"] });
      queryClient.invalidateQueries({ queryKey: ["calendar"] });

      // Clear user-specific storage keys
      const userKeys = [
        "user_data",
        "questionnaire_data",
        "nutrition_data",
        "meal_plans",
        "calendar_events",
      ];

      for (const key of userKeys) {
        try {
          await AsyncStorage.removeItem(key);
        } catch (e) {
          console.warn(`⚠️ Failed to remove ${key}:`, e);
        }
      }

      if (Platform.OS !== "web") {
        try {
          const SecureStore = require("expo-secure-store");
          for (const key of userKeys) {
            try {
              await SecureStore.deleteItemAsync(key);
            } catch (e) {
              // Key might not exist, continue
            }
          }
        } catch (error) {
          console.warn("⚠️ SecureStore user data cleanup failed:", error);
        }
      }

      console.log("✅ User data clearance successful");
    } catch (error) {
      console.error("❌ Error during user data clearance:", error);
      throw error;
    }
  }

  /**
   * Clear only cache data (keep user data)
   */
  static async clearCacheOnly(): Promise<void> {
    try {
      console.log("🧹 Starting cache-only clearance...");

      // Clear TanStack Query cache
      queryClient.clear();

      // Clear cache-specific storage
      const cacheKeys = ["api_cache", "image_cache", "temp_data"];

      for (const key of cacheKeys) {
        try {
          await AsyncStorage.removeItem(key);
        } catch (e) {
          console.warn(`⚠️ Failed to remove cache ${key}:`, e);
        }
      }

      console.log("✅ Cache clearance successful");
    } catch (error) {
      console.error("❌ Error during cache clearance:", error);
      throw error;
    }
  }
}
