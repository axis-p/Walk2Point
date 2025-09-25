import { apiClient } from './api';
import { PointTransaction, DailyLimit, ApiResponse, PaginatedResponse } from '@/types';

interface PointsBalance {
  balance: number;
  dailyEarned: number;
  lifetimeEarned: number;
}

interface AdViewData {
  adType: 'banner' | 'interstitial' | 'rewarded';
  adUnitId: string;
  watchedDuration?: number;
  completed: boolean;
}

interface PointsEarnResponse {
  transaction: PointTransaction;
  dailyLimits: DailyLimit;
}

class PointsService {
  async getBalance(): Promise<ApiResponse<PointsBalance>> {
    const response = await apiClient.get<PointsBalance>('/points/balance');

    if (!response.success) {
      throw new Error(response.error || 'ポイント残高の取得に失敗しました');
    }

    return response;
  }

  async getHistory(
    page: number = 0,
    limit: number = 20
  ): Promise<ApiResponse<PointTransaction[]>> {
    const response = await apiClient.get<PointTransaction[]>(
      `/points/history?page=${page}&limit=${limit}`
    );

    if (!response.success) {
      throw new Error(response.error || 'ポイント履歴の取得に失敗しました');
    }

    return response;
  }

  async earnPointsFromSteps(steps: number): Promise<ApiResponse<PointsEarnResponse>> {
    const response = await apiClient.post<PointsEarnResponse>('/points/earn-steps', {
      steps,
    });

    if (!response.success) {
      throw new Error(response.error || '歩数ポイントの獲得に失敗しました');
    }

    return response;
  }

  async earnPointsFromAd(adData: AdViewData): Promise<ApiResponse<PointsEarnResponse>> {
    const response = await apiClient.post<PointsEarnResponse>('/points/earn-ad', {
      adType: adData.adType,
      adUnitId: adData.adUnitId,
      watchedDuration: adData.watchedDuration,
      completed: adData.completed,
    });

    if (!response.success) {
      throw new Error(response.error || '広告ポイントの獲得に失敗しました');
    }

    return response;
  }

  async getDailyLimits(): Promise<ApiResponse<DailyLimit>> {
    const response = await apiClient.get<DailyLimit>('/points/daily-limits');

    if (!response.success) {
      throw new Error(response.error || '日次制限の取得に失敗しました');
    }

    return response;
  }

  async getPointsStatistics(): Promise<
    ApiResponse<{
      totalEarned: number;
      totalRedeemed: number;
      averageDaily: number;
      bestDay: { date: string; points: number };
      streakDays: number;
      monthlyBreakdown: { month: string; earned: number; redeemed: number }[];
    }>
  > {
    const response = await apiClient.get('/points/statistics');

    if (!response.success) {
      throw new Error(response.error || 'ポイント統計の取得に失敗しました');
    }

    return response;
  }

  async earnBonusPoints(
    bonusType: 'daily_login' | 'weekly_goal' | 'monthly_challenge' | 'referral',
    metadata?: Record<string, any>
  ): Promise<ApiResponse<PointsEarnResponse>> {
    const response = await apiClient.post<PointsEarnResponse>('/points/earn-bonus', {
      bonusType,
      metadata,
    });

    if (!response.success) {
      throw new Error(response.error || 'ボーナスポイントの獲得に失敗しました');
    }

    return response;
  }

  // Client-side utility methods
  formatPointsDisplay(points: number): string {
    if (points >= 1000000) {
      return `${(points / 1000000).toFixed(1)}M`;
    } else if (points >= 1000) {
      return `${(points / 1000).toFixed(1)}k`;
    }
    return points.toLocaleString();
  }

  calculatePointsValue(points: number, exchangeRate: number = 1): string {
    const value = points * exchangeRate;
    return `¥${value.toLocaleString()}`;
  }

  getPointsFromSteps(steps: number, rate: number = 2000): number {
    return Math.floor(steps / rate);
  }

  canEarnMorePoints(dailyLimits: DailyLimit): {
    canEarnSteps: boolean;
    canEarnAds: boolean;
    canEarnTotal: boolean;
    remaining: {
      steps: number;
      ads: number;
      total: number;
    };
  } {
    const remainingSteps = dailyLimits.stepsPoints.max - dailyLimits.stepsPoints.current;
    const remainingAds = dailyLimits.adPoints.max - dailyLimits.adPoints.current;
    const remainingTotal = dailyLimits.totalPoints.max - dailyLimits.totalPoints.current;

    return {
      canEarnSteps: remainingSteps > 0,
      canEarnAds: remainingAds > 0,
      canEarnTotal: remainingTotal > 0,
      remaining: {
        steps: Math.max(0, remainingSteps),
        ads: Math.max(0, remainingAds),
        total: Math.max(0, remainingTotal),
      },
    };
  }

  getPointsEarningTip(dailyLimits: DailyLimit): string {
    const remaining = this.canEarnMorePoints(dailyLimits);

    if (!remaining.canEarnTotal) {
      return '本日のポイント上限に達しました！明日またチャレンジしてください。';
    }

    if (remaining.canEarnSteps && remaining.remaining.steps > 0) {
      const stepsNeeded = remaining.remaining.steps * 2000; // Assuming 2000 steps per point
      return `あと${stepsNeeded.toLocaleString()}歩で${remaining.remaining.steps}ポイント獲得できます！`;
    }

    if (remaining.canEarnAds && remaining.remaining.ads > 0) {
      return `動画広告を視聴してあと${remaining.remaining.ads}ポイント獲得できます！`;
    }

    return 'お疲れさまでした！';
  }

  // Transaction filtering and sorting
  filterTransactions(
    transactions: PointTransaction[],
    filters: {
      type?: string;
      dateRange?: { start: Date; end: Date };
      minAmount?: number;
    }
  ): PointTransaction[] {
    return transactions.filter(transaction => {
      if (filters.type && transaction.type !== filters.type) {
        return false;
      }

      if (filters.dateRange) {
        const transactionDate = new Date(transaction.createdAt);
        if (transactionDate < filters.dateRange.start || transactionDate > filters.dateRange.end) {
          return false;
        }
      }

      if (filters.minAmount && Math.abs(transaction.amount) < filters.minAmount) {
        return false;
      }

      return true;
    });
  }

  groupTransactionsByDate(transactions: PointTransaction[]): Record<string, PointTransaction[]> {
    return transactions.reduce((groups, transaction) => {
      const date = new Date(transaction.createdAt).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(transaction);
      return groups;
    }, {} as Record<string, PointTransaction[]>);
  }

  getTransactionTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      steps: '歩数報酬',
      ad_view: '広告視聴',
      bonus: 'ボーナス',
      redemption: 'ポイント交換',
      adjustment: '調整',
      referral: '紹介報酬',
    };
    return labels[type] || type;
  }

  getTransactionIcon(type: string): string {
    const icons: Record<string, string> = {
      steps: 'walk',
      ad_view: 'play-circle',
      bonus: 'star',
      redemption: 'gift',
      adjustment: 'settings',
      referral: 'people',
    };
    return icons[type] || 'help-circle';
  }
}

export const pointsService = new PointsService();