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
import { signUp, verifyEmail } from "@/src/store/authSlice";
import { RootState, AppDispatch } from "@/src/store";
import LanguageSelector from "@/components/LanguageSelector";
import { ToastService } from "@/src/services/totastService";
import Toast from 'react-native-toast-message';

export default function SignUpScreen() {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
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
      ToastService.error("Error", "Please accept our privacy policy to continue");
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
        "Error",
        error.message || error || "Failed to create account"
      );
    }
  };

  return (
    <>
      <View style={[styles.container, isRTL && styles.containerRTL]}>
      <View style={styles.backgroundAccent} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, isRTL && styles.titleRTL]}>
            {t("auth.create_account")}
          </Text>
          <Text style={[styles.subtitle, isRTL && styles.subtitleRTL]}>
            {t("auth.welcome")}
          </Text>
        </View>

        <View style={styles.languageSection}>
          <Text style={[styles.sectionTitle, isRTL && styles.sectionTitleRTL]}>
            {t("auth.language_preference")}
          </Text>
          <View style={styles.languageSelectorContainer}>
            <LanguageSelector
              showModal={showLanguageModal}
              onToggleModal={() => setShowLanguageModal(!showLanguageModal)}
            />
          </View>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, isRTL && styles.inputRTL]}
              placeholder={t("profile.name")}
              placeholderTextColor="#10B981"
              value={name}
              onChangeText={setName}
              textAlign={isRTL ? "right" : "left"}
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, isRTL && styles.inputRTL]}
              placeholder={t("auth.email")}
              placeholderTextColor="#10B981"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              textAlign={isRTL ? "right" : "left"}
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, isRTL && styles.inputRTL]}
              placeholder={t("auth.password")}
              placeholderTextColor="#10B981"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              textAlign={isRTL ? "right" : "left"}
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, isRTL && styles.inputRTL]}
              placeholder={t("auth.confirm_password")}
              placeholderTextColor="#10B981"
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
              <View style={[styles.checkbox, acceptedPrivacyPolicy && styles.checkboxChecked]}>
                {acceptedPrivacyPolicy && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </View>
              <Text style={[styles.privacyText, isRTL && styles.textRTL]}>
                I have read and agree to the{" "}
                <TouchableOpacity
                  onPress={() => router.push("/privacy-policy")}
                  style={styles.privacyLinkContainer}
                >
                  <Text style={styles.privacyLink}>Privacy Policy</Text>
                </TouchableOpacity>
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.signUpButton, isLoading && styles.buttonDisabled]}
            onPress={handleSignUp}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.signUpButtonText}>{t("auth.sign_up")}</Text>
            )}
          </TouchableOpacity>

          {error && <Text style={styles.errorText}>{error}</Text>}

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  containerRTL: {
    ...(Platform.OS === "web" ? { direction: "rtl" } : {}),
  },
  backgroundAccent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "30%",
    backgroundColor: "#f0fdf4",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  scrollView: {
    flex: 1,
    zIndex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    marginTop: 60,
    marginBottom: 32,
    alignItems: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#065f46",
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  titleRTL: {
    textAlign: "right",
  },
  subtitle: {
    fontSize: 18,
    color: "#10B981",
    fontWeight: "500",
  },
  subtitleRTL: {
    textAlign: "right",
  },
  languageSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#065f46",
    marginBottom: 12,
  },
  sectionTitleRTL: {
    textAlign: "right",
  },
  languageSelectorContainer: {
    shadowColor: "#10B981",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  form: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 18,
    shadowColor: "#10B981",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  input: {
    borderWidth: 2,
    borderColor: "#d1fae5",
    borderRadius: 16,
    padding: 18,
    fontSize: 16,
    backgroundColor: "#ffffff",
    color: "#065f46",
    fontWeight: "500",
  },
  inputRTL: {
    textAlign: "right",
  },
  signUpButton: {
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
  signUpButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  errorText: {
    color: "#ef4444",
    fontSize: 14,
    textAlign: "center",
    marginTop: 16,
    fontWeight: "500",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 32,
    paddingBottom: 20,
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
  privacyPolicyContainer: {
    marginTop: 16,
    marginBottom: 8,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: "#10B981",
    borderRadius: 4,
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
  },
  checkboxChecked: {
    backgroundColor: "#10B981",
  },
  checkmark: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "bold",
  },
  privacyText: {
    fontSize: 14,
    color: "#6b7280",
    flex: 1,
    lineHeight: 20,
  },
  privacyLinkContainer: {
    display: "contents",
  },
  privacyLink: {
    color: "#10B981",
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  textRTL: {
    textAlign: "right",
  },
});
