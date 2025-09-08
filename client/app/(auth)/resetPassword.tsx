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
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/src/i18n/context/LanguageContext";
import { useTheme } from "@/src/context/ThemeContext";
import { userAPI } from "@/src/services/api";

const { width, height } = Dimensions.get("window");

export default function ResetPasswordScreen() {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const { colors } = useTheme();
  const router = useRouter();
  const { resetToken } = useLocalSearchParams();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const validatePassword = (password: string) => {
    if (password.length < 6) {
      return t("auth.errors.invalid_password");
    }
    return null;
  };

  const handleResetPassword = async () => {
    if (!password.trim() || !confirmPassword.trim()) {
      Alert.alert(t("common.error"), t("auth.errors.required_field"));
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      Alert.alert(t("common.error"), passwordError);
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(t("common.error"), t("auth.errors.passwords_dont_match"));
      return;
    }

    try {
      setIsLoading(true);
      const response = await userAPI.resetPassword(
        resetToken as string,
        password
      );

      if (response.success) {
        Alert.alert(
          t("common.success"),
          t("auth.reset_password.reset_successful"),
          [
            {
              text: t("common.ok"),
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
      Alert.alert(
        t("common.error"),
        error.message || t("auth.reset_password.reset_failed")
      );
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
    gradientBackground: {
      position: "absolute",
      left: 0,
      right: 0,
      top: 0,
      height: height * 0.5,
    },
    cloudShape: {
      position: "absolute",
      backgroundColor: colors.surface,
      borderRadius: 50,
      opacity: 0.9,
    },
    cloud1: {
      width: width * 0.7,
      height: 100,
      top: height * 0.15,
      left: width * 0.15,
      transform: [{ rotate: "10deg" }],
    },
    cloud2: {
      width: width * 0.5,
      height: 70,
      top: height * 0.25,
      right: -width * 0.05,
      transform: [{ rotate: "-12deg" }],
    },
    content: {
      flex: 1,
      paddingHorizontal: 24,
      paddingTop: 60,
      justifyContent: "center",
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 30,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    header: {
      alignItems: "center",
      marginBottom: 40,
    },
    iconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 24,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    icon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    title: {
      fontSize: 24,
      fontWeight: "800",
      color: colors.text,
      marginBottom: 8,
      textAlign: "center",
    },
    subtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: "center",
      lineHeight: 20,
      paddingHorizontal: 20,
    },
    formContainer: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 24,
      marginBottom: 20,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 6,
    },
    inputContainer: {
      marginBottom: 20,
      position: "relative",
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
      paddingRight: 50,
      fontSize: 16,
      color: colors.text,
      textAlign: isRTL ? "right" : "left",
    },
    inputRTL: {
      paddingLeft: 50,
      paddingRight: 16,
    },
    eyeButton: {
      position: "absolute",
      right: 15,
      top: 42,
      padding: 5,
    },
    eyeButtonRTL: {
      left: 15,
      right: "auto",
    },
    resetButton: {
      borderRadius: 12,
      overflow: "hidden",
      marginTop: 10,
    },
    resetGradient: {
      paddingVertical: 16,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      backgroundColor: colors.primary,
    },
    resetButtonText: {
      color: colors.surface,
      fontSize: 16,
      fontWeight: "700",
      marginLeft: isRTL ? 0 : 8,
      marginRight: isRTL ? 8 : 0,
    },
    passwordRequirements: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 16,
      borderLeftWidth: 4,
      borderLeftColor: colors.primary,
      marginBottom: 10,
    },
    requirementsTitle: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 8,
    },
    requirementText: {
      fontSize: 12,
      color: colors.textSecondary,
      lineHeight: 16,
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
              size={20}
              color={colors.text}
            />
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <View style={styles.icon}>
                <Ionicons name="key" size={22} color={colors.surface} />
              </View>
            </View>
            <Text style={styles.title}>
              {t("auth.reset_password.reset_password_title")}
            </Text>
            <Text style={styles.subtitle}>
              {t("auth.reset_password.enter_new_password")}
            </Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>
                {t("auth.reset_password.new_password")}
              </Text>
              <TextInput
                style={[styles.input, isRTL && styles.inputRTL]}
                placeholder={t("auth.enter_password")}
                placeholderTextColor={colors.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
              <TouchableOpacity
                style={[styles.eyeButton, isRTL && styles.eyeButtonRTL]}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name={showPassword ? "eye-off" : "eye"}
                  size={18}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>
                {t("auth.reset_password.confirm_new_password")}
              </Text>
              <TextInput
                style={[styles.input, isRTL && styles.inputRTL]}
                placeholder={t("auth.enter_password_again")}
                placeholderTextColor={colors.textSecondary}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
              <TouchableOpacity
                style={[styles.eyeButton, isRTL && styles.eyeButtonRTL]}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Ionicons
                  name={showConfirmPassword ? "eye-off" : "eye"}
                  size={18}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.passwordRequirements}>
              <Text style={styles.requirementsTitle}>
                {t("auth.reset_password.password_requirements")}:
              </Text>
              <Text style={styles.requirementText}>
                • {t("auth.reset_password.password_requirement_length")}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.resetButton}
              onPress={handleResetPassword}
              disabled={!isFormValid() || isLoading}
            >
              <View style={styles.resetGradient}>
                {isLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator color={colors.surface} size="small" />
                    <Text style={styles.loadingText}>
                      {t("common.loading")}
                    </Text>
                  </View>
                ) : (
                  <>
                    <Ionicons name="key" size={18} color={colors.surface} />
                    <Text style={styles.resetButtonText}>
                      {t("auth.reset_password.title")}
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
