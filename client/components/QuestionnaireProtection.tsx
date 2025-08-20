import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { useRouter, usePathname } from "expo-router";
import { RootState } from "@/src/store";
import { ToastService } from "@/src/services/totastService";

interface QuestionnaireProtectionProps {
  children: React.ReactNode;
}

const QuestionnaireProtection: React.FC<QuestionnaireProtectionProps> = ({
  children,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useSelector((state: RootState) => state.auth);

  // Define routes that require questionnaire completion
  const protectedRoutes = [
    "/payment-plan",
    "/payment",
    "/(tabs)",
    "/(tabs)/camera",
    "/(tabs)/statistics",
    "/(tabs)/calendar",
    "/(tabs)/devices",
    "/(tabs)/recommended-menus",
    "/(tabs)/ai-chat",
    "/(tabs)/food-scanner",
    "/(tabs)/profile",
    "/(tabs)/history",
  ];

  // Define routes that are always accessible
  const allowedRoutes = [
    "/",
    "/signin",
    "/signup",
    "/questionnaire",
    "/(auth)/signin",
    "/(auth)/signup",
    "/(auth)/email-verification",
    "/(auth)/forgotPassword",
    "/(auth)/resetPassword",
    "/(auth)/reset-password-verify",
    "/privacy-policy",
  ];

  useEffect(() => {
    if (!user) return;

    const isProtectedRoute = protectedRoutes.some(
      (route) => pathname.startsWith(route) || pathname === route
    );

    const isAllowedRoute = allowedRoutes.some(
      (route) => pathname.startsWith(route) || pathname === route
    );

    const isQuestionnaireRoute = pathname.includes("/questionnaire");

    // Check if user has a paid plan but hasn't completed questionnaire
    const hasPaidPlan =
      user.subscription_type && user.subscription_type !== "FREE";
    const needsQuestionnaire = !user.is_questionnaire_completed;

    // If user has paid plan but no questionnaire completion
    if (
      hasPaidPlan &&
      needsQuestionnaire &&
      !isQuestionnaireRoute &&
      !isAllowedRoute
    ) {
      ToastService.info(
        "Complete Your Profile",
        "Please complete the questionnaire to access your premium features"
      );
      router.replace("/questionnaire");
      return;
    }

    // If user hasn't completed questionnaire and is trying to access protected routes (FREE plan logic)
    if (
      !hasPaidPlan &&
      needsQuestionnaire &&
      isProtectedRoute &&
      !isAllowedRoute
    ) {
      ToastService.warning(
        "Complete Questionnaire",
        "Please complete the questionnaire before accessing other features"
      );
      router.replace("/questionnaire");
      return;
    }

    // If user completed questionnaire but has no subscription (hasn't selected a plan)
    if (
      user.is_questionnaire_completed &&
      (!user.subscription_type || user.subscription_type === null) &&
      pathname.startsWith("/(tabs)") &&
      pathname !== "/(tabs)/questionnaire"
    ) {
      ToastService.info(
        "Choose Your Plan",
        "Please select a subscription plan to continue"
      );
      router.replace("/payment-plan");
      return;
    }
  }, [user, pathname, router]);

  return <>{children}</>;
};

export default QuestionnaireProtection;
