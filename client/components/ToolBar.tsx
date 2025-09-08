import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  Dimensions,
  Platform,
  Pressable,
} from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Settings,
  Globe,
  Sun,
  Moon,
  CircleHelp as HelpCircle,
  X,
  Sparkles,
} from "lucide-react-native";
import { useTheme } from "../src/context/ThemeContext";
import { useLanguage } from "@/src/i18n/context/LanguageContext";
import { ToastService } from "@/src/services/totastService";

interface HelpContent {
  title: string;
  description: string;
  quickTips?: string[];
  additionalSupport?: string;
}

interface ToolBarProps {
  helpContent?: HelpContent;
  onLanguageChange?: (language: string) => void;
  onThemeChange?: (isDark: boolean) => void;
}

const SPRING_CONFIG = {
  damping: 15,
  stiffness: 200,
  mass: 0.8,
};

const TIMING_CONFIG = {
  duration: 300,
};

const ToolBar: React.FC<ToolBarProps> = ({
  helpContent,
  onLanguageChange,
  onThemeChange,
}) => {
  const { language, changeLanguage, isRTL } = useLanguage();
  const { isDark, toggleTheme, colors } = useTheme();
  const [showHelp, setShowHelp] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const insets = useSafeAreaInsets();

  // Animation values
  const fabScale = useSharedValue(1);
  const fabRotation = useSharedValue(0);
  const menuOpacity = useSharedValue(0);
  const backdropOpacity = useSharedValue(0);
  const pulseScale = useSharedValue(1);

  // Button positions for radial menu
  const button1Position = useSharedValue({ x: 0, y: 0 });
  const button2Position = useSharedValue({ x: 0, y: 0 });
  const button3Position = useSharedValue({ x: 0, y: 0 });

  // Button scales for staggered animation
  const button1Scale = useSharedValue(0);
  const button2Scale = useSharedValue(0);
  const button3Scale = useSharedValue(0);

  const handleToggleMenu = useCallback(() => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);

    const expandDirection = isRTL ? 1 : -1;

    // Add haptic feedback
    fabScale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withSpring(1, SPRING_CONFIG)
    );

    if (newExpanded) {
      // Opening animation
      fabRotation.value = withSpring(45, SPRING_CONFIG);
      menuOpacity.value = withTiming(1, TIMING_CONFIG);
      backdropOpacity.value = withTiming(0.4, TIMING_CONFIG);

      // Staggered button animations
      // Perfect quarter circle animation for buttons
      const radius = 80; // Adjust this to change the size of the arc

      // Calculate positions for a perfect quarter circle
      // Angles: 15°, 45°, 75° (or adjust as needed)
      const angle1 = (15 * Math.PI) / 180; // 15 degrees in radians
      const angle2 = (45 * Math.PI) / 180; // 45 degrees in radians
      const angle3 = (75 * Math.PI) / 180; // 75 degrees in radians

      // For right expansion (expandDirection = 1)
      // For left expansion (expandDirection = -1), we flip the x coordinates
      button1Position.value = withSpring(
        {
          x: expandDirection * radius * Math.cos(angle1),
          y: -radius * Math.sin(angle1),
        },
        SPRING_CONFIG
      );
      button1Scale.value = withDelay(50, withSpring(1, SPRING_CONFIG));

      button2Position.value = withSpring(
        {
          x: expandDirection * radius * Math.cos(angle2),
          y: -radius * Math.sin(angle2),
        },
        SPRING_CONFIG
      );
      button2Scale.value = withDelay(100, withSpring(1, SPRING_CONFIG));

      button3Position.value = withSpring(
        {
          x: expandDirection * radius * Math.cos(angle3),
          y: -radius * Math.sin(angle3),
        },
        SPRING_CONFIG
      );
      button3Scale.value = withDelay(150, withSpring(1, SPRING_CONFIG));
      button3Scale.value = withDelay(150, withSpring(1, SPRING_CONFIG));
    } else {
      // Closing animation
      fabRotation.value = withSpring(0, SPRING_CONFIG);
      menuOpacity.value = withTiming(0, { duration: 200 });
      backdropOpacity.value = withTiming(0, { duration: 200 });

      // Reset button scales first, then positions
      button1Scale.value = withTiming(0, { duration: 150 });
      button2Scale.value = withTiming(0, { duration: 150 });
      button3Scale.value = withTiming(0, { duration: 150 });

      button1Position.value = withDelay(
        100,
        withSpring({ x: 0, y: 0 }, SPRING_CONFIG)
      );
      button2Position.value = withDelay(
        100,
        withSpring({ x: 0, y: 0 }, SPRING_CONFIG)
      );
      button3Position.value = withDelay(
        100,
        withSpring({ x: 0, y: 0 }, SPRING_CONFIG)
      );
    }
  }, [
    isExpanded,
    isRTL,
    fabRotation,
    fabScale,
    menuOpacity,
    backdropOpacity,
    button1Position,
    button2Position,
    button3Position,
    button1Scale,
    button2Scale,
    button3Scale,
  ]);

  const handleLanguageToggle = useCallback(async () => {
    console.log("Language button pressed!");
    const newLanguage = language === "he" ? "en" : "he";
    try {
      await changeLanguage(newLanguage);
      onLanguageChange?.(newLanguage);
      handleToggleMenu();

      // Show feedback
      ToastService.success(
        "Language Changed",
        `Switched to ${newLanguage === "he" ? "Hebrew" : "English"}`
      );
    } catch (error) {
      console.error("Error changing language:", error);
      ToastService.error("Error", "Failed to change language");
    }
  }, [language, changeLanguage, handleToggleMenu, onLanguageChange]);

  const handleThemeToggle = useCallback(() => {
    console.log("Theme button pressed!");
    try {
      toggleTheme();
      onThemeChange?.(!isDark);
      handleToggleMenu();

      // Add a pulse animation for feedback
      pulseScale.value = withSequence(
        withTiming(1.1, { duration: 150 }),
        withTiming(1, { duration: 150 })
      );

      // Show feedback
      ToastService.success(
        "Theme Changed",
        `Switched to ${!isDark ? "dark" : "light"} theme`
      );
    } catch (error) {
      console.error("Error toggling theme:", error);
      ToastService.error("Error", "Failed to change theme");
    }
  }, [toggleTheme, handleToggleMenu, onThemeChange, isDark, pulseScale]);

  const handleHelpPress = useCallback(() => {
    console.log("Help button pressed!");
    setShowHelp(true);
    handleToggleMenu();
  }, [handleToggleMenu]);

  const handleCloseHelp = useCallback(() => {
    setShowHelp(false);
  }, []);

  // Animated styles
  const fabStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: fabScale.value * pulseScale.value },
      { rotate: `${fabRotation.value}deg` },
    ],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const menuContainerStyle = useAnimatedStyle(() => ({
    opacity: menuOpacity.value,
  }));

  const button1Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: button1Position.value.x },
      { translateY: button1Position.value.y },
      { scale: button1Scale.value },
    ],
  }));

  const button2Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: button2Position.value.x },
      { translateY: button2Position.value.y },
      { scale: button2Scale.value },
    ],
  }));

  const button3Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: button3Position.value.x },
      { translateY: button3Position.value.y },
      { scale: button3Scale.value },
    ],
  }));

  const toolbarPosition = useMemo(
    () => ({
      bottom: insets.bottom + 100,
      [isRTL ? "left" : "right"]: 24,
    }),
    [insets.bottom, isRTL]
  );

  return (
    <>
      {/* Backdrop */}
      {isExpanded && (
        <Animated.View
          style={[styles.backdrop, backdropStyle]}
          pointerEvents="auto"
        >
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={handleToggleMenu}
          />
        </Animated.View>
      )}

      {/* Main Container */}
      <View style={[styles.container, toolbarPosition]}>
        {/* Menu Items */}
        <Animated.View style={[styles.menuContainer, menuContainerStyle]}>
          {/* Language Button */}
          <Animated.View style={[styles.menuButton, button1Style]}>
            <TouchableOpacity
              style={[
                styles.buttonTouchable,
                { backgroundColor: colors.primary },
              ]}
              onPress={handleLanguageToggle}
              activeOpacity={0.8}
            >
              <View style={styles.buttonContent}>
                <Globe size={20} color={colors.onPrimary} strokeWidth={2.5} />
                <Text style={[styles.buttonLabel, { color: colors.onPrimary }]}>
                  {language === "he" ? "EN" : "עב"}
                </Text>
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* Theme Button */}
          <Animated.View style={[styles.menuButton, button2Style]}>
            <TouchableOpacity
              style={[
                styles.buttonTouchable,
                { backgroundColor: colors.primary },
              ]}
              onPress={handleThemeToggle}
              activeOpacity={0.8}
            >
              <View style={styles.buttonContent}>
                {isDark ? (
                  <Sun size={20} color={colors.onPrimary} strokeWidth={2.5} />
                ) : (
                  <Moon size={20} color={colors.onPrimary} strokeWidth={2.5} />
                )}
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* Help Button */}
          {helpContent && (
            <Animated.View style={[styles.menuButton, button3Style]}>
              <TouchableOpacity
                style={[
                  styles.buttonTouchable,
                  { backgroundColor: colors.primary },
                ]}
                onPress={handleHelpPress}
                activeOpacity={0.8}
              >
                <View style={styles.buttonContent}>
                  <HelpCircle
                    size={20}
                    color={colors.onPrimary}
                    strokeWidth={2.5}
                  />
                </View>
              </TouchableOpacity>
            </Animated.View>
          )}
        </Animated.View>

        {/* Main FAB */}
        <Animated.View style={fabStyle}>
          <TouchableOpacity
            style={styles.fab}
            onPress={handleToggleMenu}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={[colors.primary, colors.primary]}
              style={styles.fabGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {isExpanded ? (
                <X size={24} color={colors.onPrimary} strokeWidth={3} />
              ) : (
                <Settings size={24} color={colors.onPrimary} strokeWidth={3} />
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Help Modal */}
      <Modal
        visible={showHelp}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseHelp}
        statusBarTranslucent={true}
        presentationStyle="overFullScreen"
      >
        <View
          style={[
            styles.modalOverlay,
            { backgroundColor: colors.shadow + "80" },
          ]}
        >
          <Pressable
            style={StyleSheet.absoluteFillObject}
            onPress={handleCloseHelp}
          />

          <View style={styles.modalContainer}>
            <BlurView
              intensity={Platform.OS === "ios" ? 100 : 50}
              tint={isDark ? "dark" : "light"}
              style={[
                styles.modalContent,
                {
                  backgroundColor:
                    Platform.OS === "ios"
                      ? colors.surface + "00"
                      : colors.surface + "F0",
                  shadowColor: colors.shadow,
                  borderColor: colors.outline + "20",
                },
              ]}
            >
              {/* Header */}
              <View
                style={[
                  styles.modalHeader,
                  { borderBottomColor: colors.outline + "30" },
                ]}
              >
                <View style={styles.modalTitleContainer}>
                  <View
                    style={[
                      styles.iconContainer,
                      { backgroundColor: colors.primaryContainer },
                    ]}
                  >
                    <Sparkles size={20} color={colors.primary} />
                  </View>
                  <Text
                    style={[styles.modalTitle, { color: colors.onSurface }]}
                  >
                    {helpContent?.title ||
                      (language === "he" ? "עזרה" : "Help")}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={handleCloseHelp}
                  style={[
                    styles.closeButton,
                    { backgroundColor: colors.surfaceVariant },
                  ]}
                  activeOpacity={0.7}
                >
                  <X size={20} color={colors.onSurfaceVariant} />
                </TouchableOpacity>
              </View>

              {/* Content */}
              <ScrollView
                style={styles.modalBody}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
              >
                <View style={styles.modalBodyContent}>
                  {helpContent ? (
                    <View>
                      <Text
                        style={[styles.modalText, { color: colors.onSurface }]}
                      >
                        {helpContent.description}
                      </Text>

                      {helpContent.quickTips && (
                        <View
                          style={[
                            styles.helpSection,
                            { borderTopColor: colors.outline + "30" },
                          ]}
                        >
                          <Text
                            style={[
                              styles.helpSectionTitle,
                              { color: colors.onSurface },
                            ]}
                          >
                            {language === "he"
                              ? "טיפים מהירים:"
                              : "Quick Tips:"}
                          </Text>
                          <View style={styles.tipsContainer}>
                            {helpContent.quickTips.map((tip, index) => (
                              <View key={index} style={styles.tipItem}>
                                <View
                                  style={[
                                    styles.tipBullet,
                                    { backgroundColor: colors.primary },
                                  ]}
                                />
                                <Text
                                  style={[
                                    styles.tipText,
                                    { color: colors.onSurfaceVariant },
                                  ]}
                                >
                                  {tip}
                                </Text>
                              </View>
                            ))}
                          </View>
                        </View>
                      )}

                      {helpContent.additionalSupport && (
                        <View
                          style={[
                            styles.helpSection,
                            { borderTopColor: colors.outline + "30" },
                          ]}
                        >
                          <Text
                            style={[
                              styles.helpSectionTitle,
                              { color: colors.onSurface },
                            ]}
                          >
                            {language === "he"
                              ? "תמיכה נוספת:"
                              : "Additional Support:"}
                          </Text>
                          <Text
                            style={[
                              styles.helpSectionText,
                              { color: colors.onSurfaceVariant },
                            ]}
                          >
                            {helpContent.additionalSupport}
                          </Text>
                        </View>
                      )}
                    </View>
                  ) : (
                    <View style={styles.noHelpContent}>
                      <HelpCircle size={48} color={colors.outline} />
                      <Text
                        style={[
                          styles.modalText,
                          { color: colors.onSurface, textAlign: "center" },
                        ]}
                      >
                        {language === "he"
                          ? "תוכן העזרה נטען..."
                          : "Help content is loading..."}
                      </Text>
                    </View>
                  )}
                </View>
              </ScrollView>
            </BlurView>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 998,
  },
  container: {
    position: "absolute",
    zIndex: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  menuContainer: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  menuButton: {
    position: "absolute",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonTouchable: {
    width: 56,
    height: 56,
    borderRadius: 28,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  buttonLabel: {
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
    textAlign: "center",
    marginTop: 2,
  },
  fab: {
    width: 64,
    height: 64,
    borderRadius: 32,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  fabGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 32,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    width: "100%",
    maxWidth: 420,
    maxHeight: "90%",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10000,
  },
  modalContent: {
    width: "100%",
    borderRadius: 24,
    overflow: "hidden",
    maxHeight: "100%",
    minHeight: 300,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    minHeight: 64,
  },
  modalTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    flex: 1,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  modalBody: {
    maxHeight: 450,
    minHeight: 200,
  },
  scrollContent: {
    flexGrow: 1,
  },
  modalBodyContent: {
    padding: 24,
  },
  modalText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
  },
  helpSection: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
  },
  helpSectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },
  helpSectionText: {
    fontSize: 15,
    lineHeight: 22,
  },
  tipsContainer: {
    gap: 12,
  },
  tipItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  tipBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 8,
    flexShrink: 0,
  },
  tipText: {
    fontSize: 15,
    lineHeight: 22,
    flex: 1,
  },
  noHelpContent: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
});

export default ToolBar;
