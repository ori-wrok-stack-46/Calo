import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from "react-native";
import { useLanguage } from "@/src/i18n/context/LanguageContext";
import { useTheme } from "@/src/context/ThemeContext";
import {
  Star,
  ChevronDown,
  ChevronUp,
  Clock,
  Heart,
} from "lucide-react-native";

interface MealRatingCardProps {
  mealName: string;
  mealTiming: string;
  currentRating: number;
  isFavorite: boolean;
  prepTime?: number;
  onRatingChange: (rating: number) => void;
  onFavoriteToggle: () => void;
  expanded?: boolean;
  onToggleExpand?: () => void;
}

export const MealRatingCard: React.FC<MealRatingCardProps> = ({
  mealName,
  mealTiming,
  currentRating,
  isFavorite,
  prepTime,
  onRatingChange,
  onFavoriteToggle,
  expanded = false,
  onToggleExpand,
}) => {
  const { isRTL, language } = useLanguage();
  const { colors } = useTheme();
  const [animationValue] = useState(new Animated.Value(expanded ? 1 : 0));

  const toggleExpand = () => {
    if (onToggleExpand) {
      onToggleExpand();
    }

    Animated.timing(animationValue, {
      toValue: expanded ? 0 : 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const renderStarRating = (
    rating: number,
    onPress: (rating: number) => void,
    size: number = 20
  ) => {
    return (
      <View style={[styles.starContainer, isRTL && styles.rtlRow]}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => onPress(star)}
            style={styles.starButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Star
              size={size}
              color={star <= rating ? "#fbbf24" : colors.border}
              fill={star <= rating ? "#fbbf24" : "transparent"}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const ratingHeight = animationValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 60],
  });

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      {/* Meal Header */}
      <TouchableOpacity
        style={[styles.header, isRTL && styles.rtlRow]}
        onPress={toggleExpand}
        activeOpacity={0.7}
      >
        <View style={[styles.mealInfo, isRTL && styles.rtlAlign]}>
          <Text
            style={[
              styles.mealName,
              { color: colors.text },
              isRTL && styles.rtlText,
            ]}
          >
            {mealName}
          </Text>
          <View style={[styles.mealMeta, isRTL && styles.rtlRow]}>
            <Text style={[styles.mealTiming, { color: colors.icon }]}>
              {mealTiming}
            </Text>
            {prepTime && (
              <>
                <Text style={{ color: colors.icon }}>•</Text>
                <View style={[styles.timeContainer, isRTL && styles.rtlRow]}>
                  <Clock size={12} color={colors.icon} />
                  <Text style={[styles.prepTime, { color: colors.icon }]}>
                    {prepTime} {language === "he" ? "דק'" : "min"}
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>

        <View style={[styles.headerActions, isRTL && styles.rtlRow]}>
          {/* Current Rating Display */}
          {currentRating > 0 && (
            <View style={[styles.currentRating, isRTL && styles.rtlRow]}>
              <Star size={16} color="#fbbf24" fill="#fbbf24" />
              <Text style={[styles.ratingText, { color: colors.text }]}>
                {currentRating}
              </Text>
            </View>
          )}

          {/* Favorite Button */}
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={onFavoriteToggle}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Heart
              size={18}
              color={isFavorite ? "#ef4444" : colors.icon}
              fill={isFavorite ? "#ef4444" : "transparent"}
            />
          </TouchableOpacity>

          {/* Expand Button */}
          <TouchableOpacity style={styles.expandButton} onPress={toggleExpand}>
            {expanded ? (
              <ChevronUp size={20} color={colors.icon} />
            ) : (
              <ChevronDown size={20} color={colors.icon} />
            )}
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      {/* Rating Section */}
      <Animated.View style={[styles.ratingSection, { height: ratingHeight }]}>
        <View style={[styles.ratingContent, isRTL && styles.rtlAlign]}>
          <Text
            style={[
              styles.ratingLabel,
              { color: colors.text },
              isRTL && styles.rtlText,
            ]}
          >
            {language === "he" ? "דרג ארוחה זו:" : "Rate this meal:"}
          </Text>
          {renderStarRating(currentRating, onRatingChange, 24)}
        </View>
      </Animated.View>

      {/* Rating Description */}
      {expanded && currentRating > 0 && (
        <View
          style={[
            styles.ratingDescription,
            { backgroundColor: colors.surface },
          ]}
        >
          <Text
            style={[
              styles.descriptionText,
              { color: colors.icon },
              isRTL && styles.rtlText,
            ]}
          >
            {currentRating === 1 &&
              (language === "he" ? "לא אהבתי" : "Didn't like it")}
            {currentRating === 2 &&
              (language === "he" ? "בסדר" : "It was okay")}
            {currentRating === 3 && (language === "he" ? "טוב" : "Good")}
            {currentRating === 4 &&
              (language === "he" ? "טוב מאוד" : "Very good")}
            {currentRating === 5 &&
              (language === "he" ? "מעולה!" : "Excellent!")}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    marginVertical: 6,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  mealInfo: {
    flex: 1,
  },
  mealName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  mealMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  mealTiming: {
    fontSize: 12,
    textTransform: "capitalize",
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  prepTime: {
    fontSize: 12,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  currentRating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: "600",
  },
  favoriteButton: {
    padding: 4,
  },
  expandButton: {
    padding: 4,
  },
  ratingSection: {
    overflow: "hidden",
    paddingHorizontal: 16,
  },
  ratingContent: {
    alignItems: "center",
    paddingBottom: 16,
  },
  ratingLabel: {
    fontSize: 14,
    marginBottom: 8,
    textAlign: "center",
  },
  starContainer: {
    flexDirection: "row",
    gap: 4,
  },
  starButton: {
    padding: 4,
  },
  ratingDescription: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
  },
  descriptionText: {
    fontSize: 12,
    textAlign: "center",
    fontStyle: "italic",
  },
  rtlText: {
    textAlign: "right",
    writingDirection: "rtl",
  },
  rtlRow: {
    flexDirection: "row-reverse",
  },
  rtlAlign: {
    alignItems: "flex-end",
  },
});

export default MealRatingCard;
