# 「with-hook」モバイルアプリ技術選定書（改訂版）

## 開発環境

- **言語**: TypeScript
- **フレームワーク**: React Native
- **開発環境**: Expo SDK（安定性重視）

## フロントエンド

- **UIライブラリ**: React Native Paper
    - 広く使われている安定したマテリアルデザインライブラリ
    - Expoとの互換性が高い
- **ナビゲーション**: React Navigation
    - React Nativeで最も使われているナビゲーションライブラリ
    - 豊富なドキュメントと安定したAPI
- **状態管理**: Zustand
    - シンプルで使いやすい軽量な状態管理ライブラリ
    - Reduxより学習コストが低く、設定も簡単
- **フォーム管理**: React Hook Form
    - パフォーマンスに優れたフォームライブラリ
    - 必要に応じてZodでのバリデーション機能を追加

## バックエンド

- **サーバーレス**: Supabase
    - オープンソースのFirebase代替
    - PostgreSQLをベースにした堅牢なバックエンド
- **API**: Supabase REST API
    - 自動生成されるREST APIでシンプルに実装
- **HTTP/APIクライアント**: Axios
    - 安定した広く使われているHTTPクライアント
    - インターセプターやエラーハンドリングも充実
- **認証**: Supabase Auth (OAuth: Google, GitHub)
    - 組み込みの認証機能で簡単に実装
    - ソーシャルログインも標準サポート

## データベース

- **データベース**: PostgreSQL (Supabase提供)
- **データモデル**:
    - 論理削除は `deleted_at` タイムスタンプ方式
    - 非削除レコード用に部分インデックスを作成
    - ページネーション対応の効率的クエリ

## 最適化戦略

- **キャッシュ**: React Query
    - データ取得とキャッシュを効率的に管理
    - 既存のHTTPクライアントと統合可能
- **オフライン対応**:
    - **軽量**: AsyncStorage（React Native標準）
    - **オプション**: 安定版リリース後にMMKVを検討
- **ネットワーク**:
    - NetInfo（ネットワーク状態検知）
    - React Queryの再試行機能活用
- **パフォーマンス**:
    - メモ化コンポーネント（React.memo、useMemo）
    - FlatList最適化（getItemLayout、windowSizeなど）

## データ永続化

- **ローカルストレージ**:
    - AsyncStorage（シンプルで安定）
    - 堅牢性重視の設計
- **セキュアストレージ**: Expo SecureStore
    - トークンなど機密情報の安全な保存
- **クエリ永続化**: React Query + AsyncStorage
    - オフライン時の状態保存とオンライン復帰時の同期

## ビルド・デプロイ

- **ビルド**: EAS Build (Expo Application Services)
    - 段階的アプローチ（まずはDevelopment Buildから）
- **配布**:
    - 開発: Expo Go → Development Build → EAS内部配布
    - 本番: App Store + Google Play公開
- **更新**: EAS Update
    - OTA更新でユーザーに最新バージョンを提供

## 使用ライブラリ選定（安定性重視）

### コア

- @tanstack/react-query
- axios
- @react-navigation/native, @react-navigation/bottom-tabs
- @supabase/supabase-js
- zustand

### UI/UX

- react-native-paper
- @react-native-async-storage/async-storage
- expo-secure-store
- @react-native-community/netinfo

### ツール

- react-hook-form
- date-fns（日付操作）
- expo-constants

### オプション（必要に応じて追加）

- zod（バリデーション、必要な場合のみ）
- expo-image（標準Imageの代わり、パフォーマンス向上が必要な場合）

## ホスティング

- **バックエンド**: Supabase（スターター～プロプラン）
- **モバイルアプリ**: EAS（Expo Application Services）

## コスト見積もり

- **Supabase**: 無料枠（500MB DB, 1GB ストレージ）～ $25/月
- **EAS**: $3/月（標準プラン）
- **合計**: 月額 $3～28（使用量による）

## 開発・リリースフロー

- **フェーズ1**: Expo Go開発（迅速な開発サイクル）
- **フェーズ2**: Development Build（ネイティブ機能テスト）
- **フェーズ3**: EAS内部配布（テスターによる検証）
- **フェーズ4**: ストアリリース（App Store + Google Play）

## API活用方針

- **Supabase Auto-generated API**
    - テーブルごとに自動生成されるREST APIを活用
    - シンプルなCRUD操作を優先
- **Row Level Security (RLS)**
    - Supabaseのセキュリティ機能を活用
    - きめ細かなアクセス制御を実装
- **効率的なデータ取得**
    - クエリパラメータを活用した最適化
    - 必要な部分のみを取得する設計
- **段階的実装アプローチ**
    - 基本機能から開始し、徐々に高度な機能を追加
    - 安定性を優先した開発サイクル

# 実装上の注意点

1. **Expo Go限界の認識**:
    - Expo Goでは一部のネイティブ機能に制限あり
    - 早期にDevelopment Buildへの移行を検討
2. **依存関係の管理**:
    - パッケージのバージョン管理を慎重に
    - 互換性問題を避けるため、追加ライブラリは厳選
3. **段階的実装**:
    - コア機能から実装開始
    - 安定性を確認しながら機能追加
    - MVPアプローチで迅速にフィードバック獲得
4. **エラーハンドリング**:
    - 堅牢なエラーハンドリング導入
    - ユーザーエクスペリエンスを損なわない設計
    - デバッグ容易性を確保
5. **パフォーマンス最適化**:
    - 初期段階ではシンプルに保つ
    - 問題が明確になった時点で最適化
    - プロファイリングに基づく改善

