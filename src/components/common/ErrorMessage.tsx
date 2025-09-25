import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '@/constants';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  retryText?: string;
  showIcon?: boolean;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  onRetry,
  retryText = '再試行',
  showIcon = true,
}) => {
  return (
    <View style={styles.container}>
      {showIcon && (
        <Ionicons
          name="warning"
          size={24}
          color={COLORS.error}
          style={styles.icon}
        />
      )}
      <Text style={styles.message}>{message}</Text>
      {onRetry && (
        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
          <Text style={styles.retryText}>{retryText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    margin: SPACING.md,
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.error,
  },

  icon: {
    marginBottom: SPACING.sm,
  },

  message: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 22,
  },

  retryButton: {
    backgroundColor: COLORS.error,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    marginTop: SPACING.md,
  },

  retryText: {
    color: COLORS.text,
    fontSize: TYPOGRAPHY.fontSizes.sm,
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
  },
});

export default ErrorMessage;