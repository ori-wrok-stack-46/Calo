import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Animated,
  Modal,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  Trophy,
  Star,
  Award,
  Target,
  Flame,
  Crown,
  Gift,
  TrendingUp,
  Calendar,
  Zap,
  X,
  Lock,
  CheckCircle,
} from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/src/i18n/context/LanguageContext";
import { useTheme } from "@/src/context/ThemeContext";
import { api } from "@/src/services/api";
import LoadingScreen from "@/components/LoadingScreen";

const { width } = Dimensions.get("window");

interface Achievement {
  id: string;
  key: string;
  title: string;
  description: string;
  category: "MILESTONE" | "GOAL" | "STREAK" | "LEVEL" | "SPECIAL";
  xpReward: number;
  icon: string;
  rarity: "COMMON" | "UNCOMMON" | "RARE" | "EPIC" | "LEGENDARY";
  progress: number;
  maxProgress: number;
  unlocked: boolean;
  unlockedDate?: Date;
}

interface UserStats {
  level: number;
  currentXP: number;
  totalPoints: number;
  currentStreak: number;
  bestStreak: number;
  totalCompleteDays: number;
  xpToNextLevel: number;
  xpProgress: number;
}

const AchievementCard = ({
  achievement,
  colors,
  isRTL,
  language,
  onPress,
}: any) => {
  const [scaleAnim] = useState(new Animated.Value(1));
  const [glowAnim] = useState(new Animated.Value(0));

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  };

  useEffect(() => {
    if (achievement.unlocked) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: false,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.3,
            duration: 2000,
            useNativeDriver: false,
          }),
        ])
      ).start();
    }
  }, [achievement.unlocked]);

  const getRarityColor = (rarity: string) => {
    const colorMap = {
      COMMON: "#CD7F32",
      UNCOMMON: "#16A085",
      RARE: "#3498DB",
      EPIC: "#9B59B6",
      LEGENDARY: "#F39C12",
    };
    return colorMap[rarity] || "#95A5A6";
  };

  const progressPercentage =
    (achievement.progress / achievement.maxProgress) * 100;

  return (
    <Animated.View
      style={[
        {
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.achievementCard,
          {
            backgroundColor: achievement.unlocked
              ? colors.card
              : colors.surface,
            borderColor: achievement.unlocked
              ? getRarityColor(achievement.rarity) + "50"
              : colors.border,
            opacity: achievement.unlocked ? 1 : 0.7,
          },
          achievement.unlocked && {
            shadowColor: getRarityColor(achievement.rarity),
            shadowOpacity: 0.3,
          },
        ]}
        onPress={() => onPress(achievement)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.8}
      >
        {achievement.unlocked && (
          <Animated.View
            style={[
              styles.glowEffect,
              {
                opacity: glowAnim,
                backgroundColor: getRarityColor(achievement.rarity) + "20",
              },
            ]}
          />
        )}

        <View style={styles.achievementHeader}>
          <View
            style={[
              styles.achievementIconContainer,
              {
                backgroundColor: achievement.unlocked
                  ? getRarityColor(achievement.rarity) + "20"
                  : colors.border + "30",
                borderColor: getRarityColor(achievement.rarity),
                borderWidth: achievement.unlocked ? 2 : 1,
              },
            ]}
          >
            <Text
              style={[
                styles.achievementIcon,
                {
                  opacity: achievement.unlocked ? 1 : 0.5,
                  fontSize: achievement.unlocked ? 24 : 20,
                },
              ]}
            >
              {achievement.icon}
            </Text>
            {achievement.unlocked && (
              <View style={styles.unlockedBadge}>
                <CheckCircle
                  size={12}
                  color="#FFFFFF"
                  fill={getRarityColor(achievement.rarity)}
                />
              </View>
            )}
            {!achievement.unlocked && (
              <View style={styles.lockedOverlay}>
                <Lock size={16} color={colors.icon} />
              </View>
            )}
          </View>

          <View style={styles.rarityBadge}>
            <Text
              style={[
                styles.rarityText,
                {
                  color: getRarityColor(achievement.rarity),
                  textAlign: isRTL ? "right" : "left",
                },
              ]}
            >
              {achievement.rarity}
            </Text>
          </View>
        </View>

        <View style={styles.achievementContent}>
          <Text
            style={[
              styles.achievementTitle,
              {
                color: achievement.unlocked ? colors.text : colors.icon,
                textAlign: isRTL ? "right" : "left",
              },
            ]}
          >
            {achievement.title}
          </Text>

          <Text
            style={[
              styles.achievementDescription,
              {
                color: colors.icon,
                textAlign: isRTL ? "right" : "left",
              },
            ]}
            numberOfLines={2}
          >
            {achievement.description}
          </Text>

          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={[styles.progressText, { color: colors.text }]}>
                {language === "he"
                  ? `${achievement.progress}/${achievement.maxProgress}`
                  : `${achievement.progress}/${achievement.maxProgress}`}
              </Text>
              <View style={styles.xpReward}>
                <Star size={12} color="#F39C12" fill="#F39C12" />
                <Text style={[styles.xpText, { color: "#F39C12" }]}>
                  +{achievement.xpReward} XP
                </Text>
              </View>
            </View>

            <View
              style={[styles.progressBar, { backgroundColor: colors.border }]}
            >
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    width: `${progressPercentage}%`,
                    backgroundColor: achievement.unlocked
                      ? getRarityColor(achievement.rarity)
                      : colors.emerald500,
                  },
                ]}
              />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const StatsCard = ({ stats, colors, isRTL, language }: any) => (
  <View
    style={[
      styles.statsCard,
      { backgroundColor: colors.card, borderColor: colors.border },
    ]}
  >
    <LinearGradient
      colors={[colors.emerald500 + "15", colors.emerald500 + "05"]}
      style={styles.statsGradient}
    >
      <View style={[styles.statsHeader, isRTL && styles.rtlRow]}>
        <View
          style={[styles.levelBadge, { backgroundColor: colors.emerald500 }]}
        >
          <Crown size={20} color="#FFFFFF" />
          <Text style={styles.levelText}>{stats.level}</Text>
        </View>
        <View style={styles.statsInfo}>
          <Text style={[styles.statsTitle, { color: colors.text }]}>
            {language === "he" ? "הסטטיסטיקות שלך" : "Your Progress"}
          </Text>
          <Text style={[styles.statsSubtitle, { color: colors.icon }]}>
            {language === "he" ? `רמה ${stats.level}` : `Level ${stats.level}`}
          </Text>
        </View>
      </View>

      <View style={styles.xpSection}>
        <View style={[styles.xpHeader, isRTL && styles.rtlRow]}>
          <Text style={[styles.xpLabel, { color: colors.text }]}>
            {language === "he" ? "ניסיון נוכחי" : "Current XP"}
          </Text>
          <Text style={[styles.xpValue, { color: colors.emerald500 }]}>
            {stats.currentXP}/100
          </Text>
        </View>
        <View style={[styles.xpBar, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.xpFill,
              {
                width: `${stats.xpProgress}%`,
                backgroundColor: colors.emerald500,
              },
            ]}
          />
        </View>
      </View>

      <View style={styles.statsGrid}>
        <View style={[styles.statItem, { backgroundColor: colors.surface }]}>
          <TrendingUp size={16} color="#3b82f6" />
          <Text style={[styles.statValue, { color: colors.text }]}>
            {stats.totalPoints}
          </Text>
          <Text style={[styles.statLabel, { color: colors.icon }]}>
            {language === "he" ? "נק' כולל" : "Total XP"}
          </Text>
        </View>

        <View style={[styles.statItem, { backgroundColor: colors.surface }]}>
          <Flame size={16} color="#ef4444" />
          <Text style={[styles.statValue, { color: colors.text }]}>
            {stats.currentStreak}
          </Text>
          <Text style={[styles.statLabel, { color: colors.icon }]}>
            {language === "he" ? "רצף נוכחי" : "Current Streak"}
          </Text>
        </View>

        <View style={[styles.statItem, { backgroundColor: colors.surface }]}>
          <Calendar size={16} color="#16a34a" />
          <Text style={[styles.statValue, { color: colors.text }]}>
            {stats.totalCompleteDays}
          </Text>
          <Text style={[styles.statLabel, { color: colors.icon }]}>
            {language === "he" ? "ימים הושלמו" : "Days Complete"}
          </Text>
        </View>

        <View style={[styles.statItem, { backgroundColor: colors.surface }]}>
          <Trophy size={16} color="#f59e0b" />
          <Text style={[styles.statValue, { color: colors.text }]}>
            {stats.bestStreak}
          </Text>
          <Text style={[styles.statLabel, { color: colors.icon }]}>
            {language === "he" ? "הרצף הטוב" : "Best Streak"}
          </Text>
        </View>
      </View>
    </LinearGradient>
  </View>
);

const AchievementDetailModal = ({
  achievement,
  visible,
  onClose,
  colors,
  isRTL,
  language,
}: any) => (
  <Modal visible={visible} transparent animationType="fade">
    <View style={styles.modalOverlay}>
      <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <X size={24} color={colors.text} />
        </TouchableOpacity>

        {achievement && (
          <>
            <View style={styles.modalHeader}>
              <View
                style={[
                  styles.modalIcon,
                  {
                    backgroundColor: achievement.unlocked
                      ? "#F39C12" + "20"
                      : colors.surface,
                  },
                ]}
              >
                <Text style={styles.modalIconText}>{achievement.icon}</Text>
              </View>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {achievement.title}
              </Text>
              <Text style={[styles.modalRarity, { color: "#F39C12" }]}>
                {achievement.rarity}
              </Text>
            </View>

            <Text style={[styles.modalDescription, { color: colors.icon }]}>
              {achievement.description}
            </Text>

            <View style={styles.modalStats}>
              <View
                style={[
                  styles.modalStatItem,
                  { backgroundColor: colors.surface },
                ]}
              >
                <Star size={20} color="#F39C12" />
                <Text style={[styles.modalStatValue, { color: colors.text }]}>
                  +{achievement.xpReward}
                </Text>
                <Text style={[styles.modalStatLabel, { color: colors.icon }]}>
                  {language === "he" ? "נק' ניסיון" : "XP Reward"}
                </Text>
              </View>

              <View
                style={[
                  styles.modalStatItem,
                  { backgroundColor: colors.surface },
                ]}
              >
                <Target size={20} color={colors.emerald500} />
                <Text style={[styles.modalStatValue, { color: colors.text }]}>
                  {Math.round(
                    (achievement.progress / achievement.maxProgress) * 100
                  )}
                  %
                </Text>
                <Text style={[styles.modalStatLabel, { color: colors.icon }]}>
                  {language === "he" ? "התקדמות" : "Progress"}
                </Text>
              </View>
            </View>

            {achievement.unlocked && achievement.unlockedDate && (
              <View
                style={[
                  styles.unlockedInfo,
                  { backgroundColor: colors.surface },
                ]}
              >
                <CheckCircle size={16} color={colors.emerald500} />
                <Text style={[styles.unlockedText, { color: colors.text }]}>
                  {language === "he" ? "נפתח ב:" : "Unlocked on:"}{" "}
                  {new Date(achievement.unlockedDate).toLocaleDateString()}
                </Text>
              </View>
            )}
          </>
        )}
      </View>
    </View>
  </Modal>
);

export default function AchievementsScreen() {
  const { t } = useTranslation();
  const { isRTL, language } = useLanguage();
  const { colors, isDark } = useTheme();

  const [achievements, setAchievements] = useState<{
    unlocked: Achievement[];
    locked: Achievement[];
  }>({ unlocked: [], locked: [] });
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedAchievement, setSelectedAchievement] =
    useState<Achievement | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const categories = [
    { key: "all", label: language === "he" ? "הכל" : "All", icon: Trophy },
    {
      key: "MILESTONE",
      label: language === "he" ? "אבני דרך" : "Milestones",
      icon: Target,
    },
    {
      key: "STREAK",
      label: language === "he" ? "רצפים" : "Streaks",
      icon: Flame,
    },
    { key: "LEVEL", label: language === "he" ? "רמות" : "Levels", icon: Crown },
    {
      key: "SPECIAL",
      label: language === "he" ? "מיוחדים" : "Special",
      icon: Gift,
    },
  ];

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/achievements");

      if (response.data.success) {
        setAchievements({
          unlocked: response.data.unlockedAchievements || [],
          locked: response.data.lockedAchievements || [],
        });
        setUserStats(response.data.userStats);
      }
    } catch (error) {
      console.error("Error loading achievements:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAchievements();
    setRefreshing(false);
  };

  const filteredAchievements = useMemo(() => {
    const allAchievements = [...achievements.unlocked, ...achievements.locked];

    if (selectedCategory === "all") {
      return allAchievements;
    }

    return allAchievements.filter(
      (achievement) => achievement.category === selectedCategory
    );
  }, [achievements, selectedCategory]);

  const handleAchievementPress = (achievement: Achievement) => {
    setSelectedAchievement(achievement);
    setShowDetail(true);
  };

  if (isLoading) {
    return (
      <LoadingScreen
        text={language === "he" ? "טוען הישגים..." : "Loading achievements..."}
      />
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <Text
          style={[
            styles.title,
            { color: colors.text },
            isRTL && styles.rtlText,
          ]}
        >
          {language === "he" ? "הישגים" : "Achievements"}
        </Text>
        <Text
          style={[
            styles.subtitle,
            { color: colors.icon },
            isRTL && styles.rtlText,
          ]}
        >
          {language === "he" ? "עקוב אחר ההתקדמות שלך" : "Track your progress"}
        </Text>
      </View>

      {/* Stats Card */}
      {userStats && (
        <StatsCard
          stats={userStats}
          colors={colors}
          isRTL={isRTL}
          language={language}
        />
      )}

      {/* Category Filter */}
      <View style={styles.categoryContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {categories.map((category) => {
            const Icon = category.icon;
            const isActive = selectedCategory === category.key;

            return (
              <TouchableOpacity
                key={category.key}
                style={[
                  styles.categoryButton,
                  {
                    backgroundColor: isActive
                      ? colors.emerald500
                      : colors.surface,
                    borderColor: isActive ? colors.emerald500 : colors.border,
                  },
                ]}
                onPress={() => setSelectedCategory(category.key)}
              >
                <Icon size={16} color={isActive ? "#FFFFFF" : colors.icon} />
                <Text
                  style={[
                    styles.categoryText,
                    {
                      color: isActive ? "#FFFFFF" : colors.text,
                    },
                  ]}
                >
                  {category.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Achievements List */}
      <FlatList
        data={filteredAchievements}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <AchievementCard
            achievement={item}
            colors={colors}
            isRTL={isRTL}
            language={language}
            onPress={handleAchievementPress}
          />
        )}
        numColumns={2}
        contentContainerStyle={styles.achievementsList}
        columnWrapperStyle={styles.achievementsRow}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.emerald500]}
            tintColor={colors.emerald500}
          />
        }
      />

      {/* Achievement Detail Modal */}
      <AchievementDetailModal
        achievement={selectedAchievement}
        visible={showDetail}
        onClose={() => {
          setShowDetail(false);
          setSelectedAchievement(null);
        }}
        colors={colors}
        isRTL={isRTL}
        language={language}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.8,
  },
  rtlText: {
    textAlign: "right",
  },
  rtlRow: {
    flexDirection: "row-reverse",
  },

  // Stats Card
  statsCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
  },
  statsGradient: {
    padding: 20,
  },
  statsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 16,
  },
  levelBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  levelText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  statsInfo: {
    flex: 1,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  statsSubtitle: {
    fontSize: 14,
    opacity: 0.8,
  },
  xpSection: {
    marginBottom: 20,
  },
  xpHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  xpLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  xpValue: {
    fontSize: 16,
    fontWeight: "700",
  },
  xpBar: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  xpFill: {
    height: "100%",
    borderRadius: 4,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statItem: {
    flex: 1,
    minWidth: "45%",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    gap: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "800",
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },

  // Categories
  categoryContainer: {
    marginBottom: 20,
  },
  categoryScroll: {
    paddingHorizontal: 20,
    gap: 12,
  },
  categoryButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: "600",
  },

  // Achievements
  achievementsList: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  achievementsRow: {
    justifyContent: "space-between",
    marginBottom: 16,
  },
  achievementCard: {
    width: (width - 52) / 2,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    position: "relative",
    overflow: "hidden",
  },
  glowEffect: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
  },
  achievementHeader: {
    alignItems: "center",
    marginBottom: 12,
    position: "relative",
  },
  achievementIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    position: "relative",
  },
  achievementIcon: {
    fontSize: 28,
  },
  unlockedBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  lockedOverlay: {
    position: "absolute",
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  rarityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  rarityText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  achievementContent: {
    gap: 8,
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
  },
  achievementDescription: {
    fontSize: 12,
    textAlign: "center",
    lineHeight: 16,
  },
  progressSection: {
    marginTop: 8,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  progressText: {
    fontSize: 12,
    fontWeight: "600",
  },
  xpReward: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  xpText: {
    fontSize: 10,
    fontWeight: "700",
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 24,
    padding: 24,
    position: "relative",
  },
  closeButton: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  modalIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  modalIconText: {
    fontSize: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 8,
    textAlign: "center",
  },
  modalRarity: {
    fontSize: 14,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  modalDescription: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
    marginBottom: 20,
  },
  modalStats: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 20,
  },
  modalStatItem: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    gap: 8,
  },
  modalStatValue: {
    fontSize: 18,
    fontWeight: "800",
  },
  modalStatLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  unlockedInfo: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  unlockedText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
