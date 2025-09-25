# Walk2Point - 技術仕様書

## 1. アーキテクチャ概要

### 1.1 システム構成
```
┌─────────────────────────────────────────┐
│          iOS App (Expo/React Native)     │
│                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐│
│  │   UI     │ │  State   │ │   API    ││
│  │Components│ │Management│ │  Client  ││
│  └──────────┘ └──────────┘ └──────────┘│
└─────────────────┬────────────────────────┘
                  │ HTTPS
                  ▼
┌─────────────────────────────────────────┐
│      Vercel Edge Functions (Backend)     │
│                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐│
│  │   API    │ │   Auth   │ │   Admin  ││
│  │ Routes   │ │Middleware│ │    API   ││
│  └──────────┘ └──────────┘ └──────────┘│
└─────────────────┬────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│         Data & External Services         │
│                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐│
│  │  Turso   │ │  AdMob   │ │  Payment ││
│  │ Database │ │   SDK    │ │    API   ││
│  └──────────┘ └──────────┘ └──────────┘│
└─────────────────────────────────────────┘
```

## 2. フロントエンド仕様

### 2.1 技術スタック
```json
{
  "framework": "Expo SDK 50+",
  "language": "TypeScript 5.0+",
  "stateManagement": "Redux Toolkit / Zustand",
  "navigation": "React Navigation 6",
  "ui": "React Native Elements / NativeBase",
  "forms": "React Hook Form",
  "http": "Axios",
  "storage": "AsyncStorage / SecureStore"
}
```

### 2.2 プロジェクト構造
```
Walk2Point/
├── app.json                 # Expo設定
├── package.json
├── tsconfig.json
├── babel.config.js
├── src/
│   ├── components/         # UIコンポーネント
│   │   ├── common/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   └── points/
│   ├── screens/           # 画面コンポーネント
│   │   ├── AuthScreen.tsx
│   │   ├── DashboardScreen.tsx
│   │   ├── PointsScreen.tsx
│   │   └── RedeemScreen.tsx
│   ├── navigation/        # ナビゲーション設定
│   ├── store/            # 状態管理
│   │   ├── slices/
│   │   └── store.ts
│   ├── services/         # API通信・外部サービス
│   │   ├── api.ts
│   │   ├── auth.ts
│   │   ├── health.ts     # HealthKit連携
│   │   └── ads.ts        # AdMob連携
│   ├── utils/            # ユーティリティ
│   ├── hooks/            # カスタムフック
│   ├── types/            # TypeScript型定義
│   └── constants/        # 定数定義
├── assets/               # 画像・フォント
└── tests/               # テストファイル
```

### 2.3 主要コンポーネント仕様

#### 2.3.1 認証フロー
```typescript
interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

interface User {
  id: string;
  email: string;
  displayName: string;
  createdAt: Date;
  points: number;
  todaySteps: number;
}
```

#### 2.3.2 HealthKit連携
```typescript
interface HealthService {
  requestAuthorization(): Promise<boolean>;
  getStepsCount(date: Date): Promise<number>;
  getStepsHistory(days: number): Promise<StepData[]>;
  startBackgroundUpdate(): void;
}

interface StepData {
  date: Date;
  steps: number;
  distance?: number;
  calories?: number;
}
```

#### 2.3.3 ポイント管理
```typescript
interface PointsState {
  balance: number;
  todayEarned: number;
  history: PointTransaction[];
  dailyLimit: DailyLimit;
}

interface PointTransaction {
  id: string;
  type: 'steps' | 'ad_view' | 'bonus' | 'redemption';
  amount: number;
  description: string;
  createdAt: Date;
}

interface DailyLimit {
  stepsPoints: { current: number; max: number };
  adPoints: { current: number; max: number };
  totalPoints: { current: number; max: number };
}
```

### 2.4 画面仕様

#### 2.4.1 ダッシュボード画面
- 今日の歩数表示（リアルタイム更新）
- 獲得可能ポイント表示
- ポイント残高表示
- 週間歩数グラフ
- 広告視聴ボタン

#### 2.4.2 ポイント画面
- ポイント残高詳細
- 獲得履歴一覧
- 換金履歴一覧
- フィルター機能（期間、種類）

#### 2.4.3 換金画面
- 換金可能オプション一覧
- 換金額選択
- 申請フォーム
- 確認画面

## 3. バックエンド仕様

### 3.1 技術スタック
```json
{
  "runtime": "Vercel Edge Functions",
  "language": "TypeScript",
  "database": "Turso (LibSQL)",
  "orm": "Drizzle ORM",
  "authentication": "JWT + Turso",
  "api": "REST API / tRPC",
  "deployment": "Vercel"
}
```

### 3.2 API設計 (Vercel Edge Functions)

#### 3.2.1 認証API
```
POST   /api/auth/register    # ユーザー登録
POST   /api/auth/login       # ログイン
POST   /api/auth/logout      # ログアウト
POST   /api/auth/refresh     # トークン更新
POST   /api/auth/reset       # パスワードリセット
```

#### 3.2.2 ユーザーAPI
```
GET    /api/users/profile    # プロフィール取得
PUT    /api/users/profile    # プロフィール更新
DELETE /api/users/account    # アカウント削除
```

#### 3.2.3 歩数API
```
POST   /api/steps/sync       # 歩数データ同期
GET    /api/steps/today      # 今日の歩数取得
GET    /api/steps/history    # 歩数履歴取得
```

#### 3.2.4 ポイントAPI
```
GET    /api/points/balance   # ポイント残高取得
GET    /api/points/history   # 獲得履歴取得
POST   /api/points/earn      # ポイント獲得（歩数）
POST   /api/points/ad-bonus  # 広告視聴ボーナス
```

#### 3.2.5 換金API
```
GET    /api/redeem/options   # 換金オプション一覧
POST   /api/redeem/request   # 換金申請
GET    /api/redeem/history   # 換金履歴
GET    /api/redeem/status    # 申請ステータス確認
```

### 3.3 Turso データベース設計

#### 3.3.1 テーブル構造 (SQLite/LibSQL)

**users テーブル**
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  total_points INTEGER DEFAULT 0,
  lifetime_steps INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**daily_steps テーブル**
```sql
CREATE TABLE daily_steps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  date DATE NOT NULL,
  steps INTEGER NOT NULL,
  points_earned INTEGER DEFAULT 0,
  synced_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  source TEXT DEFAULT 'healthkit',
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(user_id, date)
);
```

**point_transactions テーブル**
```sql
CREATE TABLE point_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL, -- 'steps', 'ad_view', 'bonus', 'redemption'
  amount INTEGER NOT NULL,
  balance INTEGER NOT NULL,
  description TEXT,
  metadata JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

**redemptions テーブル**
```sql
CREATE TABLE redemptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  points_used INTEGER NOT NULL,
  reward_type TEXT NOT NULL,
  reward_value INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  processed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

**sessions テーブル**
```sql
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

**app_config テーブル**
```sql
CREATE TABLE app_config (
  key TEXT PRIMARY KEY,
  value JSON NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### 3.3.2 インデックス設計
```sql
CREATE INDEX idx_daily_steps_user_date ON daily_steps(user_id, date);
CREATE INDEX idx_transactions_user_created ON point_transactions(user_id, created_at);
CREATE INDEX idx_redemptions_user ON redemptions(user_id);
CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(token);
```

## 4. 広告統合

### 4.1 AdMob設定
```typescript
interface AdConfig {
  bannerId: string;
  interstitialId: string;
  rewardedId: string;
  testMode: boolean;
}

// 広告表示位置
- バナー広告: ダッシュボード下部固定
- リワード動画: ポイント画面内ボタン
- インタースティシャル: 画面遷移時（1日3回まで）
```

### 4.2 広告収益最適化
- メディエーション設定（AdMob, Facebook Audience Network）
- eCPMフロア価格設定
- A/Bテスト実装

## 5. セキュリティ仕様

### 5.1 認証・認可
- JWT (JSON Web Token) ベースの認証
- リフレッシュトークン実装
- アクセストークン有効期限: 1時間
- リフレッシュトークン有効期限: 30日

### 5.2 API保護
```typescript
// レート制限
const rateLimits = {
  auth: '5 requests per minute',
  steps: '60 requests per hour',
  points: '30 requests per hour',
  redeem: '10 requests per day'
};

// 不正検知
const fraudDetection = {
  maxDailySteps: 50000,
  abnormalPattern: true,
  deviceFingerprint: true
};
```

### 5.3 データ保護
- HTTPS通信の強制
- 機密データの暗号化（AES-256）
- PII（個人識別情報）の最小化

## 6. パフォーマンス最適化

### 6.1 アプリ最適化
- React.memo / useMemoによる再レンダリング防止
- 画像の遅延読み込み
- コード分割とダイナミックインポート
- バンドルサイズ最適化

### 6.2 API最適化
- レスポンスキャッシュ（Redis）
- データベースインデックス最適化
- バッチ処理の実装
- CDN活用

## 7. モニタリング・分析

### 7.1 アプリ分析
- Firebase Analytics統合
- カスタムイベントトラッキング
- ユーザー行動分析
- クラッシュレポート（Crashlytics）

### 7.2 監視項目
```typescript
interface Metrics {
  app: {
    crashes: number;
    anr: number; // Application Not Responding
    loadTime: number;
  };
  api: {
    latency: number;
    errorRate: number;
    requestsPerSecond: number;
  };
  business: {
    dau: number;
    pointsDistributed: number;
    revenuePerUser: number;
  };
}
```

## 8. テスト戦略

### 8.1 テストカバレッジ目標
- ユニットテスト: 80%以上
- 統合テスト: 主要フロー100%
- E2Eテスト: クリティカルパス100%

### 8.2 テストツール
```json
{
  "unit": "Jest + React Native Testing Library",
  "integration": "Jest",
  "e2e": "Detox",
  "performance": "React Native Performance",
  "security": "OWASP ZAP"
}
```

## 9. CI/CD パイプライン

### 9.1 開発フロー
```yaml
branches:
  main: Production
  staging: Staging環境
  develop: 開発環境
  feature/*: 機能開発
```

### 9.2 自動化プロセス
1. コードプッシュ
2. 自動テスト実行
3. コード品質チェック（ESLint, Prettier）
4. ビルド生成
5. TestFlight / App Store Connect へのデプロイ

## 10. 環境変数管理

### 10.1 環境別設定
```typescript
interface Environment {
  // Vercel Environment Variables
  NEXT_PUBLIC_API_URL: string;
  TURSO_DATABASE_URL: string;
  TURSO_AUTH_TOKEN: string;

  // App Configuration
  ADMOB_BANNER_ID: string;
  ADMOB_REWARDED_ID: string;
  JWT_SECRET: string;

  // External Services
  SENTRY_DSN: string;
  AMAZON_GIFT_API_KEY: string;

  // Environment
  APP_ENV: 'development' | 'staging' | 'production';
}
```

### 10.2 シークレット管理
- Vercel Environment Variables (Production)
- .env.local for development
- GitHub Secrets for CI/CD
- Expo SecureStore for sensitive client data

---
*Document Version: 1.0*
*Last Updated: 2025-09-25*