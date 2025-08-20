import React, { useRef, useEffect, useMemo, useCallback } from "react";
import { ViewStyle, TextStyle } from "react-native";
import { Tabs } from "expo-router";
import {
  View,
  StyleSheet,
  Dimensions,
  Platform,
  TouchableOpacity,
  Text,
  ScrollView,
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
  ScanLine,
  ClipboardList,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  useSafeAreaInsets,
  SafeAreaView,
} from "react-native-safe-area-context";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolateColor,
  interpolate,
  withSequence,
  Easing,
  runOnJS,
} from "react-native-reanimated";

const SCREEN_WIDTH = Dimensions.get("window").width;

// Enhanced design constants with more sophisticated sizing
const TAB_CONFIG = {
  labelFontSize: 11,
  iconSize: 22,
  cameraIconSize: 26,
  tabHeight: 52,
  cameraHeight: 64,
  barHeight: 52,
  barPaddingHorizontal: 20,
  barPaddingVertical: 6,
  tabMinWidth: 85,
  tabMaxWidth: 140,
  tabPaddingHorizontal: 16,
  tabPaddingVertical: 10,
  borderRadius: 28,
  cameraBorderRadius: 32,
  spacing: 12,
  glowRadius: 8,
  shadowRadius: 12,
} as const;

// Enhanced animation configs with more fluid motion
const INSTANT_CONFIG = {
  damping: 45,
  stiffness: 900,
  mass: 0.15,
} as const;

const SMOOTH_CONFIG = {
  damping: 28,
  stiffness: 450,
  mass: 0.4,
} as const;

const BOUNCE_CONFIG = {
  damping: 15,
  stiffness: 300,
  mass: 0.8,
} as const;

// Safe icon mapping
const getIconComponent = (routeName: string) => {
  const iconMap: { [key: string]: React.ComponentType<any> } = {
    index: Home,
    history: History,
    camera: Camera,
    statistics: TrendingUp,
    calendar: Calendar,
    devices: Watch,
    "recommended-menus": UtensilsCrossed,
    "ai-chat": Bot,
    "food-scanner": ScanLine,
    questionnaire: ClipboardList,
    profile: User,
  };
  return iconMap[routeName] || Home;
};

// Safe tab label mapping
const getTabLabel = (routeName: string): string => {
  const labelMap: { [key: string]: string } = {
    index: "Home",
    history: "History",
    camera: "Camera",
    statistics: "Stats",
    calendar: "Calendar",
    devices: "Devices",
    "recommended-menus": "Menus",
    "ai-chat": "AI Chat",
    "food-scanner": "Scanner",
    questionnaire: "Survey",
    profile: "Profile",
  };
  return labelMap[routeName] || routeName;
};

interface RouteInfo {
  key: string;
  name: string;
}

interface TabState {
  routes: RouteInfo[];
  index: number;
}

interface CustomTabBarProps {
  state: TabState;
  descriptors: { [key: string]: any };
  navigation: any;
}

// Enhanced Camera Tab Component with sophisticated animations
const CameraTab = React.memo(
  ({
    route,
    isFocused,
    onPress,
    onLongPress,
  }: {
    route: RouteInfo;
    isFocused: boolean;
    onPress: () => void;
    onLongPress: () => void;
  }) => {
    const scaleValue = useSharedValue(1);
    const elevationValue = useSharedValue(0);
    const rotationValue = useSharedValue(0);
    const glowScale = useSharedValue(1);
    const pulseValue = useSharedValue(1);

    useEffect(() => {
      if (isFocused) {
        scaleValue.value = withSpring(1.12, BOUNCE_CONFIG);
        elevationValue.value = withTiming(1, {
          duration: 300,
          easing: Easing.out(Easing.cubic),
        });
        glowScale.value = withSpring(1.3, SMOOTH_CONFIG);
        pulseValue.value = withSequence(
          withTiming(1.05, { duration: 800 }),
          withTiming(1, { duration: 800 })
        );
      } else {
        scaleValue.value = withSpring(1, SMOOTH_CONFIG);
        elevationValue.value = withTiming(0, { duration: 200 });
        glowScale.value = withSpring(1, SMOOTH_CONFIG);
        pulseValue.value = withTiming(1, { duration: 200 });
      }
    }, [isFocused]);

    const handlePressIn = useCallback(() => {
      scaleValue.value = withSpring(0.88, INSTANT_CONFIG);
      rotationValue.value = withTiming(-5, { duration: 100 });
    }, []);

    const handlePressOut = useCallback(() => {
      scaleValue.value = withSpring(isFocused ? 1.12 : 1, BOUNCE_CONFIG);
      rotationValue.value = withSpring(0, SMOOTH_CONFIG);
    }, [isFocused]);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [
        { scale: scaleValue.value * pulseValue.value },
        { rotate: `${rotationValue.value}deg` },
      ],
    }));

    const glowStyle = useAnimatedStyle(() => ({
      opacity: elevationValue.value * 0.3,
      transform: [{ scale: glowScale.value }],
    }));

    const shadowStyle = useAnimatedStyle(() => ({
      shadowOpacity: 0.15 + elevationValue.value * 0.1,
      elevation: 8 + elevationValue.value * 4,
    }));

    return (
      <View style={styles.cameraTabContainer}>
        {/* Enhanced multi-layer glow effect */}
        <Animated.View style={[styles.cameraGlowOuter, glowStyle]} />
        <Animated.View style={[styles.cameraGlowInner, glowStyle]} />

        <Animated.View style={[animatedStyle, shadowStyle]}>
          <TouchableOpacity
            onPress={onPress}
            onLongPress={onLongPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={styles.cameraTab}
            activeOpacity={1}
          >
            <LinearGradient
              colors={
                isFocused
                  ? ["#059669", "#10B981", "#34D399", "#6EE7B7"]
                  : ["#F8FAFC", "#FFFFFF", "#F1F5F9", "#E2E8F0"]
              }
              style={styles.cameraGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {/* Inner highlight for depth */}
              <View
                style={[
                  styles.cameraInnerHighlight,
                  {
                    backgroundColor: isFocused
                      ? "rgba(255,255,255,0.2)"
                      : "rgba(16,185,129,0.1)",
                  },
                ]}
              />

              <Camera
                color={isFocused ? "#FFFFFF" : "#059669"}
                size={TAB_CONFIG.cameraIconSize}
                strokeWidth={isFocused ? 2.8 : 2.2}
              />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }
);

CameraTab.displayName = "CameraTab";

// Enhanced Regular Tab Component with micro-interactions
const RegularTab = React.memo(
  ({
    route,
    isFocused,
    onPress,
    onLongPress,
    tabWidth,
  }: {
    route: RouteInfo;
    isFocused: boolean;
    onPress: () => void;
    onLongPress: () => void;
    tabWidth: number;
  }) => {
    const scaleValue = useSharedValue(1);
    const backgroundValue = useSharedValue(isFocused ? 1 : 0);
    const iconBounce = useSharedValue(1);
    const labelSlide = useSharedValue(0);
    const shadowValue = useSharedValue(0);

    const IconComponent = getIconComponent(route.name);
    const label = getTabLabel(route.name);

    useEffect(() => {
      if (isFocused) {
        scaleValue.value = withSpring(1.04, BOUNCE_CONFIG);
        backgroundValue.value = withTiming(1, {
          duration: 250,
          easing: Easing.out(Easing.cubic),
        });
        shadowValue.value = withTiming(1, { duration: 200 });
        iconBounce.value = withSequence(
          withTiming(1.15, { duration: 150 }),
          withSpring(1, SMOOTH_CONFIG)
        );
        labelSlide.value = withSpring(1, SMOOTH_CONFIG);
      } else {
        scaleValue.value = withSpring(1, SMOOTH_CONFIG);
        backgroundValue.value = withTiming(0, { duration: 200 });
        shadowValue.value = withTiming(0, { duration: 150 });
        iconBounce.value = withSpring(1, SMOOTH_CONFIG);
        labelSlide.value = withTiming(0, { duration: 150 });
      }
    }, [isFocused]);

    const handlePressIn = useCallback(() => {
      scaleValue.value = withSpring(0.94, INSTANT_CONFIG);
    }, []);

    const handlePressOut = useCallback(() => {
      scaleValue.value = withSpring(isFocused ? 1.04 : 1, BOUNCE_CONFIG);
    }, [isFocused]);

    const animatedTabStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scaleValue.value }],
    }));

    const animatedBackgroundStyle = useAnimatedStyle(() => {
      const backgroundColor = interpolateColor(
        backgroundValue.value,
        [0, 1],
        ["rgba(255,255,255,0.0)", "#10B981"]
      );

      const borderColor = interpolateColor(
        backgroundValue.value,
        [0, 1],
        ["rgba(229,231,235,0.6)", "#10B981"]
      );

      return {
        backgroundColor,
        borderColor,
        shadowOpacity: shadowValue.value * 0.08,
        elevation: shadowValue.value * 3,
      };
    });

    const animatedIconStyle = useAnimatedStyle(() => ({
      transform: [{ scale: iconBounce.value }],
    }));

    const animatedTextStyle = useAnimatedStyle(() => {
      const color = interpolateColor(
        backgroundValue.value,
        [0, 1],
        ["#6B7280", "#FFFFFF"]
      );

      // Fixed: Use interpolate for translateY instead of interpolateColor
      const translateY = interpolate(labelSlide.value, [0, 1], [2, 0]);

      return {
        color,
        transform: [{ translateY }],
        opacity: 0.85 + backgroundValue.value * 0.15,
      };
    });

    return (
      <Animated.View style={[{ width: tabWidth }, animatedTabStyle]}>
        <TouchableOpacity
          onPress={onPress}
          onLongPress={onLongPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={styles.regularTab}
          activeOpacity={1}
        >
          <Animated.View
            style={[styles.tabBackground, animatedBackgroundStyle]}
          >
            {/* Subtle inner highlight for depth */}
            {isFocused && <View style={styles.tabInnerHighlight} />}

            <View style={styles.tabContent}>
              <Animated.View style={animatedIconStyle}>
                <IconComponent
                  color={isFocused ? "#FFFFFF" : "#6B7280"}
                  size={TAB_CONFIG.iconSize}
                  strokeWidth={isFocused ? 2.8 : 2.2}
                />
              </Animated.View>
              <Animated.Text
                style={[
                  styles.tabLabel,
                  animatedTextStyle,
                  {
                    fontWeight: isFocused ? "700" : "500",
                    letterSpacing: isFocused ? 0.3 : 0.2,
                  },
                ]}
                numberOfLines={1}
              >
                {label}
              </Animated.Text>
            </View>
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
    );
  }
);

RegularTab.displayName = "RegularTab";

export function ScrollableTabBar({
  state,
  descriptors,
  navigation,
}: CustomTabBarProps) {
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);

  // Separate camera from regular tabs with proper error handling
  const { regularTabs, cameraTab } = useMemo(() => {
    try {
      if (!state?.routes || !Array.isArray(state.routes)) {
        return { regularTabs: [], cameraTab: null };
      }

      const validRoutes = state.routes.filter(
        (route): route is RouteInfo =>
          route &&
          typeof route === "object" &&
          typeof route.name === "string" &&
          typeof route.key === "string"
      );

      const camera =
        validRoutes.find((route) => route.name === "camera") || null;
      const regular = validRoutes.filter((route) => route.name !== "camera");

      return {
        regularTabs: regular,
        cameraTab: camera,
      };
    } catch (error) {
      console.warn("Error filtering tabs:", error);
      return { regularTabs: [], cameraTab: null };
    }
  }, [state?.routes]);

  // Enhanced tab width calculation
  const calculateTabWidth = useCallback(
    (label: string, isFocused: boolean): number => {
      const baseWidth = TAB_CONFIG.tabMinWidth;
      const labelWidth = Math.min(label.length * 8.2, 72);
      const contentWidth =
        TAB_CONFIG.tabPaddingHorizontal * 2 +
        TAB_CONFIG.iconSize +
        10 +
        labelWidth;

      const focusMultiplier = isFocused ? 1.08 : 1;

      return Math.min(
        Math.max(baseWidth, contentWidth * focusMultiplier),
        TAB_CONFIG.tabMaxWidth
      );
    },
    []
  );

  // Calculate total width for regular tabs
  const totalTabsWidth = useMemo(() => {
    if (!state?.routes) return 0;

    return (
      regularTabs.reduce((total, route) => {
        const label = getTabLabel(route.name);
        const routeIndex = state.routes.findIndex((r) => r?.key === route.key);
        const isFocused = routeIndex !== -1 && state.index === routeIndex;
        return total + calculateTabWidth(label, isFocused) + TAB_CONFIG.spacing;
      }, 0) +
      TAB_CONFIG.barPaddingHorizontal * 2
    );
  }, [regularTabs, state?.index, state?.routes, calculateTabWidth]);

  // Navigation handlers with better error handling
  const createTabPressHandler = useCallback(
    (route: RouteInfo) => {
      return () => {
        try {
          if (!route?.name || !navigation) {
            console.warn("Invalid route or navigation object");
            return;
          }

          navigation.navigate(route.name);
        } catch (error) {
          console.warn("Error in tab press handler:", error);
        }
      };
    },
    [navigation]
  );

  const createTabLongPressHandler = useCallback(
    (route: RouteInfo) => {
      return () => {
        try {
          if (!route?.key || !navigation) {
            console.warn("Invalid route or navigation object");
            return;
          }

          navigation.emit({
            type: "tabLongPress",
            target: route.key,
          });
        } catch (error) {
          console.warn("Error in tab long press handler:", error);
        }
      };
    },
    [navigation]
  );

  // Dynamic styles
  const dynamicStyles = useMemo(() => {
    return createOptimizedStyles(insets, totalTabsWidth <= SCREEN_WIDTH);
  }, [insets, totalTabsWidth]);

  // Fallback for invalid state
  if (!state || !state.routes || !descriptors || !navigation) {
    return (
      <SafeAreaView edges={["bottom"]} style={dynamicStyles.safeAreaWrapper}>
        <View style={dynamicStyles.fallbackContainer}>
          <Text style={dynamicStyles.fallbackText}>Loading tabs...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Check if camera is focused
  const cameraIndex = cameraTab
    ? state.routes.findIndex((r) => r?.key === cameraTab.key)
    : -1;
  const isCameraFocused = cameraIndex !== -1 && state.index === cameraIndex;

  return (
    <SafeAreaView edges={["bottom"]} style={dynamicStyles.safeAreaWrapper}>
      {/* Enhanced backdrop with subtle gradient */}
      <LinearGradient
        colors={["rgba(255,255,255,0.95)", "rgba(248,250,252,0.98)"]}
        style={dynamicStyles.backdrop}
      />

      <View style={dynamicStyles.container}>
        {/* Regular tabs */}
        <ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[
            dynamicStyles.scrollContent,
            totalTabsWidth <= SCREEN_WIDTH && dynamicStyles.centeredContent,
          ]}
          style={dynamicStyles.scrollView}
          bounces={false}
          decelerationRate="fast"
          scrollEventThrottle={16}
          directionalLockEnabled={true}
          alwaysBounceHorizontal={false}
          keyboardShouldPersistTaps="handled"
          scrollEnabled={totalTabsWidth > SCREEN_WIDTH}
        >
          {regularTabs.map((route) => {
            if (!route?.key || !descriptors[route.key]) {
              return null;
            }

            try {
              const { options } = descriptors[route.key];
              const label = getTabLabel(route.name);

              const routeIndex = state.routes.findIndex(
                (r) => r?.key === route.key
              );
              const isFocused = routeIndex !== -1 && state.index === routeIndex;
              const isDisabled = options?.tabBarButton === null;

              if (isDisabled) return null;

              const tabWidth = calculateTabWidth(label, isFocused);

              return (
                <RegularTab
                  key={route.key}
                  route={route}
                  isFocused={isFocused}
                  onPress={createTabPressHandler(route)}
                  onLongPress={createTabLongPressHandler(route)}
                  tabWidth={tabWidth}
                />
              );
            } catch (error) {
              console.warn(`Error rendering tab ${route.name}:`, error);
              return null;
            }
          })}
        </ScrollView>

        {/* Camera Tab - Enhanced positioning */}
        {cameraTab && (
          <View style={styles.cameraTabWrapper}>
            <CameraTab
              route={cameraTab}
              isFocused={isCameraFocused}
              onPress={createTabPressHandler(cameraTab)}
              onLongPress={createTabLongPressHandler(cameraTab)}
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

// Optimized styles with enhanced visual design
interface OptimizedStyles {
  safeAreaWrapper: ViewStyle;
  backdrop: ViewStyle;
  container: ViewStyle;
  scrollView: ViewStyle;
  scrollContent: ViewStyle;
  centeredContent: ViewStyle;
  fallbackContainer: ViewStyle;
  fallbackText: TextStyle;
}

const createOptimizedStyles = (
  insets: { bottom?: number } = {},
  shouldCenter: boolean
): OptimizedStyles => {
  const safeBottomPadding =
    Platform.OS === "ios" ? 0 : Math.max(insets?.bottom || 0, 10);

  return StyleSheet.create({
    safeAreaWrapper: {
      backgroundColor: "transparent",
    },

    backdrop: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: -1,
    },

    container: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "transparent",
      paddingTop: TAB_CONFIG.barPaddingVertical,
      paddingBottom: TAB_CONFIG.barPaddingVertical + safeBottomPadding,
      paddingHorizontal: TAB_CONFIG.barPaddingHorizontal,
      height: TAB_CONFIG.barHeight + safeBottomPadding + 8,
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: -3 },
      shadowOpacity: 0.08,
      shadowRadius: 16,
      elevation: 8,
    },

    scrollView: {
      flex: 1,
      height: TAB_CONFIG.tabHeight,
    },

    scrollContent: {
      alignItems: "center",
      gap: TAB_CONFIG.spacing,
      paddingRight: 20,
      minWidth: shouldCenter
        ? SCREEN_WIDTH - TAB_CONFIG.barPaddingHorizontal * 2 - 90
        : undefined,
    },

    centeredContent: {
      justifyContent: "center",
    },

    fallbackContainer: {
      height: TAB_CONFIG.barHeight,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#FFFFFF",
    },

    fallbackText: {
      fontSize: 13,
      color: "#6B7280",
      fontWeight: "500",
    },
  });
};

// Enhanced static styles with modern design elements
const styles = StyleSheet.create({
  // Regular tab styles
  regularTab: {
    flex: 1,
    height: TAB_CONFIG.tabHeight,
  },

  tabBackground: {
    flex: 1,
    borderRadius: TAB_CONFIG.borderRadius,
    borderWidth: 1.5,
    borderColor: "transparent",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 0,
  },

  tabInnerHighlight: {
    position: "absolute",
    top: 1,
    left: 1,
    right: 1,
    height: "30%",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderTopLeftRadius: TAB_CONFIG.borderRadius - 2,
    borderTopRightRadius: TAB_CONFIG.borderRadius - 2,
  },

  tabContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: TAB_CONFIG.tabPaddingHorizontal,
    paddingVertical: TAB_CONFIG.tabPaddingVertical,
  },

  tabLabel: {
    fontSize: TAB_CONFIG.labelFontSize,
    textAlign: "center",
    lineHeight: TAB_CONFIG.labelFontSize * 1.3,
    flexShrink: 1,
    textShadowColor: "rgba(0,0,0,0.1)",
    textShadowOffset: { width: 0, height: 0.5 },
    textShadowRadius: 1,
  },

  // Enhanced camera tab styles
  cameraTabWrapper: {
    marginLeft: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  cameraTabContainer: {
    position: "relative",
    width: TAB_CONFIG.cameraHeight,
    height: TAB_CONFIG.cameraHeight,
    alignItems: "center",
    justifyContent: "center",
  },

  cameraGlowOuter: {
    position: "absolute",
    width: TAB_CONFIG.cameraHeight + 20,
    height: TAB_CONFIG.cameraHeight + 20,
    borderRadius: (TAB_CONFIG.cameraHeight + 20) / 2,
    backgroundColor: "#10B981",
    opacity: 0,
  },

  cameraGlowInner: {
    position: "absolute",
    width: TAB_CONFIG.cameraHeight + 8,
    height: TAB_CONFIG.cameraHeight + 8,
    borderRadius: (TAB_CONFIG.cameraHeight + 8) / 2,
    backgroundColor: "#34D399",
    opacity: 0,
  },

  cameraTab: {
    width: TAB_CONFIG.cameraHeight,
    height: TAB_CONFIG.cameraHeight,
    borderRadius: TAB_CONFIG.cameraHeight / 2,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },

  cameraGradient: {
    width: TAB_CONFIG.cameraHeight,
    height: TAB_CONFIG.cameraHeight,
    borderRadius: TAB_CONFIG.cameraHeight / 2,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
    position: "relative",
  },

  cameraInnerHighlight: {
    position: "absolute",
    top: 3,
    left: 3,
    right: 3,
    height: "35%",
    borderTopLeftRadius: TAB_CONFIG.cameraHeight / 2 - 6,
    borderTopRightRadius: TAB_CONFIG.cameraHeight / 2 - 6,
  },
});

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <ScrollableTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    />
  );
}