import React, { useState } from "react";
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
import { Link, router } from "expo-router";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/src/i18n/context/LanguageContext";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react-native";
import { api } from "@/src/services/api";

const { width } = Dimensions.get("window");

export default function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  React.useEffect(() => {
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
  }, []);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSendResetEmail = async () => {
    if (!email || !validateEmail(email)) {
      Alert.alert(t("common.error"), "Please enter a valid email address");
      return;
    }

    try {
      setIsLoading(true);
      console.log("🔄 Sending password reset email to:", email);

      const response = await api.post("/auth/forgot-password", { email });

      if (response.data.success) {
        // Navigate to verification page instead of showing alert
        router.push({
          pathname: "/(auth)/reset-password-verify",
          params: { email },
        });
      } else {
        throw new Error(response.data.error || "Failed to send reset email");
      }
    } catch (error: any) {
      console.error("💥 Forgot password error:", error);
      Alert.alert(
        t("common.error"),
        error.response?.data?.error ||
          error.message ||
          "Failed to send reset email"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = async () => {
    setEmailSent(false);
    await handleSendResetEmail();
  };

  if (emailSent) {
    return (
      <View style={[styles.container, isRTL && styles.containerRTL]}>
        <View style={styles.backgroundAccent} />

        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <CheckCircle size={60} color="#10B981" />
            </View>
            <Text style={[styles.title, isRTL && styles.titleRTL]}>
              Email Sent!
            </Text>
            <Text style={[styles.subtitle, isRTL && styles.subtitleRTL]}>
              We've sent password reset instructions to:
            </Text>
            <Text style={[styles.emailText, isRTL && styles.emailTextRTL]}>
              {email}
            </Text>
            <Text style={[styles.subtitle, isRTL && styles.subtitleRTL]}>
              Please check your email (including spam folder)
            </Text>
          </View>

          <View style={styles.form}>
            <TouchableOpacity
              style={styles.resendButton}
              onPress={handleResendEmail}
              disabled={isLoading}
            >
              <Text style={styles.resendButtonText}>Resend Email</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.push("/(auth)/signin")}
            >
              <ArrowLeft size={20} color="#10B981" />
              <Text style={styles.backButtonText}>Back to Sign In</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={[styles.container, isRTL && styles.containerRTL]}>
      <View style={styles.backgroundAccent} />

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Mail size={48} color="#10B981" />
          </View>
          <Text style={[styles.title, isRTL && styles.titleRTL]}>
            Forgot Password?
          </Text>
          <Text style={[styles.subtitle, isRTL && styles.subtitleRTL]}>
            Enter your email address and we'll send you instructions to reset
            your password
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, isRTL && styles.inputRTL]}
              placeholder="Enter your email address"
              placeholderTextColor="#10B981"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              textAlign={isRTL ? "right" : "left"}
              editable={!isLoading}
            />
          </View>

          <TouchableOpacity
            style={[styles.sendButton, isLoading && styles.buttonDisabled]}
            onPress={handleSendResetEmail}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.sendButtonText}>Send Reset Email</Text>
            )}
          </TouchableOpacity>

          <View style={[styles.footer, isRTL && styles.footerRTL]}>
            <Text style={styles.footerText}>Remember your password? </Text>
            <Link href="/signin" asChild>
              <TouchableOpacity>
                <Text style={styles.linkText}>Sign In</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  containerRTL: {
    direction: "rtl",
  },
  backgroundAccent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "40%",
    backgroundColor: "#f0fdf4",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    zIndex: 1,
  },
  header: {
    marginBottom: 48,
    alignItems: "center",
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    shadowColor: "#10B981",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 2,
    borderColor: "#d1fae5",
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#065f46",
    marginBottom: 16,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  titleRTL: {
    textAlign: "right",
  },
  subtitle: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 8,
    fontWeight: "500",
    lineHeight: 22,
  },
  subtitleRTL: {
    textAlign: "right",
  },
  emailText: {
    fontSize: 16,
    color: "#10B981",
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  emailTextRTL: {
    textAlign: "right",
  },
  form: {
    flex: 1,
    maxHeight: 300,
  },
  inputContainer: {
    marginBottom: 32,
    shadowColor: "#10B981",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  input: {
    borderWidth: 2,
    borderColor: "#d1fae5",
    borderRadius: 16,
    padding: 20,
    fontSize: 16,
    backgroundColor: "#ffffff",
    color: "#065f46",
    fontWeight: "500",
  },
  inputRTL: {
    textAlign: "right",
  },
  sendButton: {
    backgroundColor: "#10B981",
    borderRadius: 16,
    padding: 18,
    alignItems: "center",
    marginBottom: 24,
    shadowColor: "#10B981",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  sendButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  resendButton: {
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    borderWidth: 2,
    borderColor: "#d1fae5",
    shadowColor: "#10B981",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 16,
  },
  resendButtonText: {
    color: "#10B981",
    fontSize: 16,
    fontWeight: "600",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    gap: 8,
  },
  backButtonText: {
    color: "#10B981",
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 32,
  },
  footerRTL: {
    flexDirection: "row-reverse",
  },
  footerText: {
    fontSize: 15,
    color: "#6b7280",
    fontWeight: "500",
  },
  linkText: {
    fontSize: 15,
    color: "#10B981",
    fontWeight: "700",
  },
});
