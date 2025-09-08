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
      height: height * 0.5,
    },
    cloudShape: {
      position: "absolute",
      backgroundColor: "#FFFFFF",
      borderRadius: 50,
    },
    cloud1: {
      width: width * 0.6,
      height: 80,
      top: height * 0.2,
      left: width * 0.2,
      transform: [{ rotate: "8deg" }],
    },
    cloud2: {
      width: width * 0.4,
      height: 60,
      top: height * 0.28,
      right: width * 0.1,
      transform: [{ rotate: "-12deg" }],
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 60,
      justifyContent: "center",
    },
    backButton: {
      width: 45,
      height: 45,
      borderRadius: 22.5,
      backgroundColor: "rgba(255, 255, 255, 0.9)",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 30,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    header: {
      alignItems: "center",
      marginBottom: 40,
    },
    iconContainer: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: "#FFFFFF",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 30,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 8,
    },
    icon: {
      width: 60,
      height: 60,
      borderRadius: 30,
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
      lineHeight: 24,
      paddingHorizontal: 20,
    },
    formContainer: {
      backgroundColor: "#FFFFFF",
      borderRadius: 25,
      padding: 30,
      marginBottom: 20,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 20,
      elevation: 10,
    },
    otpTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.text,
      textAlign: "center",
      marginBottom: 30,
    },
    otpContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 40,
      paddingHorizontal: 10,
    },
    otpInput: {
      width: 50,
      height: 60,
      borderRadius: 15,
      backgroundColor: "#F8F9FA",
      borderWidth: 2,
      borderColor: "#E9ECEF",
      textAlign: "center",
      fontSize: 24,
      fontWeight: "bold",
      color: colors.text,
    },
    otpInputFilled: {
      borderColor: colors.primary,
      backgroundColor: "#FFFFFF",
    },
    verifyButton: {
      borderRadius: 15,
      overflow: "hidden",
      marginBottom: 20,
    },
    verifyGradient: {
      paddingVertical: 18,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
    },
    verifyButtonText: {
      color: "#FFFFFF",
      fontSize: 18,
      fontWeight: "700",
      marginLeft: isRTL ? 0 : 8,
      marginRight: isRTL ? 8 : 0,
    },
    resendContainer: {
      alignItems: "center",
      marginTop: 20,
    },
    resendText: {
      color: colors.textSecondary,
      fontSize: 16,
      marginBottom: 15,
      textAlign: "center",
    },
    resendButton: {
      paddingVertical: 10,
      paddingHorizontal: 20,
    },
    resendButtonText: {
      color: colors.primary,
      fontSize: 16,
      fontWeight: "700",
    },
    resendDisabledText: {
      color: colors.textSecondary,
      fontSize: 16,
    },
    loadingContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },
    loadingText: {
      color: "#FFFFFF",
      fontSize: 18,
      fontWeight: "700",
      marginLeft: isRTL ? 0 : 8,
      marginRight: isRTL ? 8 : 0,
    },
  });

  const renderOTPInputs = () => {
    const inputs = [];
    for (let i = 0; i < 6; i++) {
      inputs.push(
        <TextInput
          key={i}
          style={[
            styles.otpInput,
            verificationCode.length > i && styles.otpInputFilled,
          ]}
          value={verificationCode[i] || ""}
          onChangeText={(text) => {
            if (text.length <= 1) {
              const newCode = verificationCode.split("");
              newCode[i] = text;
              setVerificationCode(newCode.join("").slice(0, 6));
            }
          }}
          keyboardType="numeric"
          maxLength={1}
          selectTextOnFocus
        />
      );
    }
    return inputs;
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={["#4FACFE", "#00F2FE"]}
        style={styles.gradientBackground}
      />

      {/* Cloud shapes */}
      <View style={[styles.cloudShape, styles.cloud1]} />
      <View style={[styles.cloudShape, styles.cloud2]} />

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
              size={24}
              color={colors.primary}
            />
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <View style={styles.icon}>
                <Ionicons name="mail" size={30} color="#FFFFFF" />
              </View>
            </View>
            <Text style={styles.title}>
              {t("auth.email_verification.title")}
            </Text>
            <Text style={styles.subtitle}>
              {t("auth.email_verification.subtitle")}
            </Text>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.otpTitle}>
              {t("auth.email_verification.verification_code")}
            </Text>

            <View style={styles.otpContainer}>{renderOTPInputs()}</View>

            <TouchableOpacity
              style={styles.verifyButton}
              onPress={handleVerifyCode}
              disabled={loading || verificationCode.length !== 6}
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
                {t("auth.email_verification.no_code")}
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
