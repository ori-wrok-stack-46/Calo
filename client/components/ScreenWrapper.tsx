import React from "react";
import { View, StyleSheet, ScrollView, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/src/context/ThemeContext";
import { useLanguage } from "@/src/i18n/context/LanguageContext";
import LoadingScreen from "./LoadingScreen";
import ErrorDisplay from "./ErrorDisplay";

interface ScreenWrapperProps {
  children: React.ReactNode;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  refreshing?: boolean;
  onRefresh?: () => void;
  scrollable?: boolean;
  style?: any;
  contentStyle?: any;
  showsVerticalScrollIndicator?: boolean;
  keyboardShouldPersistTaps?: "always" | "never" | "handled";
}

const ScreenWrapper: React.FC<ScreenWrapperProps> = ({
  children,
  loading = false,
  error = null,
  onRetry,
  refreshing = false,
  onRefresh,
  scrollable = false,
  style,
  contentStyle,
  showsVerticalScrollIndicator = true,
  keyboardShouldPersistTaps = "handled",
}) => {
  const { colors } = useTheme();
  const { isRTL } = useLanguage();

  const containerStyle = [
    styles.container,
    { backgroundColor: colors.background },
    isRTL && styles.rtlContainer,
    style,
  ];

  const content = [
    styles.content,
    { backgroundColor: colors.background },
    contentStyle,
  ];

  if (loading) {
    return (
      <SafeAreaView style={containerStyle}>
        <LoadingScreen />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={containerStyle}>
        <ErrorDisplay message={error} onRetry={onRetry} variant="fullscreen" />
      </SafeAreaView>
    );
  }

  if (scrollable) {
    return (
      <SafeAreaView style={containerStyle}>
        <ScrollView
          style={content}
          showsVerticalScrollIndicator={showsVerticalScrollIndicator}
          keyboardShouldPersistTaps={keyboardShouldPersistTaps}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            ) : undefined
          }
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={containerStyle}>
      <View style={content}>{children}</View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  rtlContainer: {
    flexDirection: "row-reverse",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
});

export default ScreenWrapper;
