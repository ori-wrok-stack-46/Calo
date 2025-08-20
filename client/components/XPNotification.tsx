import React, { useEffect, useRef, useState } from "react";
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
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const [showAchievements, setShowAchievements] = useState(false);

  useEffect(() => {
    if (visible) {
      // Show animation with enhanced effects
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();

      // Show achievements after main notification
      if (newAchievements.length > 0) {
        setTimeout(() => {
          setShowAchievements(true);
        }, 1000);
      }

      // Auto hide after 5 seconds (longer for achievements)
      const timer = setTimeout(
        () => {
          hideNotification();
        },
        newAchievements.length > 0 ? 6000 : 4000
      );

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const hideNotification = () => {
    setShowAchievements(false);
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
      Animated.timing(scaleAnim, {
        toValue: 0.8,
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
          transform: [{ translateY }, { scale: scaleAnim }],
        },
      ]}
    >
      <View
        style={[
          styles.notification,
          leveledUp && styles.levelUpNotification,
          newAchievements.length > 0 && styles.achievementNotification,
        ]}
      >
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

        {newAchievements.length > 0 && showAchievements && (
          <Animated.View
            style={[
              styles.achievementsSection,
              styles.section,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <View style={styles.achievementHeaderContainer}>
              <Award size={20} color="#9B59B6" />
              <Text style={styles.achievementHeaderText}>
                {texts.newAchievement}
              </Text>
            </View>
            {newAchievements.slice(0, 3).map((achievement, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.achievementItem,
                  {
                    opacity: fadeAnim,
                    transform: [
                      {
                        translateX: language === "he" ? 20 : -20,
                      },
                      { scale: scaleAnim },
                    ],
                  },
                ]}
              >
                <View style={styles.achievementIconContainer}>
                  <Text style={styles.achievementIcon}>{achievement.icon}</Text>
                </View>
                <View style={styles.achievementTextContainer}>
                  <Text style={styles.achievementTitle}>
                    {typeof achievement.title === "object"
                      ? achievement.title[language] || achievement.title.en
                      : achievement.title}
                  </Text>
                  <View style={styles.achievementXPContainer}>
                    <Star size={12} color="#F39C12" fill="#F39C12" />
                    <Text style={styles.achievementXP}>
                      +{achievement.xpReward} XP
                    </Text>
                  </View>
                </View>
                <View style={styles.achievementBadge}>
                  <Text style={styles.achievementBadgeText}>🏆</Text>
                </View>
              </Animated.View>
            ))}
            {newAchievements.length > 3 && (
              <Text style={styles.moreAchievementsText}>
                {language === "he"
                  ? `ועוד ${newAchievements.length - 3} הישגים...`
                  : `+${newAchievements.length - 3} more achievements...`}
              </Text>
            )}
          </Animated.View>
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
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 2,
    borderColor: "#16A08520",
  },
  levelUpNotification: {
    borderColor: "#F39C1250",
    backgroundColor: "#FFFEF7",
  },
  achievementNotification: {
    borderColor: "#9B59B650",
    backgroundColor: "#FEFEFF",
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
    padding: 16,
    borderRadius: 16,
    marginTop: 8,
  },
  achievementHeaderContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  achievementHeaderText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#9B59B6",
  },
  achievementItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  achievementIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#9B59B620",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  achievementIcon: {
    fontSize: 20,
  },
  achievementTextContainer: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2C3E50",
    marginBottom: 4,
  },
  achievementXPContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  achievementXP: {
    fontSize: 12,
    color: "#F39C12",
    fontWeight: "600",
  },
  achievementBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F39C1220",
    justifyContent: "center",
    alignItems: "center",
  },
  achievementBadgeText: {
    fontSize: 16,
  },
  moreAchievementsText: {
    textAlign: "center",
    fontSize: 12,
    color: "#9B59B6",
    fontStyle: "italic",
    marginTop: 8,
  },
});
