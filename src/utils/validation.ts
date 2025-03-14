import * as z from 'zod';

// 単語登録用バリデーションスキーマ
export const wordSchema = z.object({
  word: z.string().min(1, '単語を入力してください').max(50, '単語は50文字以内で入力してください'),
});

// 意味登録用バリデーションスキーマ
export const meaningSchema = z.object({
  meaningText: z.string().min(1, '意味を入力してください').max(500, '意味は500文字以内で入力してください'),
  isPublic: z.boolean().default(false),
});

// 記憶Hook登録用バリデーションスキーマ
export const memoryHookSchema = z.object({
  hookText: z.string().min(1, '記憶Hookを入力してください').max(500, '記憶Hookは500文字以内で入力してください'),
  isPublic: z.boolean().default(false),
});

// ログイン後のユーザープロフィール更新用バリデーション
export const profileSchema = z.object({
  nickname: z.string().min(1, 'ニックネームを入力してください').max(30, 'ニックネームは30文字以内で入力してください'),
});

// 検索用バリデーションスキーマ
export const searchSchema = z.object({
  searchTerm: z.string().min(1, '検索語を入力してください').max(50, '検索語は50文字以内で入力してください'),
  partOfSpeech: z.enum(['', 'n', 'v', 'adj', 'adv']).optional(),
});

// 入力値のサニタイズ関数
export const sanitizeInput = (input: string): string => {
  if (!input) return '';
  
  // 基本的なXSS対策（HTMLタグの除去など）
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .trim();
};

// 論理削除されているかチェックする関数
export const isDeleted = (entity: { deleted_at: string | null }): boolean => {
  return entity.deleted_at !== null;
};

// 削除済みテキストから元のテキストを抽出する関数
export const extractOriginalText = (deletedText: string): string => {
  const prefix = '削除済み: ';
  if (deletedText.startsWith(prefix)) {
    return deletedText.substring(prefix.length);
  }
  return deletedText;
};