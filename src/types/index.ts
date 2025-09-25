// User related types
export interface User {
  id: string;
  email: string;
  displayName: string;
  totalPoints: number;
  lifetimeSteps: number;
  status: 'active' | 'suspended' | 'deleted';
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

// Steps and Health related types
export interface StepData {
  date: string; // YYYY-MM-DD format
  steps: number;
  distance?: number;
  calories?: number;
  activeMinutes?: number;
  pointsEarned: number;
  source: 'healthkit' | 'manual' | 'google_fit';
}

export interface DailyStepsState {
  todaySteps: StepData | null;
  weeklySteps: StepData[];
  isLoading: boolean;
  error: string | null;
  lastSyncAt: Date | null;
}

// Points related types
export interface PointTransaction {
  id: string;
  type: 'steps' | 'ad_view' | 'bonus' | 'redemption' | 'adjustment' | 'referral';
  amount: number;
  balanceAfter: number;
  description: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface PointsState {
  balance: number;
  transactions: PointTransaction[];
  dailyEarned: number;
  dailyLimit: DailyLimit;
  isLoading: boolean;
  error: string | null;
}

export interface DailyLimit {
  stepsPoints: { current: number; max: number };
  adPoints: { current: number; max: number };
  totalPoints: { current: number; max: number };
}

// Ads related types
export interface AdView {
  id: string;
  adType: 'banner' | 'interstitial' | 'rewarded';
  adUnitId: string;
  pointsEarned: number;
  watchedDuration?: number;
  completed: boolean;
  createdAt: Date;
}

export interface AdsState {
  dailyViews: AdView[];
  isLoading: boolean;
  error: string | null;
}

// Redemption related types
export interface RedemptionOption {
  id: string;
  type: 'amazon_gift' | 'paypay' | 'rakuten' | 'google_play' | 'apple_gift';
  name: string;
  description: string;
  minPoints: number;
  rate: number; // points per currency unit
  isAvailable: boolean;
  icon: string;
}

export interface Redemption {
  id: string;
  userId: string;
  pointsUsed: number;
  rewardType: string;
  rewardValue: number;
  rewardCode?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  processedAt?: Date;
  completedAt?: Date;
  failureReason?: string;
  createdAt: Date;
}

export interface RedemptionState {
  options: RedemptionOption[];
  history: Redemption[];
  isLoading: boolean;
  error: string | null;
}

// App Config types
export interface AppConfig {
  pointsRate: {
    stepsPerPoint: number;
    maxDailyStepsPoints: number;
  };
  adRewards: {
    banner: number;
    interstitial: number;
    rewarded: number;
  };
  dailyLimits: {
    maxAdViews: number;
    maxTotalPoints: number;
  };
  redemptionMinimums: Record<string, number>;
}

// Navigation types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Login: undefined;
  Register: undefined;
  Dashboard: undefined;
  Points: undefined;
  Redeem: undefined;
  Profile: undefined;
  Settings: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Points: undefined;
  Redeem: undefined;
  Profile: undefined;
};

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Form types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  email: string;
  password: string;
  confirmPassword: string;
  displayName: string;
  acceptTerms: boolean;
}

// Error types
export interface AppError {
  code: string;
  message: string;
  details?: any;
}

// Theme types
export interface Theme {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    success: string;
    warning: string;
    error: string;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
}

export type ThemeMode = 'light' | 'dark';