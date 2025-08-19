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
} from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Settings,
  Globe,
  Sun,
  Moon,
  CircleHelp as HelpCircle,
  X,
} from "lucide-react-native";
import { useLanguage } from "../src/i18n/context/LanguageContext";
import { useTheme } from "../src/context/ThemeContext";
import { Colors, EmeraldSpectrum } from "@/constants/Colors";

interface HelpContent {
  title: string;
  description: string;
}

interface ToolBarProps {
  helpContent?: HelpContent;
}

const { width: screenWidth } = Dimensions.get("window");
const AnimatedTouchableOpacity =
  Animated.createAnimatedComponent(TouchableOpacity);

const ToolBar: React.FC<ToolBarProps> = ({ helpContent }) => {
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

  // Button positions for radial menu
  const button1Position = useSharedValue({ x: 0, y: 0 });
  const button2Position = useSharedValue({ x: 0, y: 0 });
  const button3Position = useSharedValue({ x: 0, y: 0 });

  const handleToggleMenu = useCallback(() => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);

    const expandDirection = isRTL ? 1 : -1;

    if (newExpanded) {
      fabRotation.value = withSpring(45, { damping: 15, stiffness: 200 });
      menuOpacity.value = withTiming(1, { duration: 300 });
      backdropOpacity.value = withTiming(0.3, { duration: 300 });

      button1Position.value = withSpring(
        { x: 80 * expandDirection, y: -10 },
        { damping: 12, stiffness: 180 }
      );
      button2Position.value = withSpring(
        { x: 65 * expandDirection, y: -55 },
        { damping: 12, stiffness: 180 }
      );
      button3Position.value = withSpring(
        { x: 35 * expandDirection, y: -85 },
        { damping: 12, stiffness: 180 }
      );
    } else {
      fabRotation.value = withSpring(0, { damping: 15, stiffness: 200 });
      menuOpacity.value = withTiming(0, { duration: 200 });
      backdropOpacity.value = withTiming(0, { duration: 200 });

      button1Position.value = withSpring(
        { x: 0, y: 0 },
        { damping: 15, stiffness: 150 }
      );
      button2Position.value = withSpring(
        { x: 0, y: 0 },
        { damping: 15, stiffness: 150 }
      );
      button3Position.value = withSpring(
        { x: 0, y: 0 },
        { damping: 15, stiffness: 150 }
      );
    }
  }, [
    isExpanded,
    isRTL,
    fabRotation,
    menuOpacity,
    backdropOpacity,
    button1Position,
    button2Position,
    button3Position,
  ]);

  const handleLanguageToggle = useCallback(async () => {
    const newLanguage = language === "he" ? "en" : "he";
    try {
      await changeLanguage(newLanguage);
      handleToggleMenu();
    } catch (error) {
      console.error("Error changing language:", error);
    }
  }, [language, changeLanguage, handleToggleMenu]);

  const handleThemeToggle = useCallback(() => {
    try {
      toggleTheme();
      handleToggleMenu();
    } catch (error) {
      console.error("Error toggling theme:", error);
    }
  }, [toggleTheme, handleToggleMenu]);

  const handleHelpPress = useCallback(() => {
    setShowHelp(true);
    handleToggleMenu();
  }, [handleToggleMenu]);

  const handleCloseHelp = useCallback(() => {
    setShowHelp(false);
  }, []);

  // Animated styles
  const fabStyle = useAnimatedStyle(
    () => ({
      transform: [
        { scale: fabScale.value },
        { rotate: `${fabRotation.value}deg` },
      ],
    }),
    []
  );

  const backdropStyle = useAnimatedStyle(
    () => ({
      opacity: backdropOpacity.value,
    }),
    []
  );

  const menuContainerStyle = useAnimatedStyle(
    () => ({
      opacity: menuOpacity.value,
    }),
    []
  );

  const button1Style = useAnimatedStyle(
    () => ({
      transform: [
        { translateX: button1Position.value.x },
        { translateY: button1Position.value.y },
        { scale: interpolate(menuOpacity.value, [0, 1], [0.3, 1]) },
      ],
    }),
    []
  );

  const button2Style = useAnimatedStyle(
    () => ({
      transform: [
        { translateX: button2Position.value.x },
        { translateY: button2Position.value.y },
        { scale: interpolate(menuOpacity.value, [0, 1], [0.3, 1]) },
      ],
    }),
    []
  );

  const button3Style = useAnimatedStyle(
    () => ({
      transform: [
        { translateX: button3Position.value.x },
        { translateY: button3Position.value.y },
        { scale: interpolate(menuOpacity.value, [0, 1], [0.3, 1]) },
      ],
    }),
    []
  );

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
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            onPress={handleToggleMenu}
            activeOpacity={1}
          />
        </Animated.View>
      )}

      {/* Main Container */}
      <View style={[styles.container, toolbarPosition]}>
        {/* Menu Items */}
        <Animated.View style={[styles.menuContainer, menuContainerStyle]}>
          {/* Language Button */}
          <AnimatedTouchableOpacity
            style={[styles.menuButton, button1Style]}
            onPress={handleLanguageToggle}
            activeOpacity={0.8}
          >
            <View style={styles.buttonContent}>
              <Globe size={18} color="#FFFFFF" strokeWidth={2.5} />
              <Text style={styles.buttonLabel}>
                {language === "he" ? "EN" : "עב"}
              </Text>
            </View>
          </AnimatedTouchableOpacity>

          {/* Theme Button */}
          <AnimatedTouchableOpacity
            style={[styles.menuButton, button2Style]}
            onPress={handleThemeToggle}
            activeOpacity={0.8}
          >
            <View style={styles.buttonContent}>
              {isDark ? (
                <Sun size={18} color="#FFFFFF" strokeWidth={2.5} />
              ) : (
                <Moon size={18} color="#FFFFFF" strokeWidth={2.5} />
              )}
            </View>
          </AnimatedTouchableOpacity>

          {/* Help Button */}
          {helpContent && (
            <AnimatedTouchableOpacity
              style={[styles.menuButton, button3Style]}
              onPress={handleHelpPress}
              activeOpacity={0.8}
            >
              <View style={styles.buttonContent}>
                <HelpCircle size={18} color="#FFFFFF" strokeWidth={2.5} />
              </View>
            </AnimatedTouchableOpacity>
          )}
        </Animated.View>

        {/* Main FAB */}
        <AnimatedTouchableOpacity
          style={[styles.fab, fabStyle]}
          onPress={handleToggleMenu}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={[colors.primary, `${colors.primary}E6`]}
            style={styles.fabGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {isExpanded ? (
              <X size={24} color="#FFFFFF" strokeWidth={3} />
            ) : (
              <Settings size={24} color="#FFFFFF" strokeWidth={3} />
            )}
          </LinearGradient>
        </AnimatedTouchableOpacity>
      </View>

      {/* Help Modal - Completely rebuilt */}
      <Modal
        visible={showHelp}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseHelp}
        statusBarTranslucent={false}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            onPress={handleCloseHelp}
            activeOpacity={1}
          />

          <View style={styles.modalContainer}>
            <View
              style={[
                styles.modalContent,
                { backgroundColor: colors.background },
              ]}
            >
              {/* Header */}
              <View
                style={[
                  styles.modalHeader,
                  { borderBottomColor: colors.border },
                ]}
              >
                <View style={styles.modalTitleContainer}>
                  <HelpCircle size={24} color={colors.primary} />
                  <Text style={[styles.modalTitle, { color: colors.text }]}>
                    {helpContent?.title || "Help"}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={handleCloseHelp}
                  style={styles.closeButton}
                >
                  <X size={20} color={colors.text} />
                </TouchableOpacity>
              </View>

              {/* Content */}
              <ScrollView
                style={styles.modalBody}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.modalBodyContent}>
                  {helpContent ? (
                    <View>
                      <Text style={[styles.modalText, { color: colors.text }]}>
                        {helpContent.description}
                      </Text>

                      <View
                        style={[
                          styles.helpSection,
                          { borderTopColor: colors.border },
                        ]}
                      >
                        <Text
                          style={[
                            styles.helpSectionTitle,
                            { color: colors.text },
                          ]}
                        >
                          Quick Tips:
                        </Text>
                        <Text
                          style={[
                            styles.helpSectionText,
                            { color: colors.text },
                          ]}
                        >
                          • Use the camera to scan meals for nutrition analysis
                          {"\n"}• Track your water intake daily for better
                          health{"\n"}• Complete your questionnaire for
                          personalized recommendations{"\n"}• Check your
                          statistics to monitor progress
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.noHelpContent}>
                      <Text style={[styles.modalText, { color: colors.text }]}>
                        Help content is loading...
                      </Text>
                    </View>
                  )}
                </View>
              </ScrollView>
            </View>
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
    backgroundColor: "rgba(0, 0, 0, 0.2)",
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
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: EmeraldSpectrum.emerald500,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
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
    color: "#FFFFFF",
    marginTop: 2,
  },
  fab: {
    width: 64,
    height: 64,
    borderRadius: 32,
    shadowColor: "#000",
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
  // Modal styles - completely rebuilt
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    width: "100%",
    maxWidth: 400,
    maxHeight: "80%",
  },
  modalContent: {
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginLeft: 12,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.05)",
  },
  modalBody: {
    maxHeight: 400,
  },
  modalBodyContent: {
    padding: 20,
  },
  modalText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  helpSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
  },
  helpSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  helpSectionText: {
    fontSize: 14,
    lineHeight: 20,
  },
  noHelpContent: {
    padding: 20,
    alignItems: "center",
  },
});

export default ToolBar;
