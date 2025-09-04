import React, { useEffect } from "react";
import { useRouter, usePathname } from "expo-router";
import { useSelector } from "react-redux";
import { RootState } from "@/src/store";

interface AuthRouteGuardProps {
  children: React.ReactNode;
}

export const AuthRouteGuard: React.FC<AuthRouteGuardProps> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, token } = useSelector(
    (state: RootState) => state.auth
  );

  useEffect(() => {
    // Don't run routing logic during initial load
    if (!isAuthenticated || !user) {
      return;
    }

    console.log("🚦 Auth Guard - Current Path:", pathname);
    console.log("🚦 Auth Guard - User State:", {
      isAuthenticated,
      email_verified: user?.email_verified,
      is_questionnaire_completed: user?.is_questionnaire_completed,
      subscription_type: user?.subscription_type,
    });

    // Define exempt routes that don't need routing checks
    const exemptRoutes = [
      "/(auth)/signin",
      "/(auth)/signup",
      "/(auth)/email-verification",
      "/(auth)/forgotPassword",
      "/(auth)/resetPassword",
      "/(auth)/reset-password-verify",
      "/privacy-policy",
    ];

    // Skip routing logic for exempt routes
    if (exemptRoutes.includes(pathname)) {
      return;
    }

    // Step 1: Check Email Verification
    if (!user.email_verified) {
      console.log(user.email_verified, "hello world");
      console.log(
        "🚦 Email not verified - redirecting to email verification",
        user.email_verified,
        "hello world",user.name
      );
      router.replace("/(auth)/email-verification");
      return;
    }

    // Step 2: Check Questionnaire Completion
    if (!user.is_questionnaire_completed) {
      console.log(
        "🚦 Questionnaire not completed - redirecting to questionnaire"
      );
      router.replace("/questionnaire");
      return;
    }

    // Step 3: Check Plan Selection
    if (!user.subscription_type || user.subscription_type === null) {
      console.log("🚦 No plan selected - redirecting to plan selection");
      router.replace("/payment-plan");
      return;
    }

    // Step 4: Check Payment for Paid Plans
    // Note: In this implementation, if user has PREMIUM or GOLD subscription_type,
    // we assume payment was completed. Add additional payment status check if needed.
    const hasPaidPlan =
      user.subscription_type === "PREMIUM" || user.subscription_type === "GOLD";
    const needsPayment = hasPaidPlan && !user.email_verified; // Add payment status field if available

    // For now, we'll assume if they have a paid subscription_type, payment is complete
    // You can add a separate payment_status field to the user model if needed

    // Step 5: All checks passed - redirect to main app if not already there
    const isInMainApp = pathname.startsWith("/(tabs)") || pathname === "/";
    if (
      !isInMainApp &&
      pathname !== "/questionnaire" &&
      pathname !== "/payment-plan" &&
      pathname !== "/payment"
    ) {
      console.log("🚦 All checks passed - redirecting to main app");
      router.replace("/(tabs)");
      return;
    }

    console.log("✅ Auth Guard - All checks passed, staying on current route");
  }, [
    isAuthenticated,
    user?.email_verified,
    user?.is_questionnaire_completed,
    user?.subscription_type,
    pathname,
    router,
  ]);

  return <>{children}</>;
};

export default AuthRouteGuard;
