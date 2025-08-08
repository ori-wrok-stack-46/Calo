import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/src/i18n/context/LanguageContext";
import { useTheme } from "@/src/context/ThemeContext";
import { userAPI } from "@/src/services/api";
import { Shield, ArrowLeft, RefreshCw } from "lucide-react-native";

export default function ResetPasswordVerifyScreen() {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const { colors, isDarkMode } = useTheme();
  const router = useRouter();
  const { email } = useLocalSearchParams();

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [canResend, setCanResend] = useState(false);

  // Refs for input fields
  const inputRefs = useRef<TextInput[]>([]);

  useEffect(() => {
    // Start countdown timer
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleCodeChange = (text: string, index: number) => {
    // Only allow digits
    const digit = text.replace(/[^0-9]/g, "");

    if (digit.length <= 1) {
      const newCode = [...code];
      newCode[index] = digit;
      setCode(newCode);

      // Auto-focus next input
      if (digit && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }

      // Auto-submit when all fields are filled
      if (digit && index === 5 && newCode.every((c) => c !== "")) {
        handleVerifyCode(newCode.join(""));
      }
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyCode = async (verificationCode?: string) => {
    const codeToVerify = verificationCode || code.join("");

    if (codeToVerify.length !== 6) {
      Alert.alert("Error", "Please enter the complete 6-digit code");
      return;
    }

    try {
      setIsLoading(true);
      console.log(
        "🔒 Verifying reset code:",
        email,
        "with code:",
        codeToVerify
      );

      const response = await userAPI.verifyResetCode(
        email as string,
        codeToVerify
      );

      if (response.success && response.resetToken) {
        console.log("✅ Reset code verified successfully");

        router.push({
          pathname: "/(auth)/resetPassword",
          params: {
            email,
            resetToken: response.resetToken,
          },
        });
      } else {
        throw new Error(response.error || "Verification failed");
      }
    } catch (error: any) {
      console.error("💥 Reset code verification error:", error);
      Alert.alert("Error", error.message || "Invalid verification code");

      // Clear the code inputs
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!canResend) return;

    try {
      setResendLoading(true);
      console.log("🔄 Resending reset code...");

      const response = await userAPI.forgotPassword(email as string);

      if (response.success) {
        Alert.alert("Success", "A new reset code has been sent to your email");

        // Reset timer
        setTimeLeft(300);
        setCanResend(false);

        // Clear current code
        setCode(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();

        // Start new timer
        const timer = setInterval(() => {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              setCanResend(true);
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        throw new Error(response.error || "Failed to resend code");
      }
    } catch (error: any) {
      console.error("💥 Resend error:", error);
      Alert.alert("Error", error.message || "Failed to resend code");
    } finally {
      setResendLoading(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    containerRTL: {
      writingDirection: "rtl",
    },
    backgroundAccent: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: "35%",
      backgroundColor: isDarkMode ? colors.surface : "#f0fdf4",
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
    emailText: {
      fontWeight: "600",
      color: colors.primary,
    },
    form: {
      flex: 1,
      maxHeight: 400,
    },
    codeContainer: {
      marginBottom: 32,
    },
    codeLabel: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.text,
      textAlign: "center",
      marginBottom: 16,
    },
    codeInputs: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: 10,
    },
    codeInputsRTL: {
      flexDirection: "row-reverse",
    },
    codeInput: {
      width: 45,
      height: 55,
      borderRadius: 12,
      backgroundColor: colors.surface,
      borderWidth: 2,
      borderColor: colors.border,
      fontSize: 24,
      fontWeight: "bold",
      color: colors.text,
      textAlign: "center",
    },
    codeInputFilled: {
      borderColor: colors.primary,
    },
    verifyButton: {
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
    verifyButtonDisabled: {
      opacity: 0.5,
    },
    verifyButtonContent: {
      flexDirection: "row",
      alignItems: "center",
    },
    verifyButtonText: {
      fontSize: 18,
      fontWeight: "700",
      color: "#ffffff",
      marginLeft: 8,
      letterSpacing: 0.5,
    },
    resendContainer: {
      alignItems: "center",
      marginBottom: 32,
    },
    timerText: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: "center",
      fontWeight: "500",
    },
    resendButton: {
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 20,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    resendButtonContent: {
      flexDirection: "row",
      alignItems: "center",
    },
    resendButtonText: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.primary,
      marginLeft: 6,
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
            <Shield size={32} color={colors.primary} />
          </View>

          <Text style={[styles.title, isRTL && styles.titleRTL]}>
            Verify Reset Code
          </Text>

          <Text style={[styles.subtitle, isRTL && styles.subtitleRTL]}>
            We've sent a 6-digit code to {"\n"}
            <Text style={styles.emailText}>{email}</Text>
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.codeContainer}>
            <Text style={styles.codeLabel}>Enter Reset Code</Text>
            <View style={[styles.codeInputs, isRTL && styles.codeInputsRTL]}>
              {code.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => (inputRefs.current[index] = ref!)}
                  style={[styles.codeInput, digit && styles.codeInputFilled]}
                  value={digit}
                  onChangeText={(text) => handleCodeChange(text, index)}
                  onKeyPress={({ nativeEvent }) =>
                    handleKeyPress(nativeEvent.key, index)
                  }
                  keyboardType="numeric"
                  maxLength={1}
                  textAlign="center"
                  editable={!isLoading}
                />
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.verifyButton,
              (!code.every((c) => c !== "") || isLoading) &&
                styles.verifyButtonDisabled,
            ]}
            onPress={() => handleVerifyCode()}
            disabled={!code.every((c) => c !== "") || isLoading}
          >
            <View style={styles.verifyButtonContent}>
              {isLoading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <>
                  <Shield size={20} color="#ffffff" />
                  <Text style={styles.verifyButtonText}>Verify Code</Text>
                </>
              )}
            </View>
          </TouchableOpacity>

          <View style={styles.resendContainer}>
            {!canResend ? (
              <Text style={styles.timerText}>
                Resend code in {formatTime(timeLeft)}
              </Text>
            ) : (
              <TouchableOpacity
                style={styles.resendButton}
                onPress={handleResendCode}
                disabled={resendLoading}
              >
                <View style={styles.resendButtonContent}>
                  {resendLoading ? (
                    <ActivityIndicator color={colors.primary} size="small" />
                  ) : (
                    <>
                      <RefreshCw size={16} color={colors.primary} />
                      <Text style={styles.resendButtonText}>Resend Code</Text>
                    </>
                  )}
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}
