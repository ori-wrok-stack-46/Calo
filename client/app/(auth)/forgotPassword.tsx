import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/src/i18n/context/LanguageContext";
import { useTheme } from "@/src/context/ThemeContext";
import { userAPI } from "@/src/services/api";

const { width, height } = Dimensions.get("window");

export default function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const { colors } = useTheme();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert(t("common.error"), t("auth.errors.required_field"));
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert(t("common.error"), t("auth.email_validation_error"));
      return;
    }

    try {
      setIsLoading(true);
      const response = await userAPI.forgotPassword(email);

      if (response.success) {
        Alert.alert(
          t("common.success"),
          t("auth.forgot_password_page.reset_sent"),
          [
            {
              text: t("common.ok"),
              onPress: () => router.back(),
            },
          ]
        );
      } else {
        throw new Error(response.error || "Failed to send reset email");
      }
    } catch (error: any) {
      Alert.alert(
        t("common.error"),
        error.message || t("auth.forgot_password_page.reset_failed")
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
    backgroundContainer: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    gradientBackground: {
      position: "absolute",
      left: 0,
      right: 0,
      top: 0,
      height: height * 1.2,
    },
    // Main white cloud base - larger and positioned better
    content: {
      flex: 1,
      paddingHorizontal: 24,
      paddingTop: 60,
      justifyContent: "center",
      zIndex: 10,
    },
    header: {
      alignItems: "center",
      marginBottom: 50,
    },
    profileContainer: {
      width: 90,
      height: 90,
      borderRadius: 45,
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 24,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
      elevation: 8,
    },
    profileIcon: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    title: {
      fontSize: 28,
      fontWeight: "800",
      color: colors.text,
      marginBottom: 8,
      textAlign: "center",
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: "center",
    },
    formContainer: {
      backgroundColor: colors.surface,
      borderRadius: 25,
      padding: 24,
    },
    inputContainer: {
      marginBottom: 20,
    },
    label: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 8,
      textAlign: isRTL ? "right" : "left",
    },
    input: {
      backgroundColor: colors.background,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      fontSize: 16,
      color: colors.text,
      textAlign: isRTL ? "right" : "left",
    },
    forgotPassword: {
      alignSelf: isRTL ? "flex-start" : "flex-end",
      marginTop: 8,
      marginBottom: 24,
    },
    forgotPasswordText: {
      color: colors.primary,
      fontSize: 14,
      fontWeight: "600",
    },
    signInButton: {
      borderRadius: 12,
      overflow: "hidden",
      marginBottom: 20,
    },
    signInGradient: {
      paddingVertical: 16,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      backgroundColor: colors.primary,
    },
    signInButtonText: {
      color: colors.surface,
      fontSize: 16,
      fontWeight: "700",
      marginLeft: isRTL ? 0 : 8,
      marginRight: isRTL ? 8 : 0,
    },
    socialContainer: {
      flexDirection: "row",
      justifyContent: "center",
      gap: 12,
      marginVertical: 20,
    },
    socialButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.background,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    footer: {
      flexDirection: isRTL ? "row-reverse" : "row",
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: 20,
    },
    footerText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    linkText: {
      fontSize: 14,
      color: colors.primary,
      fontWeight: "600",
      marginLeft: isRTL ? 0 : 4,
      marginRight: isRTL ? 4 : 0,
    },
    loadingContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },
    loadingText: {
      color: colors.surface,
      fontSize: 16,
      fontWeight: "700",
      marginLeft: isRTL ? 0 : 8,
      marginRight: isRTL ? 8 : 0,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[colors.primary, colors.emerald200]}
        style={styles.gradientBackground}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.content}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons
              name={isRTL ? "chevron-forward" : "chevron-back"}
              size={20}
              color={colors.text}
            />
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <View style={styles.icon}>
                <Ionicons name="lock-closed" size={22} color={colors.surface} />
              </View>
            </View>
            <Text style={styles.title}>
              {t("auth.forgot_password_page.title")}
            </Text>
            <Text style={styles.subtitle}>
              {t("auth.forgot_password_page.enter_email")}
            </Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>{t("auth.email")}</Text>
              <TextInput
                style={styles.input}
                placeholder={t("auth.enter_email")}
                placeholderTextColor={colors.textSecondary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isLoading}
              />
            </View>

            <TouchableOpacity
              style={styles.sendButton}
              onPress={handleForgotPassword}
              disabled={isLoading}
            >
              <View style={styles.sendGradient}>
                {isLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator color={colors.surface} size="small" />
                    <Text style={styles.loadingText}>
                      {t("common.loading")}
                    </Text>
                  </View>
                ) : (
                  <>
                    <Ionicons name="mail" size={18} color={colors.surface} />
                    <Text style={styles.sendButtonText}>
                      {t("auth.forgot_password_page.send_reset")}
                    </Text>
                  </>
                )}
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
