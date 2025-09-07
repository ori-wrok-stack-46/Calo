import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Link, router } from "expo-router";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/src/i18n/context/LanguageContext";
import { useDispatch, useSelector } from "react-redux";
import { signUp } from "@/src/store/authSlice";
import { RootState, AppDispatch } from "@/src/store";
import { ToastService } from "@/src/services/totastService";
import Toast from "react-native-toast-message";
import { useTheme } from "@/src/context/ThemeContext";

export default function SignUpScreen() {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const { colors } = useTheme();
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [acceptedPrivacyPolicy, setAcceptedPrivacyPolicy] = useState(false);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSignUp = async () => {
    if (!email || !password || !name) {
      ToastService.error("Error", "Please fill in all fields");
      return;
    }

    if (!validateEmail(email)) {
      ToastService.error("Error", "Please enter a valid email address");
      return;
    }

    if (password !== confirmPassword) {
      ToastService.error("Error", "Passwords do not match");
      return;
    }

    if (!acceptedPrivacyPolicy) {
      ToastService.error(
        "Error",
        "Please accept our privacy policy to continue"
      );
      return;
    }

    try {
      console.log("🔄 Starting signup process...");

      const result = await dispatch(
        signUp({
          email,
          password,
          name,
          birth_date: new Date(), // You should get this from a date picker
        })
      ).unwrap();

      console.log("✅ Signup result:", result);

      if (result.success) {
        // Show success message
        ToastService.success(
          "Account Created!",
          result.message || "Please check your email for verification code"
        );

        // Navigate after a short delay to show the toast
        setTimeout(() => {
          router.push({
            pathname: "/(auth)/email-verification",
            params: { email },
          });
        }, 1500);
      } else {
        throw new Error(result.error || "Failed to create account");
      }
    } catch (error: any) {
      console.error("💥 Signup error in component:", error);
      ToastService.error(
        t("common.error", "Error"),
        error.message ||
          error ||
          t("auth.failed_create_account", "Failed to create account")
      );
    }
  };

  const handleGoogleSignUp = () => {
    // Implement Google sign up
    console.log("Google sign up");
  };

  const handleFacebookSignUp = () => {
    // Implement Facebook sign up
    console.log("Facebook sign up");
  };

  const handleTwitterSignUp = () => {
    // Implement Twitter sign up
    console.log("Twitter sign up");
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    containerRTL: {
      ...(Platform.OS === "web" ? { direction: "rtl" } : {}),
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      padding: 24,
      paddingTop: 50,
      paddingBottom: 40,
    },
    headerContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 40,
    },
    backButton: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.surface,
      justifyContent: "center",
      alignItems: "center",
      shadowColor: colors.text,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    backButtonText: {
      fontSize: 20,
      color: colors.text,
      fontWeight: "600",
    },
    titleContainer: {
      marginBottom: 40,
      alignItems: "center",
    },
    title: {
      fontSize: 32,
      fontWeight: "800",
      color: colors.text,
      textAlign: "center",
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: "center",
      fontWeight: "400",
    },
    titleRTL: {
      textAlign: "center",
    },
    form: {
      flex: 1,
    },
    inputContainer: {
      marginBottom: 20,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 8,
    },
    input: {
      borderWidth: 2,
      borderColor: colors.border,
      borderRadius: 16,
      padding: 18,
      fontSize: 16,
      backgroundColor: colors.surface,
      color: colors.text,
      fontWeight: "400",
      shadowColor: colors.text,
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    inputFocused: {
      borderColor: colors.primary,
      shadowColor: colors.primary,
      shadowOpacity: 0.2,
    },
    inputRTL: {
      textAlign: "right",
    },
    privacyPolicyContainer: {
      marginTop: 8,
      marginBottom: 32,
      paddingHorizontal: 4,
    },
    checkboxContainer: {
      flexDirection: "row",
      alignItems: "flex-start",
      paddingHorizontal: 4,
    },
    checkbox: {
      width: 22,
      height: 22,
      borderWidth: 2,
      borderColor: colors.border,
      borderRadius: 6,
      marginRight: 12,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surface,
      marginTop: 2,
    },
    checkboxChecked: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    checkmark: {
      color: "#ffffff",
      fontSize: 12,
      fontWeight: "bold",
    },
    privacyText: {
      fontSize: 14,
      color: colors.textSecondary,
      flex: 1,
      lineHeight: 20,
      fontWeight: "400",
    },
    privacyLinkContainer: {
      display: "contents",
    },
    privacyLink: {
      color: colors.primary,
      fontWeight: "600",
      textDecorationLine: "underline",
    },
    signUpButton: {
      backgroundColor: colors.primary,
      borderRadius: 16,
      padding: 18,
      alignItems: "center",
      marginBottom: 24,
      shadowColor: colors.primary,
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 8,
    },
    buttonDisabled: {
      opacity: 0.6,
    },
    signUpButtonText: {
      color: "#ffffff",
      fontSize: 18,
      fontWeight: "700",
      letterSpacing: 0.5,
    },
    errorText: {
      color: colors.error,
      fontSize: 14,
      textAlign: "center",
      marginBottom: 16,
      fontWeight: "500",
      backgroundColor: `${colors.error}10`,
      padding: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: `${colors.error}20`,
    },
    socialContainer: {
      marginBottom: 32,
    },
    dividerContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 24,
    },
    divider: {
      flex: 1,
      height: 1,
      backgroundColor: colors.border,
    },
    dividerText: {
      marginHorizontal: 16,
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: "500",
    },
    socialButtons: {
      flexDirection: "row",
      justifyContent: "center",
      gap: 16,
    },
    socialButton: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.surface,
      borderWidth: 2,
      borderColor: colors.border,
      justifyContent: "center",
      alignItems: "center",
      shadowColor: colors.text,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    socialButtonText: {
      fontSize: 20,
      fontWeight: "600",
      color: colors.text,
    },
    footer: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      paddingTop: 20,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      marginTop: 20,
    },
    footerRTL: {
      flexDirection: "row-reverse",
    },
    footerText: {
      fontSize: 15,
      color: colors.textSecondary,
      fontWeight: "400",
    },
    linkText: {
      fontSize: 15,
      color: colors.primary,
      fontWeight: "700",
      textDecorationLine: "underline",
    },
    textRTL: {
      textAlign: "right",
    },
  });

  return (
    <>
      <View style={[styles.container, isRTL && styles.containerRTL]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header with back button */}
          <View style={styles.headerContainer}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
          </View>

          {/* Title */}
          <View style={styles.titleContainer}>
            <Text style={[styles.title, isRTL && styles.titleRTL]}>
              {t("auth.create_account")}
            </Text>
            <Text style={styles.subtitle}>{t("auth.welcome")}</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t("auth.full_name")}</Text>
              <TextInput
                style={[styles.input, isRTL && styles.inputRTL]}
                placeholder={t("auth.name")}
                placeholderTextColor={colors.textSecondary}
                value={name}
                onChangeText={setName}
                textAlign={isRTL ? "right" : "left"}
                editable={!isLoading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t("auth.email")}</Text>
              <TextInput
                style={[styles.input, isRTL && styles.inputRTL]}
                placeholder={t("auth.enter_email")}
                placeholderTextColor={colors.textSecondary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                textAlign={isRTL ? "right" : "left"}
                editable={!isLoading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t("auth.password")}</Text>
              <TextInput
                style={[styles.input, isRTL && styles.inputRTL]}
                placeholder={t("auth.enter_password")}
                placeholderTextColor={colors.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                textAlign={isRTL ? "right" : "left"}
                editable={!isLoading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>
                {t("auth.confirm_password")}
              </Text>
              <TextInput
                style={[styles.input, isRTL && styles.inputRTL]}
                placeholder={t("auth.enter_password_again")}
                placeholderTextColor={colors.textSecondary}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                textAlign={isRTL ? "right" : "left"}
                editable={!isLoading}
              />
            </View>

            <View style={styles.privacyPolicyContainer}>
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => setAcceptedPrivacyPolicy(!acceptedPrivacyPolicy)}
              >
                <View
                  style={[
                    styles.checkbox,
                    acceptedPrivacyPolicy && styles.checkboxChecked,
                  ]}
                >
                  {acceptedPrivacyPolicy && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </View>
                <View style={styles.privacyLinkContainer}>
                  <Text style={[styles.privacyText, isRTL && styles.textRTL]}>
                    {t("auth.privacy_agree")}{" "}
                  </Text>
                  <TouchableOpacity
                    onPress={() => router.push("/privacy-policy")}
                    style={styles.privacyLinkContainer}
                  >
                    <Text style={styles.privacyLink}>{t("privacy.title")}</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </View>

            {/* Sign Up Button */}
            <TouchableOpacity
              style={[styles.signUpButton, isLoading && styles.buttonDisabled]}
              onPress={handleSignUp}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.signUpButtonText}>{t("auth.create")}</Text>
              )}
            </TouchableOpacity>

            {error && <Text style={styles.errorText}>{error}</Text>}

            {/* Footer */}
            <View style={[styles.footer, isRTL && styles.footerRTL]}>
              <Text style={styles.footerText}>{t("auth.has_account")} </Text>
              <Link href="/signin" asChild>
                <TouchableOpacity>
                  <Text style={styles.linkText}>{t("auth.sign_in")}</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </View>
      <Toast />
    </>
  );
}
