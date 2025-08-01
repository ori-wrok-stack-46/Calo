import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/src/store";
import { PushNotificationService } from "@/src/services/pushNotifications";
import NotificationService from "@/src/services/notificationService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "react-i18next";

interface AppInitializationState {
  isLoading: boolean;
  isAuthenticated: boolean;
  userProfile: any;
  error: string | null;
}

export const useAppInitialization = (): AppInitializationState => {
  const dispatch = useDispatch<AppDispatch>();
  const { i18n } = useTranslation();
  const queryClient = useQueryClient();
  const { user } = useSelector((state: RootState) => state.auth);

  // Initialize app settings
  const { data: appSettings, isLoading: settingsLoading } = useQuery({
    queryKey: ["appInitialization"],
    queryFn: async () => {
      try {
        // Load saved language
        const savedLanguage = await AsyncStorage.getItem("@userLanguage");
        if (savedLanguage && savedLanguage !== i18n.language) {
          await i18n.changeLanguage(savedLanguage);
        }

        // Load authentication state
        const authToken = await AsyncStorage.getItem("authToken");
        const isAuthenticated = !!authToken;

        return {
          language: savedLanguage,
          isAuthenticated,
          authToken,
        };
      } catch (error) {
        throw new Error("Failed to initialize app");
      }
    },
    staleTime: Infinity, // App initialization only happens once
    retry: 3,
  });

  // Load user profile if authenticated
  const {
    data: userProfile,
    isLoading: profileLoading,
    error,
  } = useQuery({
    queryKey: ["userProfile"],
    queryFn: async () => {
      const { userAPI } = await import("../src/services/api");
      return userAPI.getUserProfile();
    },
    enabled: !!appSettings?.isAuthenticated,
    staleTime: 10 * 60 * 1000,
  });

  useEffect(() => {
    const initializeApp = async () => {
      console.log("App initialized");

      // Show user online notification if app is properly initialized
      if (appSettings?.isAuthenticated || user) {
        NotificationService.showUserOnline();
      }

      // Register for push notifications
      const token =
        await PushNotificationService.registerForPushNotifications();

      if (token && user) {
        // Send token to backend if needed
        console.log("Push notification token:", token);

        // Schedule notifications based on user's questionnaire data
        try {
          // You'll need to fetch user questionnaire data from your backend
          const response = await fetch(
            `${process.env.EXPO_PUBLIC_API_URL}/api/questionnaire/user`,
            {
              headers: {
                Authorization: `Bearer `,
              },
            }
          );

          if (response.ok) {
            const questionnaire = await response.json();
            await PushNotificationService.scheduleMealReminders(
              questionnaire.data
            );
            await PushNotificationService.scheduleWaterReminder();
            await PushNotificationService.scheduleWeeklyProgress();
          }
        } catch (error) {
          console.error("Error setting up notifications:", error);
        }
      }
    };

    if (appSettings && !settingsLoading) {
      initializeApp();
    }
  }, [dispatch, user, appSettings, settingsLoading]);

  return {
    isLoading: settingsLoading || profileLoading,
    isAuthenticated: appSettings?.isAuthenticated || false,
    userProfile,
    error: error?.message || null,
  };
};

export default useAppInitialization;
