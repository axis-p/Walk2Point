// App constants
export const APP_NAME = 'Walk2Point';
export const APP_VERSION = '1.0.0';

// API constants
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';
export const API_TIMEOUT = 10000; // 10 seconds

// Storage keys
export const STORAGE_KEYS = {
  TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user_data',
  THEME: 'theme_preference',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  LAST_SYNC: 'last_steps_sync',
} as const;

// Points configuration
export const POINTS_CONFIG = {
  STEPS_PER_POINT: 2000,
  MAX_DAILY_STEPS_POINTS: 15,
  MAX_AD_VIEWS_PER_DAY: 5,
  MAX_TOTAL_POINTS_PER_DAY: 25,
  POINTS_PER_AD_VIEW: 3,
} as const;

// Health data constants
export const HEALTH_CONFIG = {
  MAX_DAILY_STEPS: 50000, // Fraud detection threshold
  MIN_VALID_STEPS: 0,
  SYNC_INTERVAL: 60000, // 1 minute in milliseconds
} as const;

// Redemption options
export const REDEMPTION_OPTIONS = {
  AMAZON_GIFT: {
    id: 'amazon_gift',
    name: 'Amazonギフト券',
    minPoints: 500,
    rate: 1, // 1 point = 1 yen
    icon: 'gift',
  },
  PAYPAY: {
    id: 'paypay',
    name: 'PayPay',
    minPoints: 500,
    rate: 1,
    icon: 'mobile-phone',
    comingSoon: true,
  },
  RAKUTEN: {
    id: 'rakuten',
    name: '楽天ポイント',
    minPoints: 500,
    rate: 1,
    icon: 'star',
    comingSoon: true,
  },
} as const;

// Theme colors (Dark theme as primary)
export const COLORS = {
  // Primary colors
  primary: '#8b5cf6', // Purple
  primaryDark: '#7c3aed',
  primaryLight: '#a78bfa',

  // Background colors
  background: '#0f172a', // Dark blue-gray
  surface: '#1e293b',
  surfaceLight: '#334155',

  // Text colors
  text: '#f8fafc', // Almost white
  textSecondary: '#cbd5e1',
  textMuted: '#64748b',

  // Border colors
  border: '#374151',
  borderLight: '#4b5563',

  // Status colors
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',

  // Point colors
  points: '#fbbf24', // Gold/Yellow

  // Transparent overlays
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
} as const;

// Spacing system
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

// Border radius system
export const BORDER_RADIUS = {
  sm: 6,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

// Typography
export const TYPOGRAPHY = {
  fontSizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
  fontWeights: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
} as const;

// Animation durations
export const ANIMATIONS = {
  fast: 200,
  normal: 300,
  slow: 500,
} as const;

// Screen dimensions breakpoints
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;

// Navigation constants
export const SCREEN_NAMES = {
  // Auth
  AUTH_STACK: 'Auth',
  LOGIN: 'Login',
  REGISTER: 'Register',

  // Main
  MAIN_TABS: 'Main',
  DASHBOARD: 'Dashboard',
  POINTS: 'Points',
  REDEEM: 'Redeem',
  PROFILE: 'Profile',

  // Other
  SETTINGS: 'Settings',
  TERMS: 'Terms',
  PRIVACY: 'Privacy',
  HELP: 'Help',
} as const;

// Tab icons
export const TAB_ICONS = {
  [SCREEN_NAMES.DASHBOARD]: 'home',
  [SCREEN_NAMES.POINTS]: 'coins',
  [SCREEN_NAMES.REDEEM]: 'gift',
  [SCREEN_NAMES.PROFILE]: 'user',
} as const;

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'ネットワークエラーが発生しました',
  INVALID_CREDENTIALS: 'メールアドレスまたはパスワードが正しくありません',
  USER_NOT_FOUND: 'ユーザーが見つかりません',
  EMAIL_ALREADY_EXISTS: 'このメールアドレスは既に使用されています',
  WEAK_PASSWORD: 'パスワードは8文字以上で設定してください',
  REQUIRED_FIELD: 'この項目は必須です',
  INVALID_EMAIL: '正しいメールアドレスを入力してください',
  PASSWORDS_DONT_MATCH: 'パスワードが一致しません',
  STEPS_SYNC_FAILED: '歩数データの同期に失敗しました',
  POINTS_CALC_FAILED: 'ポイント計算に失敗しました',
  REDEMPTION_FAILED: 'ポイント交換に失敗しました',
  INSUFFICIENT_POINTS: 'ポイントが不足しています',
  DAILY_LIMIT_REACHED: '本日の上限に達しています',
  UNKNOWN_ERROR: '予期しないエラーが発生しました',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'ログインしました',
  REGISTER_SUCCESS: 'アカウントを作成しました',
  LOGOUT_SUCCESS: 'ログアウトしました',
  STEPS_SYNCED: '歩数データを同期しました',
  POINTS_EARNED: 'ポイントを獲得しました',
  REDEMPTION_SUCCESS: 'ポイント交換を申請しました',
  PROFILE_UPDATED: 'プロフィールを更新しました',
} as const;

// Validation rules
export const VALIDATION = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD_MIN_LENGTH: 8,
  DISPLAY_NAME_MIN_LENGTH: 2,
  DISPLAY_NAME_MAX_LENGTH: 20,
} as const;