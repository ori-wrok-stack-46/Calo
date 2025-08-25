import { useSelector } from "react-redux";
import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "@/src/store";
import { useMemo } from "react";

// Create stable auth selector
const selectAuthState = createSelector(
  [(state: RootState) => state.auth],
  (auth) => ({
    isAuthenticated: auth.isAuthenticated,
    user: auth.user,
    isLoading: auth.isLoading,
    error: auth.error,
  })
);

// Optimized auth selector hook
export const useOptimizedAuthSelector = () => {
  return useSelector(selectAuthState, (left, right) => {
    // Deep comparison for auth state
    if (left.isAuthenticated !== right.isAuthenticated) return false;
    if (left.isLoading !== right.isLoading) return false;
    if (left.error !== right.error) return false;

    // User comparison
    if (!left.user && !right.user) return true;
    if (!left.user || !right.user) return false;

    return (
      left.user.user_id === right.user.user_id &&
      left.user.email_verified === right.user.email_verified &&
      left.user.subscription_type === right.user.subscription_type &&
      left.user.is_questionnaire_completed ===
        right.user.is_questionnaire_completed
    );
  });
};

export default useOptimizedAuthSelector;
