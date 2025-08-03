import React, { useRef, useEffect, useMemo, useCallback } from "react";
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

// Tab configuration based on your actual routes
const tabConfig = [
  { name: "index", title: "בית", icon: Home },
  { name: "history", title: "היסטוריה", icon: ClipboardList },
  { name: "camera", title: "מצלמה", icon: Camera, isSpecial: true },
  { name: "ai-chat", title: "צ'אט AI", icon: Bot },
  { name: "statistics", title: "התקדמות", icon: BarChart3 },
  { name: "calendar", title: "יעדים", icon: TrendingUp },
  { name: "devices", title: "מכשירים", icon: Watch },
  { name: "food-scanner", title: "סורק מזון", icon: Scan },
  { name: "recommended-menus", title: "תפריטים", icon: UtensilsCrossed },
  { name: "questionnaire", title: "שאלון", icon: ClipboardList },
  { name: "profile", title: "פרופיל", icon: User },
];

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
          styles.floatingCameraButton,
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
            styles.cameraButton,
            {
              opacity: isDisabled ? 0.4 : 1,
            },
          ]}
          activeOpacity={0.8}
          disabled={isDisabled}
        >
          <LinearGradient
            colors={isFocused ? ["#16A085", "#1ABC9C"] : ["#16A085", "#1ABC9C"]}
            style={styles.cameraGradient}
          >
            <Camera size={28} color="#FFFFFF" strokeWidth={2} />
          </LinearGradient>
        </TouchableOpacity>

        <Text
          style={[
            styles.cameraLabel,
            {
              color: isFocused ? "#16A085" : "#7F8C8D",
              fontWeight: isFocused ? "700" : "500",
            },
          ]}
          numberOfLines={1}
          allowFontScaling={false}
        >
          מצלמה
        </Text>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView edges={["bottom"]} style={styles.safeAreaWrapper}>
      <View style={styles.wrapper}>
        <View
          style={[
            styles.container,
            {
              paddingBottom: Platform.OS === "ios" ? 4 : 8, // Minimal padding for content
            },
          ]}
        >
          {/* Active tab indicator - positioned relative to scroll content with bounds checking */}
          <Animated.View
            style={[
              styles.indicator,
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
              styles.scrollViewContent,
              {
                width: tabCalculations.totalContentWidth,
                minWidth: SCREEN_WIDTH, // Ensure minimum width
              },
              !tabCalculations.shouldScroll && {
                flexGrow: 1,
                justifyContent: "space-around", // Distribute tabs evenly when not scrolling
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
            style={styles.scrollView}
          >
            {state.routes.map((route: any, index: number) => {
              const { options } = descriptors[route.key];
              const tabInfo = tabConfig.find((tab) => tab.name === route.name);

              const label =
                options.tabBarLabel !== undefined
                  ? options.tabBarLabel
                  : options.title !== undefined
                  ? options.title
                  : tabInfo?.title || route.name;

              const isFocused = state.index === index;
              const isDisabled = options.tabBarButton === null;
              const IconComponent =
                tabInfo?.icon ||
                iconMap[route.name as keyof typeof iconMap] ||
                Home;

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
              if (tabInfo?.isSpecial) {
                return (
                  <View
                    key={route.key}
                    style={[
                      styles.tabButton,
                      styles.cameraPlaceholder,
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
                    styles.tabButton,
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
                      styles.iconContainer,
                      {
                        transform: [
                          { scale: iconScales[index] },
                          { translateY: iconTranslateY[index] },
                        ],
                      },
                    ]}
                  >
                    <IconComponent
                      color={isFocused ? "#16A085" : "#7F8C8D"}
                      size={TAB_ICON_SIZE}
                      strokeWidth={isFocused ? 2.2 : 1.8}
                    />
                  </Animated.View>

                  <Animated.View
                    style={[
                      styles.labelContainer,
                      {
                        opacity: isFocused ? 1 : 0.7,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.label,
                        {
                          color: isFocused ? "#16A085" : "#7F8C8D",
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

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <ScrollableTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      {tabConfig.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
          }}
        />
      ))}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  safeAreaWrapper: {
    backgroundColor: "#ffffff",
    position: "relative",
    bottom: 0,
    left: 0,
    right: 0,
  },
  wrapper: {
    backgroundColor: "#ffffff",
  },
  container: {
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 12,
    paddingTop: 6, // Fixed the incomplete paddingTop
    paddingHorizontal: 0,
    minHeight: 60,
  },
  indicator: {
    position: "absolute",
    top: 0,
    height: 3,
    backgroundColor: "#16A085",
    borderRadius: 2,
    zIndex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 52,
    paddingHorizontal: 0,
  },
  tabButton: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 8,
    zIndex: 2,
    minHeight: 52,
  },
  cameraPlaceholder: {
    // Invisible placeholder to maintain proper spacing
    opacity: 0,
  },
  iconContainer: {
    marginBottom: 4,
    justifyContent: "center",
    alignItems: "center",
    height: 28,
    width: 28,
  },
  labelContainer: {
    justifyContent: "center",
    alignItems: "center",
    minHeight: 16, // Increased label container height
  },
  label: {
    fontSize: TAB_LABEL_FONT_SIZE,
    textAlign: "center",
    letterSpacing: 0.2,
    fontFamily: "Rubik-Medium",
  },
  floatingCameraButton: {
    position: "absolute",
    top: -32, // Float higher above the tab bar
    left: 0, // Use transform for positioning instead
    width: CAMERA_BUTTON_SIZE,
    height: CAMERA_BUTTON_SIZE + 35, // Extra height for label
    justifyContent: "flex-start",
    alignItems: "center",
    zIndex: 10, // High z-index to ensure it's above everything
  },
  cameraButton: {
    width: CAMERA_BUTTON_SIZE,
    height: CAMERA_BUTTON_SIZE,
    borderRadius: CAMERA_BUTTON_SIZE / 2,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  cameraGradient: {
    width: CAMERA_BUTTON_SIZE,
    height: CAMERA_BUTTON_SIZE,
    borderRadius: CAMERA_BUTTON_SIZE / 2,
    justifyContent: "center",
    alignItems: "center",
    elevation: 12,
    shadowColor: "#16A085",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    // Add white border for better separation
    borderWidth: 4, // Increased border width
    borderColor: "#ffffff",
  },
  cameraLabel: {
    fontSize: TAB_LABEL_FONT_SIZE,
    textAlign: "center",
    letterSpacing: 0.2,
    fontFamily: "Rubik-Medium",
    marginTop: 2,
  },
});
