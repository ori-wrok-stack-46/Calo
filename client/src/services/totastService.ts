import Toast from "react-native-toast-message";

interface ToastConfig {
  duration?: number;
  position?: "top" | "bottom";
  onPress?: () => void;
  onHide?: () => void;
  type?: "success" | "error" | "info" | "warning";
}

export class ToastService {
  // Enhanced error handling with context
  static handleError(error: any, context?: string, onRetry?: () => void) {
    let title = "Error";
    let message = "An unexpected error occurred";

    if (error?.response?.data?.error) {
      message = error.response.data.error;
    } else if (error?.message) {
      message = error.message;
    }

    if (context) {
      title = `${context} Failed`;
    }

    this.error(title, message, {
      duration: onRetry ? 6000 : 4000,
      onPress: onRetry,
    });
  }

  static show(title: string, message?: string, config?: ToastConfig) {
    Toast.show({
      type: config?.type || "info",
      text1: title,
      text2: message,
      visibilityTime: config?.duration || 3000,
      position: config?.position || "top",
      onPress: config?.onPress,
      onHide: config?.onHide,
    });
  }

  static success(title: string, message?: string, config?: ToastConfig) {
    Toast.show({
      type: "success",
      text1: title,
      text2: message,
      visibilityTime: config?.duration || 3000,
      position: config?.position || "top",
      onPress: config?.onPress,
      onHide: config?.onHide,
    });
  }

  static error(title: string, message?: string, config?: ToastConfig) {
    Toast.show({
      type: "error",
      text1: title,
      text2: message,
      visibilityTime: config?.duration || 4000,
      position: config?.position || "top",
      onPress: config?.onPress,
      onHide: config?.onHide,
    });
  }

  static warning(title: string, message?: string, config?: ToastConfig) {
    Toast.show({
      type: "warning",
      text1: title,
      text2: message,
      visibilityTime: config?.duration || 3500,
      position: config?.position || "top",
      onPress: config?.onPress,
      onHide: config?.onHide,
    });
  }

  static info(title: string, message?: string, config?: ToastConfig) {
    Toast.show({
      type: "info",
      text1: title,
      text2: message,
      visibilityTime: config?.duration || 3000,
      position: config?.position || "top",
      onPress: config?.onPress,
      onHide: config?.onHide,
    });
  }

  // Network specific toasts
  static networkError(action?: string) {
    this.error(
      "Connection Error",
      action
        ? `Failed to ${action}. Please check your internet connection.`
        : "Please check your internet connection and try again."
    );
  }

  static serverError(action?: string) {
    this.error(
      "Server Error",
      action
        ? `Failed to ${action}. Please try again later.`
        : "Something went wrong on our end. Please try again later."
    );
  }

  // Authentication specific toasts
  static authError(message?: string) {
    this.error(
      "Authentication Error",
      message || "Please sign in again to continue."
    );
  }

  // Validation specific toasts
  static validationError(field: string, message?: string) {
    this.warning(
      "Validation Error",
      message || `Please check the ${field} field and try again.`
    );
  }

  // Success actions
  static saveSuccess(item?: string) {
    this.success(
      "Saved Successfully",
      item ? `${item} has been saved.` : "Your changes have been saved."
    );
  }

  static deleteSuccess(item?: string) {
    this.success(
      "Deleted Successfully",
      item ? `${item} has been deleted.` : "Item has been deleted."
    );
  }

  // Hide all toasts
  static hide() {
    Toast.hide();
  }

  // Replace native alert functionality
  static alert(title: string, message?: string, onPress?: () => void) {
    this.info(title, message, {
      duration: 5000,
      onPress: onPress,
    });
  }

  // Replace native confirm functionality (informational only)
  static confirm(title: string, message?: string) {
    this.warning(title, message, {
      duration: 6000,
    });
  }

  // Meal-specific toasts
  static mealAdded(mealName?: string) {
    this.success(
      "Meal Added Successfully",
      mealName
        ? `${mealName} has been logged to your diary.`
        : "Your meal has been logged successfully.",
      { duration: 3000 }
    );
  }

  static mealDeleted(mealName?: string) {
    this.success(
      "Meal Deleted",
      mealName
        ? `${mealName} has been removed from your diary.`
        : "Meal has been removed successfully.",
      { duration: 3000 }
    );
  }

  static mealUpdateError(error?: string) {
    this.error(
      "Meal Update Failed",
      error || "Unable to update your meal. Please try again.",
      { duration: 4000 }
    );
  }

  // Achievement-specific toasts
  static achievementUnlocked(title: string, xp?: number) {
    this.success(
      `🏆 Achievement Unlocked!`,
      `${title}${xp ? ` (+${xp} XP)` : ""}`,
      {
        duration: 5000,
        onPress: () => {
          // Navigate to achievements or show detail
          console.log("Achievement toast pressed");
        },
      }
    );
  }

  static levelUp(newLevel: number, xp?: number) {
    this.success(
      `🎉 Level Up!`,
      `Congratulations! You've reached Level ${newLevel}${
        xp ? ` (+${xp} XP)` : ""
      }`,
      {
        duration: 6000,
        onPress: () => {
          console.log("Level up toast pressed");
        },
      }
    );
  }

  // Goal and progress toasts
  static goalCompleted(goalName: string) {
    this.success(
      "🎯 Goal Completed!",
      `Great job! You've completed your ${goalName} goal for today.`,
      { duration: 4000 }
    );
  }

  static streakAchieved(days: number) {
    this.success(
      `🔥 ${days}-Day Streak!`,
      `Amazing! You've maintained your healthy habits for ${days} consecutive days.`,
      { duration: 5000 }
    );
  }

  // Questionnaire-related toasts
  static questionnaireCompleted() {
    this.success(
      "Profile Complete",
      "Your personalized nutrition plan is now ready!",
      { duration: 4000 }
    );
  }

  static questionnaireUpdated() {
    this.success(
      "Profile Updated",
      "Your preferences have been updated. Your recommendations will be refreshed.",
      { duration: 4000 }
    );
  }

  // Water intake toasts
  static waterGoalReached() {
    this.success(
      "💧 Hydration Goal Reached!",
      "Excellent! You've met your daily water intake goal.",
      { duration: 3000 }
    );
  }

  // Sync and connection toasts
  static deviceConnected(deviceName: string) {
    this.success(
      "Device Connected",
      `${deviceName} has been successfully connected to your account.`,
      { duration: 3000 }
    );
  }

  static deviceDisconnected(deviceName: string) {
    this.info(
      "Device Disconnected",
      `${deviceName} has been disconnected from your account.`,
      { duration: 3000 }
    );
  }

  static syncCompleted() {
    this.success(
      "Data Synced",
      "Your health data has been successfully synchronized.",
      { duration: 2500 }
    );
  }

  static syncFailed() {
    this.error(
      "Sync Failed",
      "Unable to sync your health data. Please check your connection and try again.",
      { duration: 4000 }
    );
  }
}
