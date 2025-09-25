import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';

import { AppDispatch, RootState } from '@/store';
import { fetchRedemptions, redeemPoints } from '@/store/slices/redemptionSlice';
import { Card, LoadingSpinner, ErrorMessage, Button } from '@/components/common';
import { COLORS, SPACING, TYPOGRAPHY } from '@/constants';
import { RedemptionOption } from '@/types';

const REDEMPTION_OPTIONS: RedemptionOption[] = [
  {
    id: 'amazon-500',
    name: 'Amazonギフト券',
    description: '500円分のAmazonギフト券',
    points: 500,
    value: 500,
    currency: 'JPY',
    icon: 'card',
    category: 'gift-card',
    isAvailable: true,
  },
  {
    id: 'amazon-1000',
    name: 'Amazonギフト券',
    description: '1,000円分のAmazonギフト券',
    points: 1000,
    value: 1000,
    currency: 'JPY',
    icon: 'card',
    category: 'gift-card',
    isAvailable: true,
  },
  {
    id: 'amazon-3000',
    name: 'Amazonギフト券',
    description: '3,000円分のAmazonギフト券',
    points: 3000,
    value: 3000,
    currency: 'JPY',
    icon: 'card',
    category: 'gift-card',
    isAvailable: true,
  },
  {
    id: 'starbucks-500',
    name: 'スターバックス カード',
    description: '500円分のスターバックス カード',
    points: 500,
    value: 500,
    currency: 'JPY',
    icon: 'cafe',
    category: 'gift-card',
    isAvailable: true,
  },
  {
    id: 'paypal-1000',
    name: 'PayPal送金',
    description: '1,000円をPayPalアカウントに送金',
    points: 1000,
    value: 1000,
    currency: 'JPY',
    icon: 'wallet',
    category: 'digital-money',
    isAvailable: false,
  },
];

const RedeemScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { history, isLoading, error } = useSelector((state: RootState) => state.redemption);
  const { totalPoints } = useSelector((state: RootState) => state.auth.user || { totalPoints: 0 });

  const [refreshing, setRefreshing] = useState(false);
  const [redeeming, setRedeeming] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchRedemptions());
  }, [dispatch]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await dispatch(fetchRedemptions()).unwrap();
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleRedeem = async (option: RedemptionOption) => {
    if (totalPoints < option.points) {
      Alert.alert(
        'ポイントが不足しています',
        `この商品には${option.points}ポイントが必要ですが、現在${totalPoints}ポイントしかありません。`
      );
      return;
    }

    Alert.alert(
      '交換の確認',
      `${option.points}ポイントで「${option.name}」と交換しますか？\n\n※この操作は取り消すことができません。`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '交換する',
          style: 'destructive',
          onPress: async () => {
            setRedeeming(option.id);
            try {
              await dispatch(redeemPoints({
                optionId: option.id,
                points: option.points,
              })).unwrap();

              Alert.alert(
                '交換完了',
                `${option.name}との交換が完了しました！\nギフトコードは登録されたメールアドレスに送信されます。`,
                [{ text: 'OK' }]
              );
            } catch (error) {
              Alert.alert(
                'エラー',
                'ポイント交換に失敗しました。しばらく経ってから再度お試しください。',
                [{ text: 'OK' }]
              );
            } finally {
              setRedeeming(null);
            }
          },
        },
      ]
    );
  };

  const renderRedemptionOption = ({ item }: { item: RedemptionOption }) => {
    const canRedeem = totalPoints >= item.points && item.isAvailable;
    const isProcessing = redeeming === item.id;

    return (
      <Card style={[styles.optionCard, !canRedeem && styles.optionCardDisabled]}>
        <View style={styles.optionHeader}>
          <View style={[
            styles.iconContainer,
            { backgroundColor: canRedeem ? COLORS.primary + '20' : COLORS.textMuted + '20' }
          ]}>
            <Ionicons
              name={item.icon as any}
              size={24}
              color={canRedeem ? COLORS.primary : COLORS.textMuted}
            />
          </View>
          <View style={styles.optionInfo}>
            <Text style={[styles.optionName, !canRedeem && styles.optionNameDisabled]}>
              {item.name}
            </Text>
            <Text style={styles.optionDescription}>
              {item.description}
            </Text>
          </View>
          {!item.isAvailable && (
            <View style={styles.unavailableBadge}>
              <Text style={styles.unavailableText}>準備中</Text>
            </View>
          )}
        </View>

        <View style={styles.optionFooter}>
          <View style={styles.pointsRequired}>
            <Text style={[styles.pointsText, !canRedeem && styles.pointsTextDisabled]}>
              {item.points.toLocaleString()}ポイント
            </Text>
            <Text style={styles.valueText}>
              ¥{item.value.toLocaleString()}相当
            </Text>
          </View>

          <Button
            title={isProcessing ? '交換中...' : '交換する'}
            onPress={() => handleRedeem(item)}
            disabled={!canRedeem || isProcessing}
            loading={isProcessing}
            size="small"
            variant={canRedeem ? 'primary' : 'outline'}
          />
        </View>
      </Card>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="gift-outline" size={60} color={COLORS.textMuted} />
      <Text style={styles.emptyTitle}>交換商品を読み込み中</Text>
      <Text style={styles.emptySubtitle}>
        しばらくお待ちください
      </Text>
    </View>
  );

  if (isLoading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingSpinner message="交換商品を読み込み中..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>ポイント交換</Text>
        <View style={styles.pointsBalance}>
          <Text style={styles.balanceLabel}>利用可能ポイント</Text>
          <Text style={styles.balanceAmount}>{totalPoints.toLocaleString()}</Text>
        </View>
      </View>

      {error && (
        <ErrorMessage
          message={error}
          onRetry={() => dispatch(fetchRedemptions())}
        />
      )}

      <FlatList
        data={REDEMPTION_OPTIONS}
        renderItem={renderRedemptionOption}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
        ListEmptyComponent={renderEmptyState}
      />

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          ※ ギフトコードは交換後24時間以内にメールで送信されます
        </Text>
        <Text style={styles.footerText}>
          ※ 交換したポイントは返還できません
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  header: {
    padding: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  title: {
    fontSize: TYPOGRAPHY.fontSizes['2xl'],
    fontWeight: TYPOGRAPHY.fontWeights.bold,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },

  pointsBalance: {
    alignItems: 'center',
    marginTop: SPACING.sm,
  },

  balanceLabel: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },

  balanceAmount: {
    fontSize: TYPOGRAPHY.fontSizes.xl,
    fontWeight: TYPOGRAPHY.fontWeights.bold,
    color: COLORS.primary,
  },

  listContainer: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },

  optionCard: {
    marginBottom: SPACING.md,
    opacity: 1,
  },

  optionCardDisabled: {
    opacity: 0.6,
  },

  optionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },

  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },

  optionInfo: {
    flex: 1,
  },

  optionName: {
    fontSize: TYPOGRAPHY.fontSizes.lg,
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },

  optionNameDisabled: {
    color: COLORS.textMuted,
  },

  optionDescription: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },

  unavailableBadge: {
    backgroundColor: COLORS.warning + '20',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
  },

  unavailableText: {
    fontSize: TYPOGRAPHY.fontSizes.xs,
    color: COLORS.warning,
    fontWeight: TYPOGRAPHY.fontWeights.medium,
  },

  optionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },

  pointsRequired: {
    flex: 1,
  },

  pointsText: {
    fontSize: TYPOGRAPHY.fontSizes.lg,
    fontWeight: TYPOGRAPHY.fontWeights.bold,
    color: COLORS.primary,
    marginBottom: 2,
  },

  pointsTextDisabled: {
    color: COLORS.textMuted,
  },

  valueText: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.textSecondary,
  },

  footer: {
    padding: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },

  footerText: {
    fontSize: TYPOGRAPHY.fontSizes.xs,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },

  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: SPACING.xl * 2,
  },

  emptyTitle: {
    fontSize: TYPOGRAPHY.fontSizes.lg,
    fontWeight: TYPOGRAPHY.fontWeights.semibold,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },

  emptySubtitle: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
});

export default RedeemScreen;