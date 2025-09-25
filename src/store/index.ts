import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import stepsSlice from './slices/stepsSlice';
import pointsSlice from './slices/pointsSlice';
import redemptionSlice from './slices/redemptionSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    steps: stepsSlice,
    points: pointsSlice,
    redemption: redemptionSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
        // Ignore these field paths in all actions
        ignoredActionsPaths: ['meta.arg', 'payload.timestamp'],
        // Ignore these paths in the state
        ignoredPaths: ['items.dates'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;