import React from "react";
import { View, Text, StyleSheet, Animated, Dimensions } from "react-native";
import Svg, {
  Path,
  Circle,
  Ellipse,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
} from "react-native-svg";

const { width, height } = Dimensions.get("window");

interface LoadingScreenProps {
  text?: string;
  size?: "small" | "large";
  appName?: string;
}

// Sleek minimal icons with vibrant green
const LeafIcon = ({ size = 48 }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Defs>
      <SvgLinearGradient id="leafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#22c55e" />
        <Stop offset="100%" stopColor="#16a34a" />
      </SvgLinearGradient>
    </Defs>
    <Path
      d="M20 75C20 45 35 20 50 20C65 20 80 45 80 75C80 80 75 85 70 85L30 85C25 85 20 80 20 75Z"
      fill="url(#leafGrad)"
    />
    <Path d="M50 20L50 85" stroke="#15803d" strokeWidth="1.5" opacity="0.6" />
  </Svg>
);

const SeedlingIcon = ({ size = 48 }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Defs>
      <SvgLinearGradient id="seedGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#22c55e" />
        <Stop offset="100%" stopColor="#16a34a" />
      </SvgLinearGradient>
    </Defs>
    <Path
      d="M50 80L50 40"
      stroke="#15803d"
      strokeWidth="3"
      strokeLinecap="round"
    />
    <Path
      d="M50 45C40 35 25 40 30 55C35 65 50 60 50 45Z"
      fill="url(#seedGrad)"
    />
    <Path
      d="M50 45C60 35 75 40 70 55C65 65 50 60 50 45Z"
      fill="url(#seedGrad)"
    />
  </Svg>
);

const TreeIcon = ({ size = 48 }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Defs>
      <SvgLinearGradient id="treeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#22c55e" />
        <Stop offset="100%" stopColor="#16a34a" />
      </SvgLinearGradient>
    </Defs>
    <Path
      d="M50 85L50 55"
      stroke="#15803d"
      strokeWidth="4"
      strokeLinecap="round"
    />
    <Circle cx="50" cy="30" r="20" fill="url(#treeGrad)" />
    <Circle cx="35" cy="45" r="15" fill="url(#treeGrad)" opacity="0.9" />
    <Circle cx="65" cy="45" r="15" fill="url(#treeGrad)" opacity="0.9" />
  </Svg>
);

const FlowerIcon = ({ size = 48 }) => (
  <Svg width={size} height={size} viewBox="0 0 100 100">
    <Defs>
      <SvgLinearGradient id="flowerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#22c55e" />
        <Stop offset="100%" stopColor="#16a34a" />
      </SvgLinearGradient>
    </Defs>
    <Path
      d="M50 85L50 45"
      stroke="#15803d"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    <Circle cx="50" cy="35" r="6" fill="#fbbf24" />
    <Ellipse cx="50" cy="20" rx="8" ry="15" fill="url(#flowerGrad)" />
    <Ellipse
      cx="35"
      cy="35"
      rx="8"
      ry="15"
      fill="url(#flowerGrad)"
      transform="rotate(-72 35 35)"
    />
    <Ellipse
      cx="65"
      cy="35"
      rx="8"
      ry="15"
      fill="url(#flowerGrad)"
      transform="rotate(72 65 35)"
    />
    <Ellipse
      cx="42"
      cy="50"
      rx="8"
      ry="15"
      fill="url(#flowerGrad)"
      transform="rotate(-144 42 50)"
    />
    <Ellipse
      cx="58"
      cy="50"
      rx="8"
      ry="15"
      fill="url(#flowerGrad)"
      transform="rotate(144 58 50)"
    />
  </Svg>
);

const icons = [LeafIcon, SeedlingIcon, TreeIcon, FlowerIcon];

export default function LoadingScreen({
  text = "Loading...",
  size = "large",
  appName = "GreenApp",
}: LoadingScreenProps) {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const iconRotateAnim = React.useRef(new Animated.Value(0)).current;
  const iconScaleAnim = React.useRef(new Animated.Value(0.8)).current;
  const progressAnim = React.useRef(new Animated.Value(0)).current;
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  const [currentIcon, setCurrentIcon] = React.useState(0);

  React.useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // Icon scale animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(iconScaleAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(iconScaleAnim, {
          toValue: 0.8,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Gentle rotation
    Animated.loop(
      Animated.timing(iconRotateAnim, {
        toValue: 1,
        duration: 8000,
        useNativeDriver: true,
      })
    ).start();

    // Progress animation
    Animated.loop(
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 2500,
        useNativeDriver: false,
      })
    ).start();

    // Pulse animation for dots
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.6,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Icon cycling
    const iconInterval = setInterval(() => {
      setCurrentIcon((prev) => (prev + 1) % icons.length);
    }, 2000);

    return () => clearInterval(iconInterval);
  }, []);

  const CurrentIcon = icons[currentIcon];

  const rotation = iconRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 200],
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        {/* Main Icon */}
        <Animated.View
          style={[
            styles.iconContainer,
            {
              transform: [{ scale: iconScaleAnim }, { rotate: rotation }],
            },
          ]}
        >
          <CurrentIcon size={64} />
        </Animated.View>

        {/* Loading Text */}
        <Text style={styles.loadingText}>{text}</Text>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <Animated.View
              style={[
                styles.progressBar,
                {
                  width: progressWidth,
                },
              ]}
            />
          </View>
        </View>

        {/* Animated Dots */}
        <View style={styles.dotsContainer}>
          {[0, 1, 2].map((index) => (
            <Animated.View
              key={index}
              style={[
                styles.dot,
                {
                  opacity: pulseAnim,
                  transform: [
                    {
                      scale: pulseAnim.interpolate({
                        inputRange: [0.6, 1],
                        outputRange: [0.8, 1.2],
                      }),
                    },
                  ],
                },
              ]}
            />
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    alignItems: "center",
    gap: 32,
  },
  iconContainer: {
    width: 100,
    height: 100,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 50,
    shadowColor: "#22c55e",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: "500",
    color: "#1f2937",
    letterSpacing: 0.5,
  },
  progressContainer: {
    alignItems: "center",
  },
  progressTrack: {
    width: 200,
    height: 3,
    backgroundColor: "#f1f5f9",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#22c55e",
    borderRadius: 2,
  },
  dotsContainer: {
    flexDirection: "row",
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#22c55e",
  },
});
