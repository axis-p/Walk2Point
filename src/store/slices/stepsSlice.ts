import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { DailyStepsState, StepData } from '@/types';
import { healthService } from '@/services/healthService';
import { stepsService } from '@/services/stepsService';

// Initial state
const initialState: DailyStepsState = {
  todaySteps: null,
  weeklySteps: [],
  isLoading: false,
  error: null,
  lastSyncAt: null,
};

// Async thunks
export const syncStepsData = createAsyncThunk(
  'steps/sync',
  async (_, { rejectWithValue }) => {
    try {
      // Get today's date
      const today = new Date().toISOString().split('T')[0];

      // Get steps from HealthKit
      const healthSteps = await healthService.getTodaySteps();

      // Sync with server
      const stepData: StepData = {
        date: today,
        steps: healthSteps.steps,
        distance: healthSteps.distance,
        calories: healthSteps.calories,
        activeMinutes: healthSteps.activeMinutes,
        pointsEarned: 0, // Will be calculated by server
        source: 'healthkit',
      };

      const response = await stepsService.syncSteps(stepData);

      return {
        stepData: response.data,
        syncedAt: new Date(),
      };
    } catch (error: any) {
      return rejectWithValue(error.message || '歩数の同期に失敗しました');
    }
  }
);

export const loadWeeklySteps = createAsyncThunk(
  'steps/loadWeekly',
  async (_, { rejectWithValue }) => {
    try {
      const response = await stepsService.getWeeklySteps();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || '週間歩数の取得に失敗しました');
    }
  }
);

export const loadTodaySteps = createAsyncThunk(
  'steps/loadToday',
  async (_, { rejectWithValue }) => {
    try {
      const response = await stepsService.getTodaySteps();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message || '本日の歩数取得に失敗しました');
    }
  }
);

// Steps slice
const stepsSlice = createSlice({
  name: 'steps',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateTodaySteps: (state, action: PayloadAction<StepData>) => {
      state.todaySteps = action.payload;
    },
    addStepsManually: (state, action: PayloadAction<number>) => {
      if (state.todaySteps) {
        state.todaySteps.steps += action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    // Sync steps
    builder
      .addCase(syncStepsData.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(syncStepsData.fulfilled, (state, action) => {
        state.isLoading = false;
        state.todaySteps = action.payload.stepData;
        state.lastSyncAt = action.payload.syncedAt;
        state.error = null;
      })
      .addCase(syncStepsData.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Load weekly steps
    builder
      .addCase(loadWeeklySteps.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadWeeklySteps.fulfilled, (state, action) => {
        state.isLoading = false;
        state.weeklySteps = action.payload;
        state.error = null;
      })
      .addCase(loadWeeklySteps.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Load today steps
    builder
      .addCase(loadTodaySteps.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadTodaySteps.fulfilled, (state, action) => {
        state.isLoading = false;
        state.todaySteps = action.payload;
        state.error = null;
      })
      .addCase(loadTodaySteps.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, updateTodaySteps, addStepsManually } =
  stepsSlice.actions;
export default stepsSlice.reducer;