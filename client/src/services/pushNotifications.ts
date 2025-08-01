
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Configure notifications behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export class PushNotificationService {
  static async registerForPushNotifications() {
    if (!Device.isDevice) {
      console.log('Must use physical device for Push Notifications');
      return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return null;
    }

    try {
      const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
      
      if (!projectId) {
        throw new Error('Project ID not found');
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId,
      });
      
      console.log('Push token:', token.data);
      return token.data;
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  }

  static async scheduleMealReminders(userQuestionnaire: any) {
    try {
      // Cancel existing notifications first
      await Notifications.cancelAllScheduledNotificationsAsync();

      if (!userQuestionnaire) {
        console.log('No questionnaire data available');
        return;
      }

      const mealsPerDay = userQuestionnaire.meals_per_day || 3;
      const mealTimes = userQuestionnaire.meal_times ? 
        userQuestionnaire.meal_times.split(',').map((time: string) => time.trim()) : 
        ['08:00', '13:00', '19:00']; // Default meal times

      const mealNames = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

      for (let i = 0; i < Math.min(mealsPerDay, mealTimes.length); i++) {
        const [hours, minutes] = mealTimes[i].split(':').map(Number);
        
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `${mealNames[i] || 'Meal'} Time! 🍽️`,
            body: `Don't forget to log your ${mealNames[i]?.toLowerCase() || 'meal'} and track your nutrition!`,
            sound: true,
          },
          trigger: {
            hour: hours,
            minute: minutes,
            repeats: true,
          },
        });
      }

      console.log(`Scheduled ${mealsPerDay} meal reminders`);
    } catch (error) {
      console.error('Error scheduling meal reminders:', error);
    }
  }

  static async scheduleWaterReminder() {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Stay Hydrated! 💧',
          body: 'Time to drink some water and log your intake!',
          sound: true,
        },
        trigger: {
          seconds: 2 * 60 * 60, // Every 2 hours
          repeats: true,
        },
      });
    } catch (error) {
      console.error('Error scheduling water reminder:', error);
    }
  }

  static async scheduleWeeklyProgress() {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Weekly Progress 📊',
          body: 'Check out your nutrition progress this week!',
          sound: true,
        },
        trigger: {
          weekday: 1, // Monday
          hour: 9,
          minute: 0,
          repeats: true,
        },
      });
    } catch (error) {
      console.error('Error scheduling weekly progress reminder:', error);
    }
  }
}
