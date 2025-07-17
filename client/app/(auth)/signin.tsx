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
import { Link, router } from "expo-router";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/src/i18n/context/LanguageContext";
import { useDispatch, useSelector } from "react-redux";
import { signIn } from "@/src/store/authSlice";
import { RootState, AppDispatch } from "@/src/store";

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
    <View style={[styles.container, isRTL && styles.containerRTL]}>
      <View style={styles.backgroundAccent} />

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, isRTL && styles.titleRTL]}>
            {t("auth.welcome_back")}
          </Text>
          <Text style={[styles.subtitle, isRTL && styles.subtitleRTL]}>
            {t("auth.sign_in")}
          </Text>
        </View>

        <View style={styles.form}>
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

          <TouchableOpacity style={styles.forgotPassword}>
            <Text
              style={[
                styles.forgotPasswordText,
                isRTL && styles.forgotPasswordTextRTL,
              ]}
            >
              {t("auth.forgot_password")}
            </Text>
          </TouchableOpacity>

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
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
  title: {
    fontSize: 36,
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
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 32,
    marginTop: 8,
  },
  forgotPasswordText: {
    color: "#10B981",
    fontSize: 14,
    fontWeight: "600",
  },
  forgotPasswordTextRTL: {
    alignSelf: "flex-start",
  },
  signInButton: {
    backgroundColor: "#10B981",
    borderRadius: 16,
    padding: 18,
    alignItems: "center",
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
  signInButtonText: {
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
