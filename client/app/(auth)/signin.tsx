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
} from "react-native";
import { Link, router } from "expo-router";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/src/i18n/context/LanguageContext";
import { useDispatch, useSelector } from "react-redux";
import { signIn } from "@/src/store/authSlice";
import { RootState, AppDispatch } from "@/src/store";

const { width, height } = Dimensions.get("window");

export default function SignInScreen() {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert(t("common.error"), "Please fill in all fields");
      return;
    }

    try {
      const result = await dispatch(signIn({ email, password })).unwrap();
      if (result.success) {
        router.replace("/(tabs)");
      }
    } catch (error: any) {
      Alert.alert(t("common.error"), error || "Failed to sign in");
    }
  };

  return (
    <View style={styles.container}>
      {/* Header with icon */}
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <View style={styles.icon}>
            <Text style={styles.iconText}>H</Text>
          </View>
        </View>

        <Text style={[styles.title, isRTL && styles.titleRTL]}>
          {t("auth.sign_in")}
        </Text>
      </View>

      {/* Form */}
      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, isRTL && styles.inputRTL]}
            placeholder={t("auth.email")}
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
            placeholder={t("auth.password")}
            placeholderTextColor="#9CA3AF"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            textAlign={isRTL ? "right" : "left"}
            editable={!isLoading}
          />
        </View>

        <TouchableOpacity
          style={[styles.signInButton, isLoading && styles.buttonDisabled]}
          onPress={handleSignIn}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.signInButtonText}>{t("auth.sign_in")}</Text>
          )}
        </TouchableOpacity>

        {error && <Text style={styles.errorText}>{error}</Text>}

        {/* Divider */}
        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>Or</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Social Login Buttons */}
        <View style={[styles.footer, isRTL && styles.footerRTL]}>
          <Text style={styles.footerText}>{t("auth.no_account")} </Text>
          <Link href="/signup" asChild>
            <TouchableOpacity>
              <Text style={styles.linkText}>{t("auth.sign_up")}</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingTop: 60,
  },
  containerRTL: {
    flexDirection: "row-reverse",
  },
  header: {
    alignItems: "center",
    marginBottom: 60,
    paddingHorizontal: 24,
  },
  iconContainer: {
    marginBottom: 32,
  },
  icon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#10B981",
    justifyContent: "center",
    alignItems: "center",
  },
  iconText: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "700",
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: "#1F2937",
    textAlign: "center",
  },
  titleRTL: {
    textAlign: "center",
  },
  form: {
    paddingHorizontal: 24,
    flex: 1,
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    backgroundColor: "#F9FAFB",
    color: "#1F2937",
  },
  inputRTL: {
    textAlign: "right",
  },
  signInButton: {
    backgroundColor: "#10B981",
    borderRadius: 25,
    padding: 16,
    alignItems: "center",
    marginTop: 24,
    marginBottom: 32,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  signInButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  errorText: {
    color: "#ef4444",
    fontSize: 14,
    textAlign: "center",
    marginTop: 16,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E5E7EB",
  },
  dividerText: {
    marginHorizontal: 16,
    color: "#9CA3AF",
    fontSize: 14,
  },
  socialContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    marginBottom: 40,
  },
  socialContainerRTL: {
    flexDirection: "row-reverse",
  },
  socialButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  googleText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#4285F4",
  },
  facebookText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1877F2",
  },
  twitterText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1DA1F2",
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
    color: "#9CA3AF",
  },
  linkText: {
    fontSize: 14,
    color: "#10B981",
    fontWeight: "600",
  },
});
