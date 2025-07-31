import React, { useRef } from "react";
import {
  View,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Camera } from "lucide-react-native";
import { useRouter } from "expo-router";

const { width: screenWidth } = Dimensions.get("window");

interface SwipeToCameraProps {
  children: React.ReactNode;
}

export default function SwipeToCamera({ children }: SwipeToCameraProps) {
  const router = useRouter();
  const swipeProgress = useRef(new Animated.Value(0)).current;

  // Pan responder for swipe gesture
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Only respond to right swipes from the right edge
        return (
          evt.nativeEvent.pageX > screenWidth - 50 &&
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy) &&
          gestureState.dx < -10
        );
      },
      onPanResponderGrant: () => {
        // Start tracking the swipe
      },
      onPanResponderMove: (evt, gestureState) => {
        if (gestureState.dx < 0) {
          const progress = Math.min(
            Math.abs(gestureState.dx) / (screenWidth * 0.3),
            1
          );
          swipeProgress.setValue(progress);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        const shouldNavigate =
          Math.abs(gestureState.dx) > screenWidth * 0.15 && gestureState.dx < 0;

        if (shouldNavigate) {
          // Navigate to camera screen
          router.push("/(tabs)/camera");
          // Reset swipe progress after navigation
          setTimeout(() => {
            swipeProgress.setValue(0);
          }, 300);
        } else {
          // Reset swipe progress
          Animated.spring(swipeProgress, {
            toValue: 0,
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  // Swipe indicator animations
  const swipeIndicatorOpacity = swipeProgress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.7, 1],
  });

  const swipeIndicatorScale = swipeProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1.2],
  });

  const swipeIndicatorTranslateX = swipeProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -30],
  });

  return (
    <View style={styles.container}>
      {/* Main content with pan responder */}
      <View style={styles.mainContent} {...panResponder.panHandlers}>
        {children}
      </View>

      {/* Swipe indicator */}
      <Animated.View
        style={[
          styles.swipeIndicator,
          {
            opacity: swipeIndicatorOpacity,
            transform: [
              { scale: swipeIndicatorScale },
              { translateX: swipeIndicatorTranslateX },
            ],
          },
        ]}
        pointerEvents="none"
      >
        <LinearGradient
          colors={["#16A085", "#1ABC9C"]}
          style={styles.swipeIndicatorGradient}
        >
          <Camera size={28} color="#FFFFFF" />
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainContent: {
    flex: 1,
  },
  swipeIndicator: {
    position: "absolute",
    right: 20,
    top: "50%",
    marginTop: -30,
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#16A085",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  swipeIndicatorGradient: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
});
