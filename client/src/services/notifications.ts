import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Device from "expo-device";
import Constants from "expo-constants";

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface NotificationSettings {
  pushNotifications: boolean;
  mealReminders: boolean;
  waterReminders: boolean;
  exerciseReminders: boolean;
  weeklyReports: boolean;
  goalAchievements: boolean;
  menuRating: boolean;
}

const defaultSettings: NotificationSettings = {
  pushNotifications: true,
  mealReminders: true,
  waterReminders: true,
  exerciseReminders: false,
  weeklyReports: true,
  goalAchievements: true,
  menuRating: true,
};

export class NotificationService {
  static async requestPermissions(): Promise<boolean> {
    try {
      // In Expo Go, handle permissions gracefully
      if (__DEV__ && !Device.isDevice) {
        console.log(
          "Development mode in simulator - skipping notification permissions"
        );
        return true;
      }

      if (!Device.isDevice) {
        console.log("Must use physical device for Push Notifications");
        return false;
      }

      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        console.log("Notification permissions not granted");
        return false;
      }

      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("meal-reminders", {
          name: "Meal Reminders",
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#10b981",
          sound: "default",
          enableLights: true,
          enableVibrate: true,
        });

        await Notifications.setNotificationChannelAsync("menu-rating", {
          name: "Menu Rating",
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#f59e0b",
          sound: "default",
          enableLights: true,
          enableVibrate: true,
        });

        await Notifications.setNotificationChannelAsync("water-reminders", {
          name: "Water Reminders",
          importance: Notifications.AndroidImportance.DEFAULT,
          vibrationPattern: [0, 250],
          lightColor: "#3b82f6",
          sound: "default",
        });
      }

      return true;
    } catch (error) {
      console.error("Error requesting notification permissions:", error);
      return false;
    }
  }

  static async registerForPushNotifications(): Promise<string | null> {
    try {
      // Skip push notifications in Expo Go but allow local notifications
      if (!Device.isDevice) {
        console.log("Push notifications not available in simulator");
        return null;
      }

      if (__DEV__ && !Device.isDevice) {
        console.log("Development mode in simulator - using mock token");
        return "dev-token-simulator";
      }

      if (__DEV__) {
        console.log(
          "Development mode on device - attempting local notifications"
        );
        const hasPermissions = await this.requestPermissions();
        if (hasPermissions) {
          return "dev-token-device";
        }
        return null;
      }

      const hasPermissions = await this.requestPermissions();
      if (!hasPermissions) {
        return null;
      }

      // Get project ID from app config
      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ||
        Constants?.easConfig?.projectId ||
        "your-project-id-here"; // Fallback

      if (!projectId || projectId === "your-project-id-here") {
        console.warn(
          "Using fallback project ID - push notifications may not work properly"
        );
        return null;
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      console.log("Push token:", token.data);
      await AsyncStorage.setItem("expo_push_token", token.data);
      return token.data;
    } catch (error) {
      console.error("Error getting push token:", error);
      return null;
    }
  }

  static async getSettings(): Promise<NotificationSettings> {
    try {
      const settings = await AsyncStorage.getItem("notification_settings");
      return settings ? JSON.parse(settings) : defaultSettings;
    } catch (error) {
      console.error("Error loading notification settings:", error);
      return defaultSettings;
    }
  }

  static async updateSettings(settings: NotificationSettings): Promise<void> {
    try {
      await AsyncStorage.setItem(
        "notification_settings",
        JSON.stringify(settings)
      );
    } catch (error) {
      console.error("Error saving notification settings:", error);
    }
  }

  static async scheduleMealReminders(userQuestionnaire: any): Promise<void> {
    try {
      const settings = await this.getSettings();
      if (!settings.mealReminders) return;

      // Cancel existing meal reminders
      await this.cancelNotificationsByType("meal_reminder");

      if (!userQuestionnaire?.meal_times) {
        console.log("No meal times configured");
        return;
      }

      const mealTimes = userQuestionnaire.meal_times
        .split(",")
        .map((time: string) => time.trim());
      const mealNames = ["Breakfast", "Lunch", "Dinner", "Snack", "Late Snack"];

      for (let i = 0; i < mealTimes.length; i++) {
        const timeStr = mealTimes[i];
        const [hours, minutes] = timeStr.split(":").map(Number);

        if (isNaN(hours) || isNaN(minutes)) continue;

        const mealName = mealNames[i] || `Meal ${i + 1}`;

        await Notifications.scheduleNotificationAsync({
          content: {
            title: `🍽️ ${mealName} Time!`,
            body: `Don't forget to log your ${mealName.toLowerCase()} and track your nutrition goals!`,
            data: {
              type: "meal_reminder",
              mealType: mealName,
              mealIndex: i,
              time: timeStr,
            },
            categoryIdentifier: "meal",
            sound: "default",
          },
          trigger: {
            hour: hours,
            minute: minutes,
            repeats: true,
            channelId: "meal-reminders",
          },
        });
      }

      console.log(`Scheduled ${mealTimes.length} meal reminders`);
    } catch (error) {
      console.error("Error scheduling meal reminders:", error);
    }
  }

  static async scheduleMenuRatingReminder(
    menuId: string,
    menuName: string
  ): Promise<void> {
    try {
      const settings = await this.getSettings();
      if (!settings.menuRating) return;

      // Schedule rating reminder 30 minutes after each meal time
      const userQuestionnaire = await AsyncStorage.getItem(
        "user_questionnaire"
      );
      if (!userQuestionnaire) return;

      const questionnaire = JSON.parse(userQuestionnaire);
      const mealTimes =
        questionnaire.meal_times
          ?.split(",")
          .map((time: string) => time.trim()) || [];

      for (let i = 0; i < mealTimes.length; i++) {
        const timeStr = mealTimes[i];
        const [hours, minutes] = timeStr.split(":").map(Number);

        if (isNaN(hours) || isNaN(minutes)) continue;

        // Add 30 minutes for rating reminder
        let reminderMinutes = minutes + 30;
        let reminderHours = hours;

        if (reminderMinutes >= 60) {
          reminderMinutes -= 60;
          reminderHours += 1;
        }

        if (reminderHours >= 24) {
          reminderHours -= 24;
        }

        await Notifications.scheduleNotificationAsync({
          content: {
            title: "⭐ Rate Your Meal",
            body: `How was your meal from ${menuName}? Share your experience and help us improve!`,
            data: {
              type: "menu_rating",
              menuId,
              menuName,
              mealIndex: i,
              originalTime: timeStr,
            },
            categoryIdentifier: "rating",
            sound: "default",
          },
          trigger: {
            hour: reminderHours,
            minute: reminderMinutes,
            repeats: true,
            channelId: "menu-rating",
          },
        });
      }

      console.log(`Scheduled menu rating reminders for ${menuName}`);
    } catch (error) {
      console.error("Error scheduling menu rating reminders:", error);
    }
  }

  static async scheduleWaterReminder(): Promise<void> {
    const settings = await this.getSettings();
    if (!settings.waterReminders) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "💧 Stay Hydrated!",
        body: "Time to drink some water and log your intake!",
        data: { type: "water_reminder" },
        sound: "default",
      },
      trigger: {
        seconds: 60 * 60 * 2, // Every 2 hours
        repeats: true,
        channelId: "water-reminders",
      },
    });
  }

  static async sendGoalAchievement(
    title: string,
    message: string
  ): Promise<void> {
    const settings = await this.getSettings();
    if (!settings.goalAchievements) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `🎉 ${title}`,
        body: message,
        data: { type: "achievement" },
        sound: "default",
      },
      trigger: null,
    });
  }

  static async sendInstantNotification(
    title: string,
    body: string,
    data: any = {}
  ): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: "default",
      },
      trigger: null,
    });
  }

  static async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  static async cancelNotificationsByType(type: string): Promise<void> {
    const notifications =
      await Notifications.getAllScheduledNotificationsAsync();
    const toCancel = notifications
      .filter(
        (n: { content: { data: { type: string } } }) =>
          n.content.data?.type === type
      )
      .map((n: { identifier: any }) => n.identifier);

    for (const id of toCancel) {
      await Notifications.cancelScheduledNotificationAsync(id);
    }
  }

  static async setupNotificationHandlers(): Promise<void> {
    // Handle notification received while app is foregrounded
    Notifications.addNotificationReceivedListener((notification) => {
      console.log("Notification received:", notification);
    });

    // Handle notification tapped/opened
    Notifications.addNotificationResponseReceivedListener((response) => {
      console.log("Notification tapped:", response);
      const data = response.notification.request.content.data;

      // Handle different notification types
      if (data.type === "meal_reminder") {
        // Navigate to meal logging screen
        console.log("Navigate to meal logging for:", data.mealType);
      } else if (data.type === "menu_rating") {
        // Navigate to menu rating screen
        console.log("Navigate to menu rating for:", data.menuId);
      } else if (data.type === "water_reminder") {
        // Navigate to water tracking
        console.log("Navigate to water tracking");
      }
    });
  }

  static async initializeNotifications(userQuestionnaire?: any): Promise<void> {
    try {
      await this.setupNotificationHandlers();
      await this.registerForPushNotifications();

      if (userQuestionnaire) {
        await this.scheduleMealReminders(userQuestionnaire);
      }

      await this.scheduleWaterReminder();

      console.log("Notifications initialized successfully");
    } catch (error) {
      console.error("Error initializing notifications:", error);
    }
  }
}
