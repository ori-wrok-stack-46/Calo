import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/src/store";
import { fetchMeals } from "@/src/store/mealSlice";
import { queryClient } from "@/src/services/queryClient";

export const useMealDataRefresh = () => {
  const dispatch = useDispatch<AppDispatch>();

  const refreshAllMealData = useCallback(async () => {
    try {
      console.log("🔄 Starting comprehensive data refresh...");

      // Clear and refresh Redux meal data
      await dispatch(fetchMeals());

      // Invalidate all meal-related React Query cache
      await queryClient.invalidateQueries({ queryKey: ["meals"] });
      await queryClient.invalidateQueries({ queryKey: ["statistics"] });
      await queryClient.invalidateQueries({ queryKey: ["calendar"] });
      await queryClient.invalidateQueries({ queryKey: ["history"] });
      await queryClient.invalidateQueries({ queryKey: ["recent-meals"] });
      await queryClient.invalidateQueries({ queryKey: ["nutrition"] });
      await queryClient.invalidateQueries({ queryKey: ["recommended-menus"] });
      await queryClient.invalidateQueries({ queryKey: ["dailyStats"] });
      await queryClient.invalidateQueries({ queryKey: ["globalStats"] });

      // Force refetch the most critical data
      await queryClient.refetchQueries({
        queryKey: ["meals"],
        type: "active",
      });

      const today = new Date().toISOString().split("T")[0];
      await queryClient.refetchQueries({
        queryKey: ["dailyStats", today],
        type: "active",
      });

      console.log("✅ All meal-related data refreshed successfully");
    } catch (error) {
      console.error("❌ Error refreshing meal data:", error);
      throw error;
    }
  }, [dispatch]);

  return { refreshAllMealData };
};
