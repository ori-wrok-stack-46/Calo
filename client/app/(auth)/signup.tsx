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
import Toast from "react-native-toast-message";

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
        "Error",
        error.message || error || "Failed to create account"
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
              Create your account
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, isRTL && styles.inputRTL]}
                placeholder="Name"
                placeholderTextColor="#9CA3AF"
                value={name}
                onChangeText={setName}
                textAlign={isRTL ? "right" : "left"}
                editable={!isLoading}
              />
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, isRTL && styles.inputRTL]}
                placeholder="Email"
                placeholderTextColor="#9CA3AF"
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
                placeholder="Password"
                placeholderTextColor="#9CA3AF"
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
                placeholder="Confirm password"
                placeholderTextColor="#9CA3AF"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                textAlign={isRTL ? "right" : "left"}
                editable={!isLoading}
              />
            </View>

            {/* Privacy Policy Checkbox */}
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

            {/* Sign Up Button */}
            <TouchableOpacity
              style={[styles.signUpButton, isLoading && styles.buttonDisabled]}
              onPress={handleSignUp}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.signUpButtonText}>Sign up</Text>
              )}
            </TouchableOpacity>

            {error && <Text style={styles.errorText}>{error}</Text>}

            {/* Footer */}
            <View style={[styles.footer, isRTL && styles.footerRTL]}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <Link href="/signin" asChild>
                <TouchableOpacity>
                  <Text style={styles.linkText}>Sign in</Text>
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  backButtonText: {
    fontSize: 18,
    color: "#374151",
    fontWeight: "600",
  },
  languageContainer: {
    // Language selector styling handled by the component
  },
  titleContainer: {
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
  },
  titleRTL: {
    textAlign: "center",
  },
  form: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: "#ffffff",
    color: "#111827",
    fontWeight: "400",
  },
  inputRTL: {
    textAlign: "right",
  },
  privacyPolicyContainer: {
    marginTop: 8,
    marginBottom: 24,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 1.5,
    borderColor: "#D1D5DB",
    borderRadius: 3,
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
  },
  checkboxChecked: {
    backgroundColor: "#10B981",
    borderColor: "#10B981",
  },
  checkmark: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "bold",
  },
  privacyText: {
    fontSize: 13,
    color: "#6B7280",
    flex: 1,
    lineHeight: 18,
  },
  privacyLinkContainer: {
    display: "contents",
  },
  privacyLink: {
    color: "#10B981",
    fontWeight: "500",
  },
  signUpButton: {
    backgroundColor: "#10B981",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginBottom: 24,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  signUpButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  errorText: {
    color: "#EF4444",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
    fontWeight: "400",
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
    backgroundColor: "#E5E7EB",
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "400",
  },
  socialButtons: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
  },
  socialButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
  },
  socialButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  footerRTL: {
    flexDirection: "row-reverse",
  },
  footerText: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "400",
  },
  linkText: {
    fontSize: 14,
    color: "#10B981",
    fontWeight: "600",
  },
  textRTL: {
    textAlign: "right",
  },
});
