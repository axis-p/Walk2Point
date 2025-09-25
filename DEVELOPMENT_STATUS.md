# Walk2Point 開発状況メモ

## プロジェクト概要
歩いてポイントを貯めるフィットネスアプリ（React Native + Expo）

## 現在の状態（2025-09-26）

### ✅ 解決済みの問題
1. **babel-plugin-module-resolver** - インストール済み
2. **babel-preset-expo** - インストール済み
3. **react-native-reanimated プラグインエラー**
   - babel.config.js から `'react-native-reanimated/plugin'` を削除
   - コード内でreanimatedを使用していないため不要
4. **react-native-worklets** - インストール済み（0.6.0）
5. **依存関係の競合** - `--legacy-peer-deps` で解決
6. **アセットファイルエラー** - app.json からアセット参照を削除

### 🔧 現在の設定

#### サーバー状況
- **現在稼働中**: ポート8086
- **Metro Bundler**: 正常動作

#### 認証設定（テスト用）
```typescript
// src/store/slices/authSlice.ts
const initialState: AuthState = {
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    displayName: 'テストユーザー',
    // ...
  },
  token: 'test-token',
  refreshToken: 'test-refresh-token',
  isAuthenticated: true, // ← テスト用に true に設定
}
```

#### Babel設定
```javascript
// babel.config.js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./src'],
          extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
          alias: {
            '@': './src',
            '@/components': './src/components',
            '@/screens': './src/screens',
            '@/navigation': './src/navigation',
            '@/store': './src/store',
            '@/services': './src/services',
            '@/utils': './src/utils',
            '@/hooks': './src/hooks',
            '@/types': './src/types',
            '@/constants': './src/constants',
          },
        },
      ]
      // react-native-reanimated/plugin は削除済み
    ],
  };
};
```

#### 依存関係
```json
{
  "dependencies": {
    "react-native-reanimated": "~4.1.1",
    "react-native-worklets": "^0.6.0",
    // ... その他
  },
  "devDependencies": {
    "babel-plugin-module-resolver": "^5.0.2",
    "babel-preset-expo": "^54.0.3",
    "@types/react": "~19.1.10",
    "eslint-config-expo": "~10.0.0",
    "jest-expo": "~54.0.12"
  }
}
```

### 📱 現在のアプリ状態
- ✅ アプリ起動: 正常
- ✅ 認証バイパス: 有効（テスト用）
- ✅ メイン画面表示: 可能
- ✅ ナビゲーション: 動作確認済み

### 🔄 次に戻すべき設定（本格開発時）

#### 1. 認証状態を元に戻す
```typescript
// src/store/slices/authSlice.ts
const initialState: AuthState = {
  user: null,
  token: null,
  refreshToken: null,
  isLoading: false,
  error: null,
  isAuthenticated: false, // ← false に戻す
};
```

#### 2. バックエンドAPIの実装が必要
- `/auth/login` エンドポイント
- `/auth/register` エンドポイント
- `/auth/validate` エンドポイント
- その他API設計に基づくエンドポイント

#### 3. アセットファイルの追加（必要に応じて）
```
assets/
  ├── icon.png
  ├── splash.png
  ├── adaptive-icon.png
  └── favicon.png
```

### 🚨 重要な注意事項
1. **テスト設定**: 現在は認証をバイパスしているため、実際のログイン機能は動作しません
2. **複数ポート**: 古いサーバー（8083, 8085等）が複数起動中の可能性があります
3. **Expo CLI警告**: Node.js 17+ では legacy expo-cli の警告が出ますが動作に問題ありません

### 🔍 確認済みファイル構造
```
src/
├── components/common/     # 共通コンポーネント
├── constants/            # 定数
├── navigation/           # ナビゲーション
├── screens/             # 画面コンポーネント
├── services/            # API サービス
├── store/               # Redux store
└── types/               # TypeScript型定義
```

### 📝 コマンド履歴（トラブル時の参考）
```bash
# 依存関係インストール
npm install --legacy-peer-deps

# サーバー起動
npx expo start --port 8086 --clear

# 必要に応じてキャッシュクリア
rm -rf node_modules/.cache
```

---
**最終更新**: 2025-09-26
**現在のポート**: 8086
**状態**: テスト用認証バイパス有効