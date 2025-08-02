import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "expo-router";
import { RootState } from "@/src/store";
import { View, ActivityIndicator } from "react-native";
import { useTokenValidation } from "@/hooks/useTokenValidation";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiresPaidPlan?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiresPaidPlan = false,
}) => {
  const router = useRouter();
  const { user } = useSelector((state: RootState) => state.auth);
  const { isAuthenticated } = useTokenValidation();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/(auth)/signin");
      return;
    }

    if (!user) {
      return;
    }

    // Check if user has completed questionnaire for paid plans
    if (requiresPaidPlan) {
      if (user.subscription_type === "FREE") {
        router.replace("/payment-plan");
        return;
      }

      if (
        !user.is_questionnaire_completed &&
        user.subscription_type !== "FREE"
      ) {
        router.replace("/questionnaire");
        return;
      }
    }
  }, [isAuthenticated, user, requiresPaidPlan, router]);

  if (!isAuthenticated || !user) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#16A085" />
      </View>
    );
  }

  if (requiresPaidPlan && user.subscription_type === "FREE") {
    return null; // Will redirect to payment-plan
  }

  if (
    requiresPaidPlan &&
    !user.is_questionnaire_completed &&
    user.subscription_type !== "FREE"
  ) {
    return null; // Will redirect to questionnaire
  }

  return <>{children}</>;
};
