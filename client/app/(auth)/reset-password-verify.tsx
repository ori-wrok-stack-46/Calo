import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Animated,
  Dimensions,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/src/i18n/context/LanguageContext";
import { LinearGradient } from "expo-linear-gradient";
import { Mail, ArrowLeft, Shield, RefreshCw, Check } from "lucide-react-native";
import { api } from "@/src/services/api";

const { width } = Dimensions.get("window");

export default function ResetPasswordVerifyScreen() {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const router = useRouter();
  const { email } = useLocalSearchParams();

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [canResend, setCanResend] = useState(false);

  // Animation values
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const [shakeAnim] = useState(new Animated.Value(0));

  // Refs for input fields
  const inputRefs = useRef<TextInput[]>([]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

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

  const shakeAnimation = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleVerifyCode = async (verificationCode?: string) => {
    const codeToVerify = verificationCode || code.join("");

    if (codeToVerify.length !== 6) {
      Alert.alert("Error", "Please enter the complete 6-digit code");
      shakeAnimation();
      return;
    }

    try {
      setIsLoading(true);
      console.log("🔄 Verifying reset code...");

      // Verify the code with the server
      const response = await api.post("/auth/verify-reset-code", {
        email: email as string,
        code: codeToVerify,
      });

      if (response.data.success) {
        console.log("✅ Code verified successfully");

        // Navigate to password reset page with token
        router.push({
          pathname: "/(auth)/resetPassword",
          params: {
            token: response.data.token,
            email: email as string,
          },
        });
      } else {
        throw new Error(response.data.error || "Verification failed");
      }
    } catch (error: any) {
      console.error("💥 Verification error:", error);
      Alert.alert(
        "Error",
        error.response?.data?.error || error.message || "Failed to verify code"
      );
      shakeAnimation();

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
      console.log("🔄 Resending verification code...");

      const response = await api.post("/auth/forgot-password", {
        email: email as string,
      });

      if (response.data.success) {
        Alert.alert(
          "Success",
          "A new verification code has been sent to your email"
        );

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
        throw new Error(response.data.error || "Failed to resend code");
      }
    } catch (error: any) {
      console.error("💥 Resend error:", error);
      Alert.alert(
        "Error",
        error.response?.data?.error || error.message || "Failed to resend code"
      );
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <View style={[styles.container, isRTL && styles.containerRTL]}>
      <LinearGradient
        colors={["#667eea", "#764ba2"]}
        style={styles.backgroundGradient}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="white" />
          </TouchableOpacity>
        </View>

        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }, { translateX: shakeAnim }],
            },
          ]}
        >
          <View style={styles.iconContainer}>
            <Mail size={48} color="white" />
          </View>

          <Text style={[styles.title, isRTL && styles.titleRTL]}>
            Check Your Email
          </Text>

          <Text style={[styles.subtitle, isRTL && styles.subtitleRTL]}>
            We've sent a 6-digit verification code to {"\n"}
            <Text style={styles.emailText}>{email}</Text>
          </Text>

          <View style={styles.codeContainer}>
            <Text style={styles.codeLabel}>Enter Verification Code</Text>
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
                <ActivityIndicator color="white" size="small" />
              ) : (
                <>
                  <Shield size={20} color="white" />
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
                    <ActivityIndicator color="#667eea" size="small" />
                  ) : (
                    <>
                      <RefreshCw size={16} color="#667eea" />
                      <Text style={styles.resendButtonText}>Resend Code</Text>
                    </>
                  )}
                </View>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.securityNotice}>
            <Check size={16} color="rgba(255, 255, 255, 0.8)" />
            <Text style={styles.securityText}>
              This code expires in 5 minutes for your security
            </Text>
          </View>
        </Animated.View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  containerRTL: {
    direction: "rtl",
  },
  backgroundGradient: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
    marginBottom: 16,
  },
  titleRTL: {
    textAlign: "right",
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 40,
  },
  subtitleRTL: {
    textAlign: "right",
  },
  emailText: {
    fontWeight: "600",
    color: "white",
  },
  codeContainer: {
    width: "100%",
    marginBottom: 32,
  },
  codeLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
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
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },
  codeInputFilled: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderColor: "rgba(255, 255, 255, 0.8)",
  },
  verifyButton: {
    width: "100%",
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
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
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
    marginLeft: 8,
  },
  resendContainer: {
    marginBottom: 32,
  },
  timerText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
  },
  resendButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
  },
  resendButtonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  resendButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#667eea",
    marginLeft: 6,
  },
  securityNotice: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  securityText: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
    marginLeft: 8,
    flex: 1,
  },
});
