import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  I18nManager,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/src/context/ThemeContext";
import { useDispatch } from "react-redux";
import { verifyEmail } from "@/src/store/authSlice";
import { AppDispatch } from "@/src/store";

const { width, height } = Dimensions.get("window");

export default function EmailVerificationScreen() {
  const [verificationCode, setVerificationCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const router = useRouter();
  const { email } = useLocalSearchParams();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const isRTL = I18nManager.isRTL;
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleVerifyCode = async () => {
    if (!verificationCode.trim()) {
      Alert.alert(t("common.error"), t("auth.errors.required_field"));
      return;
    }

    if (verificationCode.length !== 6) {
      Alert.alert(t("common.error"), t("auth.email_verification.invalid_code"));
      return;
    }

    setLoading(true);
    try {
      const userEmail = Array.isArray(email) ? email[0] : email || "";

      if (!userEmail) {
        throw new Error("Email parameter missing");
      }

      console.log("🔄 Dispatching email verification...");
      const result = await dispatch(
        verifyEmail({
          email: userEmail,
          code: verificationCode,
        })
      ).unwrap();

      console.log("✅ Email verification successful:", result);
      setLoading(false);

      Alert.alert(
        t("common.success"),
        t("auth.email_verification.verification_successful"),
        [
          {
            text: t("common.ok"),
            onPress: () => {
              // Let the auth routing logic handle the redirect
              router.replace("/");
            },
          },
        ]
      );
    } catch (error: any) {
      setLoading(false);
      console.error("Email verification error:", error);
      Alert.alert(
        t("common.error"),
        error.message || t("auth.email_verification.verification_failed")
      );
    }
  };

  const handleResendCode = async () => {
    if (!canResend) return;

    setResendLoading(true);
    try {
      const userEmail = Array.isArray(email) ? email[0] : email || "";

      if (!userEmail) {
        throw new Error("Email parameter missing");
      }

      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/auth/resend-verification`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: userEmail,
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        setResendLoading(false);
        setCanResend(false);
        setCountdown(60);
        Alert.alert(
          t("common.success"),
          t("auth.email_verification.resend_successful")
        );
      } else {
        throw new Error(result.error || "Resend failed");
      }
    } catch (error: any) {
      setResendLoading(false);
      console.error("Resend verification error:", error);
      Alert.alert(
        t("common.error"),
        error.message || t("auth.email_verification.resend_failed")
      );
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    gradientBackground: {
      position: "absolute",
      left: 0,
      right: 0,
      top: 0,
      height: height * 0.4,
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 60,
      justifyContent: "center",
    },
    header: {
      alignItems: "center",
      marginBottom: 40,
    },
    iconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.primary + "20",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 24,
    },
    title: {
      fontSize: 28,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 8,
      textAlign: "center",
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: "center",
      lineHeight: 24,
    },
    formContainer: {
      backgroundColor: colors.card,
      borderRadius: 20,
      padding: 24,
      marginBottom: 20,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 5,
    },
    inputContainer: {
      marginBottom: 24,
    },
    label: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 8,
      textAlign: isRTL ? "right" : "left",
    },
    codeInputWrapper: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 20,
    },
    codeInput: {
      backgroundColor: colors.background,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      fontSize: 18,
      fontWeight: "bold",
      textAlign: "center",
      color: colors.text,
      minHeight: 56,
    },
    verifyButton: {
      borderRadius: 12,
      overflow: "hidden",
    },
    verifyGradient: {
      paddingVertical: 16,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
    },
    verifyButtonText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "bold",
      marginLeft: isRTL ? 0 : 8,
      marginRight: isRTL ? 8 : 0,
    },
    resendContainer: {
      alignItems: "center",
      marginTop: 20,
    },
    resendText: {
      color: colors.textSecondary,
      fontSize: 14,
      marginBottom: 8,
    },
    resendButton: {
      padding: 8,
    },
    resendButtonText: {
      color: colors.primary,
      fontSize: 14,
      fontWeight: "600",
    },
    resendDisabledText: {
      color: colors.textSecondary,
      fontSize: 14,
    },
    loadingContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },
    loadingText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "bold",
      marginLeft: isRTL ? 0 : 8,
      marginRight: isRTL ? 8 : 0,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[colors.primary + "20", "transparent"]}
        style={styles.gradientBackground}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="mail" size={40} color={colors.primary} />
            </View>
            <Text style={styles.title}>
              {t("auth.email_verification.title")}
            </Text>
            <Text style={styles.subtitle}>
              {t("auth.email_verification.subtitle")}
            </Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>
                {t("auth.email_verification.verification_code")}
              </Text>
              <TextInput
                style={styles.codeInput}
                value={verificationCode}
                onChangeText={setVerificationCode}
                placeholder="000000"
                placeholderTextColor={colors.textSecondary}
                keyboardType="number-pad"
                maxLength={6}
                autoComplete="sms-otp"
              />
            </View>

            <TouchableOpacity
              style={styles.verifyButton}
              onPress={handleVerifyCode}
              disabled={loading}
            >
              <LinearGradient
                colors={[colors.primary, colors.primary + "DD"]}
                style={styles.verifyGradient}
              >
                {loading ? (
                  <View style={styles.loadingContainer}>
                    <Ionicons name="sync" size={20} color="#FFFFFF" />
                    <Text style={styles.loadingText}>
                      {t("auth.loading.verifying")}
                    </Text>
                  </View>
                ) : (
                  <>
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color="#FFFFFF"
                    />
                    <Text style={styles.verifyButtonText}>
                      {t("auth.email_verification.verify")}
                    </Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.resendContainer}>
              <Text style={styles.resendText}>
                {t("common.no")} {t("auth.email_verification.enter_code")}?
              </Text>
              {canResend ? (
                <TouchableOpacity
                  style={styles.resendButton}
                  onPress={handleResendCode}
                  disabled={resendLoading}
                >
                  <Text style={styles.resendButtonText}>
                    {resendLoading
                      ? t("common.loading")
                      : t("auth.email_verification.resend_code")}
                  </Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.resendDisabledText}>
                  {t("auth.email_verification.resend_code")} ({countdown}s)
                </Text>
              )}
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
