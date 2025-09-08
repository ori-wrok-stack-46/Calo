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
  Dimensions,
  KeyboardAvoidingView,
  SafeAreaView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Link, router } from "expo-router";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/src/i18n/context/LanguageContext";
import { useDispatch, useSelector } from "react-redux";
import { signUp } from "@/src/store/authSlice";
import { RootState, AppDispatch } from "@/src/store";
import { ToastService } from "@/src/services/totastService";
import Toast from "react-native-toast-message";
import { useTheme } from "@/src/context/ThemeContext";

const { width, height } = Dimensions.get("window");

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
  const [acceptedPrivacyPolicy, setAcceptedPrivacyPolicy] = useState(false);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSignUp = async () => {
    if (!email || !password || !name) {
      ToastService.error(t("common.error"), t("auth.errors.required_field"));
      return;
    }

    if (!validateEmail(email)) {
      ToastService.error(t("common.error"), t("auth.email_validation_error"));
      return;
    }

    if (password !== confirmPassword) {
      ToastService.error(
        t("common.error"),
        t("auth.errors.passwords_dont_match")
      );
      return;
    }

    if (!acceptedPrivacyPolicy) {
      ToastService.error(t("common.error"), t("auth.privacy_policy_required"));
      return;
    }

    try {
      console.log("🔄 Starting signup process...");

      const result = await dispatch(
        signUp({
          email,
          password,
          name,
          birth_date: new Date(),
        })
      ).unwrap();

      console.log("✅ Signup result:", result);

      if (result.success) {
        ToastService.success(
          t("auth.account_created"),
          result.message || t("auth.email_verification.check_email")
        );

        setTimeout(() => {
          router.push({
            pathname: "/(auth)/email-verification",
            params: { email },
          });
        }, 1500);
      } else {
        throw new Error(result.error || t("auth.failed_create_account"));
      }
    } catch (error: any) {
      console.error("💥 Signup error in component:", error);
      ToastService.error(
        t("common.error"),
        error.message || error || t("auth.failed_create_account")
      );
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    backgroundContainer: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    gradientBackground: {
      position: "absolute",
      left: 0,
      right: 0,
      top: 0,
      height: height * 1.2,
    },
    // Main white cloud base - larger and positioned better
    content: {
      flex: 1,
      paddingHorizontal: 24,
      paddingTop: 60,
      justifyContent: "center",
      zIndex: 10,
    },
    header: {
      alignItems: "center",
      marginBottom: 50,
    },
    profileContainer: {
      width: 90,
      height: 90,
      borderRadius: 45,
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 24,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
      elevation: 8,
    },
    profileIcon: {
      width: 50,
      height: 50,
      borderRadius: 25,
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
    },
    formContainer: {
      backgroundColor: colors.surface,
      borderRadius: 25,
      padding: 24,
    },
    inputContainer: {
      marginBottom: 20,
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
      fontSize: 16,
      color: colors.text,
      textAlign: isRTL ? "right" : "left",
    },
    forgotPassword: {
      alignSelf: isRTL ? "flex-start" : "flex-end",
      marginTop: 8,
      marginBottom: 24,
    },
    forgotPasswordText: {
      color: colors.primary,
      fontSize: 14,
      fontWeight: "600",
    },
    signInButton: {
      borderRadius: 12,
      overflow: "hidden",
      marginBottom: 20,
    },
    signInGradient: {
      paddingVertical: 16,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      backgroundColor: colors.primary,
    },
    signInButtonText: {
      color: colors.surface,
      fontSize: 16,
      fontWeight: "700",
      marginLeft: isRTL ? 0 : 8,
      marginRight: isRTL ? 8 : 0,
    },
    socialContainer: {
      flexDirection: "row",
      justifyContent: "center",
      gap: 12,
      marginVertical: 20,
    },
    socialButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.background,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    footer: {
      flexDirection: isRTL ? "row-reverse" : "row",
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: 20,
    },
    footerText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    linkText: {
      fontSize: 14,
      color: colors.primary,
      fontWeight: "600",
      marginLeft: isRTL ? 0 : 4,
      marginRight: isRTL ? 4 : 0,
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

    scrollView: {
      flex: 1,
    },

    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 20,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    privacyPolicyContainer: {
      flexDirection: isRTL ? "row-reverse" : "row",
      alignItems: "flex-start",
      marginBottom: 24,
    },
    checkbox: {
      width: 20,
      height: 20,
      borderWidth: 2,
      borderColor: colors.border,
      borderRadius: 4,
      marginRight: isRTL ? 0 : 10,
      marginLeft: isRTL ? 10 : 0,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: acceptedPrivacyPolicy
        ? colors.primary
        : colors.background,
    },
    privacyText: {
      fontSize: 13,
      color: colors.textSecondary,
      flex: 1,
      lineHeight: 18,
    },
    privacyLink: {
      color: colors.primary,
      fontWeight: "600",
    },
    signUpButton: {
      borderRadius: 12,
      overflow: "hidden",
      marginBottom: 20,
    },
    signUpGradient: {
      paddingVertical: 16,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      backgroundColor: colors.primary,
    },
    signUpButtonText: {
      color: colors.surface,
      fontSize: 16,
      fontWeight: "700",
      marginLeft: isRTL ? 0 : 8,
      marginRight: isRTL ? 8 : 0,
    },
  });

  return (
    <>
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={[colors.primary, colors.emerald200]}
          style={styles.gradientBackground}
        />
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
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
                <Text style={styles.title}>{t("auth.sign_up")}</Text>
                <Text style={styles.subtitle}>{t("auth.create_account")}</Text>
              </View>

              <View style={styles.formContainer}>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>{t("auth.full_name")}</Text>
                  <TextInput
                    style={styles.input}
                    placeholder={t("auth.name")}
                    placeholderTextColor={colors.textSecondary}
                    value={name}
                    onChangeText={setName}
                    editable={!isLoading}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>{t("auth.email")}</Text>
                  <TextInput
                    style={styles.input}
                    placeholder={t("auth.enter_email")}
                    placeholderTextColor={colors.textSecondary}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={!isLoading}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>{t("auth.password")}</Text>
                  <TextInput
                    style={styles.input}
                    placeholder={t("auth.enter_password")}
                    placeholderTextColor={colors.textSecondary}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    editable={!isLoading}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>{t("auth.confirm_password")}</Text>
                  <TextInput
                    style={styles.input}
                    placeholder={t("auth.enter_password_again")}
                    placeholderTextColor={colors.textSecondary}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                    editable={!isLoading}
                  />
                </View>

                <TouchableOpacity
                  style={styles.privacyPolicyContainer}
                  onPress={() =>
                    setAcceptedPrivacyPolicy(!acceptedPrivacyPolicy)
                  }
                >
                  <View style={styles.checkbox}>
                    {acceptedPrivacyPolicy && (
                      <Ionicons
                        name="checkmark"
                        size={12}
                        color={colors.surface}
                      />
                    )}
                  </View>
                  <Text style={styles.privacyText}>
                    {t("auth.privacy_agree")}{" "}
                    <Text style={styles.privacyLink}>{t("privacy.title")}</Text>
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.signUpButton}
                  onPress={handleSignUp}
                  disabled={isLoading}
                >
                  <View style={styles.signUpGradient}>
                    {isLoading ? (
                      <View style={styles.loadingContainer}>
                        <ActivityIndicator
                          size="small"
                          color={colors.surface}
                        />
                        <Text style={styles.loadingText}>
                          {t("auth.loading.creating_account")}
                        </Text>
                      </View>
                    ) : (
                      <>
                        <Ionicons
                          name="person-add"
                          size={18}
                          color={colors.surface}
                        />
                        <Text style={styles.signUpButtonText}>
                          {t("auth.create")}
                        </Text>
                      </>
                    )}
                  </View>
                </TouchableOpacity>
                <View style={styles.footer}>
                  <Text style={styles.footerText}>{t("auth.has_account")}</Text>
                  <Link href="/signin" asChild>
                    <TouchableOpacity>
                      <Text style={styles.linkText}>{t("auth.sign_in")}</Text>
                    </TouchableOpacity>
                  </Link>
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
      <Toast />
    </>
  );
}
