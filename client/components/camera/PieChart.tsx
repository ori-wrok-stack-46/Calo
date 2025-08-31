
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useTheme } from '@/src/context/ThemeContext';
import { useTranslation } from 'react-i18next';

interface PieChartProps {
  protein: number;
  carbs: number;
  fat: number;
  size?: number;
}

export const PieChart: React.FC<PieChartProps> = ({
  protein,
  carbs,
  fat,
  size = 120,
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const total = protein + carbs + fat;
  const radius = size / 2 - 10;
  const center = size / 2;

  // Calculate angles for each segment
  const proteinAngle = total > 0 ? (protein / total) * 360 : 0;
  const carbsAngle = total > 0 ? (carbs / total) * 360 : 0;
  const fatAngle = total > 0 ? (fat / total) * 360 : 0;

  // Calculate percentages
  const proteinPercent = total > 0 ? Math.round((protein / total) * 100) : 0;
  const carbsPercent = total > 0 ? Math.round((carbs / total) * 100) : 0;
  const fatPercent = total > 0 ? Math.round((fat / total) * 100) : 0;

  // Create SVG paths for each segment
  const createPath = (startAngle: number, endAngle: number) => {
    const start = (startAngle * Math.PI) / 180;
    const end = (endAngle * Math.PI) / 180;
    
    const x1 = center + radius * Math.cos(start);
    const y1 = center + radius * Math.sin(start);
    const x2 = center + radius * Math.cos(end);
    const y2 = center + radius * Math.sin(end);
    
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    
    return `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
  };

  const colors_chart = {
    protein: '#3B82F6',
    carbs: '#F59E0B',
    fat: '#EF4444',
  };

  if (total === 0) {
    return (
      <View style={[styles.container, { width: size, height: size }]}>
        <View style={[styles.emptyChart, { backgroundColor: colors.surface }]}>
          <Text style={[styles.emptyText, { color: colors.icon }]}>
            {t('nutrition.noData') || 'No data'}
          </Text>
        </View>
      </View>
    );
  }

  let currentAngle = 0;
  const segments = [];

  if (protein > 0) {
    segments.push({
      path: createPath(currentAngle, currentAngle + proteinAngle),
      color: colors_chart.protein,
      label: t('nutrition.protein') || 'Protein',
      value: protein,
      percent: proteinPercent,
    });
    currentAngle += proteinAngle;
  }

  if (carbs > 0) {
    segments.push({
      path: createPath(currentAngle, currentAngle + carbsAngle),
      color: colors_chart.carbs,
      label: t('nutrition.carbs') || 'Carbs',
      value: carbs,
      percent: carbsPercent,
    });
    currentAngle += carbsAngle;
  }

  if (fat > 0) {
    segments.push({
      path: createPath(currentAngle, currentAngle + fatAngle),
      color: colors_chart.fat,
      label: t('nutrition.fat') || 'Fat',
      value: fat,
      percent: fatPercent,
    });
  }

  return (
    <View style={styles.container}>
      <View style={styles.chartContainer}>
        <Svg width={size} height={size}>
          {segments.map((segment, index) => (
            <Path
              key={index}
              d={segment.path}
              fill={segment.color}
              stroke={colors.background}
              strokeWidth={2}
            />
          ))}
        </Svg>
        
        {/* Center circle */}
        <View 
          style={[
            styles.centerCircle, 
            { 
              backgroundColor: colors.background,
              top: size / 2 - 20,
              left: size / 2 - 20,
            }
          ]} 
        />
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        {segments.map((segment, index) => (
          <View key={index} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: segment.color }]} />
            <Text style={[styles.legendText, { color: colors.text }]}>
              {segment.label} ({segment.percent}%)
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  chartContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  centerCircle: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  emptyChart: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '500',
  },
  legend: {
    alignItems: 'flex-start',
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
