import { Alert, Platform, ToastAndroid } from "react-native";

export enum NotificationType {
  SUCCESS = "success",
  ERROR = "error",
  WARNING = "warning",
  INFO = "info",
}

interface NotificationConfig {
  type: NotificationType;
  title?: string;
  message: string;
  action?: {
    text: string;
    onPress: () => void;
  };
}

class NotificationService {
  static show(config: NotificationConfig) {
    if (Platform.OS === "android") {
      ToastAndroid.show(config.message, ToastAndroid.LONG);
    } else {
      const buttons = [
        {
          text: "OK",
          onPress: config.action?.onPress || (() => {}),
        },
      ];

      if (config.action) {
        buttons.unshift({
          text: "Cancel",
          style: "cancel" as const,
          onPress: () => {},
        });
        buttons[1].text = config.action.text;
      }

      Alert.alert(
        config.title || this.getDefaultTitle(config.type),
        config.message,
        buttons
      );
    }
  }

  static success(
    message: string,
    title?: string,
    action?: { text: string; onPress: () => void }
  ) {
    this.show({
      type: NotificationType.SUCCESS,
      title: title || "Success!",
      message,
      action,
    });
  }

  static error(
    message: string,
    title?: string,
    action?: { text: string; onPress: () => void }
  ) {
    this.show({
      type: NotificationType.ERROR,
      title: title || "Error",
      message,
      action,
    });
  }

  static warning(
    message: string,
    title?: string,
    action?: { text: string; onPress: () => void }
  ) {
    this.show({
      type: NotificationType.WARNING,
      title: title || "Warning",
      message,
      action,
    });
  }

  static info(
    message: string,
    title?: string,
    action?: { text: string; onPress: () => void }
  ) {
    this.show({
      type: NotificationType.INFO,
      title: title || "Info",
      message,
      action,
    });
  }

  static showUserOnline() {
    this.success(
      "You are now connected and ready to track your nutrition!",
      "Welcome! 🟢 User Online"
    );
  }

  private static getDefaultTitle(type: NotificationType): string {
    switch (type) {
      case NotificationType.SUCCESS:
        return "Success!";
      case NotificationType.ERROR:
        return "Error";
      case NotificationType.WARNING:
        return "Warning";
      case NotificationType.INFO:
        return "Info";
      default:
        return "";
    }
  }
}

export default NotificationService;
