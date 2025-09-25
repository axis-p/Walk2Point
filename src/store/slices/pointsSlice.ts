import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { PointsState, PointTransaction, DailyLimit } from '@/types';
import { pointsService } from '@/services/pointsService';

// Initial state
const initialState: PointsState = {
  balance: 0,
  transactions: [],
  dailyEarned: 0,
  dailyLimit: {
    stepsPoints: { current: 0, max: 15 },
    adPoints: { current: 0, max: 15 },
    totalPoints: { current: 0, max: 25 },
  },
  isLoading: false,
  error: null,
};

// Async thunks
export const loadPointsBalance = createAsyncThunk(
  'points/loadBalance',
  async (_, { rejectWithValue }) => {
    try {
      const response = await pointsService.getBalance();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'ポイント残高の取得に失敗しました');
    }
  }
);

export const loadPointsHistory = createAsyncThunk(
  'points/loadHistory',
  async (
    { page = 0, limit = 20 }: { page?: number; limit?: number } = {},
    { rejectWithValue }
  ) => {
    try {
      const response = await pointsService.getHistory(page, limit);
      return { transactions: response.data, page, isFirstPage: page === 0 };
    } catch (error: any) {
      return rejectWithValue(error.message || 'ポイント履歴の取得に失敗しました');
    }
  }
);

export const earnPointsFromSteps = createAsyncThunk(
  'points/earnFromSteps',
  async (steps: number, { rejectWithValue }) => {
    try {
      const response = await pointsService.earnPointsFromSteps(steps);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || '歩数ポイントの獲得に失敗しました');
    }
  }
);

export const earnPointsFromAd = createAsyncThunk(
  'points/earnFromAd',
  async (
    adData: {
      adType: 'banner' | 'interstitial' | 'rewarded';
      adUnitId: string;
      watchedDuration?: number;
      completed: boolean;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await pointsService.earnPointsFromAd(adData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || '広告ポイントの獲得に失敗しました');
    }
  }
);

export const loadDailyLimits = createAsyncThunk(
  'points/loadDailyLimits',
  async (_, { rejectWithValue }) => {
    try {
      const response = await pointsService.getDailyLimits();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || '日次制限の取得に失敗しました');
    }
  }
);

// Points slice
const pointsSlice = createSlice({
  name: 'points',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateBalance: (state, action: PayloadAction<number>) => {
      state.balance = action.payload;
    },
    addTransaction: (state, action: PayloadAction<PointTransaction>) => {
      state.transactions.unshift(action.payload);
      // Update balance
      state.balance = action.payload.balanceAfter;
      // Update daily earned if it's a positive transaction
      if (action.payload.amount > 0) {
        state.dailyEarned += action.payload.amount;
      }
    },
    resetDailyStats: (state) => {
      state.dailyEarned = 0;
      state.dailyLimit = {
        stepsPoints: { current: 0, max: state.dailyLimit.stepsPoints.max },
        adPoints: { current: 0, max: state.dailyLimit.adPoints.max },
        totalPoints: { current: 0, max: state.dailyLimit.totalPoints.max },
      };
    },
  },
  extraReducers: (builder) => {
    // Load balance
    builder
      .addCase(loadPointsBalance.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadPointsBalance.fulfilled, (state, action) => {
        state.isLoading = false;
        state.balance = action.payload.balance;
        state.dailyEarned = action.payload.dailyEarned;
        state.error = null;
      })
      .addCase(loadPointsBalance.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Load history
    builder
      .addCase(loadPointsHistory.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadPointsHistory.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.isFirstPage) {
          state.transactions = action.payload.transactions;
        } else {
          state.transactions.push(...action.payload.transactions);
        }
        state.error = null;
      })
      .addCase(loadPointsHistory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Earn from steps
    builder
      .addCase(earnPointsFromSteps.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(earnPointsFromSteps.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.transaction) {
          state.transactions.unshift(action.payload.transaction);
          state.balance = action.payload.transaction.balanceAfter;
          state.dailyEarned += action.payload.transaction.amount;

          // Update daily limits
          if (action.payload.dailyLimits) {
            state.dailyLimit = action.payload.dailyLimits;
          }
        }
        state.error = null;
      })
      .addCase(earnPointsFromSteps.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Earn from ad
    builder
      .addCase(earnPointsFromAd.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(earnPointsFromAd.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.transaction) {
          state.transactions.unshift(action.payload.transaction);
          state.balance = action.payload.transaction.balanceAfter;
          state.dailyEarned += action.payload.transaction.amount;

          // Update daily limits
          if (action.payload.dailyLimits) {
            state.dailyLimit = action.payload.dailyLimits;
          }
        }
        state.error = null;
      })
      .addCase(earnPointsFromAd.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Load daily limits
    builder
      .addCase(loadDailyLimits.fulfilled, (state, action) => {
        state.dailyLimit = action.payload;
      });
  },
});

export const { clearError, updateBalance, addTransaction, resetDailyStats } =
  pointsSlice.actions;
export default pointsSlice.reducer;