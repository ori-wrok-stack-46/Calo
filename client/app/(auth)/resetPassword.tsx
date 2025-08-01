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
} from "react-native";
import { useRouter, useLocalSearchParams, Link } from "expo-router";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/src/i18n/context/LanguageContext";
import { Lock, Eye, EyeOff } from "lucide-react-native";
import { api } from "@/src/services/api";

export default function ResetPasswordScreen() {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const router = useRouter();
  const { token, email } = useLocalSearchParams();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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

  const validatePassword = (password: string) => {
    return password.length >= 8;
  };

  const handleResetPassword = async () => {
    if (!password || !confirmPassword) {
      Alert.alert(t("common.error"), "Please fill in all fields");
      return;
    }

    if (!validatePassword(password)) {
      Alert.alert(t("common.error"), "Password must be at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(t("common.error"), "Passwords do not match");
      return;
    }

    try {
      setIsLoading(true);
      console.log("🔄 Resetting password...");

      const response = await api.post("/auth/reset-password", {
        token,
        email,
        newPassword: password,
      });

      if (response.data.success) {
        Alert.alert("Success!", "Your password has been reset successfully", [
          {
            text: "Sign In",
            onPress: () => router.replace("/(auth)/signin"),
          },
        ]);
      } else {
        throw new Error(response.data.error || "Failed to reset password");
      }
    } catch (error: any) {
      console.error("💥 Reset password error:", error);
      Alert.alert(
        t("common.error"),
        error.response?.data?.error ||
          error.message ||
          "Failed to reset password"
      );
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
            <Lock size={48} color="#10B981" />
          </View>
          <Text style={[styles.title, isRTL && styles.titleRTL]}>
            Reset Password
          </Text>
          <Text style={[styles.subtitle, isRTL && styles.subtitleRTL]}>
            Enter your new password below
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, isRTL && styles.inputRTL]}
              placeholder="New Password"
              placeholderTextColor="#10B981"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              textAlign={isRTL ? "right" : "left"}
              editable={!isLoading}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff size={20} color="#10B981" />
              ) : (
                <Eye size={20} color="#10B981" />
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, isRTL && styles.inputRTL]}
              placeholder="Confirm New Password"
              placeholderTextColor="#10B981"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              textAlign={isRTL ? "right" : "left"}
              editable={!isLoading}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <EyeOff size={20} color="#10B981" />
              ) : (
                <Eye size={20} color="#10B981" />
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.resetButton, isLoading && styles.buttonDisabled]}
            onPress={handleResetPassword}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.resetButtonText}>Reset Password</Text>
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
    fontWeight: "500",
    lineHeight: 22,
  },
  subtitleRTL: {
    textAlign: "right",
  },
  form: {
    flex: 1,
    maxHeight: 400,
  },
  inputContainer: {
    marginBottom: 20,
    shadowColor: "#10B981",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    position: "relative",
  },
  input: {
    borderWidth: 2,
    borderColor: "#d1fae5",
    borderRadius: 16,
    padding: 18,
    paddingRight: 50,
    fontSize: 16,
    backgroundColor: "#ffffff",
    color: "#065f46",
    fontWeight: "500",
  },
  inputRTL: {
    textAlign: "right",
    paddingLeft: 50,
    paddingRight: 18,
  },
  eyeButton: {
    position: "absolute",
    right: 18,
    top: "50%",
    transform: [{ translateY: -10 }],
  },
  resetButton: {
    backgroundColor: "#10B981",
    borderRadius: 16,
    padding: 18,
    alignItems: "center",
    marginTop: 24,
    shadowColor: "#10B981",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  resetButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
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
