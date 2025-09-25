import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';

import { AppDispatch, RootState } from '@/store';
import { fetchPointHistory } from '@/store/slices/pointsSlice';
import { Card, LoadingSpinner, ErrorMessage } from '@/components/common';
import { COLORS, SPACING, TYPOGRAPHY } from '@/constants';
import { PointTransaction } from '@/types';

type FilterType = 'all' | 'earned' | 'redeemed';

const PointsScreen: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { history, isLoading, error } = useSelector((state: RootState) => state.points);
  const { totalPoints } = useSelector((state: RootState) => state.auth.user || { totalPoints: 0 });

  const [filter, setFilter] = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    dispatch(fetchPointHistory());
  }, [dispatch]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await dispatch(fetchPointHistory()).unwrap();
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const filteredHistory = history.filter(transaction => {
    if (filter === 'all') return true;
    if (filter === 'earned') return transaction.amount > 0;
    if (filter === 'redeemed') return transaction.amount < 0;
    return true;
  });

  const getTransactionIcon = (transaction: PointTransaction) => {
    if (transaction.amount > 0) {
      return transaction.type === 'steps' ? 'walk' : 'gift';
    }
    return 'card';
  };

  const getTransactionColor = (transaction: PointTransaction) => {
    return transaction.amount > 0 ? COLORS.success : COLORS.error;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return '今日';
    if (diffDays === 2) return '昨日';
    if (diffDays <= 7) return `${diffDays - 1}日前`;

    return date.toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric',
    });
  };

  const renderTransaction = ({ item }: { item: PointTransaction }) => (
    <Card style={styles.transactionCard}>
      <View style={styles.transactionContent}>
        <View style={styles.transactionLeft}>
          <View style={[
            styles.iconContainer,
            { backgroundColor: getTransactionColor(item) + '20' }
          ]}>
            <Ionicons
              name={getTransactionIcon(item)}
              size={20}
              color={getTransactionColor(item)}
            />
          </View>
          <View style={styles.transactionInfo}>
            <Text style={styles.transactionDescription}>
              {item.description}
            </Text>
            <Text style={styles.transactionDate}>
              {formatDate(item.createdAt)}
            </Text>
          </View>
        </View>
        <View style={styles.transactionRight}>
          <Text style={[
            styles.transactionAmount,
            { color: getTransactionColor(item) }
          ]}>
            {item.amount > 0 ? '+' : ''}{item.amount.toLocaleString()}
          </Text>
          <Text style={styles.transactionPoints}>ポイント</Text>
        </View>
      </View>
    </Card>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="receipt-outline" size={60} color={COLORS.textMuted} />
      <Text style={styles.emptyTitle}>ポイント履歴がありません</Text>
      <Text style={styles.emptySubtitle}>
        歩いてポイントを獲得しましょう！
      </Text>
    </View>
  );

  const FilterButton = ({ type, label, isActive }: {
    type: FilterType;
    label: string;
    isActive: boolean;
  }) => (
    <TouchableOpacity
      style={[styles.filterButton, isActive && styles.filterButtonActive]}
      onPress={() => setFilter(type)}
    >
      <Text style={[
        styles.filterButtonText,
        isActive && styles.filterButtonTextActive
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  if (isLoading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingSpinner message="ポイント履歴を読み込み中..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>ポイント履歴</Text>
        <View style={styles.totalPointsContainer}>
          <Text style={styles.totalPointsLabel}>現在のポイント</Text>
          <Text style={styles.totalPoints}>{totalPoints.toLocaleString()}</Text>
        </View>
      </View>

      {error && (
        <ErrorMessage
          message={error}
          onRetry={() => dispatch(fetchPointHistory())}
        />
      )}

      <View style={styles.filterContainer}>
        <FilterButton
          type="all"
          label="すべて"
          isActive={filter === 'all'}
        />
        <FilterButton
          type="earned"
          label="獲得"
          isActive={filter === 'earned'}
        />
        <FilterButton
          type="redeemed"
          label="使用"
          isActive={filter === 'redeemed'}
        />
      </View>

      <FlatList
        data={filteredHistory}
        renderItem={renderTransaction}
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

  totalPointsContainer: {
    alignItems: 'center',
    marginTop: SPACING.sm,
  },

  totalPointsLabel: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },

  totalPoints: {
    fontSize: TYPOGRAPHY.fontSizes.xl,
    fontWeight: TYPOGRAPHY.fontWeights.bold,
    color: COLORS.primary,
  },

  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },

  filterButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
  },

  filterButtonActive: {
    backgroundColor: COLORS.primary,
  },

  filterButtonText: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    fontWeight: TYPOGRAPHY.fontWeights.medium,
    color: COLORS.textSecondary,
  },

  filterButtonTextActive: {
    color: COLORS.white,
  },

  listContainer: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
  },

  transactionCard: {
    marginBottom: SPACING.sm,
  },

  transactionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },

  transactionInfo: {
    flex: 1,
  },

  transactionDescription: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    fontWeight: TYPOGRAPHY.fontWeights.medium,
    color: COLORS.text,
    marginBottom: 2,
  },

  transactionDate: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.textSecondary,
  },

  transactionRight: {
    alignItems: 'flex-end',
  },

  transactionAmount: {
    fontSize: TYPOGRAPHY.fontSizes.lg,
    fontWeight: TYPOGRAPHY.fontWeights.bold,
    marginBottom: 2,
  },

  transactionPoints: {
    fontSize: TYPOGRAPHY.fontSizes.xs,
    color: COLORS.textMuted,
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

export default PointsScreen;