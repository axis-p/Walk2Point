import { apiClient } from './api';
import { RedemptionOption, Redemption, ApiResponse } from '@/types';

interface RedemptionRequest {
  rewardType: string;
  pointsToUse: number;
  rewardValue: number;
}

class RedemptionService {
  async getRedemptionOptions(): Promise<ApiResponse<RedemptionOption[]>> {
    const response = await apiClient.get<RedemptionOption[]>('/redeem/options');

    if (!response.success) {
      throw new Error(response.error || '換金オプションの取得に失敗しました');
    }

    return response;
  }

  async requestRedemption(
    request: RedemptionRequest
  ): Promise<ApiResponse<Redemption>> {
    const response = await apiClient.post<Redemption>('/redeem/request', {
      rewardType: request.rewardType,
      pointsUsed: request.pointsToUse,
      rewardValue: request.rewardValue,
    });

    if (!response.success) {
      throw new Error(response.error || 'ポイント交換の申請に失敗しました');
    }

    return response;
  }

  async getRedemptionHistory(
    page: number = 0,
    limit: number = 20
  ): Promise<ApiResponse<Redemption[]>> {
    const response = await apiClient.get<Redemption[]>(
      `/redeem/history?page=${page}&limit=${limit}`
    );

    if (!response.success) {
      throw new Error(response.error || '換金履歴の取得に失敗しました');
    }

    return response;
  }

  async getRedemptionStatus(redemptionId: string): Promise<ApiResponse<Redemption>> {
    const response = await apiClient.get<Redemption>(`/redeem/status/${redemptionId}`);

    if (!response.success) {
      throw new Error(response.error || 'ステータス確認に失敗しました');
    }

    return response;
  }

  async cancelRedemption(redemptionId: string): Promise<ApiResponse<Redemption>> {
    const response = await apiClient.post<Redemption>(`/redeem/cancel/${redemptionId}`);

    if (!response.success) {
      throw new Error(response.error || 'キャンセルに失敗しました');
    }

    return response;
  }

  // Client-side utility methods
  canRedeem(points: number, option: RedemptionOption): boolean {
    return points >= option.minPoints && option.isAvailable;
  }

  calculateRewardValue(points: number, rate: number): number {
    return Math.floor(points / rate);
  }

  getAvailableRewardValues(
    points: number,
    option: RedemptionOption
  ): { points: number; value: number }[] {
    if (!this.canRedeem(points, option)) {
      return [];
    }

    const maxRewardValue = this.calculateRewardValue(points, option.rate);
    const options: { points: number; value: number }[] = [];

    // Common denominations based on reward type
    let denominations: number[] = [];

    switch (option.type) {
      case 'amazon_gift':
        denominations = [500, 1000, 3000, 5000, 10000];
        break;
      case 'paypay':
      case 'rakuten':
        denominations = [100, 500, 1000, 3000, 5000, 10000];
        break;
      case 'google_play':
      case 'apple_gift':
        denominations = [500, 1000, 1500, 3000, 5000, 10000];
        break;
      default:
        denominations = [500, 1000, 3000, 5000];
    }

    for (const value of denominations) {
      const requiredPoints = value * option.rate;
      if (requiredPoints <= points && value <= maxRewardValue) {
        options.push({
          points: requiredPoints,
          value: value,
        });
      }
    }

    return options;
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: '申請中',
      processing: '処理中',
      completed: '完了',
      failed: '失敗',
      cancelled: 'キャンセル',
    };
    return labels[status] || status;
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      pending: '#f59e0b', // orange
      processing: '#3b82f6', // blue
      completed: '#10b981', // green
      failed: '#ef4444', // red
      cancelled: '#6b7280', // gray
    };
    return colors[status] || '#6b7280';
  }

  getRewardTypeIcon(rewardType: string): string {
    const icons: Record<string, string> = {
      amazon_gift: 'storefront',
      paypay: 'phone-portrait',
      rakuten: 'star',
      google_play: 'logo-google-playstore',
      apple_gift: 'logo-apple',
    };
    return icons[rewardType] || 'gift';
  }

  getRewardTypeName(rewardType: string): string {
    const names: Record<string, string> = {
      amazon_gift: 'Amazonギフト券',
      paypay: 'PayPay',
      rakuten: '楽天ポイント',
      google_play: 'Google Playギフトカード',
      apple_gift: 'Apple Giftカード',
    };
    return names[rewardType] || rewardType;
  }

  getProcessingTimeEstimate(rewardType: string): string {
    const estimates: Record<string, string> = {
      amazon_gift: '1-3営業日',
      paypay: '即時反映',
      rakuten: '1-2営業日',
      google_play: '1-3営業日',
      apple_gift: '1-3営業日',
    };
    return estimates[rewardType] || '1-5営業日';
  }

  isRedemptionCancellable(redemption: Redemption): boolean {
    return redemption.status === 'pending' &&
           new Date().getTime() - new Date(redemption.createdAt).getTime() < 24 * 60 * 60 * 1000; // 24 hours
  }

  formatRedemptionSummary(redemption: Redemption): string {
    const rewardName = this.getRewardTypeName(redemption.rewardType);
    return `${rewardName} ${redemption.rewardValue}円分 (${redemption.pointsUsed}P使用)`;
  }

  groupRedemptionsByMonth(redemptions: Redemption[]): Record<string, Redemption[]> {
    return redemptions.reduce((groups, redemption) => {
      const date = new Date(redemption.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!groups[monthKey]) {
        groups[monthKey] = [];
      }
      groups[monthKey].push(redemption);
      return groups;
    }, {} as Record<string, Redemption[]>);
  }

  calculateRedemptionStatistics(redemptions: Redemption[]): {
    totalRedeemed: number;
    totalValue: number;
    averageRedemption: number;
    favoriteRewardType: string;
    successRate: number;
  } {
    const completed = redemptions.filter(r => r.status === 'completed');
    const totalRedeemed = completed.reduce((sum, r) => sum + r.pointsUsed, 0);
    const totalValue = completed.reduce((sum, r) => sum + r.rewardValue, 0);
    const averageRedemption = completed.length > 0 ? totalValue / completed.length : 0;

    // Find most common reward type
    const typeCounts = completed.reduce((counts, r) => {
      counts[r.rewardType] = (counts[r.rewardType] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);

    const favoriteRewardType = Object.keys(typeCounts).reduce((a, b) =>
      typeCounts[a] > typeCounts[b] ? a : b, ''
    );

    const successRate = redemptions.length > 0 ? (completed.length / redemptions.length) * 100 : 0;

    return {
      totalRedeemed,
      totalValue,
      averageRedemption: Math.round(averageRedemption),
      favoriteRewardType,
      successRate: Math.round(successRate),
    };
  }
}

export const redemptionService = new RedemptionService();