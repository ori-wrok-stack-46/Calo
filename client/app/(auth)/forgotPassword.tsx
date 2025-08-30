import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/src/i18n/context/LanguageContext";
import { useTheme } from "@/src/context/ThemeContext";
import { userAPI } from "@/src/services/api";
import { Mail, ArrowLeft } from "lucide-react-native";

export default function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const { colors } = useTheme();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSendResetCode = async () => {
    if (!email.trim()) {
      Alert.alert(t("common.error"), t("auth.errors.required_field"));
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert(t("common.error"), t("auth.errors.invalid_email"));
      return;
    }

    try {
      setIsLoading(true);
      console.log("📧 Sending password reset request for:", email);

      const response = await userAPI.forgotPassword(email);

      if (response.success) {
        Alert.alert(
          t("auth.forgot_password_page.email_sent"),
          t("auth.forgot_password_page.reset_code_sent"),
          [
            {
              text: t("common.ok"),
              onPress: () => {
                router.push({
                  pathname: "/(auth)/reset-password-verify",
                  params: { email },
                });
              },
            },
          ]
        );
      } else {
        throw new Error(response.error || "Failed to send reset email");
      }
    } catch (error: any) {
      console.error("💥 Forgot password error:", error);
      Alert.alert(
        t("common.error"),
        error.message || t("auth.reset_password.reset_failed")
      );
    } finally {
      setIsLoading(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    containerRTL: {
      flexDirection: "row-reverse",
    },
    backgroundAccent: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: "35%",
      backgroundColor: "#f0fdf4",
      borderBottomLeftRadius: 30,
      borderBottomRightRadius: 30,
    },
    header: {
      paddingTop: 60,
      paddingHorizontal: 20,
      marginBottom: 20,
      zIndex: 2,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primary + "20",
      justifyContent: "center",
      alignItems: "center",
    },
    content: {
      flex: 1,
      padding: 24,
      justifyContent: "center",
      zIndex: 1,
    },
    headerSection: {
      marginBottom: 48,
      alignItems: "center",
    },
    iconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.primary + "20",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 24,
    },
    title: {
      fontSize: 36,
      fontWeight: "700",
      color: colors.text,
      marginBottom: 8,
      letterSpacing: -0.5,
      textAlign: "center",
    },
    titleRTL: {
      textAlign: "right",
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      fontWeight: "500",
      textAlign: "center",
      lineHeight: 24,
      paddingHorizontal: 20,
    },
    subtitleRTL: {
      textAlign: "right",
    },
    form: {
      flex: 1,
      maxHeight: 300,
    },
    inputContainer: {
      marginBottom: 32,
      shadowColor: colors.primary,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
    input: {
      borderWidth: 2,
      borderColor: colors.border,
      borderRadius: 16,
      padding: 18,
      fontSize: 16,
      backgroundColor: colors.surface,
      color: colors.text,
      fontWeight: "500",
    },
    inputRTL: {
      textAlign: "right",
    },
    sendButton: {
      backgroundColor: colors.primary,
      borderRadius: 16,
      padding: 18,
      alignItems: "center",
      shadowColor: colors.primary,
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
      marginBottom: 24,
    },
    buttonDisabled: {
      opacity: 0.7,
    },
    sendButtonContent: {
      flexDirection: "row",
      alignItems: "center",
    },
    sendButtonText: {
      color: "#ffffff",
      fontSize: 18,
      fontWeight: "700",
      letterSpacing: 0.5,
      marginLeft: 8,
    },
    backToSigninButton: {
      alignSelf: "center",
      paddingVertical: 12,
    },
    backToSigninText: {
      fontSize: 15,
      color: colors.primary,
      fontWeight: "600",
      textDecorationLine: "underline",
    },
  });

  return (
    <View style={[styles.container, isRTL && styles.containerRTL]}>
      <View style={styles.backgroundAccent} />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.headerSection}>
          <View style={styles.iconContainer}>
            <Mail size={32} color={colors.primary} />
          </View>

          <Text style={[styles.title, isRTL && styles.titleRTL]}>
            {t("auth.forgot_password_page.title")}
          </Text>

          <Text style={[styles.subtitle, isRTL && styles.subtitleRTL]}>
            {t("auth.forgot_password_page.subtitle")}
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, isRTL && styles.inputRTL]}
              placeholder={t("auth.forgot_password_page.email_placeholder")}
              placeholderTextColor={colors.textSecondary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
              textAlign={isRTL ? "right" : "left"}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.sendButton,
              (!email.trim() || isLoading) && styles.buttonDisabled,
            ]}
            onPress={handleSendResetCode}
            disabled={!email.trim() || isLoading}
          >
            <View style={styles.sendButtonContent}>
              {isLoading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <>
                  <Mail size={20} color="#ffffff" />
                  <Text style={styles.sendButtonText}>
                    {t("auth.forgot_password_page.send_reset_code")}
                  </Text>
                </>
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backToSigninButton}
            onPress={() => router.replace("/(auth)/signin")}
          >
            <Text style={styles.backToSigninText}>
              {t("auth.forgot_password_page.back_to_signin")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
