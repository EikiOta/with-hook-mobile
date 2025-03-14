# 「with-hook」モバイルアプリ技術選定書（REST API版）

## 開発環境

- **言語**: TypeScript
- **フレームワーク**: React Native
- **開発環境**: Expo SDK

## フロントエンド

- **UIライブラリ**: React Native Paper
- **ナビゲーション**: React Navigation
- **状態管理**: Zustand
- **フォーム管理**: React Hook Form + Zod

## バックエンド

- **サーバーレス**: Supabase
- **API**: Supabase REST API + RPC関数
- **HTTP/APIクライアント**: Axios + React Query
- **認証**: Supabase Auth (OAuth: Google, GitHub)

## データベース

- **データベース**: PostgreSQL (Supabase提供)
- **データモデル**:
    - 論理削除は `deleted_at` タイムスタンプ方式を維持
    - 非削除レコード用に部分インデックスを作成
    - ページネーション対応の効率的クエリ

## 最適化戦略

- **キャッシュ**: React Query のキャッシュ管理
- **オフライン対応**: MMKV + AsyncStorage + React Query オフラインサポート
- **ネットワーク**: NetInfo + React Query の再試行・失敗時ミューテーションキュー
- **画像最適化**: React Native Fast Image
- **パフォーマンス**: メモ化コンポーネント + FlatList最適化

## データ永続化

- **ローカルストレージ**: MMKV（高速）+ AsyncStorage（バックアップ）
- **セキュアストレージ**: Expo SecureStore
- **クエリ永続化**: React Query persistQueryClient

## ビルド・デプロイ

- **ビルド**: EAS Build (Expo Application Services)
- **配布**: App Store + Google Play
- **更新**: EAS Update (OTA更新)

## 使用ライブラリ

- @tanstack/react-query
- axios
- @react-navigation/native, @react-navigation/bottom-tabs
- @supabase/supabase-js
- zustand
- react-native-paper
- react-native-mmkv
- react-native-fast-image
- @react-native-community/netinfo
- react-hook-form
- expo-secure-store
- expo-updates

## ホスティング

- **バックエンド**: Supabase（スターター～プロプラン）
- **モバイルアプリ**: EAS（Expo Application Services）

## コスト見積もり

- **Supabase**: 無料枠（500MB DB, 1GB ストレージ）～ $25/月
- **EAS**: $3/月（標準プラン）
- **合計**: 月額 $3～28（使用量による）

## 開発・リリースフロー

- 開発環境: Expo Go
- テスト: EAS内部配布
- 本番: App Store + Google Play公開

## REST API 活用方針

- **Supabase Auto-generated API**: データベーステーブルごとに自動生成されるREST APIエンドポイントを活用
- **PostgreSQL RPC関数**: 複雑なビジネスロジックはRPC関数としてサーバーサイドに実装
- **Row Level Security (RLS)**: セキュリティはSupabaseのRLSで実装し、APIレベルでのアクセス制御を実現
- **データフィルタリング**: クエリパラメータを活用した効率的なフィルタリングとページネーション
- **一括操作**: 複数レコードの操作は一度のAPI呼び出しで処理し、ネットワーク負荷を低減