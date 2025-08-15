import { Tabs } from "expo-router";
import React, { useMemo } from "react";
import { View, Platform, I18nManager } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/src/i18n/context/LanguageContext";
import { ProtectedRoute } from "@/components/ProtectedRoutes";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useColorScheme } from "@/hooks/useColorScheme";
import { ScrollableTabBar } from "@/components/ScrollableTabBar";
import { useTheme } from "@/src/context/ThemeContext";

// Enable RTL support
I18nManager.allowRTL(true);

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const { colors } = useTheme();

  return (
    <ProtectedRoute>
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: colors.background,
        }}
        edges={["top"]}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: colors.background,
          }}
        >
          <Tabs
            screenOptions={{
              headerShown: false,
              tabBarHideOnKeyboard: true,
            }}
            tabBar={(props) => <ScrollableTabBar {...props} />}
          >
            <Tabs.Screen
              name="index"
              options={{
                title: t("tabs.home"),
                tabBarIcon: ({ color }) => (
                  <IconSymbol size={24} name="house.fill" color={color} />
                ),
              }}
            />
            <Tabs.Screen
              name="history"
              options={{
                title: t("tabs.history"),
                tabBarIcon: ({ color }) => (
                  <IconSymbol size={24} name="clock.fill" color={color} />
                ),
              }}
            />
            <Tabs.Screen
              name="recommended-menus"
              options={{
                title: t("tabs.recommended_menus"),
                tabBarIcon: ({ color }) => (
                  <IconSymbol size={24} name="dining" color={color} />
                ),
              }}
            />
            <Tabs.Screen
              name="camera"
              options={{
                title: t("tabs.camera"),
                tabBarIcon: ({ color }) => (
                  <IconSymbol size={24} name="camera.fill" color={color} />
                ),
              }}
            />
            <Tabs.Screen
              name="food-scanner"
              options={{
                title: t("tabs.food_scanner"),
                tabBarIcon: ({ color }) => (
                  <IconSymbol
                    size={24}
                    name="barcode.viewfinder"
                    color={color}
                  />
                ),
              }}
            />
            <Tabs.Screen
              name="calendar"
              options={{
                title: t("tabs.calendar"),
                tabBarIcon: ({ color }) => (
                  <IconSymbol size={24} name="calendar" color={color} />
                ),
              }}
            />
            <Tabs.Screen
              name="statistics"
              options={{
                title: t("tabs.statistics"),
                tabBarIcon: ({ color }) => (
                  <IconSymbol size={24} name="chart.bar.fill" color={color} />
                ),
              }}
            />
            <Tabs.Screen
              name="ai-chat"
              options={{
                title: t("tabs.ai_chat"),
                tabBarIcon: ({ color }) => (
                  <IconSymbol size={24} name="message.fill" color={color} />
                ),
              }}
            />
            <Tabs.Screen
              name="devices"
              options={{
                title: t("tabs.devices"),
                tabBarIcon: ({ color }) => (
                  <IconSymbol size={24} name="watch.digital" color={color} />
                ),
              }}
            />
            <Tabs.Screen
              name="questionnaire"
              options={{
                title: t("tabs.questionnaire"),
                tabBarIcon: ({ color }) => (
                  <IconSymbol size={24} name="doc.text.fill" color={color} />
                ),
              }}
            />
            <Tabs.Screen
              name="profile"
              options={{
                title: t("tabs.profile"),
                tabBarIcon: ({ color }) => (
                  <IconSymbol size={24} name="person.fill" color={color} />
                ),
              }}
            />
          </Tabs>
        </View>
      </SafeAreaView>
    </ProtectedRoute>
  );
}
