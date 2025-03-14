# with-hook: 英単語帳アプリ詳細設計書
Next.js + TS + Auth.jsで作成した元のweb版英単語帳アプリの詳細仕様を下記に示す。
## 目次

1. [アプリケーション概要](https://www.notion.so/1b586cedbc7e807a9566e5d732510a78?pvs=21)
2. [技術スタック](https://www.notion.so/1b586cedbc7e807a9566e5d732510a78?pvs=21)
3. [データベース設計](https://www.notion.so/1b586cedbc7e807a9566e5d732510a78?pvs=21)
4. [認証システム](https://www.notion.so/1b586cedbc7e807a9566e5d732510a78?pvs=21)
5. [画面設計と機能詳細](https://www.notion.so/1b586cedbc7e807a9566e5d732510a78?pvs=21)
6. [API設計](https://www.notion.so/1b586cedbc7e807a9566e5d732510a78?pvs=21)
7. [状態管理](https://www.notion.so/1b586cedbc7e807a9566e5d732510a78?pvs=21)
8. [エラーハンドリング](https://www.notion.so/1b586cedbc7e807a9566e5d732510a78?pvs=21)
9. [国際化対応](https://www.notion.so/1b586cedbc7e807a9566e5d732510a78?pvs=21)
10. [アカウント管理](https://www.notion.so/1b586cedbc7e807a9566e5d732510a78?pvs=21)

<a id="アプリケーション概要"></a>

## 1. アプリケーション概要

「with-hook」は革新的な英単語学習アプリケーションです。ユーザーは単語の意味だけでなく、記憶hook（記憶術）を使って効率的に単語を覚えることができます。

### 主要機能

- Google/GitHubを使ったソーシャルログイン
- 英単語検索
- 単語の意味と記憶hookの登録・閲覧
- My単語帳への追加と管理
- ユーザーによる意味・記憶hookの公開/非公開設定
- アカウント削除と復旧機能

<a id="技術スタック"></a>

## 2. 技術スタック

### フロントエンド

- React Native + Expo（移植先）
- ※元アプリはNext.js（React）、Tailwind CSS
- 状態管理は各コンポーネントでのuseState/useEffect

### バックエンド

- Node.js
- Prisma ORM
- PostgreSQL
- Next Auth（認証システム）

<a id="データベース設計"></a>

## 3. データベース設計

データベースはPostgreSQLを使用し、以下のエンティティがあります：

### User（users テーブル）

```
コピー
- user_id: String (@id @default(cuid()))
- providerAccountId: String? @unique
- nickname: String?
- profile_image: String?
- createdAt: DateTime @default(now())
- updatedAt: DateTime @updatedAt
- deleted_at: DateTime? // 論理削除用

```

### Word（words テーブル）

```
コピー
- word_id: Int (@id @default(autoincrement()))
- word: String @unique
- created_at: DateTime @default(now())
- updated_at: DateTime @updatedAt

```

### Meaning（meanings テーブル）

```
コピー
- meaning_id: Int (@id @default(autoincrement()))
- word_id: Int (Word外部キー)
- user_id: String (User外部キー)
- meaning: String
- is_public: Boolean @default(false)
- created_at: DateTime @default(now())
- updated_at: DateTime @updatedAt
- deleted_at: DateTime? // 論理削除用

```

### MemoryHook（memory_hooks テーブル）

```
コピー
- memory_hook_id: Int (@id @default(autoincrement()))
- word_id: Int (Word外部キー)
- user_id: String (User外部キー)
- memory_hook: String
- is_public: Boolean @default(false)
- created_at: DateTime @default(now())
- updated_at: DateTime @updatedAt
- deleted_at: DateTime? // 論理削除用

```

### UserWord（user_words テーブル）

```
コピー
- user_words_id: Int (@id @default(autoincrement()))
- user_id: String (User外部キー)
- word_id: Int (Word外部キー)
- meaning_id: Int (Meaning外部キー)
- memory_hook_id: Int? (MemoryHook外部キー、任意)
- created_at: DateTime @default(now())
- updated_at: DateTime @updatedAt
- deleted_at: DateTime? // 論理削除用

```

### リレーション図

```
コピー
User 1--* UserWord
User 1--* Meaning
User 1--* MemoryHook
Word 1--* UserWord
Word 1--* Meaning
Word 1--* MemoryHook
Meaning 1--* UserWord
MemoryHook 1--* UserWord

```

<a id="認証システム"></a>

## 4. 認証システム

### 認証プロバイダ

- Google
- GitHub

### 認証フロー

1. ユーザーが「Googleで登録」または「GitHubで登録」ボタンをクリック
2. プロバイダの認証画面にリダイレクト
3. 認証成功後、コールバックでアプリに戻る
4. プロバイダアカウントIDをもとにユーザー情報を取得または作成
5. セッションを確立

### 実装詳細

- JWT認証を使用
- セッション有効期限は30日間
- 未認証ユーザーは `/login` にリダイレクト
- 認証済みユーザーがログインページにアクセスした場合はトップページにリダイレクト

### ミドルウェア

- すべての非パブリックルートで認証チェック
- 削除済みユーザーの復旧ページへのリダイレクト処理

<a id="画面設計と機能詳細"></a>

## 5. 画面設計と機能詳細

### ログイン画面（/login）

- タイトル「with-hook」
- 機能概要の簡単な説明
- 「Googleで登録」ボタン
- 「GitHubで登録」ボタン

### ヘッダー（共通）

- タイトル「with-hook」（クリックでホームへ）
- ユーザー情報（アイコン、名前）
- ドロップダウンメニュー
    - 意味・記憶hook管理
    - 設定
    - ログアウト

### トップページ（/）

- 2つのカード式メニュー
    - 英単語検索
    - My単語帳

### 英単語検索画面（/word-search）

- 検索フォーム（英単語入力専用）
- 品詞フィルター（すべて、名詞、動詞、形容詞、副詞）
- 検索結果一覧表示
    - 表示項目：No、品詞、英単語
    - ページネーション（5件/ページ）
- 単語クリックで詳細画面へ遷移

### 単語詳細画面（/words/[word]）

- 単語タイトル
- タブメニュー（単語設定、意味一覧、記憶hook一覧）

### 単語設定タブ

- 単語表示
- 選択中の意味表示
- 選択中の記憶hook表示（＋解除ボタン）
- 「My単語帳に追加」または「My単語帳へ更新」ボタン

### 意味一覧タブ

- 「意味の新規作成」ボタン
- 意味一覧表（No、作成者、意味、公開？、操作）
- 自分の投稿には編集・削除ボタン
- 意味クリックで選択状態に
- 新規作成・編集時のモーダル表示

### 記憶hook一覧タブ

- 「記憶hookの新規作成」ボタン
- 「解除」ボタン
- 記憶hook一覧表（No、作成者、記憶hook、公開？、操作）
- 自分の投稿には編集・削除ボタン
- 記憶hookクリックで選択状態に
- 新規作成・編集時のモーダル表示

### My単語帳画面（/my-words）

- 追加した単語の一覧表示
- 表示項目：No、英単語、意味、記憶hook、操作（編集・削除）
- ページネーション（5件/ページ）
- 削除時の確認モーダル
- 編集ボタンクリックで単語詳細画面へ遷移

### 意味・記憶hook管理画面（/manage）

- タブメニュー（意味一覧、記憶hook一覧）
- 自分が作成した意味/記憶hookの管理
- 編集・削除機能
- 編集時のモーダル表示

### 設定画面（/settings）

- アカウント削除ボタン
- 削除確認モーダル

### アカウント復旧画面（/recover-account）

- 削除済みアカウントのみアクセス可能
- 「アカウントを復旧する」ボタン
- 「キャンセル（新規アカウント作成）」ボタン
- 復旧成功時の完了メッセージとリダイレクト

<a id="api設計"></a>

## 6. API設計

### 認証関連

### `/api/auth/[...nextauth]/route.ts`

- NextAuthハンドラー（GET, POST）

### `/api/user/delete/check-deleted/route.ts`

- ユーザーの削除状態確認API
- GET：ユーザーの削除状態を返す

### `/api/user/delete/route.ts`

- ユーザーアカウント削除API
- POST：ユーザーとその関連データを論理削除

### `/api/user/recover/route.ts`

- ユーザーアカウント復旧API
- POST：削除されたユーザーとその関連データを復元

### `/api/user/status/route.ts`

- ユーザーステータス取得API
- GET：ユーザー情報と関連データの統計を返す

### 意味関連

### `/api/meaning/create/route.ts`

- 意味作成API
- POST：新しい意味を作成
- リクエスト：{ wordText, meaningText, isPublic }
- レスポンス：{ success, message, newMeaning, wordRec }

### `/api/meaning/delete/route.ts`

- 意味削除API
- POST：意味を論理削除
- リクエスト：{ meaning_id }
- レスポンス：{ deleted, message }

### `/api/meaning/update/route.ts`

- 意味更新API
- POST：意味を更新
- リクエスト：{ meaning_id, meaningText, isPublic }
- レスポンス：{ updated, message }

### 記憶Hook関連

### `/api/memoryHook/create/route.ts`

- 記憶hook作成API
- POST：新しい記憶hookを作成
- リクエスト：{ wordText, hookText, isPublic }
- レスポンス：{ success, message, newMemoryHook, wordRec }

### `/api/memoryHook/delete/route.ts`

- 記憶hook削除API
- POST：記憶hookを論理削除
- リクエスト：{ memory_hook_id }
- レスポンス：{ deleted, message }

### `/api/memoryHook/update/route.ts`

- 記憶hook更新API
- POST：記憶hookを更新
- リクエスト：{ memory_hook_id, hookText, isPublic }
- レスポンス：{ updated, message }

### My単語帳関連

### `/api/myword/delete/route.ts`

- My単語帳削除API
- POST：My単語帳から単語を削除（論理削除）
- リクエスト：{ id }
- レスポンス：{ message, deleted }

### `/api/myword/save/route.ts`

- My単語帳保存API
- POST：単語をMy単語帳に追加または更新
- リクエスト：{ wordParam, meaning_id, memory_hook_id }
- レスポンス：{ message, created/updated, isNew }

<a id="状態管理"></a>

## 7. 状態管理

### セッション管理

- NextAuthを使用したセッション状態
- JWT戦略によるトークン管理

### コンポーネント状態管理

- React Hooksを使用（useState, useEffect）
- 各画面コンポーネントで必要な状態を管理

### 主要な状態管理例

1. 英単語検索画面
    - 検索語（searchTerm）
    - 検索結果（aggregatedResults）
    - 品詞フィルター（selectedPos）
    - ページネーション（currentPage）
2. 単語詳細画面
    - アクティブタブ（activeTab）
    - 意味リスト（meanings）
    - 記憶hookリスト（memoryHooks）
    - 選択中の意味（selectedMeaning）
    - 選択中の記憶hook（selectedMemoryHook）
    - 編集対象（editMeaning, editMemoryHook）
    - 削除対象（deleteMeaningTarget, deleteMemoryHookTarget）
3. My単語帳画面
    - 単語リスト（data）
    - ページネーション（currentPage）
    - 削除対象（deleteTarget）
4. 意味・記憶hook管理画面
    - アクティブタブ（activeTab）
    - 意味リスト（meanings）
    - 記憶hookリスト（memoryHooks）

<a id="エラーハンドリング"></a>

## 8. エラーハンドリング

### フロントエンド

- try-catch構文によるAPI呼び出しのエラーハンドリング
- toast通知によるエラーメッセージ表示
- フォームバリデーションのエラー表示

### バックエンド

- try-catch構文によるDB操作のエラーハンドリング
- HTTPステータスコードによるエラー状態の返却
- エラーメッセージのJSON返却

### エラーメッセージ一覧

- 認証エラー：「認証が必要です」
- 入力不足：「単語と意味は必須です」「必須パラメータが不足しています」
- 重複エラー：「既にあなたはこの単語の意味を登録済みです」
- 未ログインエラー：「未ログイン状態です」
- 削除済みエラー：「既に削除済みです」
- レコード未発見：「対象レコードが見つかりません」

<a id="国際化対応"></a>

## 9. 国際化対応

- アプリの基本言語は日本語
- 英単語検索時のAPI呼び出しは英語（Datamuse API, Dictionary API）
- フォームの入力制限（英字のみ）

<a id="アカウント管理"></a>

## 10. アカウント管理

### アカウント論理削除

1. ユーザーが設定画面で「アカウント削除」ボタンをクリック
2. 確認モーダルを表示
3. 確認後、ユーザーと関連データ（意味、記憶hook、My単語帳）を論理削除（deleted_atフィールドに日時設定）
4. 意味と記憶hookのテキストは削除メッセージに置き換え
5. ログアウト処理とログイン画面へのリダイレクト

### アカウント復旧（30日以内）

1. 削除済みユーザーがログイン
2. ミドルウェアで削除状態をチェックし、復旧画面へリダイレクト
3. 「アカウントを復旧する」ボタンをクリック
4. ユーザーと関連データの論理削除を解除（deleted_atをnullに）
5. 意味と記憶hookのテキストを元に戻す
6. 成功メッセージの表示とトップページへのリダイレクト

## 11. データフロー詳細

### 英単語検索フロー

1. ユーザーが英単語を入力して検索
2. Dictionary APIで完全一致検索
3. Datamuse APIで前方一致検索
4. 結果を統合して重複排除
5. 同じ単語に複数の品詞があればまとめる
6. アルファベット順にソートして表示

### 単語保存フロー

1. 単語詳細画面で意味と記憶hookを選択
2. 「My単語帳に追加」ボタンをクリック
3. サーバーサイドで単語レコードの存在チェック（なければ作成）
4. 既存のUserWordレコードを検索
5. 存在すれば更新、なければ新規作成
6. 成功メッセージと共にMy単語帳画面にリダイレクト

### 意味・記憶hook作成フロー

1. 「意味の新規作成」または「記憶hookの新規作成」ボタンをクリック
2. モーダルで入力フォームを表示
3. テキストと公開設定を入力
4. サーバーサイドで単語レコードの存在チェック（なければ作成）
5. 新しい意味または記憶hookレコードを作成
6. 成功時、リストを更新し新しい項目を選択状態に

## 12. 削除と更新の挙動

### 論理削除の実装

- 実際のレコード削除はせず、`deleted_at`フィールドに現在日時を設定
- 意味と記憶hookテキストは削除メッセージで上書き：
    - 意味：「この意味はユーザによって削除されました（元の意味: [元のテキスト]）」
    - 記憶hook：「この記憶hookはユーザによって削除されました（元の記憶hook: [元のテキスト]）」

### 復旧処理

- `deleted_at`フィールドをnullに戻す
- 意味と記憶hookテキストは、削除メッセージから元のテキストを抽出して復元

### My単語帳での削除済み項目の表示

- 削除済みの意味や記憶hookが選択されている場合、赤字で表示
- 単語は削除されていなくても、選択された意味や記憶hookが削除されている場合はその状態を表示

## 13. 検索機能詳細

### 英単語検索の実装

- 前方一致検索（入力した文字で始まる単語を検索）
- 2つのAPIを併用：
    1. Dictionary API (`api.dictionaryapi.dev`)：完全一致での詳細情報
    2. Datamuse API (`api.datamuse.com`)：類似単語、前方一致

### 品詞コード変換

品詞は内部的に次のコードで管理：

- `n`: 名詞 (noun)
- `v`: 動詞 (verb)
- `adj`: 形容詞 (adjective)
- `adv`: 副詞 (adverb)

表示時には日本語短縮形に変換：[名][動][形][副]

## 14. コンポーネント設計

### 共通コンポーネント

- `Header.tsx` - ヘッダーコンポーネント
- `DropdownMenu.tsx` - ドロップダウンメニュー
- `DeleteModal.tsx` - 削除確認モーダル
- `TextFormModal.tsx` - テキスト入力モーダル
- `OperationButtons.tsx` - 編集・削除ボタン
- `DeletedUserCheck.tsx` - 削除済みユーザーチェック

### ページコンポーネント

- `LoginPage.tsx` - ログイン画面
- `HomePage.tsx` - トップページ
- `WordSearchPage.tsx` - 単語検索画面
- `WordDetailPage.tsx` + `WordDetailTabs.tsx` - 単語詳細画面
- `MyWordsPage.tsx` + `MyWordsTable.tsx` - My単語帳画面
- `ManagePage.tsx` + `ManageTabs.tsx` - 意味・記憶hook管理画面
- `SettingsPage.tsx` - 設定画面
- `RecoverAccountPage.tsx` - アカウント復旧画面

## 15. UIデザイン詳細

### 全体テーマ

- ベース色：白（#ffffff）
- テキスト色：黒（#171717）
- アクセント色：青（#3b82f6）
- 成功色：緑（#22c55e）
- 警告色：赤（#ef4444）
- フォント：Arial, Helvetica, sans-serif

### ボタンスタイル

- 主要アクション：青背景、白テキスト、丸角
- 副次アクション：グレー背景、黒テキスト、丸角
- 削除アクション：赤背景、白テキスト、丸角
- 編集アクション：黄色背景、黒テキスト、丸角

### テーブルスタイル

- ヘッダー：薄いグレー背景
- 行：白背景、ホバー時に薄い青または薄いグレー
- 選択行：薄い青背景
- 罫線：薄いグレー
- パディング：8px（p-2）

### モーダルスタイル

- 白背景
- 影付き
- 丸角
- 半透明黒オーバーレイ

## 16. セキュリティ対策

### 認証セキュリティ

- NextAuthによるJWT認証
- 環境変数を使用した秘密鍵
- HTTPS通信

### アクセス制御

- 未認証アクセスはログインページにリダイレクト
- ミドルウェアによる認証チェック
- API呼び出し前の認証確認

### データアクセス制御

- 自分の投稿のみ編集・削除可能
- 公開設定（is_public）によるデータ表示制限
- 論理削除によるデータ保護