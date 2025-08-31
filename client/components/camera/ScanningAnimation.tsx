import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Modal,
} from "react-native";
import { useTheme } from "@/src/context/ThemeContext";
import { useTranslation } from "react-i18next";
import { Zap, Eye, Brain, Sparkles, CheckCircle } from "lucide-react-native";

const { width, height } = Dimensions.get("window");

interface ScanningAnimationProps {
  visible: boolean;
  onComplete?: () => void;
}

export const ScanningAnimation: React.FC<ScanningAnimationProps> = ({
  visible,
  onComplete,
}) => {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  // State
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  const steps = [
    {
      key: "initializing",
      icon: Zap,
      color: colors.emerald500,
      duration: 1200,
    },
    {
      key: "processing",
      icon: Eye,
      color: "#059669",
      duration: 1800,
    },
    {
      key: "identifying",
      icon: Brain,
      color: "#047857",
      duration: 2500,
    },
    {
      key: "calculating",
      icon: Sparkles,
      color: "#065f46",
      duration: 2000,
    },
    {
      key: "analyzing",
      icon: Brain,
      color: colors.emerald500,
      duration: 1500,
    },
    {
      key: "finalizing",
      icon: CheckCircle,
      color: "#10B981",
      duration: 800,
    },
  ];

  useEffect(() => {
    if (visible) {
      startAnimation();
    } else {
      resetAnimation();
    }
  }, [visible]);

  const startAnimation = () => {
    // Initial entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
    ]).start();

    // Start continuous animations
    startRotation();
    startPulse();
    startScanLine();

    // Progress through steps
    progressThroughSteps();
  };

  const startRotation = () => {
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start();
  };

  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const startScanLine = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const progressThroughSteps = () => {
    let totalTime = 0;
    let currentProgress = 0;

    steps.forEach((step, index) => {
      setTimeout(() => {
        setCurrentStep(index);
        currentProgress += 100 / steps.length;
        setProgress(currentProgress);

        Animated.timing(progressAnim, {
          toValue: currentProgress / 100,
          duration: step.duration,
          useNativeDriver: false,
        }).start();

        // Complete animation
        if (index === steps.length - 1) {
          setTimeout(() => {
            onComplete?.();
          }, step.duration + 500);
        }
      }, totalTime);

      totalTime += step.duration;
    });
  };

  const resetAnimation = () => {
    fadeAnim.setValue(0);
    scaleAnim.setValue(0.8);
    rotateAnim.setValue(0);
    progressAnim.setValue(0);
    pulseAnim.setValue(1);
    scanLineAnim.setValue(0);
    setCurrentStep(0);
    setProgress(0);
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const scanLineTranslateY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-150, 150],
  });

  if (!visible) return null;

  const CurrentIcon = steps[currentStep]?.icon || Zap;
  const currentColor = steps[currentStep]?.color || colors.emerald500;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <View
        style={[
          styles.overlay,
          {
            backgroundColor: isDark
              ? "rgba(0,0,0,0.95)"
              : "rgba(255,255,255,0.95)",
          },
        ]}
      >
        <Animated.View
          style={[
            styles.container,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Main scanning area */}
          <View style={[styles.scanningArea, { borderColor: currentColor }]}>
            {/* Rotating outer ring */}
            <Animated.View
              style={[
                styles.outerRing,
                {
                  borderColor: currentColor,
                  transform: [{ rotate: spin }],
                },
              ]}
            />

            {/* Pulsing inner circle */}
            <Animated.View
              style={[
                styles.innerCircle,
                {
                  backgroundColor: currentColor + "20",
                  transform: [{ scale: pulseAnim }],
                },
              ]}
            >
              <CurrentIcon size={48} color={currentColor} />
            </Animated.View>

            {/* Scanning line */}
            <Animated.View
              style={[
                styles.scanLine,
                {
                  backgroundColor: currentColor,
                  transform: [{ translateY: scanLineTranslateY }],
                },
              ]}
            />

            {/* Corner indicators */}
            {[0, 1, 2, 3].map((corner) => (
              <View
                key={corner}
                style={[
                  styles.corner,
                  {
                    borderColor: currentColor,
                    ...getCornerStyle(corner),
                  },
                ]}
              />
            ))}
          </View>

          {/* Text content */}
          <View style={styles.textContainer}>
            <Text style={[styles.title, { color: colors.text }]}>
              {t("camera.scanAnimation.title")}
            </Text>

            <Text style={[styles.subtitle, { color: colors.icon }]}>
              {t("camera.scanAnimation.subtitle")}
            </Text>

            <Text style={[styles.stepText, { color: currentColor }]}>
              {t(`camera.scanningSteps.${steps[currentStep]?.key}`)}
            </Text>
          </View>

          {/* Progress indicator */}
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={[styles.progressLabel, { color: colors.text }]}>
                {progress < 100
                  ? t("camera.scanAnimation.progress")
                  : t("camera.scanAnimation.complete")}
              </Text>
              <Text style={[styles.progressPercent, { color: currentColor }]}>
                {Math.round(progress)}%
              </Text>
            </View>

            <View
              style={[styles.progressTrack, { backgroundColor: colors.border }]}
            >
              <Animated.View
                style={[
                  styles.progressBar,
                  {
                    backgroundColor: currentColor,
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ["0%", "100%"],
                    }),
                  },
                ]}
              />
            </View>
          </View>

          {/* Enhanced particle effects */}
          {[...Array(8)].map((_, index) => (
            <Animated.View
              key={index}
              style={[
                styles.sparkle,
                {
                  opacity: pulseAnim.interpolate({
                    inputRange: [1, 1.1],
                    outputRange: [0.4, 1],
                  }),
                  transform: [
                    {
                      rotate: `${index * 45}deg`,
                    },
                    {
                      translateY: -140 - index * 12,
                    },
                    {
                      scale: pulseAnim.interpolate({
                        inputRange: [1, 1.1],
                        outputRange: [0.8, 1.2],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Sparkles size={14} color={currentColor} />
            </Animated.View>
          ))}

          {/* Floating dots animation */}
          {[...Array(12)].map((_, index) => (
            <Animated.View
              key={`dot-${index}`}
              style={[
                styles.floatingDot,
                {
                  backgroundColor: currentColor + "40",
                  opacity: scanLineAnim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0.3, 1, 0.3],
                  }),
                  transform: [
                    {
                      translateX: Math.cos((index * Math.PI * 2) / 12) * 100,
                    },
                    {
                      translateY: Math.sin((index * Math.PI * 2) / 12) * 100,
                    },
                    {
                      scale: pulseAnim.interpolate({
                        inputRange: [1, 1.1],
                        outputRange: [0.5, 1],
                      }),
                    },
                  ],
                },
              ]}
            />
          ))}

          {/* Glow effect */}
          <Animated.View
            style={[
              styles.glowEffect,
              {
                backgroundColor: currentColor + "10",
                opacity: pulseAnim.interpolate({
                  inputRange: [1, 1.1],
                  outputRange: [0.3, 0.8],
                }),
                transform: [{ scale: pulseAnim }],
              },
            ]}
          />
        </Animated.View>
      </View>
    </Modal>
  );
};

const getCornerStyle = (corner: number) => {
  const size = 30;
  const thickness = 3;

  switch (corner) {
    case 0: // Top-left
      return {
        top: -thickness,
        left: -thickness,
        borderTopWidth: thickness,
        borderLeftWidth: thickness,
        width: size,
        height: size,
      };
    case 1: // Top-right
      return {
        top: -thickness,
        right: -thickness,
        borderTopWidth: thickness,
        borderRightWidth: thickness,
        width: size,
        height: size,
      };
    case 2: // Bottom-left
      return {
        bottom: -thickness,
        left: -thickness,
        borderBottomWidth: thickness,
        borderLeftWidth: thickness,
        width: size,
        height: size,
      };
    case 3: // Bottom-right
      return {
        bottom: -thickness,
        right: -thickness,
        borderBottomWidth: thickness,
        borderRightWidth: thickness,
        width: size,
        height: size,
      };
    default:
      return {};
  }
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  scanningArea: {
    width: 300,
    height: 300,
    borderRadius: 20,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
    marginBottom: 40,
  },
  outerRing: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  innerCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  scanLine: {
    position: "absolute",
    width: "100%",
    height: 2,
    opacity: 0.8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  corner: {
    position: "absolute",
    borderColor: "transparent",
  },
  textContainer: {
    alignItems: "center",
    marginBottom: 30,
    paddingHorizontal: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  stepText: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  progressContainer: {
    width: width - 80,
    marginTop: 20,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: "700",
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    borderRadius: 3,
  },
  sparkle: {
    position: "absolute",
  },
  floatingDot: {
    position: "absolute",
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  glowEffect: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    zIndex: -1,
  },
});
