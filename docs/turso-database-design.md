# Walk2Point - Turso Database設計書

## 1. Turso概要

### 1.1 Tursoの特徴
- **基盤**: LibSQL（SQLiteフォーク）
- **エッジ対応**: 世界30+箇所のロケーション
- **レプリケーション**: 自動マルチリージョンレプリケーション
- **料金**: 無料枠 8GB ストレージ、10億行読み取り/月
- **Vercel統合**: Edge Functionsとの低レイテンシー接続

### 1.2 接続設定
```typescript
// turso.config.ts
import { createClient } from '@libsql/client';

export const turso = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

// Edge対応
export const tursoEdge = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
  // Edge Functionで使用
  fetch: globalThis.fetch,
});
```

## 2. データベーススキーマ

### 2.1 テーブル定義（SQL）

```sql
-- ユーザーテーブル
CREATE TABLE users (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  total_points INTEGER DEFAULT 0,
  lifetime_steps INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'suspended', 'deleted')),
  last_login_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- セッション管理テーブル
CREATE TABLE sessions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  user_id TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  refresh_token TEXT UNIQUE,
  device_info TEXT, -- JSON: {platform, version, device_id}
  ip_address TEXT,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 日次歩数テーブル
CREATE TABLE daily_steps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  date DATE NOT NULL,
  steps INTEGER NOT NULL DEFAULT 0,
  distance REAL, -- メートル単位
  calories REAL,
  active_minutes INTEGER,
  points_earned INTEGER DEFAULT 0,
  synced_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  source TEXT DEFAULT 'healthkit' CHECK(source IN ('healthkit', 'manual', 'google_fit')),
  raw_data TEXT, -- JSON形式の生データ
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, date)
);

-- ポイント取引テーブル
CREATE TABLE point_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('steps', 'ad_view', 'bonus', 'redemption', 'adjustment', 'referral')),
  amount INTEGER NOT NULL, -- 正の値は加算、負の値は減算
  balance_after INTEGER NOT NULL, -- トランザクション後の残高
  description TEXT,
  metadata TEXT, -- JSON: 追加情報
  reference_id TEXT, -- 関連ID（daily_steps.id, ad_views.id等）
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 広告視聴記録テーブル
CREATE TABLE ad_views (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  ad_type TEXT NOT NULL CHECK(ad_type IN ('banner', 'interstitial', 'rewarded')),
  ad_unit_id TEXT NOT NULL,
  points_earned INTEGER DEFAULT 0,
  watched_duration INTEGER, -- 秒単位
  completed BOOLEAN DEFAULT FALSE,
  ip_address TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 換金申請テーブル
CREATE TABLE redemptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  points_used INTEGER NOT NULL,
  reward_type TEXT NOT NULL CHECK(reward_type IN ('amazon_gift', 'paypay', 'rakuten', 'google_play', 'apple_gift')),
  reward_value INTEGER NOT NULL, -- 円単位
  reward_code TEXT, -- ギフトコード（暗号化して保存）
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  processed_at DATETIME,
  completed_at DATETIME,
  failure_reason TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- アプリ設定テーブル
CREATE TABLE app_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL, -- JSON形式
  description TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 初期設定値の挿入
INSERT INTO app_config (key, value, description) VALUES
  ('points_rate', '{"steps_per_point": 2000, "max_daily_steps_points": 15}', '歩数ポイント換算レート'),
  ('ad_rewards', '{"banner": 0, "interstitial": 1, "rewarded": 3}', '広告視聴報酬'),
  ('daily_limits', '{"max_ad_views": 5, "max_total_points": 25}', '1日の上限設定'),
  ('redemption_minimums', '{"amazon_gift": 500, "paypay": 500}', '最小換金ポイント');

-- ユーザー統計テーブル（集計用）
CREATE TABLE user_stats (
  user_id TEXT PRIMARY KEY,
  total_days_active INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  total_ads_watched INTEGER DEFAULT 0,
  total_redemptions INTEGER DEFAULT 0,
  last_active_date DATE,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 不正検知ログテーブル
CREATE TABLE fraud_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  detection_type TEXT NOT NULL, -- 'abnormal_steps', 'rapid_ads', 'device_mismatch'等
  details TEXT, -- JSON形式の詳細情報
  severity TEXT CHECK(severity IN ('low', 'medium', 'high', 'critical')),
  action_taken TEXT, -- 'warned', 'points_frozen', 'account_suspended'等
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### 2.2 インデックス設計

```sql
-- パフォーマンス最適化のためのインデックス
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_user_expires ON sessions(user_id, expires_at);
CREATE INDEX idx_daily_steps_user_date ON daily_steps(user_id, date DESC);
CREATE INDEX idx_point_transactions_user_created ON point_transactions(user_id, created_at DESC);
CREATE INDEX idx_point_transactions_type ON point_transactions(type);
CREATE INDEX idx_ad_views_user_created ON ad_views(user_id, created_at DESC);
CREATE INDEX idx_redemptions_user_status ON redemptions(user_id, status);
CREATE INDEX idx_redemptions_status ON redemptions(status);
CREATE INDEX idx_fraud_logs_user ON fraud_logs(user_id);
```

### 2.3 トリガー設計

```sql
-- updated_atの自動更新トリガー
CREATE TRIGGER update_users_updated_at
AFTER UPDATE ON users
BEGIN
  UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER update_redemptions_updated_at
AFTER UPDATE ON redemptions
BEGIN
  UPDATE redemptions SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- ポイント残高の整合性チェックトリガー
CREATE TRIGGER check_points_balance
BEFORE INSERT ON point_transactions
BEGIN
  SELECT RAISE(ABORT, 'Insufficient points balance')
  WHERE NEW.amount < 0
    AND (SELECT total_points FROM users WHERE id = NEW.user_id) + NEW.amount < 0;
END;

-- ユーザー統計の自動更新トリガー
CREATE TRIGGER update_user_stats_on_steps
AFTER INSERT ON daily_steps
BEGIN
  INSERT INTO user_stats (user_id, total_days_active, last_active_date)
  VALUES (NEW.user_id, 1, NEW.date)
  ON CONFLICT(user_id) DO UPDATE SET
    total_days_active = total_days_active + 1,
    last_active_date = NEW.date,
    current_streak = CASE
      WHEN date(last_active_date) = date(NEW.date, '-1 day') THEN current_streak + 1
      ELSE 1
    END,
    longest_streak = MAX(longest_streak, current_streak + 1),
    updated_at = CURRENT_TIMESTAMP;
END;
```

## 3. Drizzle ORM実装

### 3.1 スキーマ定義（TypeScript）

```typescript
// db/schema.ts
import { sql } from 'drizzle-orm';
import {
  sqliteTable,
  text,
  integer,
  real,
  datetime,
  primaryKey,
  unique,
  index
} from 'drizzle-orm/sqlite-core';

// Users table
export const users = sqliteTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text('email').unique().notNull(),
  passwordHash: text('password_hash').notNull(),
  displayName: text('display_name').notNull(),
  avatarUrl: text('avatar_url'),
  totalPoints: integer('total_points').default(0),
  lifetimeSteps: integer('lifetime_steps').default(0),
  status: text('status', { enum: ['active', 'suspended', 'deleted'] }).default('active'),
  lastLoginAt: datetime('last_login_at'),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

// Daily Steps table
export const dailySteps = sqliteTable('daily_steps', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull().references(() => users.id),
  date: text('date').notNull(), // YYYY-MM-DD format
  steps: integer('steps').notNull().default(0),
  distance: real('distance'),
  calories: real('calories'),
  activeMinutes: integer('active_minutes'),
  pointsEarned: integer('points_earned').default(0),
  syncedAt: datetime('synced_at').default(sql`CURRENT_TIMESTAMP`),
  source: text('source', { enum: ['healthkit', 'manual', 'google_fit'] }).default('healthkit'),
  rawData: text('raw_data'),
}, (table) => ({
  userDateUnique: unique().on(table.userId, table.date),
  userDateIdx: index('idx_daily_steps_user_date').on(table.userId, table.date),
}));

// Point Transactions table
export const pointTransactions = sqliteTable('point_transactions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull().references(() => users.id),
  type: text('type', {
    enum: ['steps', 'ad_view', 'bonus', 'redemption', 'adjustment', 'referral']
  }).notNull(),
  amount: integer('amount').notNull(),
  balanceAfter: integer('balance_after').notNull(),
  description: text('description'),
  metadata: text('metadata'), // JSON
  referenceId: text('reference_id'),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  userCreatedIdx: index('idx_transactions_user_created').on(table.userId, table.createdAt),
}));

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type DailyStep = typeof dailySteps.$inferSelect;
export type NewDailyStep = typeof dailySteps.$inferInsert;
export type PointTransaction = typeof pointTransactions.$inferSelect;
export type NewPointTransaction = typeof pointTransactions.$inferInsert;
```

### 3.2 データベース接続とクエリ例

```typescript
// db/index.ts
import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

export const db = drizzle(client, { schema });

// クエリ例
import { eq, and, desc, gte, sql } from 'drizzle-orm';

// ユーザー作成
export async function createUser(userData: NewUser) {
  const [user] = await db.insert(users).values(userData).returning();
  return user;
}

// 今日の歩数取得
export async function getTodaySteps(userId: string) {
  const today = new Date().toISOString().split('T')[0];
  const [step] = await db
    .select()
    .from(dailySteps)
    .where(and(
      eq(dailySteps.userId, userId),
      eq(dailySteps.date, today)
    ));
  return step;
}

// ポイント履歴取得（ページネーション付き）
export async function getPointHistory(userId: string, limit = 20, offset = 0) {
  return await db
    .select()
    .from(pointTransactions)
    .where(eq(pointTransactions.userId, userId))
    .orderBy(desc(pointTransactions.createdAt))
    .limit(limit)
    .offset(offset);
}

// ポイント付与（トランザクション）
export async function awardPoints(
  userId: string,
  amount: number,
  type: string,
  description: string
) {
  return await db.transaction(async (tx) => {
    // 現在のポイント残高を取得
    const [user] = await tx
      .select({ totalPoints: users.totalPoints })
      .from(users)
      .where(eq(users.id, userId));

    const newBalance = (user?.totalPoints || 0) + amount;

    // ポイント残高を更新
    await tx
      .update(users)
      .set({ totalPoints: newBalance })
      .where(eq(users.id, userId));

    // トランザクション記録を作成
    const [transaction] = await tx
      .insert(pointTransactions)
      .values({
        userId,
        type,
        amount,
        balanceAfter: newBalance,
        description,
      })
      .returning();

    return transaction;
  });
}
```

## 4. API実装例（Vercel Edge Functions）

### 4.1 歩数同期API

```typescript
// api/steps/sync.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { dailySteps, users, pointTransactions } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { verifyToken } from '@/lib/auth';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    // 認証チェック
    const userId = await verifyToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { date, steps, distance, calories, source } = body;

    // 不正な歩数チェック
    if (steps > 100000) {
      await logFraudDetection(userId, 'abnormal_steps', { steps });
      return NextResponse.json({ error: 'Invalid step count' }, { status: 400 });
    }

    // 設定値を取得
    const config = await getAppConfig(['points_rate', 'daily_limits']);
    const stepsPerPoint = config.points_rate.steps_per_point;
    const maxDailyPoints = config.daily_limits.max_daily_steps_points;

    // ポイント計算
    const pointsEarned = Math.min(
      Math.floor(steps / stepsPerPoint),
      maxDailyPoints
    );

    // トランザクション処理
    const result = await db.transaction(async (tx) => {
      // 歩数データを保存/更新
      const [stepData] = await tx
        .insert(dailySteps)
        .values({
          userId,
          date,
          steps,
          distance,
          calories,
          pointsEarned,
          source,
        })
        .onConflictDoUpdate({
          target: [dailySteps.userId, dailySteps.date],
          set: {
            steps,
            distance,
            calories,
            pointsEarned,
            syncedAt: new Date(),
          },
        })
        .returning();

      // ポイントを付与
      if (pointsEarned > 0) {
        await awardPointsInTransaction(tx, userId, pointsEarned, 'steps',
          `${date}の歩数報酬: ${steps.toLocaleString()}歩`);
      }

      return stepData;
    });

    return NextResponse.json({
      success: true,
      data: result,
      pointsEarned
    });
  } catch (error) {
    console.error('Steps sync error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 4.2 広告視聴ボーナスAPI

```typescript
// api/points/ad-bonus.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { adViews, pointTransactions } from '@/db/schema';
import { eq, and, gte, count } from 'drizzle-orm';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const userId = await verifyToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { adType, adUnitId, watchedDuration, completed } = body;

    // 今日の広告視聴回数をチェック
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [viewCount] = await db
      .select({ count: count() })
      .from(adViews)
      .where(and(
        eq(adViews.userId, userId),
        gte(adViews.createdAt, today),
        eq(adViews.adType, 'rewarded')
      ));

    const config = await getAppConfig(['ad_rewards', 'daily_limits']);
    const maxAdViews = config.daily_limits.max_ad_views;

    if (viewCount.count >= maxAdViews) {
      return NextResponse.json({
        error: 'Daily ad view limit reached'
      }, { status: 429 });
    }

    // 広告視聴記録とポイント付与
    const result = await db.transaction(async (tx) => {
      const pointsEarned = completed ? config.ad_rewards[adType] : 0;

      // 広告視聴記録
      const [adView] = await tx
        .insert(adViews)
        .values({
          userId,
          adType,
          adUnitId,
          pointsEarned,
          watchedDuration,
          completed,
          ipAddress: request.headers.get('x-forwarded-for'),
        })
        .returning();

      // ポイント付与
      if (pointsEarned > 0) {
        await awardPointsInTransaction(tx, userId, pointsEarned, 'ad_view',
          `${adType}広告視聴ボーナス`);
      }

      return { adView, pointsEarned };
    });

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Ad bonus error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## 5. マイグレーション戦略

### 5.1 初期セットアップ

```bash
# Turso CLIインストール
curl -sSfL https://get.tur.so/install.sh | bash

# データベース作成
turso db create walk2point --location nrt
turso db tokens create walk2point

# 環境変数設定
echo "TURSO_DATABASE_URL=$(turso db show walk2point --url)" >> .env
echo "TURSO_AUTH_TOKEN=$(turso db tokens create walk2point)" >> .env
```

### 5.2 Drizzle マイグレーション

```typescript
// drizzle.config.ts
import type { Config } from 'drizzle-kit';

export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  driver: 'turso',
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  },
} satisfies Config;
```

```bash
# マイグレーション生成と実行
npx drizzle-kit generate:sqlite
npx drizzle-kit push:sqlite
```

## 6. パフォーマンス最適化

### 6.1 クエリ最適化

```typescript
// バッチ処理の例
export async function batchUpdateUserStats(userIds: string[]) {
  const batchSize = 100;
  const batches = [];

  for (let i = 0; i < userIds.length; i += batchSize) {
    const batch = userIds.slice(i, i + batchSize);
    batches.push(batch);
  }

  for (const batch of batches) {
    await db
      .update(userStats)
      .set({
        updatedAt: new Date(),
        // その他の更新
      })
      .where(sql`user_id IN (${sql.join(batch.map(id => sql`${id}`), sql`, `)})`);
  }
}

// 集計クエリの最適化
export async function getLeaderboard(limit = 100) {
  return await db.execute(sql`
    WITH RankedUsers AS (
      SELECT
        u.id,
        u.display_name,
        u.total_points,
        COUNT(DISTINCT ds.date) as active_days,
        RANK() OVER (ORDER BY u.total_points DESC) as rank
      FROM users u
      LEFT JOIN daily_steps ds ON u.id = ds.user_id
      WHERE u.status = 'active'
      GROUP BY u.id
    )
    SELECT * FROM RankedUsers
    WHERE rank <= ${limit}
    ORDER BY rank
  `);
}
```

### 6.2 キャッシュ戦略

```typescript
// Vercel KVを使用したキャッシュ
import { kv } from '@vercel/kv';

export async function getCachedUserStats(userId: string) {
  const cacheKey = `user_stats:${userId}`;

  // キャッシュチェック
  const cached = await kv.get(cacheKey);
  if (cached) return cached;

  // DBから取得
  const stats = await db
    .select()
    .from(userStats)
    .where(eq(userStats.userId, userId))
    .limit(1);

  // キャッシュに保存（1時間）
  await kv.set(cacheKey, stats[0], { ex: 3600 });

  return stats[0];
}
```

## 7. バックアップとリカバリ

### 7.1 自動バックアップ

```bash
# 日次バックアップスクリプト
#!/bin/bash
DATE=$(date +%Y%m%d)
turso db dump walk2point > backup_${DATE}.sql
aws s3 cp backup_${DATE}.sql s3://walk2point-backups/
```

### 7.2 Point-in-Timeリカバリ

Turso Proプランでは自動的に30日間のPoint-in-Timeリカバリが提供される

## 8. モニタリング

### 8.1 重要メトリクス

```typescript
// api/admin/metrics.ts
export async function getDatabaseMetrics() {
  const metrics = await db.execute(sql`
    SELECT
      (SELECT COUNT(*) FROM users) as total_users,
      (SELECT COUNT(*) FROM users WHERE date(last_login_at) = date('now')) as dau,
      (SELECT COUNT(*) FROM point_transactions WHERE date(created_at) = date('now')) as daily_transactions,
      (SELECT SUM(amount) FROM point_transactions WHERE date(created_at) = date('now') AND type != 'redemption') as points_distributed_today,
      (SELECT COUNT(*) FROM redemptions WHERE status = 'pending') as pending_redemptions
  `);

  return metrics[0];
}
```

### 8.2 アラート設定

- クエリ実行時間 > 1秒
- エラーレート > 1%
- ストレージ使用率 > 80%
- 同時接続数 > 900

---
*Document Version: 1.0*
*Last Updated: 2025-09-25*