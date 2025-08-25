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
  PanResponder,
  Easing,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MessageCircle, Minus, X } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AIChatScreen from "../app/(tabs)/ai-chat";

interface AIChatScreenProps {
  onClose?: () => void;
  onMinimize?: () => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");
const BUTTON_SIZE = 60;
const EDGE_MARGIN = 20;

const ANIMATIONS = {
  spring: {
    tension: 300,
    friction: 20,
    useNativeDriver: true,
  },
  timing: {
    duration: 150,
    easing: Easing.out(Easing.cubic),
    useNativeDriver: true,
  },
} as const;

const COLORS = {
  emerald: "#10b981",
  white: "#ffffff",
  gray600: "#4b5563",
  gray900: "#111827",
  backdrop: "rgba(0, 0, 0, 0.5)",
} as const;

export default function FloatingChatButton() {
  const insets = useSafeAreaInsets();
  const [showChat, setShowChat] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [snapSide, setSnapSide] = useState<"left" | "right">("right");

  // Animation refs
  const pan = useRef(new Animated.ValueXY()).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  // Calculate initial position
  const initialPosition = useMemo(() => {
    const safeBottom = insets.bottom + 100;
    const safeTop = insets.top + 80;
    const centerY = (screenHeight - safeBottom - safeTop) / 2;

    return {
      x: screenWidth - EDGE_MARGIN - BUTTON_SIZE,
      y: centerY,
    };
  }, [insets]);

  // Set initial position
  useEffect(() => {
    pan.setOffset(initialPosition);
  }, [initialPosition]);

  // Pan responder
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
          Animated.spring(scaleAnim, { toValue: 1.05, ...ANIMATIONS.spring }),
          Animated.timing(opacityAnim, { toValue: 0.9, ...ANIMATIONS.timing }),
        ]).start();
      },

      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),

      onPanResponderRelease: (evt, gestureState) => {
        setIsDragging(false);

        const currentX = pan.x._offset + gestureState.dx;
        const currentY = pan.y._offset + gestureState.dy;

        const snapToLeft = currentX < screenWidth / 2;
        const newSnapSide = snapToLeft ? "left" : "right";
        setSnapSide(newSnapSide);

        const snapX = snapToLeft
          ? EDGE_MARGIN
          : screenWidth - EDGE_MARGIN - BUTTON_SIZE;

        const minY = insets.top + 60;
        const maxY = screenHeight - insets.bottom - BUTTON_SIZE - 60;
        const snapY = Math.max(minY, Math.min(maxY, currentY));

        pan.setOffset({ x: currentX, y: currentY });
        pan.setValue({ x: 0, y: 0 });

        Animated.parallel([
          Animated.spring(pan, {
            toValue: { x: snapX - currentX, y: snapY - currentY },
            ...ANIMATIONS.spring,
          }),
          Animated.spring(scaleAnim, { toValue: 1, ...ANIMATIONS.spring }),
          Animated.timing(opacityAnim, { toValue: 1, ...ANIMATIONS.timing }),
        ]).start(() => {
          pan.setOffset({ x: snapX, y: snapY });
          pan.setValue({ x: 0, y: 0 });
        });
      },
    });
  }, [pan, scaleAnim, opacityAnim, insets]);

  const handlePress = useCallback(() => {
    if (isDragging) return;

    console.log("FloatingChatButton pressed - opening modal");

    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, { toValue: 1, ...ANIMATIONS.spring }),
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

  return (
    <>
      {/* Floating Button */}
      <Animated.View
        style={[
          styles.container,
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
        <TouchableOpacity
          style={styles.button}
          onPress={handlePress}
          activeOpacity={0.8}
        >
          <MessageCircle size={26} color={COLORS.white} strokeWidth={2} />
        </TouchableOpacity>
      </Animated.View>

      {/* Chat Modal - Fixed layout and styling */}
      <Modal
        visible={showChat}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={handleClose}
        statusBarTranslucent={true}
      >
        <SafeAreaView
          style={styles.modalContainer}
          edges={["top", "left", "right"]}
        >
          <StatusBar
            barStyle="dark-content"
            backgroundColor="transparent"
            translucent={true}
          />

          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={handleMinimize}
              style={styles.headerButton}
              activeOpacity={0.7}
            >
              <Minus size={22} color={COLORS.gray600} strokeWidth={2.5} />
            </TouchableOpacity>

            <View style={styles.headerTitle}>
              <View style={styles.headerIconContainer}>
                <MessageCircle
                  size={22}
                  color={COLORS.emerald}
                  strokeWidth={2.5}
                />
              </View>
              <Text style={styles.headerTitleText}>AI Chat</Text>
            </View>

            <TouchableOpacity
              onPress={handleClose}
              style={styles.headerButton}
              activeOpacity={0.7}
            >
              <X size={22} color={COLORS.gray600} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          {/* Chat Content */}
          <View style={styles.chatContent}>
            <AIChatScreen onClose={handleClose} onMinimize={handleMinimize} />
          </View>
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    zIndex: 1000,
  },
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    backgroundColor: COLORS.emerald,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  // Modal styles - fixed layout and RTL support
  modalContainer: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    minHeight: 80,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginHorizontal: 16,
  },
  headerIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E0F2F1",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleText: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.gray900,
    letterSpacing: -0.3,
  },
  chatContent: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
});
