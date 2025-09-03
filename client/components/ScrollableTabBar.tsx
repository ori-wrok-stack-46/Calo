import React, {
  useRef,
  useEffect,
  useMemo,
  useCallback,
  useState,
} from "react";
import { ViewStyle, TextStyle, AppState, AppStateStatus } from "react-native";
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
import * as Haptics from "expo-haptics";
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
  withSequence,
  withDelay,
  interpolateColor,
  interpolate,
  runOnJS,
  Easing,
} from "react-native-reanimated";
import { useLanguage } from "../src/i18n/context/LanguageContext";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/src/context/ThemeContext";

const SCREEN_WIDTH = Dimensions.get("window").width;

// Enhanced design constants
const TAB_CONFIG = {
  labelFontSize: 9,
  iconSize: 23,
  cameraIconSize: 30,
  tabHeight: 68,
  cameraSize: 58,
  barHeight: 68,
  spacing: 2,
  tabPadding: 14,
  borderRadius: 34,
  cameraBorderRadius: 29,
  floatingMargin: 16,
  floatingBorderRadius: 22,
  indicatorHeight: 3,
  blurRadius: 25,
} as const;

// Advanced animation configs
const SPRING_CONFIG = {
  damping: 18,
  stiffness: 320,
  mass: 0.8,
} as const;

const MICRO_SPRING = {
  damping: 35,
  stiffness: 600,
  mass: 0.5,
} as const;

// Enhanced haptic feedback
const triggerHaptic = () => {
  if (Platform.OS === "ios") {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
};

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

// Premium camera tab with advanced animations
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
    const rotation = useSharedValue(0);
    const glowOpacity = useSharedValue(0);
    const { colors } = useTheme();

    useEffect(() => {
      scale.value = withSpring(isFocused ? 1.12 : 1, SPRING_CONFIG);
      shadowOpacity.value = withTiming(isFocused ? 1 : 0.6, { duration: 300 });
      glowOpacity.value = withTiming(isFocused ? 1 : 0, { duration: 400 });

      if (isFocused) {
        rotation.value = withSequence(
          withTiming(5, { duration: 200, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 300, easing: Easing.out(Easing.quad) })
        );
      }
    }, [isFocused]);

    const handlePress = () => {
      runOnJS(triggerHaptic)();
      scale.value = withSequence(
        withTiming(0.85, { duration: 120, easing: Easing.out(Easing.quad) }),
        withSpring(isFocused ? 1.12 : 1, MICRO_SPRING)
      );
      rotation.value = withSequence(
        withTiming(-10, { duration: 100 }),
        withTiming(0, { duration: 200 })
      );
      setTimeout(onPress, 140);
    };

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }, { rotate: `${rotation.value}deg` }],
    }));

    const shadowStyle = useAnimatedStyle(() => ({
      shadowOpacity: shadowOpacity.value * 0.5,
      elevation: shadowOpacity.value * 15,
    }));

    const glowStyle = useAnimatedStyle(() => ({
      opacity: glowOpacity.value * 0.8,
    }));

    return (
      <View style={styles.cameraContainer}>
        {/* Outer glow effect */}
        <Animated.View
          style={[
            styles.cameraGlow,
            {
              backgroundColor: colors.primary + "30",
            },
            glowStyle,
          ]}
        />

        <Animated.View style={[animatedStyle, shadowStyle]}>
          <LinearGradient
            colors={
              isFocused
                ? [colors.primary, colors.primary + "E6", colors.primary + "CC"]
                : [
                    colors.surface + "F0",
                    colors.surface + "E0",
                    colors.surface + "D0",
                  ]
            }
            style={[
              styles.cameraTab,
              {
                shadowColor: colors.primary,
              },
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <TouchableOpacity
              onPress={handlePress}
              onLongPress={onLongPress}
              style={styles.cameraButton}
              activeOpacity={0.85}
            >
              <Camera
                size={TAB_CONFIG.cameraIconSize}
                color="#f5f5f5"
                strokeWidth={2.8}
              />

              {/* Inner highlight */}
              <View
                style={[
                  styles.cameraHighlight,
                  {
                    backgroundColor: isFocused
                      ? colors.background + "30"
                      : "transparent",
                  },
                ]}
              />
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      </View>
    );
  }
);

CameraTab.displayName = "CameraTab";

// Premium regular tab with micro-interactions
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
    const backgroundOpacity = useSharedValue(isFocused ? 1 : 0);
    const iconScale = useSharedValue(1);
    const labelOpacity = useSharedValue(isFocused ? 1 : 0);
    const indicatorWidth = useSharedValue(isFocused ? 24 : 0);
    const translateY = useSharedValue(0);

    const IconComponent = getIconComponent(route.name);
    const label = getTabLabel(route.name, t);

    useEffect(() => {
      scale.value = withSpring(isFocused ? 1.08 : 1, SPRING_CONFIG);
      backgroundOpacity.value = withSpring(isFocused ? 1 : 0, SPRING_CONFIG);
      labelOpacity.value = withTiming(isFocused ? 1 : 0, {
        duration: isFocused ? 300 : 200,
        easing: Easing.out(Easing.quad),
      });
      indicatorWidth.value = withSpring(isFocused ? 24 : 0, SPRING_CONFIG);

      if (isFocused) {
        iconScale.value = withSequence(
          withSpring(1.25, { damping: 20, stiffness: 500 }),
          withSpring(1.15, SPRING_CONFIG)
        );
        translateY.value = withSequence(
          withTiming(-2, { duration: 150 }),
          withSpring(0, SPRING_CONFIG)
        );
      } else {
        iconScale.value = withSpring(1, SPRING_CONFIG);
        translateY.value = withSpring(0, SPRING_CONFIG);
      }
    }, [isFocused]);

    const handlePress = () => {
      runOnJS(triggerHaptic)();
      scale.value = withSequence(
        withTiming(0.92, { duration: 100, easing: Easing.out(Easing.quad) }),
        withSpring(isFocused ? 1.08 : 1, MICRO_SPRING)
      );
      iconScale.value = withSequence(
        withTiming(0.8, { duration: 100 }),
        withSpring(isFocused ? 1.15 : 1, MICRO_SPRING)
      );
      setTimeout(onPress, 120);
    };

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }, { translateY: translateY.value }],
    }));

    const backgroundStyle = useAnimatedStyle(() => ({
      opacity: backgroundOpacity.value,
    }));

    const iconAnimatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: iconScale.value }],
    }));

    const labelAnimatedStyle = useAnimatedStyle(() => ({
      opacity: labelOpacity.value,
      transform: [
        { translateY: interpolate(labelOpacity.value, [0, 1], [5, 0]) },
      ],
    }));

    const indicatorStyle = useAnimatedStyle(() => ({
      width: indicatorWidth.value,
      opacity: interpolate(indicatorWidth.value, [0, 24], [0, 1]),
    }));

    return (
      <Animated.View style={[styles.regularTab, animatedStyle]}>
        <TouchableOpacity
          onPress={handlePress}
          onLongPress={onLongPress}
          style={styles.tabButton}
          activeOpacity={0.75}
        >
          <View style={styles.tabContent}>
            {/* Active indicator line */}
            <Animated.View
              style={[
                styles.activeIndicator,
                {
                  backgroundColor: colors.primary,
                },
                indicatorStyle,
              ]}
            />

            <View style={styles.iconContainer}>
              {/* Enhanced active background */}
              <Animated.View style={[styles.activeBackground, backgroundStyle]}>
                <LinearGradient
                  colors={[
                    colors.primary + "25",
                    colors.primary + "20",
                    colors.primary + "15",
                  ]}
                  style={styles.activeGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
              </Animated.View>

              {/* Icon with enhanced animations - smoke white color */}
              <Animated.View style={iconAnimatedStyle}>
                <IconComponent
                  size={TAB_CONFIG.iconSize}
                  color={isFocused ? "#14b8a6" : "#f5f5f5"}
                  strokeWidth={isFocused ? 2.8 : 2.2}
                />
              </Animated.View>

              {/* Subtle pulse effect for active tab */}
              {isFocused && (
                <Animated.View
                  style={[
                    styles.pulseEffect,
                    {
                      borderColor: colors.primary + "40",
                    },
                  ]}
                />
              )}
            </View>

            {/* Enhanced label with better typography */}
            <Animated.View style={labelAnimatedStyle}>
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: "#f5f5f5",
                    fontWeight: "700",
                    letterSpacing: 0.2,
                  },
                ]}
                numberOfLines={1}
              >
                {label}
              </Text>
            </Animated.View>
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
  const scrollViewRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { isRTL } = useLanguage();
  const { t } = useTranslation();
  const [layoutKey, setLayoutKey] = useState(0);

  // Enhanced entrance animation
  const containerOpacity = useSharedValue(0);
  const containerTranslateY = useSharedValue(20);

  useEffect(() => {
    // Smooth entrance animation
    containerOpacity.value = withDelay(
      100,
      withTiming(1, { duration: 600, easing: Easing.out(Easing.quad) })
    );
    containerTranslateY.value = withDelay(
      100,
      withSpring(0, { damping: 25, stiffness: 300 })
    );
  }, []);

  // Handle app state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === "active") {
        setTimeout(() => {
          setLayoutKey((prev) => prev + 1);
        }, 100);
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );
    return () => subscription?.remove();
  }, []);

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

  // Enhanced navigation handlers
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
        if (Platform.OS === "ios") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
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

  const bottomPadding = Math.max(insets.bottom || 0, 12);

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
    transform: [{ translateY: containerTranslateY.value }],
  }));

  return (
    <Animated.View style={[styles.floatingContainer, containerAnimatedStyle]}>
      {/* Enhanced backdrop blur effect */}
      <View style={styles.backdrop} />

      <View
        style={[
          styles.container,
          {
            backgroundColor: "#012019",
          },
        ]}
        key={layoutKey}
      >
        {/* Premium glass morphism background */}
        <LinearGradient
          colors={[
            "rgba(255, 255, 255, 0.08)",
            "rgba(255, 255, 255, 0.04)",
            "rgba(255, 255, 255, 0.02)",
          ]}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        {/* Subtle inner border */}
        <View
          style={[
            styles.innerBorder,
          ]}
        />

        {/* Regular tabs */}
        <ScrollView
          ref={scrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          style={styles.scrollView}
          bounces={false}
          keyboardShouldPersistTaps="handled"
          decelerationRate="fast"
        >
          {regularTabs.map((route, index) => {
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

        {/* Enhanced Camera Tab */}
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

      {/* Bottom safe area */}
      <View style={{ height: bottomPadding }} />
    </Animated.View>
  );
}

// Premium floating styles with glassmorphism
const styles = StyleSheet.create({
  floatingContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: TAB_CONFIG.floatingMargin,
  },

  backdrop: {
    position: "absolute",
    top: -50,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "",
  },

  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    height: TAB_CONFIG.barHeight,
    borderRadius: TAB_CONFIG.floatingBorderRadius,
    borderWidth: 1,
    overflow: "hidden",
  },

  innerBorder: {
    position: "absolute",
    top: 1,
    left: 1,
    right: 1,
    bottom: 1,
    borderRadius: TAB_CONFIG.floatingBorderRadius - 1,
    pointerEvents: "none",
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    alignItems: "center",
    paddingHorizontal: 6,
    gap: 4,
  },

  regularTab: {
    minWidth: 52,
  },

  tabButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: TAB_CONFIG.tabPadding,
  },

  tabContent: {
    alignItems: "center",
    gap: 4,
  },

  activeIndicator: {
    height: TAB_CONFIG.indicatorHeight,
    borderRadius: TAB_CONFIG.indicatorHeight / 2,
    marginBottom: 2,
  },

  iconContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    width: 42,
    height: 42,
  },

  activeBackground: {
    position: "absolute",
    width: 42,
    height: 42,
    borderRadius: 21,
    overflow: "hidden",
  },

  activeGradient: {
    flex: 1,
    borderRadius: 21,
  },

  pulseEffect: {
    position: "absolute",
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    opacity: 0.6,
  },

  tabLabel: {
    fontSize: TAB_CONFIG.labelFontSize,
    textAlign: "center",
    marginTop: 1,
  },

  cameraContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },

  cameraGlow: {
    position: "absolute",
    width: TAB_CONFIG.cameraSize + 16,
    height: TAB_CONFIG.cameraSize + 16,
    borderRadius: (TAB_CONFIG.cameraSize + 16) / 2,
    opacity: 0.6,
  },

  cameraWrapper: {
    marginLeft: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  cameraTab: {
    width: TAB_CONFIG.cameraSize,
    height: TAB_CONFIG.cameraSize,
    borderRadius: TAB_CONFIG.cameraBorderRadius,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.15)",
    ...Platform.select({
      ios: {
        shadowColor: "black",
        shadowOffset: { width: 0, height: 8 },
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
    }),
  },

  cameraButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    backgroundColor: "#064E3B"
  },

  cameraHighlight: {
    position: "absolute",
    top: 8,
    left: 8,
    right: 8,
    height: 12,
    borderRadius: 6,
    opacity: 0.8,
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
