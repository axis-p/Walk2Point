import { apiClient } from './api';
import { StepData, ApiResponse, PaginatedResponse } from '@/types';

class StepsService {
  async syncSteps(stepData: StepData): Promise<ApiResponse<StepData>> {
    const response = await apiClient.post<StepData>('/steps/sync', {
      date: stepData.date,
      steps: stepData.steps,
      distance: stepData.distance,
      calories: stepData.calories,
      activeMinutes: stepData.activeMinutes,
      source: stepData.source,
    });

    if (!response.success) {
      throw new Error(response.error || '歩数の同期に失敗しました');
    }

    return response;
  }

  async getTodaySteps(): Promise<ApiResponse<StepData>> {
    const response = await apiClient.get<StepData>('/steps/today');

    if (!response.success) {
      throw new Error(response.error || '本日の歩数取得に失敗しました');
    }

    return response;
  }

  async getWeeklySteps(): Promise<ApiResponse<StepData[]>> {
    const response = await apiClient.get<StepData[]>('/steps/weekly');

    if (!response.success) {
      throw new Error(response.error || '週間歩数の取得に失敗しました');
    }

    return response;
  }

  async getStepsHistory(
    page: number = 0,
    limit: number = 30
  ): Promise<ApiResponse<PaginatedResponse<StepData>>> {
    const response = await apiClient.get<PaginatedResponse<StepData>>(
      `/steps/history?page=${page}&limit=${limit}`
    );

    if (!response.success) {
      throw new Error(response.error || '歩数履歴の取得に失敗しました');
    }

    return response;
  }

  async getStepsForDateRange(
    startDate: string,
    endDate: string
  ): Promise<ApiResponse<StepData[]>> {
    const response = await apiClient.get<StepData[]>(
      `/steps/range?start=${startDate}&end=${endDate}`
    );

    if (!response.success) {
      throw new Error(response.error || '期間内歩数データの取得に失敗しました');
    }

    return response;
  }

  async getStepsStatistics(): Promise<
    ApiResponse<{
      totalSteps: number;
      averageDaily: number;
      bestDay: { date: string; steps: number };
      currentStreak: number;
      longestStreak: number;
    }>
  > {
    const response = await apiClient.get('/steps/statistics');

    if (!response.success) {
      throw new Error(response.error || '統計データの取得に失敗しました');
    }

    return response;
  }

  async updateStepsManually(
    date: string,
    steps: number,
    reason?: string
  ): Promise<ApiResponse<StepData>> {
    const response = await apiClient.post<StepData>('/steps/manual-update', {
      date,
      steps,
      reason,
      source: 'manual',
    });

    if (!response.success) {
      throw new Error(response.error || '手動歩数更新に失敗しました');
    }

    return response;
  }

  // Utility methods for client-side calculations
  calculatePointsFromSteps(steps: number, stepsPerPoint: number = 2000): number {
    return Math.floor(steps / stepsPerPoint);
  }

  getStepGoalProgress(steps: number, goal: number = 10000): number {
    return Math.min((steps / goal) * 100, 100);
  }

  formatStepsDisplay(steps: number): string {
    if (steps >= 10000) {
      return `${(steps / 1000).toFixed(1)}k`;
    }
    return steps.toLocaleString();
  }

  getStepGoalMessage(steps: number, goal: number = 10000): string {
    if (steps >= goal) {
      const excess = steps - goal;
      return `目標達成！${excess.toLocaleString()}歩オーバー`;
    } else {
      const remaining = goal - steps;
      return `あと${remaining.toLocaleString()}歩で目標達成`;
    }
  }

  // Activity level classification
  getActivityLevel(steps: number): {
    level: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active';
    label: string;
    color: string;
  } {
    if (steps < 3000) {
      return {
        level: 'sedentary',
        label: '運動不足',
        color: '#ef4444', // red
      };
    } else if (steps < 7500) {
      return {
        level: 'lightly_active',
        label: '軽度活動',
        color: '#f59e0b', // orange
      };
    } else if (steps < 10000) {
      return {
        level: 'moderately_active',
        label: '適度活動',
        color: '#eab308', // yellow
      };
    } else if (steps < 15000) {
      return {
        level: 'very_active',
        label: '活発',
        color: '#22c55e', // green
      };
    } else {
      return {
        level: 'extremely_active',
        label: '非常に活発',
        color: '#16a34a', // dark green
      };
    }
  }

  // Weekly summary calculation
  calculateWeeklySummary(weeklySteps: StepData[]): {
    totalSteps: number;
    averageSteps: number;
    daysWithGoal: number;
    bestDay: StepData | null;
    improvement: number; // vs previous week percentage
  } {
    const totalSteps = weeklySteps.reduce((sum, day) => sum + day.steps, 0);
    const averageSteps = Math.round(totalSteps / weeklySteps.length);
    const daysWithGoal = weeklySteps.filter(day => day.steps >= 10000).length;
    const bestDay = weeklySteps.reduce((best, day) =>
      (!best || day.steps > best.steps) ? day : best,
      null as StepData | null
    );

    // For improvement calculation, we'd need previous week data
    // This is a placeholder - would need additional API call
    const improvement = 0;

    return {
      totalSteps,
      averageSteps,
      daysWithGoal,
      bestDay,
      improvement,
    };
  }
}

export const stepsService = new StepsService();