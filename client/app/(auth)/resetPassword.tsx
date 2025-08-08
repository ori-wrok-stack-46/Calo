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
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/src/i18n/context/LanguageContext";
import { useTheme } from "@/src/context/ThemeContext";
import { userAPI } from "@/src/services/api";
import { Lock, ArrowLeft, Eye, EyeOff } from "lucide-react-native";

export default function ResetPasswordScreen() {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const { colors, isDarkMode } = useTheme();
  const router = useRouter();
  const { email, resetToken } = useLocalSearchParams();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const validatePassword = (password: string) => {
    if (password.length < 6) {
      return "Password must be at least 6 characters long";
    }
    return null;
  };

  const handleResetPassword = async () => {
    if (!password.trim() || !confirmPassword.trim()) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      Alert.alert("Error", passwordError);
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    try {
      setIsLoading(true);
      console.log("🔑 Resetting password for:", email);

      const response = await userAPI.resetPassword(
        resetToken as string,
        email as string,
        password
      );

      if (response.success) {
        Alert.alert(
          "Success",
          "Your password has been reset successfully. Please sign in with your new password.",
          [
            {
              text: "OK",
              onPress: () => {
                router.replace("/(auth)/signin");
              },
            },
          ]
        );
      } else {
        throw new Error(response.error || "Failed to reset password");
      }
    } catch (error: any) {
      console.error("💥 Reset password error:", error);
      Alert.alert("Error", error.message || "Failed to reset password");
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = () => {
    return (
      password.trim() &&
      confirmPassword.trim() &&
      password === confirmPassword &&
      validatePassword(password) === null
    );
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
    },
    subtitleRTL: {
      textAlign: "right",
    },
    form: {
      flex: 1,
      maxHeight: 500,
    },
    inputContainer: {
      marginBottom: 20,
      shadowColor: colors.primary,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
    passwordInputContainer: {
      position: "relative",
    },
    input: {
      borderWidth: 2,
      borderColor: colors.border,
      borderRadius: 16,
      padding: 18,
      paddingRight: 60,
      fontSize: 16,
      backgroundColor: colors.surface,
      color: colors.text,
      fontWeight: "500",
    },
    inputRTL: {
      textAlign: "right",
      paddingLeft: 60,
      paddingRight: 18,
    },
    eyeButton: {
      position: "absolute",
      right: 20,
      top: 20,
      padding: 4,
    },
    eyeButtonRTL: {
      left: 20,
      right: "auto",
    },
    resetButton: {
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
      marginTop: 12,
    },
    resetButtonDisabled: {
      opacity: 0.5,
    },
    resetButtonContent: {
      flexDirection: "row",
      alignItems: "center",
    },
    resetButtonText: {
      fontSize: 18,
      fontWeight: "700",
      color: "#ffffff",
      marginLeft: 8,
      letterSpacing: 0.5,
    },
    passwordRequirements: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      borderLeftWidth: 4,
      borderLeftColor: colors.primary,
    },
    requirementsTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 8,
    },
    requirementText: {
      fontSize: 12,
      color: colors.textSecondary,
      lineHeight: 18,
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
            <Lock size={32} color={colors.primary} />
          </View>

          <Text style={[styles.title, isRTL && styles.titleRTL]}>
            Create New Password
          </Text>

          <Text style={[styles.subtitle, isRTL && styles.subtitleRTL]}>
            Enter your new password below
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={[styles.input, isRTL && styles.inputRTL]}
                placeholder="New Password"
                placeholderTextColor={colors.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
                textAlign={isRTL ? "right" : "left"}
              />
              <TouchableOpacity
                style={[styles.eyeButton, isRTL && styles.eyeButtonRTL]}
                onPress={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff size={20} color={colors.textSecondary} />
                ) : (
                  <Eye size={20} color={colors.textSecondary} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={[styles.input, isRTL && styles.inputRTL]}
                placeholder="Confirm New Password"
                placeholderTextColor={colors.textSecondary}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
                textAlign={isRTL ? "right" : "left"}
              />
              <TouchableOpacity
                style={[styles.eyeButton, isRTL && styles.eyeButtonRTL]}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff size={20} color={colors.textSecondary} />
                ) : (
                  <Eye size={20} color={colors.textSecondary} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.resetButton,
              (!isFormValid() || isLoading) && styles.resetButtonDisabled,
            ]}
            onPress={handleResetPassword}
            disabled={!isFormValid() || isLoading}
          >
            <View style={styles.resetButtonContent}>
              {isLoading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <>
                  <Lock size={20} color="#ffffff" />
                  <Text style={styles.resetButtonText}>Reset Password</Text>
                </>
              )}
            </View>
          </TouchableOpacity>

          <View style={styles.passwordRequirements}>
            <Text style={styles.requirementsTitle}>Password Requirements:</Text>
            <Text style={styles.requirementText}>
              • At least 6 characters long
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
