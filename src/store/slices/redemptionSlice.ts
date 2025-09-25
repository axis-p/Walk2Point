import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { RedemptionState, RedemptionOption, Redemption } from '@/types';
import { redemptionService } from '@/services/redemptionService';

// Initial state
const initialState: RedemptionState = {
  options: [],
  history: [],
  isLoading: false,
  error: null,
};

// Async thunks
export const loadRedemptionOptions = createAsyncThunk(
  'redemption/loadOptions',
  async (_, { rejectWithValue }) => {
    try {
      const response = await redemptionService.getRedemptionOptions();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || '換金オプションの取得に失敗しました');
    }
  }
);

export const loadRedemptionHistory = createAsyncThunk(
  'redemption/loadHistory',
  async (
    { page = 0, limit = 20 }: { page?: number; limit?: number } = {},
    { rejectWithValue }
  ) => {
    try {
      const response = await redemptionService.getRedemptionHistory(page, limit);
      return { redemptions: response.data, page, isFirstPage: page === 0 };
    } catch (error: any) {
      return rejectWithValue(error.message || '換金履歴の取得に失敗しました');
    }
  }
);

export const requestRedemption = createAsyncThunk(
  'redemption/request',
  async (
    {
      rewardType,
      pointsToUse,
      rewardValue,
    }: {
      rewardType: string;
      pointsToUse: number;
      rewardValue: number;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await redemptionService.requestRedemption({
        rewardType,
        pointsToUse,
        rewardValue,
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'ポイント交換の申請に失敗しました');
    }
  }
);

export const checkRedemptionStatus = createAsyncThunk(
  'redemption/checkStatus',
  async (redemptionId: string, { rejectWithValue }) => {
    try {
      const response = await redemptionService.getRedemptionStatus(redemptionId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || 'ステータス確認に失敗しました');
    }
  }
);

// Redemption slice
const redemptionSlice = createSlice({
  name: 'redemption',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateRedemptionStatus: (state, action) => {
      const { redemptionId, status, rewardCode, completedAt } = action.payload;
      const redemption = state.history.find((r) => r.id === redemptionId);
      if (redemption) {
        redemption.status = status;
        if (rewardCode) redemption.rewardCode = rewardCode;
        if (completedAt) redemption.completedAt = new Date(completedAt);
      }
    },
  },
  extraReducers: (builder) => {
    // Load options
    builder
      .addCase(loadRedemptionOptions.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadRedemptionOptions.fulfilled, (state, action) => {
        state.isLoading = false;
        state.options = action.payload;
        state.error = null;
      })
      .addCase(loadRedemptionOptions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Load history
    builder
      .addCase(loadRedemptionHistory.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadRedemptionHistory.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.isFirstPage) {
          state.history = action.payload.redemptions;
        } else {
          state.history.push(...action.payload.redemptions);
        }
        state.error = null;
      })
      .addCase(loadRedemptionHistory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Request redemption
    builder
      .addCase(requestRedemption.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(requestRedemption.fulfilled, (state, action) => {
        state.isLoading = false;
        // Add new redemption to history
        state.history.unshift(action.payload);
        state.error = null;
      })
      .addCase(requestRedemption.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Check status
    builder
      .addCase(checkRedemptionStatus.fulfilled, (state, action) => {
        const redemption = state.history.find((r) => r.id === action.payload.id);
        if (redemption) {
          Object.assign(redemption, action.payload);
        }
      });
  },
});

export const { clearError, updateRedemptionStatus } = redemptionSlice.actions;
export default redemptionSlice.reducer;