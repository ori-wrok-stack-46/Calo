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
} from "react-native-reanimated";

const SCREEN_WIDTH = Dimensions.get("window").width;

// Design constants
const TAB_CONFIG = {
  labelFontSize: 11,
  iconSize: 20,
  cameraIconSize: 24,
  tabHeight: 45,
  cameraHeight: 56,
  barHeight: 45,
  barPaddingHorizontal: 16,
  barPaddingVertical: 2,
  tabMinWidth: 80,
  tabMaxWidth: 120,
  tabPaddingHorizontal: 12,
  tabPaddingVertical: 8,
  borderRadius: 25,
  cameraBorderRadius: 28,
  spacing: 8,
} as const;

// Animation configs
const INSTANT_CONFIG = {
  damping: 40,
  stiffness: 800,
  mass: 0.2,
} as const;

const SMOOTH_CONFIG = {
  damping: 25,
  stiffness: 400,
  mass: 0.5,
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

// Enhanced Camera Tab Component
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

    useEffect(() => {
      scaleValue.value = withSpring(isFocused ? 1.08 : 1, SMOOTH_CONFIG);
      elevationValue.value = withTiming(isFocused ? 1 : 0, { duration: 200 });
    }, [isFocused]);

    const handlePressIn = useCallback(() => {
      scaleValue.value = withSpring(0.92, INSTANT_CONFIG);
    }, []);

    const handlePressOut = useCallback(() => {
      scaleValue.value = withSpring(isFocused ? 1.08 : 1, INSTANT_CONFIG);
    }, [isFocused]);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scaleValue.value }],
    }));

    const glowStyle = useAnimatedStyle(() => ({
      opacity: elevationValue.value * 0.4,
      transform: [{ scale: 1 + elevationValue.value * 0.15 }],
    }));

    return (
      <View style={styles.cameraTabContainer}>
        {/* Glow effect */}
        <Animated.View style={[styles.cameraGlow, glowStyle]} />

        <Animated.View style={animatedStyle}>
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
                  ? ["#059669", "#10B981", "#34D399"]
                  : ["#F3F4F6", "#FFFFFF", "#F9FAFB"]
              }
              style={styles.cameraGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Camera
                color={isFocused ? "#FFFFFF" : "#059669"}
                size={TAB_CONFIG.cameraIconSize}
                strokeWidth={isFocused ? 2.5 : 2}
              />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }
);

CameraTab.displayName = "CameraTab";

// Enhanced Regular Tab Component
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

    const IconComponent = getIconComponent(route.name);
    const label = getTabLabel(route.name);

    useEffect(() => {
      scaleValue.value = withSpring(isFocused ? 1.02 : 1, SMOOTH_CONFIG);
      backgroundValue.value = withTiming(isFocused ? 1 : 0, { duration: 150 });
    }, [isFocused]);

    const handlePressIn = useCallback(() => {
      scaleValue.value = withSpring(0.96, INSTANT_CONFIG);
    }, []);

    const handlePressOut = useCallback(() => {
      scaleValue.value = withSpring(isFocused ? 1.02 : 1, INSTANT_CONFIG);
    }, [isFocused]);

    const animatedTabStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scaleValue.value }],
    }));

    const animatedBackgroundStyle = useAnimatedStyle(() => {
      const backgroundColor = interpolateColor(
        backgroundValue.value,
        [0, 1],
        ["transparent", "#10B981"]
      );

      return {
        backgroundColor,
        borderColor:
          backgroundColor === "transparent" 
      };
    });

    const animatedTextStyle = useAnimatedStyle(() => {
      const color = interpolateColor(
        backgroundValue.value,
        [0, 1],
        ["#6B7280", "#FFFFFF"]
      );

      return {
        color,
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
            <View style={styles.tabContent}>
              <IconComponent
                color={isFocused ? "#FFFFFF" : "#6B7280"}
                size={TAB_CONFIG.iconSize}
                strokeWidth={isFocused ? 2.5 : 2}
              />
              <Animated.Text
                style={[
                  styles.tabLabel,
                  animatedTextStyle,
                  {
                    fontWeight: isFocused ? "600" : "500",
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

  // Calculate tab width
  const calculateTabWidth = useCallback(
    (label: string, isFocused: boolean): number => {
      const baseWidth = TAB_CONFIG.tabMinWidth;
      const labelWidth = Math.min(label.length * 7.5, 64);
      const contentWidth =
        TAB_CONFIG.tabPaddingHorizontal * 2 +
        TAB_CONFIG.iconSize +
        8 +
        labelWidth;

      return Math.min(
        Math.max(baseWidth, contentWidth + (isFocused ? 8 : 0)),
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

        {/* Camera Tab - Integrated but Special */}
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

// Optimized styles with proper typing
interface OptimizedStyles {
  safeAreaWrapper: ViewStyle;
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
    Platform.OS === "ios" ? 0 : Math.max(insets?.bottom || 0, 8);

  return StyleSheet.create({
    safeAreaWrapper: {
      backgroundColor: "transparent",
    },

    container: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "transparent",
      paddingTop: TAB_CONFIG.barPaddingVertical,
      paddingBottom: TAB_CONFIG.barPaddingVertical + safeBottomPadding,
      paddingHorizontal: TAB_CONFIG.barPaddingHorizontal,
      height: TAB_CONFIG.barHeight + safeBottomPadding,
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
    },

    scrollView: {
      flex: 1,
      height: TAB_CONFIG.tabHeight,
    },

    scrollContent: {
      alignItems: "center",
      gap: TAB_CONFIG.spacing,
      paddingRight: 16, // Space for camera tab
      minWidth: shouldCenter
        ? SCREEN_WIDTH - TAB_CONFIG.barPaddingHorizontal * 2 - 80
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

// Static styles
const styles = StyleSheet.create({
  // Regular tab styles
  regularTab: {
    flex: 1,
    height: TAB_CONFIG.tabHeight,
  },

  tabBackground: {
    flex: 1,
    borderRadius: TAB_CONFIG.borderRadius,
    borderWidth: 1,
    borderColor: "transparent",
  },

  tabContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: TAB_CONFIG.tabPaddingHorizontal,
    paddingVertical: TAB_CONFIG.tabPaddingVertical,
  },

  tabLabel: {
    fontSize: TAB_CONFIG.labelFontSize,
    textAlign: "center",
    letterSpacing: 0.2,
    lineHeight: TAB_CONFIG.labelFontSize * 1.2,
    flexShrink: 1,
  },

  // Camera tab styles
  cameraTabWrapper: {
    marginLeft: 8,
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

  cameraGlow: {
    position: "absolute",
    width: TAB_CONFIG.cameraHeight + 12,
    height: TAB_CONFIG.cameraHeight + 12,
    borderRadius: (TAB_CONFIG.cameraHeight + 12) / 2,
    backgroundColor: "#10B981",
    opacity: 0,
  },

  cameraTab: {
    width: TAB_CONFIG.cameraHeight,
    height: TAB_CONFIG.cameraHeight,
    borderRadius: TAB_CONFIG.cameraHeight / 2,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
  },

  cameraGradient: {
    width: TAB_CONFIG.cameraHeight,
    height: TAB_CONFIG.cameraHeight,
    borderRadius: TAB_CONFIG.cameraHeight / 2,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
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
