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
  I18nManager,
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
} from "react-native-reanimated";
import { useLanguage } from "../src/i18n/context/LanguageContext";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/src/context/ThemeContext";

const SCREEN_WIDTH = Dimensions.get("window").width;

// Clean, modern design constants
const TAB_CONFIG = {
  labelFontSize: 10,
  iconSize: 22,
  cameraIconSize: 28,
  tabHeight: 50,
  cameraSize: 60,
  barHeight: 80,
  spacing: 4,
  tabPadding: 12,
  borderRadius: 25,
  cameraBorderRadius: 30,
} as const;

// Simple, smooth animations
const SPRING_CONFIG = {
  damping: 20,
  stiffness: 300,
} as const;

// Icon mapping
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

// Label mapping
const getTabLabel = (routeName: string, t: (key: string) => string): string => {
  const labelMap: { [key: string]: string } = {
    index: t("tabs.home"),
    history: t("tabs.history"),
    camera: t("tabs.camera"),
    statistics: t("tabs.statistics"),
    calendar: t("tabs.calendar"),
    devices: t("tabs.devices"),
    "recommended-menus": t("tabs.recommended_menus"),
    "ai-chat": t("tabs.ai_chat"),
    "food-scanner": t("tabs.food_scanner"),
    questionnaire: t("tabs.questionnaire"),
    profile: t("tabs.profile"),
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

// Beautiful emerald camera tab
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
    colors: any;
  }) => {
    const scale = useSharedValue(1);
    const shadowOpacity = useSharedValue(0);
    const { colors } = useTheme();
    useEffect(() => {
      scale.value = withSpring(isFocused ? 1.1 : 1, SPRING_CONFIG);
      shadowOpacity.value = withTiming(isFocused ? 1 : 0, { duration: 200 });
    }, [isFocused]);

    const handlePress = () => {
      scale.value = withSpring(0.9, { damping: 50, stiffness: 500 });
      setTimeout(() => {
        scale.value = withSpring(isFocused ? 1.1 : 1, SPRING_CONFIG);
        onPress();
      }, 100);
    };

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    const shadowStyle = useAnimatedStyle(() => ({
      shadowOpacity: shadowOpacity.value * 0.3,
      elevation: shadowOpacity.value * 8,
    }));

    return (
      <Animated.View style={[animatedStyle, shadowStyle]}>
        <TouchableOpacity
          onPress={handlePress}
          onLongPress={onLongPress}
          style={[
            styles.cameraTab,
            {
              backgroundColor: isFocused ? colors.primary : colors.surface,
              shadowColor: colors.primary,
            },
          ]}
          activeOpacity={0.8}
        >
          <Camera
            size={TAB_CONFIG.cameraIconSize}
            color={isFocused ? colors.background : colors.text}
            strokeWidth={2}
          />
        </TouchableOpacity>
      </Animated.View>
    );
  }
);

CameraTab.displayName = "CameraTab";

// Beautiful regular tab with emerald theme and active circle
const RegularTab = React.memo(
  ({
    route,
    isFocused,
    onPress,
    onLongPress,
    colors,
    t,
  }: {
    route: RouteInfo;
    isFocused: boolean;
    onPress: () => void;
    onLongPress: () => void;
    colors: any;
    t: (key: string) => string;
  }) => {
    const scale = useSharedValue(1);
    const circleScale = useSharedValue(isFocused ? 1 : 0);
    const iconScale = useSharedValue(1);

    const IconComponent = getIconComponent(route.name);
    const label = getTabLabel(route.name, t);

    useEffect(() => {
      scale.value = withSpring(isFocused ? 1.02 : 1, SPRING_CONFIG);
      circleScale.value = withSpring(isFocused ? 1 : 0, SPRING_CONFIG);
      if (isFocused) {
        iconScale.value = withSpring(1.1, { damping: 25, stiffness: 400 });
      } else {
        iconScale.value = withSpring(1, SPRING_CONFIG);
      }
    }, [isFocused]);

    const handlePress = () => {
      scale.value = withSpring(0.95, { damping: 50, stiffness: 500 });
      setTimeout(() => {
        scale.value = withSpring(isFocused ? 1.02 : 1, SPRING_CONFIG);
        onPress();
      }, 100);
    };

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    const circleStyle = useAnimatedStyle(() => ({
      transform: [{ scale: circleScale.value }],
      opacity: circleScale.value,
    }));

    const iconAnimatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: iconScale.value }],
    }));

    return (
      <Animated.View style={[styles.regularTab, animatedStyle]}>
        <TouchableOpacity
          onPress={handlePress}
          onLongPress={onLongPress}
          style={styles.tabButton}
          activeOpacity={0.7}
        >
          <View style={styles.tabContent}>
            <View style={styles.iconContainer}>
              {/* Active circle background */}
              <Animated.View
                style={[
                  styles.activeCircle,
                  {
                    backgroundColor: colors.primary + "20", // 20% opacity
                    borderColor: colors.primary + "40", // 40% opacity
                  },
                  circleStyle,
                ]}
              />
              <Animated.View style={iconAnimatedStyle}>
                <IconComponent
                  size={TAB_CONFIG.iconSize}
                  color={isFocused ? colors.primary : colors.text}
                  strokeWidth={isFocused ? 2.5 : 2}
                />
              </Animated.View>
            </View>
            <Text
              style={[
                styles.tabLabel,
                {
                  color: isFocused ? colors.primary : colors.text,
                  fontWeight: isFocused ? "600" : "400",
                },
              ]}
              numberOfLines={1}
            >
              {label}
            </Text>
          </View>
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
  const { colors, isDark } = useTheme();
  const { isRTL } = useLanguage();
  const { t } = useTranslation();

  // Separate tabs
  const { regularTabs, cameraTab } = useMemo(() => {
    if (!state?.routes) return { regularTabs: [], cameraTab: null };

    const validRoutes = state.routes.filter(
      (route): route is RouteInfo =>
        route && typeof route.name === "string" && typeof route.key === "string"
    );

    const camera = validRoutes.find((route) => route.name === "camera") || null;
    const regular = validRoutes.filter((route) => route.name !== "camera");

    return { regularTabs: regular, cameraTab: camera };
  }, [state?.routes]);

  // Navigation handlers
  const createTabPressHandler = useCallback(
    (route: RouteInfo) => () => {
      try {
        navigation.navigate(route.name);
      } catch (error) {
        console.warn("Navigation error:", error);
      }
    },
    [navigation]
  );

  const createTabLongPressHandler = useCallback(
    (route: RouteInfo) => () => {
      try {
        navigation.emit({ type: "tabLongPress", target: route.key });
      } catch (error) {
        console.warn("Long press error:", error);
      }
    },
    [navigation]
  );

  if (!state?.routes) {
    return null;
  }

  // Check camera focus
  const cameraIndex = cameraTab
    ? state.routes.findIndex((r) => r?.key === cameraTab.key)
    : -1;
  const isCameraFocused = cameraIndex !== -1 && state.index === cameraIndex;

  const bottomPadding = Math.max(insets.bottom || 0, 20);

  return (
    <SafeAreaView edges={["bottom"]} style={{ backgroundColor: "transparent" }}>
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.background + "F5", // 96% opacity
            paddingBottom: bottomPadding,
            borderTopColor: colors.border,
          },
        ]}
      >
        {/* Regular tabs */}
        <ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          style={styles.scrollView}
          bounces={false}
          keyboardShouldPersistTaps="handled"
        >
          {regularTabs.map((route) => {
            if (!descriptors[route.key]) return null;

            const routeIndex = state.routes.findIndex(
              (r) => r?.key === route.key
            );
            const isFocused = routeIndex !== -1 && state.index === routeIndex;

            return (
              <RegularTab
                key={route.key}
                route={route}
                isFocused={isFocused}
                onPress={createTabPressHandler(route)}
                onLongPress={createTabLongPressHandler(route)}
                colors={colors}
                t={t}
              />
            );
          })}
        </ScrollView>

        {/* Camera Tab */}
        {cameraTab && (
          <View style={styles.cameraWrapper}>
            <CameraTab
              route={cameraTab}
              isFocused={isCameraFocused}
              onPress={createTabPressHandler(cameraTab)}
              onLongPress={createTabLongPressHandler(cameraTab)}
              colors={colors}
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

// Clean, modern styles
const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    height: TAB_CONFIG.barHeight,
    borderTopWidth: StyleSheet.hairlineWidth,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
      },
      android: {
        elevation: 8,
      },
    }),
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    alignItems: "center",
    paddingHorizontal: 8,
    gap: 8,
  },

  regularTab: {
    minWidth: 60,
  },

  tabButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    paddingHorizontal: TAB_CONFIG.tabPadding,
  },

  tabContent: {
    alignItems: "center",
    gap: 4,
  },

  iconContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    width: 36,
    height: 36,
  },

  activeCircle: {
    position: "absolute",
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
  },

  tabLabel: {
    fontSize: TAB_CONFIG.labelFontSize,
    textAlign: "center",
  },

  cameraWrapper: {
    marginLeft: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  cameraTab: {
    width: TAB_CONFIG.cameraSize,
    height: TAB_CONFIG.cameraSize,
    borderRadius: TAB_CONFIG.cameraBorderRadius,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "black",
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
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
