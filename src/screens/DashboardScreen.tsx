import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';

import { AppDispatch, RootState } from '@/store';
import { syncStepsData, loadTodaySteps } from '@/store/slices/stepsSlice';
import { loadPointsBalance, earnPointsFromSteps, earnPointsFromAd } from '@/store/slices/pointsSlice';
import { Card, LoadingSpinner, ErrorMessage, Button } from '@/components/common';
import { COLORS, SPACING, TYPOGRAPHY, POINTS_CONFIG } from '@/constants';

const DashboardScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();

  const { user } = useSelector((state: RootState) => state.auth);
  const { todaySteps, isLoading: stepsLoading, error: stepsError } = useSelector(
    (state: RootState) => state.steps
  );
  const { balance, dailyEarned, dailyLimit, isLoading: pointsLoading } = useSelector(
    (state: RootState) => state.points
  );

  const [refreshing, setRefreshing] = useState(false);
  const [syncingSteps, setSyncingSteps] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      await Promise.all([
        dispatch(loadTodaySteps()),
        dispatch(loadPointsBalance()),
      ]);
    } catch (error) {
      console.error('Failed to load initial data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadInitialData();
    } finally {
      setRefreshing(false);
    }
  };

  const handleSyncSteps = async () => {
    setSyncingSteps(true);
    try {
      const result = await dispatch(syncStepsData()).unwrap();

      // If points were earned from steps, show success message
      if (result.stepData.pointsEarned > 0) {
        Alert.alert(
          'ポイント獲得！',
          `${result.stepData.pointsEarned}ポイントを獲得しました！`,
          [{ text: 'OK' }]
        );
        // Refresh points balance
        dispatch(loadPointsBalance());
      }
    } catch (error) {
      Alert.alert('同期エラー', '歩数の同期に失敗しました。再度お試しください。');
    } finally {
      setSyncingSteps(false);
    }
  };

  const handleWatchAd = async () => {
    // Check if user can still watch ads today
    if (dailyLimit.adPoints.current >= dailyLimit.adPoints.max) {
      Alert.alert(
        '上限達成',
        '本日の動画広告視聴上限に達しています。明日また挑戦してください！',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      // Mock ad viewing - in real app, this would integrate with AdMob
      const mockAdData = {
        adType: 'rewarded' as const,
        adUnitId: 'mock_unit_id',
        watchedDuration: 30,
        completed: true,
      };

      const result = await dispatch(earnPointsFromAd(mockAdData)).unwrap();

      if (result.transaction) {
        Alert.alert(
          '動画視聴完了！',
          `${result.transaction.amount}ポイントを獲得しました！`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert('エラー', '動画広告の処理中にエラーが発生しました。');
    }
  };

  // Calculate progress percentage
  const getStepProgress = () => {
    if (!todaySteps) return 0;
    return Math.min((todaySteps.steps / 10000) * 100, 100);
  };

  const getStepGoalMessage = () => {
    if (!todaySteps) return '歩数データを取得中...';

    const steps = todaySteps.steps;
    const goal = 10000;

    if (steps >= goal) {
      const excess = steps - goal;
      return `🎉 目標達成！${excess.toLocaleString()}歩オーバー`;
    } else {
      const remaining = goal - steps;
      return `あと${remaining.toLocaleString()}歩で目標達成`;
    }
  };

  const canEarnMoreStepsPoints = () => {
    return dailyLimit.stepsPoints.current < dailyLimit.stepsPoints.max;
  };

  const canEarnMoreAdPoints = () => {
    return dailyLimit.adPoints.current < dailyLimit.adPoints.max;
  };

  if (stepsLoading && !todaySteps) {
    return (
      <LoadingSpinner
        message="データを読み込み中..."
        style={styles.centerLoader}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Greeting Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>おはようございます</Text>
            <Text style={styles.userName}>{user?.displayName}さん</Text>
          </View>
          <TouchableOpacity
            style={styles.syncButton}
            onPress={handleSyncSteps}
            disabled={syncingSteps}
          >
            <Ionicons
              name={syncingSteps ? 'sync' : 'refresh'}
              size={24}
              color={COLORS.primary}
              style={syncingSteps ? styles.rotating : undefined}
            />
          </TouchableOpacity>
        </View>

        {/* Error Display */}
        {stepsError && (
          <ErrorMessage
            message={stepsError}
            onRetry={() => dispatch(loadTodaySteps())}
          />
        )}

        {/* Today's Steps Card */}
        <Card style={styles.stepsCard}>
          <View style={styles.stepsHeader}>
            <Text style={styles.cardTitle}>今日の歩数</Text>
            <Ionicons name="walk" size={24} color={COLORS.primary} />
          </View>

          <View style={styles.stepsDisplay}>
            <Text style={styles.stepsNumber}>
              {todaySteps?.steps.toLocaleString() || '0'}
            </Text>
            <Text style={styles.stepsUnit}>歩</Text>
          </View>

          <Text style={styles.goalMessage}>{getStepGoalMessage()}</Text>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${getStepProgress()}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>{Math.round(getStepProgress())}%</Text>
          </View>

          {/* Additional Stats */}
          {todaySteps && (
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Ionicons name="flame" size={16} color={COLORS.warning} />
                <Text style={styles.statText}>
                  {Math.round(todaySteps.calories || 0)} kcal
                </Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="location" size={16} color={COLORS.info} />
                <Text style={styles.statText}>
                  {((todaySteps.distance || 0) / 1000).toFixed(1)} km
                </Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="time" size={16} color={COLORS.success} />
                <Text style={styles.statText}>
                  {todaySteps.activeMinutes || 0} 分
                </Text>
              </View>
            </View>
          )}
        </Card>

        {/* Points Summary Card */}
        <Card style={styles.pointsCard}>
          <View style={styles.pointsHeader}>
            <Text style={styles.cardTitle}>ポイント残高</Text>
            <Ionicons name="wallet" size={24} color={COLORS.points} />
          </View>

          <View style={styles.pointsDisplay}>
            <Text style={styles.pointsNumber}>{balance.toLocaleString()}</Text>
            <Text style={styles.pointsUnit}>P</Text>
          </View>

          <Text style={styles.dailyEarned}>
            今日の獲得: {dailyEarned}P
          </Text>

          {/* Daily Limits Progress */}
          <View style={styles.limitsContainer}>
            <View style={styles.limitItem}>
              <Text style={styles.limitLabel}>歩数ポイント</Text>
              <Text style={styles.limitValue}>
                {dailyLimit.stepsPoints.current}/{dailyLimit.stepsPoints.max}
              </Text>
            </View>
            <View style={styles.limitItem}>
              <Text style={styles.limitLabel}>広告ポイント</Text>
              <Text style={styles.limitValue}>
                {dailyLimit.adPoints.current}/{dailyLimit.adPoints.max}
              </Text>
            </View>
          </View>
        </Card>

        {/* Actions Card */}
        <Card style={styles.actionsCard}>
          <Text style={styles.cardTitle}>ポイントを貯める</Text>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                !canEarnMoreStepsPoints() && styles.disabledButton,
              ]}
              onPress={handleSyncSteps}
              disabled={!canEarnMoreStepsPoints() || syncingSteps}
            >
              <View style={styles.actionButtonContent}>
                <Ionicons
                  name="footsteps"
                  size={32}
                  color={canEarnMoreStepsPoints() ? COLORS.primary : COLORS.textMuted}
                />
                <Text style={[
                  styles.actionButtonTitle,
                  !canEarnMoreStepsPoints() && styles.disabledText,
                ]}>
                  歩数同期
                </Text>
                <Text style={[
                  styles.actionButtonSubtitle,
                  !canEarnMoreStepsPoints() && styles.disabledText,
                ]}>
                  {canEarnMoreStepsPoints() ? 'ポイント獲得' : '上限達成'}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionButton,
                !canEarnMoreAdPoints() && styles.disabledButton,
              ]}
              onPress={handleWatchAd}
              disabled={!canEarnMoreAdPoints()}
            >
              <View style={styles.actionButtonContent}>
                <Ionicons
                  name="play-circle"
                  size={32}
                  color={canEarnMoreAdPoints() ? COLORS.success : COLORS.textMuted}
                />
                <Text style={[
                  styles.actionButtonTitle,
                  !canEarnMoreAdPoints() && styles.disabledText,
                ]}>
                  動画視聴
                </Text>
                <Text style={[
                  styles.actionButtonSubtitle,
                  !canEarnMoreAdPoints() && styles.disabledText,
                ]}>
                  {canEarnMoreAdPoints() ? '+3P' : '上限達成'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Quick Stats Card */}
        <Card style={styles.quickStatsCard}>
          <Text style={styles.cardTitle}>今週の成果</Text>

          <View style={styles.weeklyStats}>
            <View style={styles.statBox}>
              <Text style={styles.statBoxNumber}>
                {Math.floor(Math.random() * 50000 + 20000).toLocaleString()}
              </Text>
              <Text style={styles.statBoxLabel}>週間歩数</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statBoxNumber}>
                {Math.floor(Math.random() * 100 + 20)}
              </Text>
              <Text style={styles.statBoxLabel}>週間ポイント</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statBoxNumber}>
                {Math.floor(Math.random() * 6 + 1)}
              </Text>
              <Text style={styles.statBoxLabel}>目標達成日</Text>
            </View>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xl,
  },

  centerLoader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },

  greeting: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    color: COLORS.textSecondary,
  },

  userName: {
    fontSize: TYPOGRAPHY.fontSizes.xl,
    fontWeight: TYPOGRAPHY.fontWeights.bold,
    color: COLORS.text,
    marginTop: 2,
  },

  syncButton: {
    padding: SPACING.sm,
    borderRadius: 25,
    backgroundColor: COLORS.surface,
  },

  rotating: {
    transform: [{ rotate: '360deg' }],
  },

  stepsCard: {
    marginBottom: SPACING.md,
  },

  stepsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },

  cardTitle: {
    fontSize: TYPOGRAPHY.fontSizes.lg,
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
    color: COLORS.text,
  },

  stepsDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: SPACING.sm,
  },

  stepsNumber: {
    fontSize: TYPOGRAPHY.fontSizes['4xl'],
    fontWeight: TYPOGRAPHY.fontWeights.bold,
    color: COLORS.primary,
  },

  stepsUnit: {
    fontSize: TYPOGRAPHY.fontSizes.xl,
    color: COLORS.textSecondary,
    marginLeft: SPACING.xs,
  },

  goalMessage: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },

  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },

  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    marginRight: SPACING.sm,
  },

  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },

  progressText: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
  },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },

  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  statText: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.textSecondary,
    marginLeft: SPACING.xs,
  },

  pointsCard: {
    marginBottom: SPACING.md,
  },

  pointsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },

  pointsDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: SPACING.sm,
  },

  pointsNumber: {
    fontSize: TYPOGRAPHY.fontSizes['4xl'],
    fontWeight: TYPOGRAPHY.fontWeights.bold,
    color: COLORS.points,
  },

  pointsUnit: {
    fontSize: TYPOGRAPHY.fontSizes.xl,
    color: COLORS.textSecondary,
    marginLeft: SPACING.xs,
  },

  dailyEarned: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    color: COLORS.success,
    marginBottom: SPACING.md,
  },

  limitsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },

  limitItem: {
    alignItems: 'center',
  },

  limitLabel: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.textSecondary,
  },

  limitValue: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
    color: COLORS.text,
    marginTop: 2,
  },

  actionsCard: {
    marginBottom: SPACING.md,
  },

  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.md,
  },

  actionButton: {
    flex: 0.48,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
    padding: SPACING.md,
  },

  disabledButton: {
    opacity: 0.5,
  },

  actionButtonContent: {
    alignItems: 'center',
  },

  actionButtonTitle: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
    color: COLORS.text,
    marginTop: SPACING.sm,
  },

  actionButtonSubtitle: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },

  disabledText: {
    color: COLORS.textMuted,
  },

  quickStatsCard: {
    marginBottom: SPACING.md,
  },

  weeklyStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.md,
  },

  statBox: {
    alignItems: 'center',
    flex: 1,
  },

  statBoxNumber: {
    fontSize: TYPOGRAPHY.fontSizes.xl,
    fontWeight: TYPOGRAPHY.fontWeights.bold,
    color: COLORS.text,
  },

  statBoxLabel: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});

export default DashboardScreen;