import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { Star, Trophy, Award } from "lucide-react-native";

interface XPNotificationProps {
  visible: boolean;
  xpGained: number;
  leveledUp?: boolean;
  newLevel?: number;
  newAchievements?: Array<{
    title: { en: string; he: string } | string;
    xpReward: number;
    icon: string;
  }>;
  onHide: () => void;
  language: "en" | "he";
}

export default function XPNotification({
  visible,
  xpGained,
  leveledUp,
  newLevel,
  newAchievements = [],
  onHide,
  language,
}: XPNotificationProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (visible) {
      // Show animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto hide after 4 seconds
      const timer = setTimeout(() => {
        hideNotification();
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const hideNotification = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide();
    });
  };

  if (!visible && fadeAnim._value === 0) return null;

  const texts = {
    xpGained: language === "he" ? "נק׳ ניסיון הושגו" : "XP Gained",
    levelUp: language === "he" ? "עליה ברמה!" : "Level Up!",
    newLevel: language === "he" ? "רמה" : "Level",
    newAchievement: language === "he" ? "הישג חדש!" : "New Achievement!",
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY }],
        },
      ]}
    >
      <View style={styles.notification}>
        {leveledUp && (
          <View style={[styles.levelUpSection, styles.section]}>
            <View style={styles.levelUpIcon}>
              <Trophy size={24} color="#F39C12" />
            </View>
            <View>
              <Text style={styles.levelUpText}>{texts.levelUp}</Text>
              <Text style={styles.levelText}>
                {texts.newLevel} {newLevel}
              </Text>
            </View>
          </View>
        )}

        {xpGained > 0 && (
          <View style={[styles.xpSection, styles.section]}>
            <View style={styles.xpIcon}>
              <Star size={20} color="#16A085" />
            </View>
            <Text style={styles.xpText}>
              +{xpGained} {texts.xpGained}
            </Text>
          </View>
        )}

        {newAchievements.length > 0 && (
          <View style={[styles.achievementsSection, styles.section]}>
            <Text style={styles.achievementHeaderText}>
              {texts.newAchievement}
            </Text>
            {newAchievements.slice(0, 2).map((achievement, index) => (
              <View key={index} style={styles.achievementItem}>
                <Text style={styles.achievementIcon}>{achievement.icon}</Text>
                <View style={styles.achievementTextContainer}>
                  <Text style={styles.achievementTitle}>
                    {typeof achievement.title === "object"
                      ? achievement.title[language] || achievement.title.en
                      : achievement.title}
                  </Text>
                  <Text style={styles.achievementXP}>
                    +{achievement.xpReward} XP
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 50,
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  notification: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#16A085",
  },
  section: {
    marginBottom: 12,
  },
  levelUpSection: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F39C1215",
    padding: 12,
    borderRadius: 12,
  },
  levelUpIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F39C1220",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  levelUpText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#F39C12",
  },
  levelText: {
    fontSize: 14,
    color: "#7F8C8D",
    marginTop: 2,
  },
  xpSection: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#16A08515",
    padding: 12,
    borderRadius: 12,
  },
  xpIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#16A08520",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  xpText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#16A085",
  },
  achievementsSection: {
    backgroundColor: "#9B59B615",
    padding: 12,
    borderRadius: 12,
  },
  achievementHeaderText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#9B59B6",
    marginBottom: 8,
  },
  achievementItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  achievementIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  achievementTextContainer: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 12,
    fontWeight: "500",
    color: "#2C3E50",
  },
  achievementXP: {
    fontSize: 10,
    color: "#9B59B6",
    fontWeight: "500",
  },
});
