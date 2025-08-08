import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useRouter } from "expo-router";
import { RootState, AppDispatch } from "@/src/store";
import { View, ActivityIndicator, Text } from "react-native";
import { useTokenValidation } from "@/hooks/useTokenValidation";
import { signOut } from "@/src/store/authSlice";
import { authAPI } from "@/src/services/api";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiresPaidPlan?: boolean;
  requiresEmailVerification?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiresPaidPlan = false,
  requiresEmailVerification = true,
}) => {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { user, token, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [isValidating, setIsValidating] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Validate token and authentication state
  useEffect(() => {
    const validateAuth = async () => {
      try {
        setIsValidating(true);
        setValidationError(null);

        // Check if we have basic auth state
        if (!isAuthenticated || !token) {
          console.log("🔒 No authentication found, redirecting to signin");
          dispatch(signOut());
          router.replace("/(auth)/signin");
          return;
        }

        // Validate stored token
        const storedToken = await authAPI.getStoredToken();
        if (!storedToken) {
          console.log("🔒 No stored token found, logging out");
          dispatch(signOut());
          router.replace("/(auth)/signin");
          return;
        }

        if (storedToken !== token) {
          console.log("🔒 Token mismatch detected, logging out");
          dispatch(signOut());
          router.replace("/(auth)/signin");
          return;
        }

        // Check user object
        if (!user) {
          console.log("🔒 No user data found, logging out");
          dispatch(signOut());
          router.replace("/(auth)/signin");
          return;
        }

        // Check email verification requirement
        if (requiresEmailVerification && !user.email_verified) {
          console.log("📧 Email not verified, redirecting to verification");
          router.replace("/(auth)/email-verification");
          return;
        }

        // Check paid plan requirement
        if (requiresPaidPlan && user.subscription_type === "FREE") {
          console.log("💳 Paid plan required, redirecting to payment");
          router.replace("/payment-plan");
          return;
        }

        setIsValidating(false);
      } catch (error) {
        console.error("🔒 Token validation error:", error);
        setValidationError("Authentication validation failed");
        dispatch(signOut());
        router.replace("/(auth)/signin");
      }
    };

    validateAuth();
  }, [isAuthenticated, token, user, requiresPaidPlan, requiresEmailVerification, dispatch, router]);

  // Show loading while validating
  if (isValidating) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: "center", 
        alignItems: "center",
        backgroundColor: "#f8f9fa"
      }}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={{ 
          marginTop: 16, 
          fontSize: 16, 
          color: "#4a5568",
          textAlign: "center"
        }}>
          Validating authentication...
        </Text>
      </View>
    );
  }

  // Show error if validation failed
  if (validationError) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: "center", 
        alignItems: "center",
        backgroundColor: "#f8f9fa",
        padding: 20
      }}>
        <Text style={{ 
          fontSize: 18, 
          color: "#e53e3e",
          textAlign: "center",
          marginBottom: 8
        }}>
          Authentication Error
        </Text>
        <Text style={{ 
          fontSize: 14, 
          color: "#4a5568",
          textAlign: "center"
        }}>
          {validationError}
        </Text>
      </View>
    );
  }

  // All validations passed - render protected content
  return <>{children}</>;
};
