import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Device from "expo-device";
import Constants from "expo-constants";

// Configure notification behavior for background delivery
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    // Get user preferences
    const settings = await NotificationService.getSettings();

    return {
      shouldShowAlert: true,
      shouldPlaySound: settings.pushNotifications,
      shouldSetBadge: true,
    };
  },
});

export interface NotificationSettings {
  pushNotifications: boolean;
  mealReminders: boolean;
  waterReminders: boolean;
  exerciseReminders: boolean;
  weeklyReports: boolean;
  goalAchievements: boolean;
  menuRating: boolean;
  reminderTimes: string[];
  notificationFrequency: "DAILY" | "WEEKLY" | "NONE";
}

const defaultSettings: NotificationSettings = {
  pushNotifications: true,
  mealReminders: true,
  waterReminders: true,
  exerciseReminders: false,
  weeklyReports: true,
  goalAchievements: true,
  menuRating: true,
  reminderTimes: ["08:00", "12:30", "18:00"],
  notificationFrequency: "DAILY",
};

export class NotificationService {
  static async requestPermissions(): Promise<boolean> {
    try {
      console.log("🔔 Requesting notification permissions...");

      if (!Device.isDevice) {
        console.log(
          "⚠️ Running on simulator - permissions granted for testing"
        );
        return true;
      }

      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        console.log("📱 Requesting notification permissions from user...");
        const { status } = await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
            allowAnnouncements: true,
          },
          android: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
          },
        });
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        console.log("❌ Notification permissions denied");
        return false;
      }

      // Set up notification channels for Android
      if (Platform.OS === "android") {
        await this.setupAndroidChannels();
      }

      console.log("✅ Notification permissions granted");
      return true;
    } catch (error) {
      console.error("💥 Error requesting notification permissions:", error);
      return false;
    }
  }

  private static async setupAndroidChannels(): Promise<void> {
    const channels = [
      {
        channelId: "meal-reminders",
        name: "Meal Reminders",
        importance: Notifications.AndroidImportance.HIGH,
        description: "Reminders for meal times and logging",
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#10b981",
        sound: "default",
        enableLights: true,
        enableVibrate: true,
      },
      {
        channelId: "menu-rating",
        name: "Menu Rating",
        importance: Notifications.AndroidImportance.HIGH,
        description: "Requests to rate meals and menus",
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#f59e0b",
        sound: "default",
        enableLights: true,
        enableVibrate: true,
      },
      {
        channelId: "water-reminders",
        name: "Water Reminders",
        importance: Notifications.AndroidImportance.DEFAULT,
        description: "Hydration reminders",
        vibrationPattern: [0, 250],
        lightColor: "#3b82f6",
        sound: "default",
      },
      {
        channelId: "achievements",
        name: "Achievements",
        importance: Notifications.AndroidImportance.HIGH,
        description: "Goal achievements and milestones",
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#10b981",
        sound: "default",
        enableLights: true,
        enableVibrate: true,
      },
      {
        channelId: "weekly-reports",
        name: "Weekly Reports",
        importance: Notifications.AndroidImportance.DEFAULT,
        description: "Weekly progress reports",
        sound: "default",
      },
    ];

    for (const channel of channels) {
      await Notifications.setNotificationChannelAsync(
        channel.channelId,
        channel
      );
    }

    console.log("✅ Android notification channels configured");
  }

  static async registerForPushNotifications(): Promise<string | null> {
    try {
      console.log("🚀 Registering for push notifications...");

      if (!Device.isDevice) {
        console.log("💻 Running on simulator - using mock token");
        await AsyncStorage.setItem("expo_push_token", "simulator-token");
        return "simulator-token";
      }

      const hasPermissions = await this.requestPermissions();
      if (!hasPermissions) {
        console.log(
          "❌ No permissions - cannot register for push notifications"
        );
        return null;
      }

      // Get project ID from app config
      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ||
        Constants?.easConfig?.projectId ||
        process.env.EXPO_PUBLIC_PROJECT_ID;

      if (!projectId) {
        console.warn(
          "⚠️ No project ID found - push notifications may not work properly"
        );
        return null;
      }

      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      const token = tokenData.data;
      console.log("✅ Push token obtained:", token.substring(0, 20) + "...");

      await AsyncStorage.setItem("expo_push_token", token);

      // Send token to backend for user
      try {
        const userToken = await AsyncStorage.getItem("auth_token");
        if (userToken) {
          await fetch(
            `${process.env.EXPO_PUBLIC_API_URL}/api/user/push-token`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${userToken}`,
              },
              body: JSON.stringify({ pushToken: token }),
            }
          );
        }
      } catch (error) {
        console.warn("⚠️ Failed to send push token to server:", error);
      }

      return token;
    } catch (error) {
      console.error("💥 Error registering for push notifications:", error);
      return null;
    }
  }

  static async getSettings(): Promise<NotificationSettings> {
    try {
      const settings = await AsyncStorage.getItem("notification_settings");
      const parsed = settings ? JSON.parse(settings) : {};

      // Check global notification preference
      const globalEnabled = await AsyncStorage.getItem(
        "global_notifications_enabled"
      );
      const isGlobalEnabled =
        globalEnabled !== null ? JSON.parse(globalEnabled) : true;

      if (!isGlobalEnabled) {
        // If globally disabled, return settings with all notifications off
        return {
          ...defaultSettings,
          ...parsed,
          pushNotifications: false,
          mealReminders: false,
          waterReminders: false,
          exerciseReminders: false,
          weeklyReports: false,
          goalAchievements: false,
          menuRating: false,
        };
      }

      return { ...defaultSettings, ...parsed };
    } catch (error) {
      console.error("💥 Error loading notification settings:", error);
      return defaultSettings;
    }
  }

  static async updateSettings(settings: NotificationSettings): Promise<void> {
    try {
      await AsyncStorage.setItem(
        "notification_settings",
        JSON.stringify(settings)
      );
      console.log("✅ Notification settings updated");

      // Reschedule notifications based on new settings
      await this.rescheduleAllNotifications();
    } catch (error) {
      console.error("💥 Error saving notification settings:", error);
    }
  }

  static async rescheduleAllNotifications(): Promise<void> {
    try {
      console.log("🔄 Rescheduling all notifications...");

      // Cancel all existing notifications
      await Notifications.cancelAllScheduledNotificationsAsync();

      // Get user questionnaire and settings
      const [questionnaireData, settings] = await Promise.all([
        AsyncStorage.getItem("user_questionnaire"),
        this.getSettings(),
      ]);

      if (questionnaireData) {
        const questionnaire = JSON.parse(questionnaireData);

        if (settings.mealReminders) {
          await this.scheduleMealReminders(questionnaire, settings);
        }
      }

      if (settings.waterReminders) {
        await this.scheduleWaterReminder(settings);
      }

      if (settings.weeklyReports) {
        await this.scheduleWeeklyProgress(settings);
      }

      console.log("✅ All notifications rescheduled");
    } catch (error) {
      console.error("💥 Error rescheduling notifications:", error);
    }
  }

  static async scheduleMealReminders(
    userQuestionnaire: any,
    settings?: NotificationSettings
  ): Promise<void> {
    try {
      const notificationSettings = settings || (await this.getSettings());
      if (
        !notificationSettings.mealReminders ||
        notificationSettings.notificationFrequency === "NONE"
      ) {
        console.log("⏭️ Meal reminders disabled - skipping");
        return;
      }

      // Cancel existing meal reminders
      await this.cancelNotificationsByType("meal_reminder");

      // Use questionnaire meal times or default reminder times
      const mealTimes =
        userQuestionnaire?.meal_times
          ?.split(",")
          ?.map((time: string) => time.trim()) ||
        notificationSettings.reminderTimes;

      const mealNames = ["Breakfast", "Lunch", "Dinner", "Snack", "Late Snack"];

      for (let i = 0; i < mealTimes.length; i++) {
        const timeStr = mealTimes[i];
        const [hours, minutes] = timeStr.split(":").map(Number);

        if (isNaN(hours) || isNaN(minutes)) {
          console.warn(`⚠️ Invalid time format: ${timeStr}`);
          continue;
        }

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
            sound: true,
            badge: 1,
          },
          trigger: {
            hour: hours,
            minute: minutes,
            repeats: true,
            channelId: "meal-reminders",
          },
        });
      }

      console.log(`✅ Scheduled ${mealTimes.length} meal reminders`);
    } catch (error) {
      console.error("💥 Error scheduling meal reminders:", error);
    }
  }

  static async scheduleMenuRatingReminder(
    menuId: string,
    menuName: string
  ): Promise<void> {
    try {
      const settings = await this.getSettings();
      if (!settings.menuRating) {
        console.log("⏭️ Menu rating reminders disabled - skipping");
        return;
      }

      const userQuestionnaire = await AsyncStorage.getItem(
        "user_questionnaire"
      );
      if (!userQuestionnaire) {
        console.log("⚠️ No user questionnaire found");
        return;
      }

      const questionnaire = JSON.parse(userQuestionnaire);
      const mealTimes =
        questionnaire.meal_times
          ?.split(",")
          ?.map((time: string) => time.trim()) || [];

      for (let i = 0; i < mealTimes.length; i++) {
        const timeStr = mealTimes[i];
        const [hours, minutes] = timeStr.split(":").map(Number);

        if (isNaN(hours) || isNaN(minutes)) continue;

        // Schedule rating reminder 30 minutes after meal time
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
            sound: true,
            badge: 1,
          },
          trigger: {
            hour: reminderHours,
            minute: reminderMinutes,
            repeats: true,
            channelId: "menu-rating",
          },
        });
      }

      console.log(`✅ Scheduled menu rating reminders for ${menuName}`);
    } catch (error) {
      console.error("💥 Error scheduling menu rating reminders:", error);
    }
  }

  static async scheduleWaterReminder(
    settings?: NotificationSettings
  ): Promise<void> {
    try {
      const notificationSettings = settings || (await this.getSettings());
      if (!notificationSettings.waterReminders) {
        console.log("⏭️ Water reminders disabled - skipping");
        return;
      }

      // Schedule water reminder every 2 hours from 8 AM to 8 PM
      const waterHours = [8, 10, 12, 14, 16, 18, 20];

      for (const hour of waterHours) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "💧 Stay Hydrated!",
            body: "Time to drink some water and log your intake!",
            data: { type: "water_reminder" },
            sound: true,
            badge: 1,
          },
          trigger: {
            hour,
            minute: 0,
            repeats: true,
            channelId: "water-reminders",
          },
        });
      }

      console.log("✅ Water reminders scheduled");
    } catch (error) {
      console.error("💥 Error scheduling water reminder:", error);
    }
  }

  static async scheduleWeeklyProgress(
    settings?: NotificationSettings
  ): Promise<void> {
    try {
      const notificationSettings = settings || (await this.getSettings());
      if (
        !notificationSettings.weeklyReports ||
        notificationSettings.notificationFrequency !== "WEEKLY"
      ) {
        console.log("⏭️ Weekly reports disabled - skipping");
        return;
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: "📊 Weekly Progress Report",
          body: "Check out your nutrition progress this week! See how you're doing with your goals.",
          data: { type: "weekly_progress" },
          sound: true,
          badge: 1,
        },
        trigger: {
          weekday: 1, // Monday
          hour: 9,
          minute: 0,
          repeats: true,
          channelId: "weekly-reports",
        },
      });

      console.log("✅ Weekly progress reminders scheduled");
    } catch (error) {
      console.error("💥 Error scheduling weekly progress reminder:", error);
    }
  }

  static async sendGoalAchievement(
    title: string,
    message: string
  ): Promise<void> {
    try {
      const settings = await this.getSettings();
      if (!settings.goalAchievements) {
        console.log("⏭️ Goal achievement notifications disabled - skipping");
        return;
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: `🎉 ${title}`,
          body: message,
          data: { type: "achievement" },
          sound: true,
          badge: 1,
        },
        trigger: null,
        channelId: "achievements",
      });

      console.log("✅ Goal achievement notification sent");
    } catch (error) {
      console.error("💥 Error sending goal achievement:", error);
    }
  }

  static async sendInstantNotification(
    title: string,
    body: string,
    data: any = {}
  ): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
          badge: 1,
        },
        trigger: null,
      });

      console.log("✅ Instant notification sent");
    } catch (error) {
      console.error("💥 Error sending instant notification:", error);
    }
  }

  static async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log("✅ All notifications cancelled");
    } catch (error) {
      console.error("💥 Error cancelling notifications:", error);
    }
  }

  static async cancelNotificationsByType(type: string): Promise<void> {
    try {
      const notifications =
        await Notifications.getAllScheduledNotificationsAsync();
      const toCancel = notifications
        .filter((n: any) => n.content.data?.type === type)
        .map((n: any) => n.identifier);

      for (const id of toCancel) {
        await Notifications.cancelScheduledNotificationAsync(id);
      }

      console.log(
        `✅ Cancelled ${toCancel.length} notifications of type: ${type}`
      );
    } catch (error) {
      console.error(
        `💥 Error cancelling notifications of type ${type}:`,
        error
      );
    }
  }

  static async setupNotificationHandlers(): Promise<void> {
    // Handle notification received while app is foregrounded
    const receivedSubscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log("🔔 Notification received:", notification);
      }
    );

    // Handle notification tapped/opened
    const responseSubscription =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("👆 Notification tapped:", response);
        const data = response.notification.request.content.data;

        // Handle different notification types
        this.handleNotificationResponse(data);
      });

    // Store subscriptions for cleanup if needed
    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  }

  private static async handleNotificationResponse(data: any): Promise<void> {
    try {
      console.log("🎯 Handling notification response:", data.type);

      // Import router dynamically to avoid circular imports
      const { router } = await import("expo-router");

      switch (data.type) {
        case "meal_reminder":
          console.log("📱 Navigate to meal logging for:", data.mealType);
          router.push("/(tabs)/camera");
          break;

        case "menu_rating":
          console.log("📱 Navigate to menu rating for:", data.menuId);
          router.push(`/menu/${data.menuId}?showRating=true`);
          break;

        case "water_reminder":
          console.log("📱 Navigate to water tracking");
          router.push("/(tabs)?tab=water");
          break;

        case "weekly_progress":
          console.log("📱 Navigate to statistics");
          router.push("/(tabs)/statistics");
          break;

        case "achievement":
          console.log("📱 Navigate to profile achievements");
          router.push("/(tabs)/profile?tab=achievements");
          break;

        default:
          console.log("📱 Navigate to home");
          router.push("/(tabs)");
      }
    } catch (error) {
      console.error("💥 Error handling notification response:", error);
    }
  }

  static async initializeNotifications(userQuestionnaire?: any): Promise<void> {
    try {
      console.log("🚀 Initializing notification system...");

      // Setup notification handlers
      await this.setupNotificationHandlers();

      // Register for push notifications
      const token = await this.registerForPushNotifications();

      if (token) {
        console.log("✅ Push notification token registered");
      }

      // Schedule notifications based on user preferences
      if (userQuestionnaire) {
        const settings = await this.getSettings();

        if (settings.mealReminders) {
          await this.scheduleMealReminders(userQuestionnaire, settings);
        }

        if (settings.waterReminders) {
          await this.scheduleWaterReminder(settings);
        }

        if (settings.weeklyReports) {
          await this.scheduleWeeklyProgress(settings);
        }
      }

      console.log("✅ Notification system initialized successfully");
    } catch (error) {
      console.error("💥 Error initializing notifications:", error);
    }
  }

  // Utility method to show local notification (for testing)
  static async showTestNotification(): Promise<void> {
    const settings = await this.getSettings();
    if (!settings.pushNotifications) {
      console.log("⏭️ Test notification skipped - notifications disabled");
      return;
    }

    await this.sendInstantNotification(
      "🧪 Test Notification",
      "This is a test notification to verify the system is working!",
      { type: "test" }
    );
  }

  // Global notification preference management
  static async setGlobalNotificationPreference(
    enabled: boolean
  ): Promise<void> {
    try {
      await AsyncStorage.setItem(
        "global_notifications_enabled",
        JSON.stringify(enabled)
      );

      if (!enabled) {
        // Cancel all notifications if disabled globally
        await this.cancelAllNotifications();
      } else {
        // Re-schedule notifications if enabled
        await this.rescheduleAllNotifications();
      }

      console.log(
        `✅ Global notifications ${enabled ? "enabled" : "disabled"}`
      );
    } catch (error) {
      console.error("💥 Error setting global notification preference:", error);
    }
  }

  static async getGlobalNotificationPreference(): Promise<boolean> {
    try {
      const setting = await AsyncStorage.getItem(
        "global_notifications_enabled"
      );
      return setting !== null ? JSON.parse(setting) : true;
    } catch (error) {
      console.error("💥 Error getting global notification preference:", error);
      return true;
    }
  }

  // Enhanced initialization with questionnaire sync
  static async initializeWithQuestionnaireSync(
    userQuestionnaire?: any
  ): Promise<void> {
    try {
      console.log(
        "🚀 Initializing notification system with questionnaire sync..."
      );

      // Check global preference first
      const isGlobalEnabled = await this.getGlobalNotificationPreference();
      if (!isGlobalEnabled) {
        console.log(
          "⏭️ Notifications disabled globally - skipping initialization"
        );
        return;
      }

      // Setup notification handlers
      await this.setupNotificationHandlers();

      // Register for push notifications
      const token = await this.registerForPushNotifications();

      if (token && userQuestionnaire) {
        const settings = await this.getSettings();

        // Use questionnaire data for meal reminders
        if (settings.mealReminders && userQuestionnaire.meals_per_day) {
          await this.scheduleMealReminders(userQuestionnaire, settings);
        }

        if (settings.waterReminders) {
          await this.scheduleWaterReminder(settings);
        }

        if (settings.weeklyReports) {
          await this.scheduleWeeklyProgress(settings);
        }

        console.log(
          "✅ Notification system initialized with questionnaire data"
        );
      }
    } catch (error) {
      console.error(
        "💥 Error initializing notifications with questionnaire sync:",
        error
      );
    }
  }
}

