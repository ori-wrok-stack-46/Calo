import Toast from "react-native-toast-message";

export interface ToastConfig {
  duration?: number;
  position?: "top" | "bottom";
  onPress?: () => void;
  onHide?: () => void;
}

export class ToastService {
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
      type: "error", // Using error type with orange styling for warning
      text1: `⚠️ ${title}`,
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
}
