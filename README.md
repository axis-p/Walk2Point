# 🚶‍♂️ Walk2Point

> 歩いてポイントを貯める、新しいフィットネス体験

[![iOS](https://img.shields.io/badge/platform-iOS-blue.svg)](https://developer.apple.com/ios/)
[![Expo](https://img.shields.io/badge/Expo-SDK%2050+-black.svg?logo=expo)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg?logo=typescript)](https://www.typescriptlang.org/)
[![Vercel](https://img.shields.io/badge/Vercel-deployed-black.svg?logo=vercel)](https://vercel.com/)
[![Turso](https://img.shields.io/badge/Turso-LibSQL-green.svg)](https://turso.tech/)

## 📱 概要

Walk2Point は日常の歩数をポイントに変換し、貯まったポイントをAmazonギフト券などのデジタルマネーに換金できるフィットネス連動型iOSアプリです。

### 🎯 コンセプト
- **歩数 → ポイント変換**: 2,000歩 = 1ポイント
- **広告収益モデル**: AdMob広告の収益をユーザーに還元
- **持続可能性**: 収益の60-70%をポイント還元、利益率20-30%を確保

## 🌟 主要機能

### Phase 1 - MVP (2025年9月-11月)
- 🔐 **ユーザー認証** - メールアドレス & パスワード
- 📊 **歩数トラッキング** - iOS HealthKit連携
- 💰 **ポイントシステム** - 歩数・広告視聴でポイント獲得
- 📺 **広告統合** - Google AdMob (バナー・動画リワード)
- 🎁 **基本換金機能** - Amazonギフト券交換

### Phase 2 - 機能拡張 (2025年11月-12月)
- 👥 **ソーシャル機能** - ランキング・友達招待
- 💳 **追加換金オプション** - PayPay・楽天ポイント
- ⚡ **パフォーマンス最適化**
- 🧪 **A/Bテスト実装**

### Phase 3 - リリース (2026年1月〜)
- 🚀 **App Store公開**
- 📈 **マーケティング展開**
- 🔄 **継続的改善**

## 🛠 技術スタック

### フロントエンド
- **Framework**: Expo SDK 50+ (React Native)
- **Language**: TypeScript 5.0+
- **State Management**: Redux Toolkit / Zustand
- **Navigation**: React Navigation 6
- **UI Library**: NativeBase

### バックエンド
- **Runtime**: Vercel Edge Functions
- **Database**: Turso (LibSQL/SQLite)
- **ORM**: Drizzle ORM
- **Authentication**: JWT

### インフラ・サービス
- **Hosting**: Vercel
- **Analytics**: Firebase Analytics
- **Ads**: Google AdMob
- **Error Tracking**: Sentry
- **CI/CD**: GitHub Actions

## 📊 収益計画

### 広告収益予測
- **バナー広告**: eCPM 50-150円
- **動画広告**: eCPM 1,000-3,000円
- **1ユーザーあたり**: 日次7-10円

### 成長予測 (1年間)
| 期間 | MAU | 広告収益 | 純利益 |
|------|-----|---------|--------|
| 1ヶ月目 | 500 | ¥31,500 | ¥1,750 |
| 6ヶ月目 | 7,500 | ¥472,500 | ¥71,250 |
| 12ヶ月目 | 28,000 | ¥1,764,000 | ¥288,000 |

**年間総利益予測: ¥1,271,750**

## 📱 アプリ設計

### 画面構成
1. **ダッシュボード** - 今日の歩数・進捗・ポイント獲得
2. **ポイント履歴** - 残高・取引履歴・フィルター機能
3. **ポイント交換** - 換金オプション・申請フォーム
4. **プロフィール** - ユーザー統計・設定・ヘルプ

### UI/UX特徴
- 🌙 **ダークモード** - 目に優しく省電力
- 📊 **視覚的フィードバック** - 進捗円グラフ・統計表示
- 🎮 **ガミフィケーション** - レベル・連続記録・アチーブメント
- 📱 **直感的操作** - タブナビゲーション・スワイプジェスチャー

## 🗄️ データベース設計 (Turso)

### 主要テーブル
```sql
-- ユーザー情報
users (id, email, password_hash, total_points, lifetime_steps, ...)

-- 日次歩数データ
daily_steps (user_id, date, steps, points_earned, ...)

-- ポイント取引履歴
point_transactions (user_id, type, amount, balance_after, ...)

-- 換金申請
redemptions (user_id, points_used, reward_type, status, ...)

-- 広告視聴記録
ad_views (user_id, ad_type, points_earned, completed, ...)
```

## 🚦 開発ロードマップ

### Sprint構成 (2週間スプリント)
- **Sprint 1-2**: プロジェクト基盤・UI/UXデザイン
- **Sprint 3-4**: 認証機能実装
- **Sprint 5-7**: 歩数トラッキング・HealthKit連携
- **Sprint 8-10**: ポイントシステム・不正対策
- **Sprint 11-13**: 広告統合・換金機能
- **Sprint 14-15**: テスト・リリース準備

## 📈 重要指標 (KPI)

### 目標数値
- **DAU/MAU比率**: 30%以上
- **D1リテンション**: 40%
- **月間ARPU**: ¥200
- **LTV/CAC比率**: 12.0

### モニタリング項目
- 歩数データの精度・同期状況
- ポイント付与・換金処理の正確性
- 広告表示・収益の最適化
- ユーザーエンゲージメント

## 🔒 セキュリティ・不正対策

- **JWT認証** - アクセストークン1時間、リフレッシュトークン30日
- **レート制限** - API呼び出し頻度制限
- **異常検知** - 1日50,000歩超の検知・自動フラグ
- **データ暗号化** - HTTPS通信・機密データAES-256
- **不正利用ログ** - 怪しい活動の記録・分析

## 💰 コスト構造

### 月額運営費
- **Vercel Pro**: ¥3,000
- **Turso Starter**: ¥4,500〜
- **その他ツール**: ¥2,000
- **合計**: 約¥10,000/月

### 変動費
- **ポイント還元**: 収益の55%
- **決済手数料**: 換金額の3%
- **カスタマーサポート**: 必要に応じて

## 🚀 セットアップ・開発

### 前提条件
- Node.js 18+
- iOS開発環境 (Xcode)
- Expo CLI

### 環境変数
```bash
# Turso Database
TURSO_DATABASE_URL=libsql://your-database.turso.io
TURSO_AUTH_TOKEN=your-auth-token

# AdMob
ADMOB_BANNER_ID=ca-app-pub-xxxxx
ADMOB_REWARDED_ID=ca-app-pub-xxxxx

# JWT
JWT_SECRET=your-jwt-secret

# External Services
SENTRY_DSN=your-sentry-dsn
AMAZON_GIFT_API_KEY=your-amazon-api-key
```

### 開発開始
```bash
# リポジトリクローン
git clone https://github.com/poteeeet/Walk2Point.git
cd Walk2Point

# 依存関係インストール
npm install

# Expo開発サーバー起動
expo start

# iOSシミュレーター
expo start --ios
```

## 📝 ライセンス

MIT License

## 👤 開発者

**poteeeet**
- GitHub: [@poteeeet](https://github.com/poteeeet)
- 企画・設計・開発

## 🤝 コントリビューション

プロジェクトへの貢献を歓迎します！

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 🔗 リンク

- **📖 プロジェクト詳細**: [GitHub Pages](https://poteeeet.github.io/Walk2Point/)
- **📋 要件定義書**: [docs/requirements.md](./docs/requirements.md)
- **⚡ 技術仕様書**: [docs/technical-spec.md](./docs/technical-spec.md)
- **💰 収益計画書**: [docs/revenue-plan.md](./docs/revenue-plan.md)
- **🗃️ DB設計書**: [docs/turso-database-design.md](./docs/turso-database-design.md)
- **🗺️ 開発ロードマップ**: [docs/roadmap.md](./docs/roadmap.md)

---

**Walk2Point** - 歩くことを、もっと楽しく、もっと価値あるものに 🚶‍♂️✨
