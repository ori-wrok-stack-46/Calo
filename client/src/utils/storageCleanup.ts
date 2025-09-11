import AsyncStorage from "@react-native-async-storage/async-storage";

export class StorageCleanupService {
  // Clean up old cache entries
  static async cleanupCache(): Promise<void> {
    try {
      console.log("🧹 Starting storage cleanup...");

      const keys = await AsyncStorage.getAllKeys();
      const keysToDelete: string[] = [];

      // Remove old cache entries (older than 7 days)
      const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

      for (const key of keys) {
        try {
          if (
            key.startsWith("cache_") ||
            key.startsWith("temp_") ||
            key.startsWith("query-") ||
            key.startsWith("mutation-")
          ) {
            const item = await AsyncStorage.getItem(key);
            if (item) {
              try {
                const parsed = JSON.parse(item);
                if (parsed.timestamp && parsed.timestamp < oneWeekAgo) {
                  keysToDelete.push(key);
                }
              } catch {
                // If we can't parse it, it's probably old/corrupted
                keysToDelete.push(key);
              }
            }
          }
        } catch (error) {
          console.warn(`Failed to process key ${key}:`, error);
        }
      }

      // Remove in batches to prevent overwhelming storage
      const batchSize = 10;
      for (let i = 0; i < keysToDelete.length; i += batchSize) {
        const batch = keysToDelete.slice(i, i + batchSize);
        try {
          await AsyncStorage.multiRemove(batch);
          console.log(`🗑️ Cleaned up batch of ${batch.length} entries`);
        } catch (error) {
          console.error(`Failed to clean batch:`, error);
          // Try individual removal
          for (const key of batch) {
            try {
              await AsyncStorage.removeItem(key);
            } catch (e) {
              console.warn(`Failed to remove ${key}:`, e);
            }
          }
        }
      }

      if (keysToDelete.length > 0) {
        console.log(
          `🗑️ Total cleaned up ${keysToDelete.length} old cache entries`
        );
      }
    } catch (error) {
      console.error("❌ Storage cleanup failed:", error);
    }
  }

  // Emergency cleanup when storage is full
  static async emergencyCleanup(): Promise<void> {
    try {
      console.log("🚨 Starting emergency storage cleanup...");

      const keys = await AsyncStorage.getAllKeys();
      const keysToDelete: string[] = [];

      // Remove all cache entries, temp files, and query cache
      for (const key of keys) {
        if (
          key.startsWith("cache_") ||
          key.startsWith("temp_") ||
          key.startsWith("query-") ||
          key.startsWith("mutation-") ||
          key.includes("analytics") ||
          key.includes("metrics")
        ) {
          keysToDelete.push(key);
        }
      }

      // Remove in small batches
      const batchSize = 5;
      for (let i = 0; i < keysToDelete.length; i += batchSize) {
        const batch = keysToDelete.slice(i, i + batchSize);
        try {
          await AsyncStorage.multiRemove(batch);
        } catch (error) {
          // Individual removal as fallback
          for (const key of batch) {
            try {
              await AsyncStorage.removeItem(key);
            } catch (e) {
              console.warn(`Failed to remove ${key} in emergency cleanup:`, e);
            }
          }
        }
      }

      console.log(
        `🚨 Emergency cleanup removed ${keysToDelete.length} entries`
      );
    } catch (error) {
      console.error("❌ Emergency cleanup failed:", error);
    }
  }

  // Get storage usage info
  static async getStorageInfo(): Promise<{ used: number; available: number }> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      let totalSize = 0;

      // Sample a few keys to estimate total size
      const sampleKeys = keys.slice(0, Math.min(keys.length, 20));
      let sampleSize = 0;

      for (const key of sampleKeys) {
        try {
          const value = await AsyncStorage.getItem(key);
          if (value) {
            sampleSize += new Blob([key + value]).size;
          }
        } catch (error) {
          // Skip failed keys
        }
      }

      // Estimate total size based on sample
      if (sampleKeys.length > 0) {
        totalSize = Math.round((sampleSize / sampleKeys.length) * keys.length);
      }

      return {
        used: totalSize,
        available: Math.max(0, 5 * 1024 * 1024 - totalSize), // Assume 5MB limit
      };
    } catch {
      return { used: 0, available: 5 * 1024 * 1024 };
    }
  }
}
