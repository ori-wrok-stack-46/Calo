import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Modal,
  StatusBar,
  Platform,
  Vibration,
  Text,
  SafeAreaView,
  PanResponder,
  Easing,
  ViewStyle,
  TextStyle,
} from "react-native";
import { MessageCircle, Minus, X, Sparkles, Bot } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/src/context/ThemeContext";
import { useLanguage } from "@/src/i18n/context/LanguageContext";
import { useTranslation } from "react-i18next";
import AIChatScreen from "../app/(tabs)/ai-chat";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
const BUTTON_SIZE = 64;
const EDGE_MARGIN = 20;
const PULSE_DURATION = 2000;

interface AIChatScreenProps {
  onClose?: () => void;
  onMinimize?: () => void;
}

const ANIMATIONS = {
  spring: {
    tension: 300,
    friction: 20,
    useNativeDriver: true,
  },
  timing: {
    duration: 200,
    easing: Easing.out(Easing.cubic),
    useNativeDriver: true,
  },
} as const;

export default function FloatingChatButton() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { isRTL } = useLanguage();
  const { t } = useTranslation();

  // State
  const [showChat, setShowChat] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [snapSide, setSnapSide] = useState<"left" | "right">(
    isRTL ? "left" : "right"
  );

  // Animation refs
  const pan = useRef(new Animated.ValueXY()).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  // Calculate initial position based on RTL
  const initialPosition = useMemo(() => {
    const safeBottom = insets.bottom + 120;
    const safeTop = insets.top + 100;
    const centerY = (screenHeight - safeBottom - safeTop) / 2;

    return {
      x: isRTL ? EDGE_MARGIN : screenWidth - EDGE_MARGIN - BUTTON_SIZE,
      y: centerY,
    };
  }, [insets, isRTL]);

  // Set initial position
  useEffect(() => {
    pan.setOffset(initialPosition);
  }, [initialPosition]);

  // Pulse animation effect
  useEffect(() => {
    const startPulseAnimation = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: PULSE_DURATION / 2,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: PULSE_DURATION / 2,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    const timer = setTimeout(startPulseAnimation, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Glow animation
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Enhanced pan responder with RTL support
  const panResponder = useMemo(() => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dx) > 3 || Math.abs(gestureState.dy) > 3;
      },

      onPanResponderGrant: () => {
        setIsDragging(true);

        if (Platform.OS === "ios") {
          Vibration.vibrate([10]);
        }

        Animated.parallel([
          Animated.spring(scaleAnim, {
            toValue: 1.1,
            ...ANIMATIONS.spring,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0.8,
            ...ANIMATIONS.timing,
          }),
        ]).start();
      },

      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),

      onPanResponderRelease: (evt, gestureState) => {
        setIsDragging(false);

        const currentX = pan.x._offset + gestureState.dx;
        const currentY = pan.y._offset + gestureState.dy;

        // Determine which side to snap to based on RTL
        const snapToLeft = isRTL
          ? currentX > screenWidth / 2
          : currentX < screenWidth / 2;

        const newSnapSide = snapToLeft ? "left" : "right";
        setSnapSide(newSnapSide);

        const snapX = snapToLeft
          ? EDGE_MARGIN
          : screenWidth - EDGE_MARGIN - BUTTON_SIZE;

        const minY = insets.top + 80;
        const maxY = screenHeight - insets.bottom - BUTTON_SIZE - 80;
        const snapY = Math.max(minY, Math.min(maxY, currentY));

        pan.setOffset({ x: currentX, y: currentY });
        pan.setValue({ x: 0, y: 0 });

        Animated.parallel([
          Animated.spring(pan, {
            toValue: { x: snapX - currentX, y: snapY - currentY },
            ...ANIMATIONS.spring,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            ...ANIMATIONS.spring,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            ...ANIMATIONS.timing,
          }),
        ]).start(() => {
          pan.setOffset({ x: snapX, y: snapY });
          pan.setValue({ x: 0, y: 0 });
        });
      },
    });
  }, [pan, scaleAnim, opacityAnim, insets, isRTL]);

  // Press handler with enhanced feedback
  const handlePress = useCallback(() => {
    if (isDragging) return;

    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        ...ANIMATIONS.spring,
      }),
    ]).start();

    if (Platform.OS === "ios") {
      Vibration.vibrate([30]);
    }

    setShowChat(true);
  }, [isDragging, scaleAnim]);

  const handleClose = useCallback(() => {
    setShowChat(false);
  }, []);

  const handleMinimize = useCallback(() => {
    setShowChat(false);
  }, []);

  const dynamicStyles = createFloatingStyles(colors, isDark, isRTL);

  return (
    <>
      <Animated.View
        style={[
          dynamicStyles.container,
          {
            transform: [
              { translateX: pan.x },
              { translateY: pan.y },
              { scale: scaleAnim },
            ],
            opacity: opacityAnim,
          },
        ]}
        {...panResponder.panHandlers}
      >
        {/* Glow effect */}
        <Animated.View
          style={[
            dynamicStyles.glowEffect,
            {
              opacity: glowAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.3, 0.7],
              }),
              transform: [
                {
                  scale: glowAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.2],
                  }),
                },
              ],
            },
          ]}
        />

        {/* Main button */}
        <Animated.View
          style={[
            dynamicStyles.button,
            {
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          <TouchableOpacity
            style={dynamicStyles.touchable}
            onPress={handlePress}
            activeOpacity={0.8}
            accessibilityLabel={t("tabs.ai_chat")}
            accessibilityRole="button"
            accessibilityHint={t("tabs.ai_chat_description")}
          >
            <LinearGradient
              colors={[colors.emerald500, colors.emerald600]}
              style={dynamicStyles.gradient}
            >
              <View style={dynamicStyles.iconContainer}>
                <Bot size={28} color="#FFFFFF" strokeWidth={2.5} />
                <Sparkles
                  size={12}
                  color="#FFFFFF"
                  style={dynamicStyles.sparkleIcon}
                />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Side indicator */}
        <View style={[dynamicStyles.sideIndicator, { [snapSide]: -8 }]}>
          <View
            style={[
              dynamicStyles.indicatorDot,
              { backgroundColor: colors.emerald500 },
            ]}
          />
        </View>
      </Animated.View>

      {/* Enhanced Chat Modal */}
      <Modal
        visible={showChat}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleClose}
        statusBarTranslucent={Platform.OS === "android"}
      >
        <SafeAreaView style={dynamicStyles.modalContainer}>
          <StatusBar
            barStyle={isDark ? "light-content" : "dark-content"}
            backgroundColor={colors.background}
            translucent={Platform.OS === "android"}
          />

          {/* Enhanced header with glass morphism */}
          <View style={dynamicStyles.header}>
            <LinearGradient
              colors={[
                colors.background,
                isDark ? "rgba(30, 41, 59, 0.95)" : "rgba(255, 255, 255, 0.95)",
              ]}
              style={dynamicStyles.headerGradient}
            >
              <TouchableOpacity
                onPress={handleMinimize}
                style={dynamicStyles.headerButton}
                accessibilityLabel={t("common.minimize")}
              >
                <Minus size={20} color={colors.textSecondary} strokeWidth={2} />
              </TouchableOpacity>

              <View
                style={[
                  dynamicStyles.headerTitle,
                  isRTL && dynamicStyles.rtlRow,
                ]}
              >
                <View style={dynamicStyles.headerIconContainer}>
                  <LinearGradient
                    colors={[colors.emerald500, colors.emerald600]}
                    style={dynamicStyles.headerIconGradient}
                  >
                    <Bot size={20} color="#FFFFFF" strokeWidth={2} />
                  </LinearGradient>
                </View>
                <View
                  style={[
                    dynamicStyles.headerTextContainer,
                    isRTL && dynamicStyles.rtlAlign,
                  ]}
                >
                  <Text
                    style={[
                      dynamicStyles.headerTitleText,
                      { color: colors.text },
                      isRTL && dynamicStyles.rtlText,
                    ]}
                  >
                    {t("tabs.ai_chat")}
                  </Text>
                  <Text
                    style={[
                      dynamicStyles.headerSubtitle,
                      { color: colors.textSecondary },
                      isRTL && dynamicStyles.rtlText,
                    ]}
                  >
                    {t("ai_chat.nutrition_advice")}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={handleClose}
                style={dynamicStyles.headerButton}
                accessibilityLabel={t("common.close")}
              >
                <X size={20} color={colors.textSecondary} strokeWidth={2} />
              </TouchableOpacity>
            </LinearGradient>
          </View>

          {/* Chat content with enhanced styling */}
          <View style={dynamicStyles.chatContent}>
            <AIChatScreen onClose={handleClose} onMinimize={handleMinimize} />
          </View>
        </SafeAreaView>
      </Modal>
    </>
  );
}

const createFloatingStyles = (colors: any, isDark: boolean, isRTL: boolean) => {
  return StyleSheet.create({
    container: {
      position: "absolute",
      zIndex: 1000,
    } as ViewStyle,

    glowEffect: {
      position: "absolute",
      width: BUTTON_SIZE + 15,
      height: BUTTON_SIZE + 15,
      borderRadius: (BUTTON_SIZE + 15) / 2,
      backgroundColor: colors.emerald500,
      top: -15,
      left: -15,
    } as ViewStyle,

    button: {
      width: BUTTON_SIZE / 1.3,
      height: BUTTON_SIZE / 1.3,
      borderRadius: BUTTON_SIZE / 2,
      overflow: "hidden",
    } as ViewStyle,

    touchable: {
      width: "100%",
      height: "100%",
    } as ViewStyle,

    gradient: {
      width: "100%",
      height: "100%",
      borderRadius: BUTTON_SIZE / 2,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 3,
      borderColor: colors.background,
      shadowColor: colors.emerald600,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
      elevation: 12,
    } as ViewStyle,

    iconContainer: {
      position: "relative",
      alignItems: "center",
      justifyContent: "center",
    } as ViewStyle,

    sparkleIcon: {
      position: "absolute",
      top: -8,
      right: -8,
    } as ViewStyle,

    sideIndicator: {
      position: "absolute",
      top: "50%",
      width: 4,
      height: 20,
      borderRadius: 2,
      marginTop: -10,
    } as ViewStyle,

    indicatorDot: {
      width: 4,
      height: 20,
      borderRadius: 2,
    } as ViewStyle,

    modalContainer: {
      flex: 1,
      backgroundColor: colors.background,
    } as ViewStyle,

    header: {
      borderBottomWidth: 1,
      borderBottomColor: isDark
        ? "rgba(255, 255, 255, 0.1)"
        : "rgba(0, 0, 0, 0.05)",
    } as ViewStyle,

    headerGradient: {
      flexDirection: isRTL ? "row-reverse" : "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 16,
      backdropFilter: "blur(20px)",
    } as ViewStyle,

    headerButton: {
      padding: 8,
      borderRadius: 12,
      backgroundColor: isDark
        ? "rgba(255, 255, 255, 0.1)"
        : "rgba(0, 0, 0, 0.05)",
      minWidth: 40,
      alignItems: "center",
      justifyContent: "center",
    } as ViewStyle,

    headerTitle: {
      flex: 1,
      flexDirection: isRTL ? "row-reverse" : "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
    } as ViewStyle,

    rtlRow: {
      flexDirection: "row-reverse",
    } as ViewStyle,

    rtlAlign: {
      alignItems: isRTL ? "flex-end" : "flex-start",
    } as ViewStyle,

    rtlText: {
      textAlign: isRTL ? "right" : "left",
      writingDirection: isRTL ? "rtl" : "ltr",
    } as TextStyle,

    headerIconContainer: {
      width: 36,
      height: 36,
      borderRadius: 18,
      overflow: "hidden",
    } as ViewStyle,

    headerIconGradient: {
      width: "100%",
      height: "100%",
      alignItems: "center",
      justifyContent: "center",
    } as ViewStyle,

    headerTextContainer: {
      alignItems: isRTL ? "flex-end" : "flex-start",
    } as ViewStyle,

    headerTitleText: {
      fontSize: 18,
      fontWeight: "700",
      letterSpacing: -0.3,
    } as TextStyle,

    headerSubtitle: {
      fontSize: 13,
      fontWeight: "500",
      marginTop: 2,
      opacity: 0.8,
    } as TextStyle,

    chatContent: {
      flex: 1,
      backgroundColor: colors.background,
    } as ViewStyle,
  });
};
