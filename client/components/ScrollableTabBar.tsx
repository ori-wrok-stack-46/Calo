import React, { useRef, useEffect, useMemo, useCallback } from "react";
import { ViewStyle, TextStyle } from "react-native";
import { Tabs } from "expo-router";
import {
  ScrollView,
  View,
  StyleSheet,
  Dimensions,
  Animated,
  Platform,
  TouchableOpacity,
  Text,
} from "react-native";
import {
  Home,
  History,
  Camera,
  TrendingUp,
  User,
  Calendar,
  Watch,
  UtensilsCrossed,
  Bot,
  Scan,
  ClipboardList,
  BarChart3,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  useSafeAreaInsets,
  SafeAreaView,
} from "react-native-safe-area-context";
import { useTheme } from "@/src/context/ThemeContext";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/src/i18n/context/LanguageContext";

const SCREEN_WIDTH = Dimensions.get("window").width;
const MAX_ICONS_VISIBLE = 5;
const TAB_LABEL_FONT_SIZE = 11;
const TAB_ICON_SIZE = 22;
const ACTIVE_TAB_SCALE = 1.08;
const CAMERA_BUTTON_SIZE = 56;

// Icon mapping for your tabs with better Lucide icons
const iconMap = {
  index: Home,
  history: History,
  camera: Camera,
  statistics: TrendingUp,
  calendar: Calendar,
  devices: Watch,
  "recommended-menus": UtensilsCrossed,
  "ai-chat": Bot,
  "food-scanner": Scan,
  questionnaire: ClipboardList,
  profile: User,
};

interface CustomTabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

export function ScrollableTabBar({
  state,
  descriptors,
  navigation,
}: CustomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();
  const { isRTL } = useLanguage();

  const scrollViewRef = useRef<ScrollView>(null);
  const indicatorTranslateX = useRef(new Animated.Value(0)).current;
  const iconScales = useRef(
    state.routes.map(() => new Animated.Value(1))
  ).current;
  const iconTranslateY = useRef(
    state.routes.map(() => new Animated.Value(0))
  ).current;
  const cameraButtonScale = useRef(new Animated.Value(1)).current;

  // Track scroll position
  const scrollX = useRef(new Animated.Value(0)).current;
  const currentScrollX = useRef(0);

  // Calculate proper tab bar height with safe area
  const baseTabHeight = 60; // Base height for tab content
  const totalTabBarHeight = baseTabHeight; // SafeAreaView handles the bottom inset

  // Create dynamic styles based on theme
  const dynamicStyles = useMemo(
    () => createDynamicStyles(colors, isDark),
    [colors, isDark]
  );

  // Memoize calculations with enhanced scrolling logic
  const tabCalculations = useMemo(() => {
    const activeIndex = state.index;
    const routesCount = state.routes.length;

    // Always use consistent tab width calculation
    const tabItemWidth =
      SCREEN_WIDTH / Math.min(routesCount, MAX_ICONS_VISIBLE);
    const totalContentWidth = routesCount * tabItemWidth;

    // Determine if scrolling is needed
    const shouldScroll = totalContentWidth > SCREEN_WIDTH;

    // Calculate actual indicator position based on active tab
    const indicatorTargetX =
      activeIndex * tabItemWidth + tabItemWidth / 2 - (tabItemWidth * 0.8) / 2;

    // Enhanced scroll offset calculation
    let scrollOffset = 0;
    if (shouldScroll) {
      const maxScrollX = totalContentWidth - SCREEN_WIDTH;
      const targetScrollX =
        activeIndex * tabItemWidth - (SCREEN_WIDTH / 2 - tabItemWidth / 2);
      scrollOffset = Math.max(0, Math.min(maxScrollX, targetScrollX));
    }

    // Calculate camera button position
    const cameraIndex = state.routes.findIndex(
      (route: any) => route.name === "camera"
    );
    const cameraButtonX =
      cameraIndex >= 0
        ? cameraIndex * tabItemWidth + tabItemWidth / 2 - CAMERA_BUTTON_SIZE / 2
        : 0;

    return {
      activeIndex,
      routesCount,
      tabItemWidth,
      totalContentWidth,
      indicatorTargetX,
      scrollOffset,
      shouldScroll,
      cameraButtonX,
      cameraIndex,
      maxScrollX: totalContentWidth - SCREEN_WIDTH,
    };
  }, [state.index, state.routes.length]);

  // Enhanced animation function with better scrolling
  const animateToTab = useCallback(
    (calculations: {
      activeIndex: number;
      indicatorTargetX: number;
      scrollOffset: number;
      shouldScroll: boolean;
      cameraIndex: number;
      maxScrollX: number;
    }) => {
      const {
        activeIndex,
        indicatorTargetX,
        scrollOffset,
        shouldScroll,
        cameraIndex,
        maxScrollX,
      } = calculations;

      // Animate indicator with bounds checking
      const clampedIndicatorX = Math.max(
        0,
        Math.min(indicatorTargetX, maxScrollX + SCREEN_WIDTH)
      );
      Animated.spring(indicatorTranslateX, {
        toValue: clampedIndicatorX,
        useNativeDriver: true,
        tension: 300,
        friction: 25,
      }).start();

      // Animate icons (excluding camera)
      iconScales.forEach(
        (scale: Animated.Value | Animated.ValueXY, index: number) => {
          if (index !== cameraIndex) {
            Animated.spring(scale, {
              toValue: index === activeIndex ? ACTIVE_TAB_SCALE : 1,
              useNativeDriver: true,
              tension: 300,
              friction: 20,
            }).start();
          }
        }
      );

      // Animate camera button
      Animated.spring(cameraButtonScale, {
        toValue: activeIndex === cameraIndex ? 1.1 : 1,
        useNativeDriver: true,
        tension: 300,
        friction: 20,
      }).start();

      // Animate icon positions (excluding camera)
      iconTranslateY.forEach(
        (translateY: Animated.Value | Animated.ValueXY, index: number) => {
          if (index !== cameraIndex) {
            Animated.spring(translateY, {
              toValue: index === activeIndex ? -3 : 0,
              useNativeDriver: true,
              tension: 300,
              friction: 20,
            }).start();
          }
        }
      );

      // Enhanced scrolling with bounds checking
      if (shouldScroll) {
        const clampedScrollOffset = Math.max(
          0,
          Math.min(scrollOffset, maxScrollX)
        );
        scrollViewRef.current?.scrollTo({
          x: clampedScrollOffset,
          animated: true,
        });
        currentScrollX.current = clampedScrollOffset;
      } else {
        scrollViewRef.current?.scrollTo({ x: 0, animated: false });
        currentScrollX.current = 0;
      }
    },
    [indicatorTranslateX, iconScales, iconTranslateY, cameraButtonScale]
  );

  useEffect(() => {
    animateToTab(tabCalculations);
  }, [tabCalculations, animateToTab]);

  // Enhanced scroll event handler with bounds checking
  const handleScroll = useCallback(
    (event: any) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const clampedOffsetX = Math.max(
        0,
        Math.min(offsetX, tabCalculations.maxScrollX || 0)
      );

      scrollX.setValue(clampedOffsetX);
      currentScrollX.current = clampedOffsetX;
    },
    [tabCalculations.maxScrollX]
  );

  // Handle momentum scroll end to ensure proper positioning
  const handleScrollEnd = useCallback(() => {
    // Ensure we're within bounds
    if (tabCalculations.shouldScroll && scrollViewRef.current) {
      const maxScroll = Math.max(
        0,
        tabCalculations.totalContentWidth - SCREEN_WIDTH
      );
      if (currentScrollX.current > maxScroll) {
        scrollViewRef.current.scrollTo({
          x: maxScroll,
          animated: true,
        });
      } else if (currentScrollX.current < 0) {
        scrollViewRef.current.scrollTo({
          x: 0,
          animated: true,
        });
      }
    }
  }, [tabCalculations.shouldScroll, tabCalculations.totalContentWidth]);

  // Render floating camera button with enhanced positioning
  const renderFloatingCameraButton = () => {
    const cameraRoute = state.routes.find(
      (route: any) => route.name === "camera"
    );
    if (!cameraRoute) return null;

    const cameraIndex = state.routes.findIndex(
      (route: any) => route.name === "camera"
    );
    const { options } = descriptors[cameraRoute.key];
    const isFocused = state.index === cameraIndex;
    const isDisabled = options.tabBarButton === null;

    const onPress = () => {
      if (isDisabled) return;

      const event = navigation.emit({
        type: "tabPress",
        target: cameraRoute.key,
        canPreventDefault: true,
      });

      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(cameraRoute.name);
      }
    };

    const onLongPress = () => {
      if (isDisabled) return;
      navigation.emit({
        type: "tabLongPress",
        target: cameraRoute.key,
      });
    };

    // Enhanced camera button positioning with bounds checking
    const cameraButtonAnimatedX = tabCalculations.shouldScroll
      ? Animated.add(
          new Animated.Value(tabCalculations.cameraButtonX),
          Animated.multiply(scrollX, -1)
        )
      : new Animated.Value(tabCalculations.cameraButtonX);

    return (
      <Animated.View
        style={[
          dynamicStyles.floatingCameraButton,
          {
            transform: [
              { translateX: cameraButtonAnimatedX },
              { scale: cameraButtonScale },
            ],
          },
        ]}
      >
        <TouchableOpacity
          accessibilityRole="tab"
          accessibilityState={{
            selected: isFocused,
            disabled: isDisabled,
          }}
          onPress={onPress}
          onLongPress={onLongPress}
          style={[
            dynamicStyles.cameraButton,
            {
              opacity: isDisabled ? 0.4 : 1,
            },
          ]}
          activeOpacity={0.8}
          disabled={isDisabled}
        >
          <LinearGradient
            colors={dynamicStyles.cameraGradientColors}
            style={[
              dynamicStyles.cameraGradient,
              { borderColor: colors.background },
            ]}
          >
            <Camera size={28} color="#FFFFFF" strokeWidth={2} />
          </LinearGradient>
        </TouchableOpacity>

        <Text
          style={[
            dynamicStyles.cameraLabel,
            {
              color: isFocused ? colors.emerald600 : colors.textSecondary,
              fontWeight: isFocused ? "700" : "500",
            },
          ]}
          numberOfLines={1}
          allowFontScaling={false}
        >
          {t("tabs.camera")}
        </Text>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView edges={["bottom"]} style={[dynamicStyles.safeAreaWrapper]}>
      <View style={dynamicStyles.wrapper}>
        <View
          style={[
            dynamicStyles.container,
            {
              paddingBottom: Platform.OS === "ios" ? 4 : 8,
            },
          ]}
        >
          {/* Active tab indicator - positioned relative to scroll content with bounds checking */}
          <Animated.View
            style={[
              dynamicStyles.indicator,
              {
                width: tabCalculations.tabItemWidth * 0.8,
                transform: [
                  {
                    translateX: tabCalculations.shouldScroll
                      ? Animated.add(
                          indicatorTranslateX,
                          Animated.multiply(scrollX, -1)
                        )
                      : indicatorTranslateX,
                  },
                ],
              },
            ]}
          />

          <ScrollView
            ref={scrollViewRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[
              dynamicStyles.scrollViewContent,
              {
                width: tabCalculations.totalContentWidth,
                minWidth: SCREEN_WIDTH,
              },
              !tabCalculations.shouldScroll && {
                flexGrow: 1,
                justifyContent: "space-around",
              },
            ]}
            decelerationRate="fast"
            bounces={true}
            bouncesZoom={false}
            alwaysBounceHorizontal={tabCalculations.shouldScroll}
            onScroll={handleScroll}
            onMomentumScrollEnd={handleScrollEnd}
            onScrollEndDrag={handleScrollEnd}
            scrollEventThrottle={16}
            style={dynamicStyles.scrollView}
          >
            {state.routes.map((route: any, index: number) => {
              const { options } = descriptors[route.key];

              const label =
                options.tabBarLabel !== undefined
                  ? options.tabBarLabel
                  : options.title !== undefined
                  ? options.title
                  : route.name;

              const isFocused = state.index === index;
              const isDisabled = options.tabBarButton === null;
              const IconComponent =
                iconMap[route.name as keyof typeof iconMap] || Home;

              const onPress = () => {
                if (isDisabled) return;

                const event = navigation.emit({
                  type: "tabPress",
                  target: route.key,
                  canPreventDefault: true,
                });

                if (!isFocused && !event.defaultPrevented) {
                  navigation.navigate(route.name);
                }
              };

              const onLongPress = () => {
                if (isDisabled) return;
                navigation.emit({
                  type: "tabLongPress",
                  target: route.key,
                });
              };

              // Skip rendering camera tab here since it's rendered as floating button
              if (route.name === "camera") {
                return (
                  <View
                    key={route.key}
                    style={[
                      dynamicStyles.tabButton,
                      dynamicStyles.cameraPlaceholder,
                      {
                        width: tabCalculations.tabItemWidth,
                      },
                    ]}
                  />
                );
              }

              return (
                <TouchableOpacity
                  key={route.key}
                  accessibilityRole="tab"
                  accessibilityState={{
                    selected: isFocused,
                    disabled: isDisabled,
                  }}
                  onPress={onPress}
                  onLongPress={onLongPress}
                  style={[
                    dynamicStyles.tabButton,
                    {
                      width: tabCalculations.tabItemWidth,
                      opacity: isDisabled ? 0.4 : 1,
                    },
                  ]}
                  activeOpacity={0.7}
                  disabled={isDisabled}
                >
                  <Animated.View
                    style={[
                      dynamicStyles.iconContainer,
                      {
                        transform: [
                          { scale: iconScales[index] },
                          { translateY: iconTranslateY[index] },
                        ],
                      },
                    ]}
                  >
                    <IconComponent
                      color={
                        isFocused ? colors.emerald600 : colors.textSecondary
                      }
                      size={TAB_ICON_SIZE}
                      strokeWidth={isFocused ? 2.2 : 1.8}
                    />
                  </Animated.View>

                  <Animated.View
                    style={[
                      dynamicStyles.labelContainer,
                      {
                        opacity: isFocused ? 1 : 0.7,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        dynamicStyles.label,
                        {
                          color: isFocused
                            ? colors.emerald600
                            : colors.textSecondary,
                          fontWeight: isFocused ? "700" : "500",
                        },
                      ]}
                      numberOfLines={1}
                      allowFontScaling={false}
                    >
                      {label}
                    </Text>
                  </Animated.View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Floating Camera Button */}
          {renderFloatingCameraButton()}
        </View>
      </View>
    </SafeAreaView>
  );
}

// Define proper types for your styles
interface DynamicStyles {
  safeAreaWrapper: ViewStyle;
  wrapper: ViewStyle;
  container: ViewStyle;
  indicator: ViewStyle;
  scrollView: ViewStyle;
  scrollViewContent: ViewStyle;
  tabButton: ViewStyle;
  cameraPlaceholder: ViewStyle;
  iconContainer: ViewStyle;
  labelContainer: ViewStyle;
  label: TextStyle;
  floatingCameraButton: ViewStyle;
  cameraButton: ViewStyle;
  cameraGradient: ViewStyle;
  cameraGradientColors: string[];
  cameraLabel: TextStyle;
}

// Dynamic styles function that adapts to theme
const createDynamicStyles = (colors: any, isDark: boolean): DynamicStyles => {
  const emeraldPrimary = isDark ? colors.emerald500 : colors.emerald600;
  const emeraldGradient = isDark
    ? [colors.emerald600, colors.emerald500]
    : [colors.emerald600, colors.emerald500];

  const styles = StyleSheet.create({
    safeAreaWrapper: {
      backgroundColor: colors.background,
      position: "relative",
      bottom: 0,
      left: 0,
      right: 0,
    } as ViewStyle,
    wrapper: {
      backgroundColor: colors.background,
    } as ViewStyle,
    container: {
      backgroundColor: colors.background,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      shadowColor: colors.shadow,
      shadowOffset: {
        width: 0,
        height: -4,
      },
      shadowOpacity: isDark ? 0.3 : 0.08,
      shadowRadius: 12,
      elevation: 12,
      paddingTop: 6,
      paddingHorizontal: 0,
      minHeight: 60,
    } as ViewStyle,
    indicator: {
      position: "absolute",
      top: 0,
      height: 3,
      backgroundColor: emeraldPrimary,
      borderRadius: 2,
      zIndex: 1,
    } as ViewStyle,
    scrollView: {
      flex: 1,
    } as ViewStyle,
    scrollViewContent: {
      flexDirection: "row",
      alignItems: "center",
      minHeight: 52,
      paddingHorizontal: 0,
    } as ViewStyle,
    tabButton: {
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      paddingVertical: 6,
      paddingHorizontal: 8,
      zIndex: 2,
      minHeight: 52,
    } as ViewStyle,
    cameraPlaceholder: {
      opacity: 0,
    } as ViewStyle,
    iconContainer: {
      marginBottom: 4,
      justifyContent: "center",
      alignItems: "center",
      height: 28,
      width: 28,
    } as ViewStyle,
    labelContainer: {
      justifyContent: "center",
      alignItems: "center",
      minHeight: 16,
    } as ViewStyle,
    label: {
      fontSize: TAB_LABEL_FONT_SIZE,
      textAlign: "center",
      letterSpacing: 0.2,
      fontFamily: "Rubik-Medium",
      color: colors.text,
    } as TextStyle,
    floatingCameraButton: {
      position: "absolute",
      top: -32,
      left: 0,
      width: CAMERA_BUTTON_SIZE,
      height: CAMERA_BUTTON_SIZE + 35,
      justifyContent: "flex-start",
      alignItems: "center",
      zIndex: 10,
    } as ViewStyle,
    cameraButton: {
      width: CAMERA_BUTTON_SIZE,
      height: CAMERA_BUTTON_SIZE,
      borderRadius: CAMERA_BUTTON_SIZE / 2,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 4,
    } as ViewStyle,
    cameraGradient: {
      width: CAMERA_BUTTON_SIZE,
      height: CAMERA_BUTTON_SIZE,
      borderRadius: CAMERA_BUTTON_SIZE / 2,
      justifyContent: "center",
      alignItems: "center",
      elevation: 12,
      shadowColor: emeraldPrimary,
      shadowOffset: {
        width: 0,
        height: 6,
      },
      shadowOpacity: 0.4,
      shadowRadius: 12,
      borderWidth: 4,
      borderColor: colors.background,
    } as ViewStyle,
    cameraLabel: {
      fontSize: TAB_LABEL_FONT_SIZE,
      textAlign: "center",
      letterSpacing: 0.2,
      fontFamily: "Rubik-Medium",
      marginTop: 2,
    } as TextStyle,
  });

  return {
    ...styles,
    cameraGradientColors: emeraldGradient,
  };
};

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <ScrollableTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    ></Tabs>
  );
}
