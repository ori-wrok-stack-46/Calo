# Code Cleanup Report

Generated on: 2025-09-07T10:37:11.352Z

Project Structure: Client-Server Architecture

## 📱 CLIENT ANALYSIS

### ❌ Unused Files (53)

- `client\src\utils\useOptimizedSelector.ts`
- `client\src\utils\secureStorage.ts`
- `client\src\utils\imageOptimiztion.ts`
- `client\src\utils\i18nUtils.ts`
- `client\src\utils\cardDetection.ts`
- `client\src\utils\cacheUtils.ts`
- `client\src\styles\globalStyles.ts`
- `client\src\services\backgroundSync.ts`
- `client\components\XPNotification.tsx`
- `client\components\ToolBar.tsx`
- `client\components\ToastWrapper.tsx`
- `client\components\ScrollableTabBar.tsx`
- `client\components\ScreenWrapper.tsx`
- `client\components\QuestionnaireProtection.tsx`
- `client\components\ProtectedRoutes.tsx`
- `client\components\PrivacySettings.tsx`
- `client\components\ParallaxScrollView.tsx`
- `client\components\NoteficationSettings.tsx`
- `client\components\MenuCard.tsx`
- `client\components\LocalizedText.tsx`
- `client\components\LanguageSelector.tsx`
- `client\components\FloatingChatButton.tsx`
- `client\components\ExternalLink.tsx`
- `client\components\ErrorBoundary.tsx`
- `client\components\EditProfile.tsx`
- `client\components\DynamicListInputs.tsx`
- `client\components\Collapsible.tsx`
- `client\components\ChatInterface.tsx`
- `client\components\AuthRouteGuard.tsx`
- `client\components\AccessibilityButton.tsx`
- `client\components\ui\TabBarBackground.ios.tsx`
- `client\components\ui\IconSymbol.ios.tsx`
- `client\components\statistics\TimePeriodFilter.tsx`
- `client\components\statistics\StatisticsHeaders.tsx`
- `client\components\statistics\MetricCard.tsx`
- `client\components\statistics\GamificationDashboard.tsx`
- `client\components\questionnaire\WeightScale.tsx`
- `client\components\questionnaire\StepContainer.tsx`
- `client\components\questionnaire\ProgressIndicator.tsx`
- `client\components\questionnaire\OptionGroup.tsx`
- `client\components\questionnaire\CustomTextInput.tsx`
- `client\components\questionnaire\CustomSwitch.tsx`
- `client\components\questionnaire\CheckBoxGroup.tsx`
- `client\components\index\CircularCaloriesProgress.tsx`
- `client\hooks\useSwipeNavigation.ts`
- `client\hooks\useRTLStyle.ts`
- `client\hooks\usePrefetch.ts`
- `client\hooks\useMealDataRefresh.ts`
- `client\hooks\useGoogleFitAuth.ts`
- `client\hooks\useFormattedTime.ts`
- `client\hooks\useColorScheme.web.ts`
- `client\hooks\useBackgroundRefetch.ts`
- `client\hooks\useAppInitialization.ts`

### ❌ Unused Functions (89)

- **useOptimizedSelector** in `client\src\utils\useOptimizedSelector.ts`
- **useMealSelector** in `client\src\utils\useOptimizedSelector.ts`
- **getRarityColor** in `client\src\utils\statisticsHelper.ts`
- **getAchievementBackgroundColor** in `client\src\utils\statisticsHelper.ts`
- **generateChartData** in `client\src\utils\statisticsHelper.ts`
- **calculateTrend** in `client\src\utils\statisticsHelper.ts`
- **calculateWeeklyChange** in `client\src\utils\statisticsHelper.ts`
- **calculateNutritionStatus** in `client\src\utils\statisticsHelper.ts`
- **setSecureItem** in `client\src\utils\secureStorage.ts`
- **getSecureItem** in `client\src\utils\secureStorage.ts`
- **removeSecureItem** in `client\src\utils\secureStorage.ts`
- **useDebounce** in `client\src\utils\performance.ts`
- **useThrottle** in `client\src\utils\performance.ts`
- **useMemoizedSelector** in `client\src\utils\performance.ts`
- **useSafeLayout** in `client\src\utils\layout.ts`
- **useResponsiveLayout** in `client\src\utils\layout.ts`
- **useOptimizedAnimation** in `client\src\utils\layout.ts`
- **useLayoutMeasurement** in `client\src\utils\layout.ts`
- **optimizeImageForUpload** in `client\src\utils\imageOptimiztion.ts`
- **getOptimalImageSettings** in `client\src\utils\imageOptimiztion.ts`
- **estimateBase64Size** in `client\src\utils\imageOptimiztion.ts`
- **shouldCompressImage** in `client\src\utils\imageOptimiztion.ts`
- **getAchievementIcon** in `client\src\utils\iconHelper.ts`
- **useLocalizedContent** in `client\src\utils\i18nUtils.ts`
- **formatNumber** in `client\src\utils\i18nUtils.ts`
- **detectCardType** in `client\src\utils\cardDetection.ts`
- **formatCardNumber** in `client\src\utils\cardDetection.ts`
- **validateCardNumber** in `client\src\utils\cardDetection.ts`
- **getCardIcon** in `client\src\utils\cardDetection.ts`
- **processImage** in `client\src\store\mealSlice.ts`
- **validateAndFixBase64Image** in `client\src\store\mealSlice.ts`
- **invalidateAllQueries** in `client\src\services\queryClient.ts`
- **removeAllQueries** in `client\src\services\queryClient.ts`
- **resetQueryClient** in `client\src\services\queryClient.ts`
- **LanguageProvider** in `client\src\i18n\context\LanguageContext.tsx`
- **ThemeProvider** in `client\src\context\ThemeContext.tsx`
- **XPNotification** in `client\components\XPNotification.tsx`
- **ShoppingList** in `client\components\ShoppingList.tsx`
- **ScrollableTabBar** in `client\components\ScrollableTabBar.tsx`
- **ProtectedRoute** in `client\components\ProtectedRoutes.tsx`
- **PrivacySettings** in `client\components\PrivacySettings.tsx`
- **ParallaxScrollView** in `client\components\ParallaxScrollView.tsx`
- **MenuCard** in `client\components\MenuCard.tsx`
- **FloatingChatButton** in `client\components\FloatingChatButton.tsx`
- **ExternalLink** in `client\components\ExternalLink.tsx`
- **EditProfile** in `client\components\EditProfile.tsx`
- **DynamicListInputs** in `client\components\DynamicListInputs.tsx`
- **Collapsible** in `client\components\Collapsible.tsx`
- **ChatInterface** in `client\components\ChatInterface.tsx`
- **AccessibilityButton** in `client\components\AccessibilityButton.tsx`
- **BlurTabBarBackground** in `client\components\ui\TabBarBackground.ios.tsx`
- **TimePeriodFilter** in `client\components\statistics\TimePeriodFilter.tsx`
- **StatisticsHeader** in `client\components\statistics\StatisticsHeaders.tsx`
- **MetricCard** in `client\components\statistics\MetricCard.tsx`
- **GamificationDashboard** in `client\components\statistics\GamificationDashboard.tsx`
- **CheckboxItem** in `client\components\questionnaire\CheckBoxGroup.tsx`
- **useSwipeNavigation** in `client\hooks\useSwipeNavigation.ts`
- **useRTLStyles** in `client\hooks\useRTLStyle.ts`
- **useTooltipVisibility** in `client\hooks\useQueries.ts`
- **useMarkTooltipShown** in `client\hooks\useQueries.ts`
- **useSignIn** in `client\hooks\useQueries.ts`
- **useSignUp** in `client\hooks\useQueries.ts`
- **useSignOut** in `client\hooks\useQueries.ts`
- **useMeals** in `client\hooks\useQueries.ts`
- **useMealsInfinite** in `client\hooks\useQueries.ts`
- **useAnalyzeMeal** in `client\hooks\useQueries.ts`
- **useSaveMeal** in `client\hooks\useQueries.ts`
- **useUpdateMeal** in `client\hooks\useQueries.ts`
- **useDuplicateMeal** in `client\hooks\useQueries.ts`
- **useToggleMealFavorite** in `client\hooks\useQueries.ts`
- **useSaveMealFeedback** in `client\hooks\useQueries.ts`
- **useDailyStats** in `client\hooks\useQueries.ts`
- **useGlobalStats** in `client\hooks\useQueries.ts`
- **useCalendarData** in `client\hooks\useQueries.ts`
- **useCalendarStats** in `client\hooks\useQueries.ts`
- **useAddEvent** in `client\hooks\useQueries.ts`
- **useStatistics** in `client\hooks\useQueries.ts`
- **useUserProfile** in `client\hooks\useQueries.ts`
- **useDailyGoals** in `client\hooks\useQueries.ts`
- **useRemoveMeal** in `client\hooks\useQueries.ts`
- **usePrefetchData** in `client\hooks\usePrefetch.ts`
- **createMemoizedSelector** in `client\hooks\useOptimizedSelector.ts`
- **useOptimizedMealSelector** in `client\hooks\useOptimizedSelector.ts`
- **useOptimizedCalendarSelector** in `client\hooks\useOptimizedSelector.ts`
- **useOptimizedQuestionnaireSelector** in `client\hooks\useOptimizedSelector.ts`
- **useMealDataRefresh** in `client\hooks\useMealDataRefresh.ts`
- **useGoogleFitAuth** in `client\hooks\useGoogleFitAuth.ts`
- **useFormattedTime** in `client\hooks\useFormattedTime.ts`
- **useBackgroundRefetch** in `client\hooks\useBackgroundRefetch.ts`

### ❌ Unused Variables (20)

- **throttledCallback** in `client\src\utils\performance.ts`
- **LayoutUtils** in `client\src\utils\performance.ts`
- **AnimationUtils** in `client\src\utils\performance.ts`
- **MemoryUtils** in `client\src\utils\performance.ts`
- **NetworkUtils** in `client\src\utils\performance.ts`
- **KeyboardUtils** in `client\src\utils\layout.ts`
- **ColorUtils** in `client\src\utils\layout.ts`
- **AchievementIcons** in `client\src\utils\iconHelper.ts`
- **StatusIcons** in `client\src\utils\iconHelper.ts`
- **GlobalStyles** in `client\src\styles\globalStyles.ts`
- **Spacing** in `client\src\styles\globalStyles.ts`
- **persistor** in `client\src\store\index.ts`
- **ValidationRules** in `client\src\services\errorHandler.ts`
- **backgroundSyncService** in `client\src\services\backgroundSync.ts`
- **mealPlanAPI** in `client\src\services\api.ts`
- **needsPayment** in `client\components\AuthRouteGuard.tsx`
- **remainingCalories** in `client\components\index\CircularCaloriesProgress.tsx`
- **STALE_TIME** in `client\hooks\useQueries.ts`
- **CACHE_TIME** in `client\hooks\useQueries.ts`
- **RETRY_DELAY** in `client\hooks\useQueries.ts`

### ❌ Unused Imports (5)

- **AxiosResponse** in `client\src\services\api.ts`
- **interpolateColor** in `client\components\ScrollableTabBar.tsx`
- **useTokenValidation** in `client\components\ProtectedRoutes.tsx`
- **Users** in `client\components\menu\MealDetailView.tsx`
- **RotateCcw** in `client\components\camera\SelectedImage.tsx`

## 🖥️ SERVER ANALYSIS

### ❌ Unused Files (1)

- `server\src\types\express.d.ts`

### ❌ Unused Functions (5)

- **parsePartialJSON** in `server\src\utils\openai.ts`
- **resetDailyLimits** in `server\src\services\cron.ts`
- **generatePasswordResetToken** in `server\src\services\auth.ts`
- **validateShoppingItem** in `server\src\routes\shoppingLists.ts`
- **getDatabaseUrl** in `server\src\lib\database.ts`

### ❌ Unused Variables (5)

- **updateSubscriptionSchema** in `server\src\types\auth.ts`
- **customizedMeals** in `server\src\services\recommendedMenu.ts`
- **userPrompt** in `server\src\services\openai.ts`
- **planName** in `server\src\routes\mealPlans.ts`
- **daysCount** in `server\src\routes\mealPlans.ts`

### ❌ Unused Imports (1)

- **healthRoutes** in `server\src\index.ts`

## 📊 SUMMARY

- **Client Issues:** 167
- **Server Issues:** 12
- **Total Cleanup Opportunities:** 179

## ⚠️ IMPORTANT NOTES

- All unused items are marked with ❌ for easy identification
- Review each item carefully before deletion
- Some "unused" items might be used dynamically
- Test your application after making changes
- Create backups before making bulk changes
