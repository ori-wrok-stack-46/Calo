import React, { useCallback } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/src/store";
import { fetchMeals } from "@/src/store/mealSlice";
import { queryClient } from "@/src/services/queryClient";

export const useMealDataRefresh = () => {
  const dispatch = useDispatch<AppDispatch>();

  // Set up automatic refresh on mutation success
  React.useEffect(() => {
    const originalOnSuccess =
      queryClient.getDefaultOptions().mutations?.onSuccess;

    queryClient.setDefaultOptions({
      mutations: {
        ...queryClient.getDefaultOptions().mutations,
        onSuccess: (data, variables, context) => {
          console.log("🔄 Mutation successful, triggering immediate refresh");
          // Call original callback if exists
          if (originalOnSuccess) {
            originalOnSuccess(data, variables, context);
          }
          // Trigger immediate refresh
          immediateRefresh();
        },
      },
    });

    return () => {
      // Restore original callback on cleanup
      queryClient.setDefaultOptions({
        mutations: {
          ...queryClient.getDefaultOptions().mutations,
          onSuccess: originalOnSuccess,
        },
      });
    };
  }, []);

  const invalidateAllMealQueries = useCallback(async () => {
    console.log("🔄 Invalidating all meal-related queries...");

    // Cancel any ongoing queries first
    await queryClient.cancelQueries({ queryKey: ["meals"] });
    await queryClient.cancelQueries({ queryKey: ["dailyStats"] });
    await queryClient.cancelQueries({ queryKey: ["statistics"] });

    // Remove stale data
    queryClient.removeQueries({ queryKey: ["meals"], exact: false });
    queryClient.removeQueries({ queryKey: ["dailyStats"], exact: false });
    queryClient.removeQueries({ queryKey: ["statistics"], exact: false });
    queryClient.removeQueries({ queryKey: ["recent-meals"], exact: false });
    queryClient.removeQueries({ queryKey: ["calendar"], exact: false });
    queryClient.removeQueries({ queryKey: ["nutrition"], exact: false });
    queryClient.removeQueries({ queryKey: ["globalStats"], exact: false });

    console.log("✅ All meal queries invalidated");
  }, []);

  const refreshAllMealData = useCallback(async () => {
    try {
      console.log("🔄 Starting comprehensive data refresh...");

      // First invalidate all queries
      await invalidateAllMealQueries();

      // Refresh Redux store immediately
      await dispatch(fetchMeals()).unwrap();

      // Force immediate refetch of critical data
      const today = new Date().toISOString().split("T")[0];
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();

      // Refetch all critical queries in parallel
      const refetchPromises = [
        queryClient.refetchQueries({
          queryKey: ["meals"],
          type: "all",
        }),
        queryClient.refetchQueries({
          queryKey: ["dailyStats", today],
          type: "all",
        }),
        queryClient.refetchQueries({
          queryKey: ["calendar", currentYear, currentMonth],
          type: "all",
        }),
        queryClient.refetchQueries({
          queryKey: ["globalStats"],
          type: "all",
        }),
        queryClient.refetchQueries({
          queryKey: ["statistics"],
          type: "all",
        }),
      ];

      await Promise.allSettled(refetchPromises);

      console.log("✅ All meal-related data refreshed successfully");
    } catch (error) {
      console.error("❌ Error refreshing meal data:", error);
      throw error;
    }
  }, [dispatch, invalidateAllMealQueries]);

  const refreshMealData = useCallback(async () => {
    try {
      console.log("🔄 Refreshing meal data...");

      // Immediately invalidate and remove meal queries
      await queryClient.cancelQueries({ queryKey: ["meals"] });
      queryClient.removeQueries({ queryKey: ["meals"] });

      // Refresh Redux store
      await dispatch(fetchMeals()).unwrap();

      // Invalidate related caches immediately
      const today = new Date().toISOString().split("T")[0];

      // Remove and refetch in parallel
      const refreshPromises = [
        queryClient.refetchQueries({ queryKey: ["meals"] }),
        queryClient.refetchQueries({ queryKey: ["dailyStats", today] }),
        queryClient.refetchQueries({ queryKey: ["statistics"] }),
        queryClient.refetchQueries({ queryKey: ["recent-meals"] }),
      ];

      await Promise.allSettled(refreshPromises);

      console.log("✅ Meal data refreshed successfully");
    } catch (error) {
      console.error("❌ Error refreshing meal data:", error);
      throw error;
    }
  }, [dispatch]);

  // Immediate refresh function for post-operation updates
  const immediateRefresh = useCallback(async () => {
    try {
      console.log("⚡ Immediate meal data refresh...");

      // Cancel all ongoing queries immediately
      await Promise.allSettled([
        queryClient.cancelQueries({ queryKey: ["meals"] }),
        queryClient.cancelQueries({ queryKey: ["dailyStats"] }),
        queryClient.cancelQueries({ queryKey: ["statistics"] }),
        queryClient.cancelQueries({ queryKey: ["recent-meals"] }),
        queryClient.cancelQueries({ queryKey: ["calendar"] }),
        queryClient.cancelQueries({ queryKey: ["globalStats"] }),
      ]);

      // Remove stale data completely
      queryClient.removeQueries({ queryKey: ["meals"] });
      queryClient.removeQueries({ queryKey: ["dailyStats"] });
      queryClient.removeQueries({ queryKey: ["statistics"] });
      queryClient.removeQueries({ queryKey: ["recent-meals"] });
      queryClient.removeQueries({ queryKey: ["calendar"] });
      queryClient.removeQueries({ queryKey: ["globalStats"] });

      // Dispatch Redux update and wait for it to complete
      await dispatch(fetchMeals()).unwrap();

      // Force immediate cache refresh in parallel
      const today = new Date().toISOString().split("T")[0];
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();

      await Promise.allSettled([
        queryClient.refetchQueries({ queryKey: ["meals"], type: "all" }),
        queryClient.refetchQueries({
          queryKey: ["dailyStats", today],
          type: "all",
        }),
        queryClient.refetchQueries({ queryKey: ["statistics"], type: "all" }),
        queryClient.refetchQueries({
          queryKey: ["calendar", currentYear, currentMonth],
          type: "all",
        }),
        queryClient.refetchQueries({ queryKey: ["globalStats"], type: "all" }),
        queryClient.refetchQueries({ queryKey: ["recent-meals"], type: "all" }),
      ]);

      console.log("⚡ Immediate refresh completed successfully");
    } catch (error) {
      console.error("❌ Error in immediate refresh:", error);
      throw error;
    }
  }, [dispatch]);

  return {
    refreshAllMealData,
    refreshMealData,
    immediateRefresh,
    invalidateAllMealQueries,
  };
};
