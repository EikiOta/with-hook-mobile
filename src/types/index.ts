// 共通の時間関連フィールド型
export interface TimeStamps {
    created_at: string;
    updated_at: string;
  }
  
  // 論理削除用フィールド型
  export interface SoftDelete {
    deleted_at: string | null;
  }
  
  // ユーザーモデル
  export interface User extends TimeStamps, SoftDelete {
    user_id: string; // UUID
    // providerAccountId: string; <- Auth.jsでは必要だったが、今回はSupabaseなので不要
    nickname: string;
    profile_image: string;
  }
  
  // 単語モデル
  export interface Word extends TimeStamps {
    word_id: number;
    word: string;
  }
  
  // 意味モデル
  export interface Meaning extends TimeStamps, SoftDelete {
    meaning_id: number;
    word_id: number;
    user_id: string; // UUID
    meaning: string;
    is_public: boolean;
  }
  
  // 記憶Hookモデル
  export interface MemoryHook extends TimeStamps, SoftDelete {
    memory_hook_id: number;
    word_id: number;
    user_id: string; // UUID
    memory_hook: string;
    is_public: boolean;
  }
  
  // ユーザー単語モデル
  export interface UserWord extends TimeStamps, SoftDelete {
    user_words_id: number;
    user_id: string; // UUID
    word_id: number;
    meaning_id: number;
    memory_hook_id: number | null; // 任意のため
  }
  
  // 外部APIのレスポンス型
  export interface DictionaryApiResponse {
    word: string;
    phonetics: {
      text: string;
      audio?: string;
    }[];
    meanings: {
      partOfSpeech: string;
      definitions: {
        definition: string;
        example?: string;
        synonyms: string[];
        antonyms: string[];
      }[];
    }[];
  }
  
  export interface DatamuseApiResponse {
    word: string;
    score: number;
    tags?: string[];
  }
  
  // ナビゲーション用パラメータ型
  export type WordDetailParams = {
    wordId: number;
    word: string;
  };