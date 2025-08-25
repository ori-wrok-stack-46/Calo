import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

const MAX_SECURE_STORE_SIZE = 2048; // bytes

// Update setSecureItem to handle SecureStore size limits and fallbacks
export const setSecureItem = async (
  key: string,
  value: string
): Promise<void> => {
  try {
    // Check if value is too large for SecureStore (2048 bytes limit)
    if (Buffer.byteLength(value, "utf8") > MAX_SECURE_STORE_SIZE) {
      console.warn(
        `📦 Value for key "${key}" is larger than ${MAX_SECURE_STORE_SIZE} bytes, using AsyncStorage instead`
      );
      await AsyncStorage.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
    // Clean up any previous async storage entry if SecureStore is used
    await AsyncStorage.removeItem(key).catch(() => {});
  } catch (error) {
    console.error(`Failed to set secure item ${key}:`, error);
    // Fallback to AsyncStorage if SecureStore fails
    try {
      console.log(`🔒 Fallback storage for key "${key}" using AsyncStorage`);
      await AsyncStorage.setItem(key, value);
    } catch (fallbackError) {
      console.error(`Fallback storage also failed for ${key}:`, fallbackError);
      throw fallbackError;
    }
  }
};

// Update getSecureItem to handle AsyncStorage fallback for large values
export const getSecureItem = async (key: string): Promise<string | null> => {
  try {
    const value = await SecureStore.getItemAsync(key);
    if (value !== null) return value;

    // Try AsyncStorage as fallback for large values or if SecureStore failed previously
    return await AsyncStorage.getItem(key);
  } catch (error) {
    console.error(`Failed to get secure item ${key}:`, error);
    // Try AsyncStorage as fallback
    try {
      return await AsyncStorage.getItem(key);
    } catch (fallbackError) {
      console.error(`Fallback storage also failed for ${key}:`, fallbackError);
      return null;
    }
  }
};

// Remove data from both storage types
export const removeSecureItem = async (key: string): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(key).catch(() => {});
    await AsyncStorage.removeItem(key).catch(() => {});
  } catch (error) {
    console.error(`Error removing data for key "${key}":`, error);
  }
};
