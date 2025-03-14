# AI向け・よくある間違い（必読）
## Supabase接続のデバッグに関するメモ

### 発生した問題

React NativeアプリでSupabaseクライアントの接続テスト中に以下のエラーが発生しました：

```
コピー
Property 'supabaseUrl' is protected and only accessible within class 'SupabaseClient<Database, SchemaName, Schema>' and its subclasses.ts(2445)

```

### 原因

Supabase Client SDKのバージョン（@supabase/supabase-js v2.49.1以降）では、`supabaseUrl`プロパティがprotected（保護）されており、`SupabaseClient`クラス外部から直接アクセスできなくなっています。これはTypeScriptの型チェックにより強制されています。

### 解決策



Supabaseクライアントの内部プロパティにアクセスする代わりに、初期化時に使用した環境変数から直接URLを参照します：

```tsx
typescript
コピー
// 修正前
console.log('Supabase URL:', supabase.supabaseUrl);

// 修正後
console.log('Supabase URL:', Constants.expoConfig?.extra?.supabaseUrl);

```