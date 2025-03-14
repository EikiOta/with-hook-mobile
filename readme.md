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

# 既存のwebアプリ・with-hook 英単語帳アプリ仕様書（React Native移植用）

## 1. アプリケーション概要

「with-hook」は英単語学習のためのウェブアプリケーションで、「記憶hook」と呼ばれる単語の覚え方を登録・共有できる機能が特徴です。ユーザーは単語の意味と記憶hookを作成・管理し、自分専用の単語帳を作成できます。

### 主な特徴

- Google/GitHubアカウントによるソーシャルログイン
- 英単語の検索と登録
- 単語の意味と記憶hookの管理
- 自分専用の単語帳（My単語帳）機能
- ユーザー間での意味と記憶hookの共有（公開/非公開設定あり）
- 論理削除と復旧機能（30日以内のアカウント復旧が可能）

## 2. データモデル

### ユーザー (User)

```
コピー
- user_id: UUID（主キー）
- providerAccountId: String（認証プロバイダーのID）
- nickname: String
- profile_image: String
- created_at: DateTime
- updated_at: DateTime
- deleted_at: DateTime（論理削除用、nullなら有効）

```

### 単語 (Word)

```
コピー
- word_id: Int（主キー）
- word: String（ユニーク）
- created_at: DateTime
- updated_at: DateTime

```

### 意味 (Meaning)

```
コピー
- meaning_id: Int（主キー）
- word_id: Int（Word参照）
- user_id: UUID（User参照）
- meaning: String
- is_public: Boolean
- created_at: DateTime
- updated_at: DateTime
- deleted_at: DateTime（論理削除用）

```

### 記憶Hook (MemoryHook)

```
コピー
- memory_hook_id: Int（主キー）
- word_id: Int（Word参照）
- user_id: UUID（User参照）
- memory_hook: String
- is_public: Boolean
- created_at: DateTime
- updated_at: DateTime
- deleted_at: DateTime（論理削除用）

```

### ユーザー単語 (UserWord)

```
コピー
- user_words_id: Int（主キー）
- user_id: UUID（User参照）
- word_id: Int（Word参照）
- meaning_id: Int（Meaning参照）
- memory_hook_id: Int（MemoryHook参照、任意）
- created_at: DateTime
- updated_at: DateTime
- deleted_at: DateTime（論理削除用）

```

## 3. 主要画面と機能

### 1. ログイン画面

- Google/GitHubによるOAuth認証
- 初回ログイン時に自動的にユーザープロファイル作成

### 2. ホーム画面

- 英単語検索と自分の単語帳へのナビゲーション
- シンプルなカードUIで主要機能にアクセス

### 3. 英単語検索画面

- 英単語の前方一致検索
- 外部APIを利用した英単語候補表示（Dictionary APIとDatamuse API）
- 品詞による絞り込み機能（名詞/動詞/形容詞/副詞）
- ページネーション

### 4. 単語詳細画面

- タブ切り替えUI（単語設定/意味一覧/記憶hook一覧）
- 意味と記憶hookの作成・編集・削除
- 他ユーザーが公開している意味と記憶hookの閲覧
- 選択した意味と記憶hookをMy単語帳に追加/更新

### 5. My単語帳画面

- 登録した単語の一覧表示
- 単語、意味、記憶hookの表示
- 単語の編集（詳細画面への遷移）と削除
- ページネーション

### 6. 管理画面

- 自分が作成した意味と記憶hookの一覧管理
- タブで意味と記憶hookを切り替え表示
- 作成した意味と記憶hookの編集・削除

### 7. 設定画面

- アカウント削除機能
- 削除は30日間の論理削除（その間は復旧可能）

### 8. アカウント復旧画面

- 論理削除されたアカウントでログイン時に表示
- アカウントの復旧またはログアウト（新規アカウント作成）選択

## 4. API仕様

### 認証関連

- OAuth認証（Google/GitHub）
- セッション管理は認証トークンベース

### 単語関連

### 検索API

- 外部API:
    - Dictionary API: `https://api.dictionaryapi.dev/api/v2/entries/en/{word}`
    - Datamuse API: `https://api.datamuse.com/words?sp={word}*&md=p`

### 意味関連

### 作成

- エンドポイント: `/api/meaning/create`
- メソッド: POST
- パラメータ: `wordText`, `meaningText`, `isPublic`
- 処理: 単語が存在しなければ新規作成し、意味を登録

### 更新

- エンドポイント: `/api/meaning/update`
- メソッド: POST
- パラメータ: `meaning_id`, `meaningText`, `isPublic`

### 削除（論理削除）

- エンドポイント: `/api/meaning/delete`
- メソッド: POST
- パラメータ: `meaning_id`
- 処理: 削除日時設定と内容を「削除済み」に書き換え

### 記憶Hook関連

### 作成

- エンドポイント: `/api/memoryHook/create`
- メソッド: POST
- パラメータ: `wordText`, `hookText`, `isPublic`

### 更新

- エンドポイント: `/api/memoryHook/update`
- メソッド: POST
- パラメータ: `memory_hook_id`, `hookText`, `isPublic`

### 削除（論理削除）

- エンドポイント: `/api/memoryHook/delete`
- メソッド: POST
- パラメータ: `memory_hook_id`
- 処理: 削除日時設定と内容を「削除済み」に書き換え

### ユーザー単語関連

### 保存/更新

- エンドポイント: `/api/myword/save`
- メソッド: POST
- パラメータ: `wordParam`, `meaning_id`, `memory_hook_id`
- 処理: 既存登録がある場合は更新、なければ新規作成

### 削除（論理削除）

- エンドポイント: `/api/myword/delete`
- メソッド: POST
- パラメータ: `id` (user_words_id)

### ユーザー関連

### 削除状態確認

- エンドポイント: `/api/user/delete/check-deleted`
- メソッド: GET
- レスポンス: `{ deleted: boolean }`

### ユーザー削除（論理削除）

- エンドポイント: `/api/user/delete`
- メソッド: POST
- 処理: ユーザーと関連する意味、記憶hook、単語帳の論理削除

### アカウント復旧

- エンドポイント: `/api/user/recover`
- メソッド: POST
- 処理: 論理削除されたユーザーと関連データの復旧

### ユーザー状態取得

- エンドポイント: `/api/user/status`
- メソッド: GET
- レスポンス: ユーザー情報と意味・記憶hook・単語帳の統計情報

## 5. 状態管理とデータフロー

### クライアント状態

- 単語検索結果: 検索語、結果リスト、選択フィルター、ページ情報
- 単語詳細: 選択単語、意味リスト、記憶hookリスト、選択状態
- My単語帳: 単語リスト、ページ情報
- ユーザー情報: プロファイル、認証状態

### データフロー

1. ユーザーはGoogle/GitHubでログイン
2. 単語検索から詳細画面へ移動し、意味や記憶hookを閲覧・作成
3. 気に入った意味と記憶hookを選択してMy単語帳に保存
4. My単語帳で登録した単語を管理

## 6. 特殊機能と実装詳細

### 論理削除と復旧機能

- ユーザー、意味、記憶hook、単語帳すべてに論理削除機能あり
- 削除時に内容を「削除済み」というプレフィックス付きテキストに書き換え
- 復旧時に元のテキストを抽出して復元

### 公開/非公開設定

- 意味と記憶hookは公開/非公開を選択可能
- 自分の作成した項目と公開設定されている他ユーザーの項目のみ表示

### 自動リダイレクト機能

- 未ログイン状態でのアクセス → ログイン画面
- 削除済みアカウントでのログイン → 復旧画面
- ログイン済みで不要なページ（ログイン画面など）へのアクセス → トップページ

### モバイル対応UI

- レスポンシブデザイン
- タッチフレンドリーなインターフェース
- タブベースのナビゲーション

## 7. 移植時の注意点

1. **認証システム**：Next.jsのAuth.jsからSupabase Authへの移行が必要
2. **データベース連携**：PrismaからSupabase APIに変更
3. **UI/UX**：タブインターフェースはReact Navigationに置き換え
4. **モーダル**：Webのモーダルコンポーネントをネイティブモーダルに変更
5. **状態管理**：Zustandとの連携が必要
6. **オフライン対応**：MMKVとReact Queryを活用したオフラインファーストな設計
7. **論理削除**：Supabase RLSポリシーを活用した論理削除の実装

