import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '@/constants';

interface ProgressBarProps {
  progress: number; // 0 to 1
  height?: number;
  backgroundColor?: string;
  progressColor?: string;
  showPercentage?: boolean;
  label?: string;
  style?: ViewStyle;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  height = 8,
  backgroundColor = COLORS.surface,
  progressColor = COLORS.primary,
  showPercentage = false,
  label,
  style,
}) => {
  const clampedProgress = Math.max(0, Math.min(1, progress));
  const percentage = Math.round(clampedProgress * 100);

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View style={styles.progressContainer}>
        <View
          style={[
            styles.progressBackground,
            {
              height,
              backgroundColor,
            },
          ]}
        >
          <View
            style={[
              styles.progressFill,
              {
                width: `${percentage}%`,
                height,
                backgroundColor: progressColor,
              },
            ]}
          />
        </View>

        {showPercentage && (
          <Text style={styles.percentage}>{percentage}%</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },

  label: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    fontWeight: TYPOGRAPHY.fontWeights.medium,
  },

  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  progressBackground: {
    flex: 1,
    borderRadius: 100,
    overflow: 'hidden',
  },

  progressFill: {
    borderRadius: 100,
    minWidth: 2,
  },

  percentage: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
    fontWeight: TYPOGRAPHY.fontWeights.medium,
    minWidth: 35,
    textAlign: 'right',
  },
});

export default ProgressBar;