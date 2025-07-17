import React, { useState, useEffect } from "react";
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
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/src/store";
import { userAPI } from "@/src/services/api";

export default function EmailVerificationScreen() {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { email } = useLocalSearchParams();

  const [verificationCode, setVerificationCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

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
  }, []);

  const handleVerifyEmail = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      Alert.alert("שגיאה", "אנא הכנס קוד אימות בן 6 ספרות");
      return;
    }

    try {
      setIsLoading(true);
      console.log("🔄 Verifying email:", email, "with code:", verificationCode);

      const response = await userAPI.verifyEmail(
        email as string,
        verificationCode
      );
      console.log("✅ Verification response:", response);

      if (response.success && response.user && response.token) {
        // Store token in SecureStore for mobile
        const { Platform } = require("react-native");
        if (Platform.OS !== "web") {
          const SecureStore = require("expo-secure-store");
          await SecureStore.setItemAsync("auth_token_secure", response.token);
          console.log("✅ Token stored in SecureStore for mobile");
        }

        // Store auth data in Redux
        dispatch({
          type: "auth/setUser",
          payload: response.user,
        });

        dispatch({
          type: "auth/setToken",
          payload: response.token,
        });

        console.log("✅ User authenticated, redirecting to payment-plan");

        // Navigate directly without alert for better UX
        router.replace("/payment-plan");
      } else {
        throw new Error(response.error || "אימות נכשל");
      }
    } catch (error: any) {
      console.error("💥 Verification error:", error);
      Alert.alert("שגיאה", error.message || "אימות האימייל נכשל");
    } finally {
      setIsLoading(false);
    }
  };

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
            <Text style={styles.emailIcon}>📧</Text>
          </View>
          <Text style={[styles.title, isRTL && styles.titleRTL]}>
            אימות אימייל
          </Text>
          <Text style={[styles.subtitle, isRTL && styles.subtitleRTL]}>
            שלחנו קוד אימות בן 6 ספרות לכתובת:
          </Text>
          <Text style={[styles.emailText, isRTL && styles.emailTextRTL]}>
            {email}
          </Text>
          <Text style={[styles.subtitle, isRTL && styles.subtitleRTL]}>
            אנא בדוק את תיבת הדואר שלך (כולל תיקיית ספאם)
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, isRTL && styles.inputRTL]}
              placeholder="הכנס קוד אימות"
              placeholderTextColor="#10B981"
              value={verificationCode}
              onChangeText={setVerificationCode}
              keyboardType="numeric"
              maxLength={6}
              textAlign="center"
              editable={!isLoading}
            />
          </View>

          <TouchableOpacity
            style={[styles.verifyButton, isLoading && styles.buttonDisabled]}
            onPress={handleVerifyEmail}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.verifyButtonText}>אמת אימייל</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.resendButton,
              (isLoading || resendCooldown > 0) && styles.buttonDisabled,
            ]}
            onPress={async () => {
              if (resendCooldown > 0) return;

              try {
                setIsLoading(true);
                const response = await userAPI.resendVerificationCode(
                  email as string
                );
                if (response.success) {
                  setResendCooldown(60); // 60 second cooldown
                  Alert.alert("הודעה", "קוד חדש נשלח לאימייל שלך");
                } else {
                  throw new Error(response.error || "Failed to resend code");
                }
              } catch (error: any) {
                Alert.alert("שגיאה", error.message || "שליחת הקוד נכשלה");
              } finally {
                setIsLoading(false);
              }
            }}
            disabled={isLoading || resendCooldown > 0}
          >
            <Text style={styles.resendButtonText}>
              {resendCooldown > 0
                ? `שלח קוד חדש (${resendCooldown})`
                : "שלח קוד חדש"}
            </Text>
          </TouchableOpacity>
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
    width: 80,
    height: 80,
    borderRadius: 40,
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
  emailIcon: {
    fontSize: 40,
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
    fontSize: 22,
    backgroundColor: "#ffffff",
    textAlign: "center",
    letterSpacing: 8,
    fontWeight: "700",
    color: "#065f46",
  },
  inputRTL: {
    textAlign: "center",
  },
  verifyButton: {
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
  verifyButtonText: {
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
  },
  resendButtonText: {
    color: "#10B981",
    fontSize: 16,
    fontWeight: "600",
  },
});
