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

      {/* Help Modal - Fixed rendering and backdrop */}
      <Modal
        visible={showHelp}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseHelp}
        statusBarTranslucent={true}
        presentationStyle="overFullScreen"
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            onPress={handleCloseHelp}
            activeOpacity={1}
          />

          <View style={styles.modalContainer}>
            <BlurView
              intensity={Platform.OS === "ios" ? 100 : 50}
              tint={isDark ? "dark" : "light"}
              style={[
                styles.modalContent,
                {
                  backgroundColor:
                    (isDark ? colors.surface : colors.background) +
                    (Platform.OS === "ios" ? "00" : "F0"),
                  shadowColor: colors.shadow,
                  shadowOffset: { width: 0, height: 10 },
                  shadowOpacity: 0.3,
                  shadowRadius: 20,
                  elevation: 20,
                },
              ]}
            >
              {/* Header */}
              <View
                style={[
                  styles.modalHeader,
                  { borderBottomColor: isDark ? "#374151" : "#E5E7EB" },
                ]}
              >
                <View style={styles.modalTitleContainer}>
                  <HelpCircle size={24} color={colors.primary} />
                  <Text
                    style={[
                      styles.modalTitle,
                      { color: isDark ? "#F9FAFB" : "#111827" },
                    ]}
                  >
                    {helpContent?.title ||
                      (language === "he" ? "עזרה" : "Help")}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={handleCloseHelp}
                  style={[
                    styles.closeButton,
                    { backgroundColor: isDark ? "#374151" : "#F3F4F6" },
                  ]}
                >
                  <X size={20} color={isDark ? "#F9FAFB" : "#111827"} />
                </TouchableOpacity>
              </View>

              {/* Content */}
              <ScrollView
                style={styles.modalBody}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ flexGrow: 1 }}
              >
                <View style={styles.modalBodyContent}>
                  {helpContent ? (
                    <View>
                      <Text
                        style={[
                          styles.modalText,
                          { color: isDark ? "#E5E7EB" : "#374151" },
                        ]}
                      >
                        {helpContent.description}
                      </Text>

                      <View
                        style={[
                          styles.helpSection,
                          { borderTopColor: isDark ? "#374151" : "#E5E7EB" },
                        ]}
                      >
                        <Text
                          style={[
                            styles.helpSectionTitle,
                            { color: isDark ? "#F9FAFB" : "#111827" },
                          ]}
                        >
                          {language === "he" ? "טיפים מהירים:" : "Quick Tips:"}
                        </Text>
                        <Text
                          style={[
                            styles.helpSectionText,
                            { color: isDark ? "#D1D5DB" : "#4B5563" },
                          ]}
                        >
                          {language === "he"
                            ? "• השתמש במצלמה לסריקת ארוחות לניתוח תזונתי\n• עקוב אחר צריכת המים היומית לבריאות טובה יותר\n• השלם את השאלון להמלצות מותאמות אישית\n• בדוק את הסטטיסטיקות למעקב אחר ההתקדמות"
                            : "• Use the camera to scan meals for nutrition analysis\n• Track your water intake daily for better health\n• Complete your questionnaire for personalized recommendations\n• Check your statistics to monitor progress"}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.helpSection,
                          { borderTopColor: isDark ? "#374151" : "#E5E7EB" },
                        ]}
                      >
                        <Text
                          style={[
                            styles.helpSectionTitle,
                            { color: isDark ? "#F9FAFB" : "#111827" },
                          ]}
                        >
                          {language === "he"
                            ? "תמיכה נוספת:"
                            : "Additional Support:"}
                        </Text>
                        <Text
                          style={[
                            styles.helpSectionText,
                            { color: isDark ? "#D1D5DB" : "#4B5563" },
                          ]}
                        >
                          {language === "he"
                            ? "לעזרה נוספת, צור קשר עם הצוות שלנו או עיין במדריכי המשתמש המלאים."
                            : "For additional help, contact our support team or refer to the comprehensive user guides."}
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.noHelpContent}>
                      <HelpCircle size={48} color="#9CA3AF" />
                      <Text
                        style={[
                          styles.modalText,
                          {
                            color: isDark ? "#E5E7EB" : "#374151",
                            textAlign: "center",
                          },
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
  // Modal styles - fixed and enhanced
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
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
    borderColor: "rgba(255, 255, 255, 0.1)",
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
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    marginLeft: 12,
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
  noHelpContent: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
});

export default ToolBar;
