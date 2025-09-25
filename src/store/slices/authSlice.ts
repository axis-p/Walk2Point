import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import * as SecureStore from 'expo-secure-store';
import { AuthState, User, LoginForm, RegisterForm } from '@/types';
import { authService } from '@/services/authService';
import { STORAGE_KEYS } from '@/constants';

// Initial state - TEMPORARILY SET TO AUTHENTICATED FOR TESTING
const initialState: AuthState = {
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    displayName: 'テストユーザー',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  token: 'test-token',
  refreshToken: 'test-refresh-token',
  isLoading: false,
  error: null,
  isAuthenticated: true, // TEMPORARILY SET TO TRUE
};

// Async thunks
export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: LoginForm, { rejectWithValue }) => {
    try {
      const response = await authService.login(credentials);

      // Store tokens securely
      await SecureStore.setItemAsync(STORAGE_KEYS.TOKEN, response.token);
      await SecureStore.setItemAsync(
        STORAGE_KEYS.REFRESH_TOKEN,
        response.refreshToken
      );
      await SecureStore.setItemAsync(
        STORAGE_KEYS.USER,
        JSON.stringify(response.user)
      );

      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'ログインに失敗しました');
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData: RegisterForm, { rejectWithValue }) => {
    try {
      const response = await authService.register(userData);

      // Store tokens securely
      await SecureStore.setItemAsync(STORAGE_KEYS.TOKEN, response.token);
      await SecureStore.setItemAsync(
        STORAGE_KEYS.REFRESH_TOKEN,
        response.refreshToken
      );
      await SecureStore.setItemAsync(
        STORAGE_KEYS.USER,
        JSON.stringify(response.user)
      );

      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || '登録に失敗しました');
    }
  }
);

export const loadStoredAuth = createAsyncThunk(
  'auth/loadStored',
  async (_, { rejectWithValue }) => {
    try {
      const token = await SecureStore.getItemAsync(STORAGE_KEYS.TOKEN);
      const refreshToken = await SecureStore.getItemAsync(
        STORAGE_KEYS.REFRESH_TOKEN
      );
      const userString = await SecureStore.getItemAsync(STORAGE_KEYS.USER);

      if (!token || !refreshToken || !userString) {
        throw new Error('No stored auth found');
      }

      const user = JSON.parse(userString);

      // Validate token with server
      const isValid = await authService.validateToken(token);
      if (!isValid) {
        throw new Error('Invalid token');
      }

      return {
        user,
        token,
        refreshToken,
      };
    } catch (error: any) {
      // Clear invalid stored data
      await SecureStore.deleteItemAsync(STORAGE_KEYS.TOKEN);
      await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
      await SecureStore.deleteItemAsync(STORAGE_KEYS.USER);

      return rejectWithValue('Stored auth is invalid');
    }
  }
);

export const refreshAuthToken = createAsyncThunk(
  'auth/refresh',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState() as { auth: AuthState };

      if (!auth.refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await authService.refreshToken(auth.refreshToken);

      // Update stored tokens
      await SecureStore.setItemAsync(STORAGE_KEYS.TOKEN, response.token);
      await SecureStore.setItemAsync(
        STORAGE_KEYS.REFRESH_TOKEN,
        response.refreshToken
      );

      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Token refresh failed');
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { getState }) => {
    const { auth } = getState() as { auth: AuthState };

    try {
      if (auth.token) {
        await authService.logout(auth.token);
      }
    } catch (error) {
      // Ignore logout errors, we'll clear local data anyway
    }

    // Clear stored data
    await SecureStore.deleteItemAsync(STORAGE_KEYS.TOKEN);
    await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
    await SecureStore.deleteItemAsync(STORAGE_KEYS.USER);
  }
);

// Auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      });

    // Register
    builder
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      });

    // Load stored auth
    builder
      .addCase(loadStoredAuth.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loadStoredAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loadStoredAuth.rejected, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
      });

    // Refresh token
    builder
      .addCase(refreshAuthToken.fulfilled, (state, action) => {
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
      })
      .addCase(refreshAuthToken.rejected, (state) => {
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
      });

    // Logout
    builder.addCase(logoutUser.fulfilled, (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.error = null;
    });
  },
});

export const { clearError, updateUser } = authSlice.actions;
export default authSlice.reducer;