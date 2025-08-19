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
  TestTube,
  Heart,
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
} from "react-native-reanimated";

const SCREEN_WIDTH = Dimensions.get("window").width;

// Updated design constants to match the image
const TAB_CONFIG = {
  labelFontSize: 10,
  iconSize: 20,
  homeIconSize: 24,
  tabHeight: 70,
  homeHeight: 56,
  barHeight: 70,
  barPaddingHorizontal: 16,
  barPaddingVertical: 8,
  tabMinWidth: 60,
  tabMaxWidth: 80,
  tabPaddingHorizontal: 8,
  tabPaddingVertical: 8,
  borderRadius: 28,
  spacing: 8,
} as const;

// Animation configs
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

// Icon mapping
const getIconComponent = (routeName: string) => {
  const iconMap: { [key: string]: React.ComponentType<any> } = {
    index: Home,
    history: TestTube,
    camera: Camera,
    statistics: Heart,
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

// Tab label mapping
const getTabLabel = (routeName: string): string => {
  const labelMap: { [key: string]: string } = {
    index: "",
    history: "",
    camera: "",
    statistics: "",
    calendar: "",
    devices: "",
    "recommended-menus": "",
    "ai-chat": "",
    "food-scanner": "",
    questionnaire: "",
    profile: "",
  };
  return labelMap[routeName] || "";
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

// Home Tab Component (circular black button)
const HomeTab = React.memo(
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

    useEffect(() => {
      if (isFocused) {
        scaleValue.value = withSpring(1.1, BOUNCE_CONFIG);
      } else {
        scaleValue.value = withSpring(1, SMOOTH_CONFIG);
      }
    }, [isFocused]);

    const handlePressIn = useCallback(() => {
      scaleValue.value = withSpring(0.9, INSTANT_CONFIG);
    }, []);

    const handlePressOut = useCallback(() => {
      scaleValue.value = withSpring(isFocused ? 1.1 : 1, BOUNCE_CONFIG);
    }, [isFocused]);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scaleValue.value }],
    }));

    return (
      <View style={styles.homeTabContainer}>
        <Animated.View style={animatedStyle}>
          <TouchableOpacity
            onPress={onPress}
            onLongPress={onLongPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={styles.homeTab}
            activeOpacity={1}
          >
            <Home
              color="#FFFFFF"
              size={TAB_CONFIG.homeIconSize}
              strokeWidth={2.5}
            />
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }
);

HomeTab.displayName = "HomeTab";

// Regular Tab Component
const RegularTab = React.memo(
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
    const colorValue = useSharedValue(isFocused ? 1 : 0);

    const IconComponent = getIconComponent(route.name);

    useEffect(() => {
      if (isFocused) {
        scaleValue.value = withSpring(1.1, BOUNCE_CONFIG);
        colorValue.value = withTiming(1, { duration: 200 });
      } else {
        scaleValue.value = withSpring(1, SMOOTH_CONFIG);
        colorValue.value = withTiming(0, { duration: 200 });
      }
    }, [isFocused]);

    const handlePressIn = useCallback(() => {
      scaleValue.value = withSpring(0.9, INSTANT_CONFIG);
    }, []);

    const handlePressOut = useCallback(() => {
      scaleValue.value = withSpring(isFocused ? 1.1 : 1, BOUNCE_CONFIG);
    }, [isFocused]);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scaleValue.value }],
    }));

    const animatedIconStyle = useAnimatedStyle(() => {
      const color = interpolateColor(
        colorValue.value,
        [0, 1],
        ["#9CA3AF", "#000000"]
      );
      return { color };
    });

    return (
      <Animated.View style={[styles.regularTab, animatedStyle]}>
        <TouchableOpacity
          onPress={onPress}
          onLongPress={onLongPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={styles.tabContent}
          activeOpacity={1}
        >
          <Animated.View>
            <IconComponent
              color={isFocused ? "#000000" : "#9CA3AF"}
              size={TAB_CONFIG.iconSize}
              strokeWidth={2}
            />
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

  // Separate home tab from other tabs
  const { regularTabs, homeTab } = useMemo(() => {
    try {
      if (!state?.routes || !Array.isArray(state.routes)) {
        return { regularTabs: [], homeTab: null };
      }

      const validRoutes = state.routes.filter(
        (route): route is RouteInfo =>
          route &&
          typeof route === "object" &&
          typeof route.name === "string" &&
          typeof route.key === "string"
      );

      const home = validRoutes.find((route) => route.name === "index") || null;
      const regular = validRoutes.filter((route) => route.name !== "index");

      return {
        regularTabs: regular,
        homeTab: home,
      };
    } catch (error) {
      console.warn("Error filtering tabs:", error);
      return { regularTabs: [], homeTab: null };
    }
  }, [state?.routes]);

  // Navigation handlers
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
    return createOptimizedStyles(insets);
  }, [insets]);

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

  // Check if home is focused
  const homeIndex = homeTab
    ? state.routes.findIndex((r) => r?.key === homeTab.key)
    : -1;
  const isHomeFocused = homeIndex !== -1 && state.index === homeIndex;

  // Get only the first 4 regular tabs to match the design
  const displayTabs = regularTabs.slice(0, 4);

  return (
    <SafeAreaView edges={["bottom"]} style={dynamicStyles.safeAreaWrapper}>
      <View style={dynamicStyles.container}>
        {/* Left tabs (2 tabs) */}
        <View style={styles.leftTabs}>
          {displayTabs.slice(0, 2).map((route) => {
            if (!route?.key || !descriptors[route.key]) {
              return null;
            }

            try {
              const { options } = descriptors[route.key];
              const routeIndex = state.routes.findIndex(
                (r) => r?.key === route.key
              );
              const isFocused = routeIndex !== -1 && state.index === routeIndex;
              const isDisabled = options?.tabBarButton === null;

              if (isDisabled) return null;

              return (
                <RegularTab
                  key={route.key}
                  route={route}
                  isFocused={isFocused}
                  onPress={createTabPressHandler(route)}
                  onLongPress={createTabLongPressHandler(route)}
                />
              );
            } catch (error) {
              console.warn(`Error rendering tab ${route.name}:`, error);
              return null;
            }
          })}
        </View>

        {/* Home Tab (center) */}
        {homeTab && (
          <HomeTab
            route={homeTab}
            isFocused={isHomeFocused}
            onPress={createTabPressHandler(homeTab)}
            onLongPress={createTabLongPressHandler(homeTab)}
          />
        )}

        {/* Right tabs (2 tabs) */}
        <View style={styles.rightTabs}>
          {displayTabs.slice(2, 4).map((route) => {
            if (!route?.key || !descriptors[route.key]) {
              return null;
            }

            try {
              const { options } = descriptors[route.key];
              const routeIndex = state.routes.findIndex(
                (r) => r?.key === route.key
              );
              const isFocused = routeIndex !== -1 && state.index === routeIndex;
              const isDisabled = options?.tabBarButton === null;

              if (isDisabled) return null;

              return (
                <RegularTab
                  key={route.key}
                  route={route}
                  isFocused={isFocused}
                  onPress={createTabPressHandler(route)}
                  onLongPress={createTabLongPressHandler(route)}
                />
              );
            } catch (error) {
              console.warn(`Error rendering tab ${route.name}:`, error);
              return null;
            }
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}

// Optimized styles
interface OptimizedStyles {
  safeAreaWrapper: ViewStyle;
  container: ViewStyle;
  fallbackContainer: ViewStyle;
  fallbackText: TextStyle;
}

const createOptimizedStyles = (
  insets: { bottom?: number } = {}
): OptimizedStyles => {
  const safeBottomPadding =
    Platform.OS === "ios" ? 0 : Math.max(insets?.bottom || 0, 10);

  return StyleSheet.create({
    safeAreaWrapper: {
      backgroundColor: "#F9FAFB",
    },

    container: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: "#F9FAFB",
      paddingTop: TAB_CONFIG.barPaddingVertical,
      paddingBottom: TAB_CONFIG.barPaddingVertical + safeBottomPadding,
      paddingHorizontal: TAB_CONFIG.barPaddingHorizontal + 20,
      height: TAB_CONFIG.barHeight + safeBottomPadding,
      borderTopWidth: 1,
      borderTopColor: "#E5E7EB",
      borderRadius: "50"
    },

    fallbackContainer: {
      height: TAB_CONFIG.barHeight,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "#F9FAFB",
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
  leftTabs: {
    flexDirection: "row",
    flex: 1,
    justifyContent: "space-around",
    alignItems: "center",
  },

  rightTabs: {
    flexDirection: "row",
    flex: 1,
    justifyContent: "space-around",
    alignItems: "center",
  },

  regularTab: {
    width: TAB_CONFIG.tabMinWidth,
    height: TAB_CONFIG.tabHeight - 20,
    alignItems: "center",
    justifyContent: "center",
  },

  tabContent: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "100%",
  },

  homeTabContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 20,
  },

  homeTab: {
    width: TAB_CONFIG.homeHeight,
    height: TAB_CONFIG.homeHeight,
    borderRadius: TAB_CONFIG.homeHeight / 2,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
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
