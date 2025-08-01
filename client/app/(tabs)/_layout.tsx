import { Tabs } from "expo-router";
import React, { useCallback, useMemo } from "react";
import { Platform, View } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/src/i18n/context/LanguageContext";
import { router } from "expo-router";

import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { ScrollableTabBar } from "@/components/ScrollableTabBar";
import LanguageToolbar from "@/components/ToolBar";
import { useTheme } from "@/src/context/ThemeContext";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const routes = useMemo(
    () => [
      "index",
      "history",
      "camera",
      "statistics",
      "calendar",
      "devices",
      "recommended-menus",
      "ai-chat",
      "food-scanner",
      "profile",
    ],
    []
  );

  const handleSwipeLeft = useCallback(() => {
    router.push("/(tabs)/camera");
  }, []);

  const handleSwipeRight = useCallback(() => {
    router.push("/(tabs)/profile");
  }, []);

  // Calculate proper tab bar height including safe area
  const tabBarHeight =
    Platform.OS === "ios"
      ? 49 + insets.bottom // Standard iOS tab bar height + safe area
      : 60;

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={["top"]}
    >
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <LanguageToolbar />

        <Tabs
          screenOptions={{
            tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
            headerShown: false,
            tabBarStyle: {
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height:
                Platform.OS === "ios" ? 80 + insets.bottom : 90 + insets.bottom,
              backgroundColor: colors.background,
              borderTopWidth: 1,
              borderTopColor: colors.border || "#E5E5E5",
              paddingBottom: Math.max(insets.bottom, 20),
              paddingTop: 12,
              elevation: 10, // Android shadow
              shadowColor: "#000", // iOS shadow
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
            },
            tabBarLabelStyle: {
              fontSize: 11,
              fontWeight: "500",
              marginTop: 2,
              marginBottom: Platform.OS === "ios" ? 4 : 8,
            },
            tabBarIconStyle: {
              marginBottom: 2,
            },
            tabBarItemStyle: {
              paddingVertical: 8,
              height: 60, // Increased height for better spacing
            },
            ...(isRTL
              ? {
                  tabBarLabelStyle: { writingDirection: "rtl" },
                }
              : {}),
          }}
          tabBar={(props) => (
            <SafeAreaView
              edges={["bottom"]}
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                backgroundColor: colors.background,
                borderTopWidth: 1,
                borderTopColor: colors.border || "#E5E5E5",
                elevation: 10,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: -2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                minHeight: 80, // Ensure minimum height
              }}
            >
              <ScrollableTabBar {...props} />
            </SafeAreaView>
          )}
        >
          <Tabs.Screen
            name="index"
            options={{
              title: t("tabs.home"),
              tabBarIcon: ({ color }) => (
                <IconSymbol size={28} name="house.fill" color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="history"
            options={{
              title: t("tabs.history"),
              tabBarIcon: ({ color }) => (
                <IconSymbol size={28} name="clock.fill" color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="camera"
            options={{
              title: t("tabs.camera"),
              tabBarIcon: ({ color }) => (
                <IconSymbol size={28} name="camera.fill" color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="statistics"
            options={{
              title: t("tabs.statistics"),
              tabBarIcon: ({ color }) => (
                <IconSymbol size={28} name="chart.bar.fill" color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="calendar"
            options={{
              title: t("tabs.calendar"),
              tabBarIcon: ({ color }) => (
                <IconSymbol size={28} name="calendar" color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="devices"
            options={{
              title: t("tabs.devices"),
              tabBarIcon: ({ color }) => (
                <IconSymbol size={28} name="watch.digital" color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="recommended-menus"
            options={{
              title: t("tabs.recommended_menus"),
              tabBarIcon: ({ color }) => (
                <IconSymbol size={28} name="dining" color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="ai-chat"
            options={{
              title: t("tabs.ai_chat"),
              tabBarIcon: ({ color }) => (
                <IconSymbol size={28} name="message.fill" color={color} />
              ),
            }}
          />

          <Tabs.Screen
            name="food-scanner"
            options={{
              title: t("tabs.food_scanner"),
              tabBarIcon: ({ color }) => (
                <IconSymbol size={28} name="barcode.viewfinder" color={color} />
              ),
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              title: t("tabs.profile"),
              tabBarIcon: ({ color }) => (
                <IconSymbol size={28} name="person.fill" color={color} />
              ),
            }}
          />
        </Tabs>
      </View>
    </SafeAreaView>
  );
}
