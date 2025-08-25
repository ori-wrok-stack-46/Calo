import React from "react";
import Toast, { BaseToast, ErrorToast } from "react-native-toast-message";
import { useTheme } from "@/src/context/ThemeContext";
import { useLanguage } from "@/src/i18n/context/LanguageContext";

const ToastWrapper: React.FC = () => {
  const { colors } = useTheme();
  const { isRTL } = useLanguage();

  const toastConfig = {
    success: (props: any) => (
      <BaseToast
        {...props}
        style={[
          {
            borderLeftColor: colors.success,
            backgroundColor: colors.surface,
          },
          isRTL && {
            borderRightColor: colors.success,
            borderLeftColor: "transparent",
          },
        ]}
        contentContainerStyle={{ paddingHorizontal: 15 }}
        text1Style={{
          fontSize: 16,
          fontWeight: "600",
          color: colors.text,
          textAlign: isRTL ? "right" : "left",
        }}
        text2Style={{
          fontSize: 14,
          color: colors.textSecondary,
          textAlign: isRTL ? "right" : "left",
        }}
      />
    ),
    error: (props: any) => (
      <ErrorToast
        {...props}
        style={[
          {
            borderLeftColor: colors.destructive,
            backgroundColor: colors.surface,
          },
          isRTL && {
            borderRightColor: colors.destructive,
            borderLeftColor: "transparent",
          },
        ]}
        text1Style={{
          fontSize: 16,
          fontWeight: "600",
          color: colors.text,
          textAlign: isRTL ? "right" : "left",
        }}
        text2Style={{
          fontSize: 14,
          color: colors.textSecondary,
          textAlign: isRTL ? "right" : "left",
        }}
      />
    ),
    info: (props: any) => (
      <BaseToast
        {...props}
        style={[
          {
            borderLeftColor: colors.primary,
            backgroundColor: colors.surface,
          },
          isRTL && {
            borderRightColor: colors.primary,
            borderLeftColor: "transparent",
          },
        ]}
        contentContainerStyle={{ paddingHorizontal: 15 }}
        text1Style={{
          fontSize: 16,
          fontWeight: "600",
          color: colors.text,
          textAlign: isRTL ? "right" : "left",
        }}
        text2Style={{
          fontSize: 14,
          color: colors.textSecondary,
          textAlign: isRTL ? "right" : "left",
        }}
      />
    ),
  };

  return <Toast config={toastConfig} />;
};

export default ToastWrapper;
