// src/types/api.ts
import { Meaning, MemoryHook, UserWord, Word } from './index';

/**
 * APIレスポンスの共通インターフェース
 */
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

/**
 * ページネーション付きAPIレスポンスの共通インターフェース
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * 意味一覧レスポンス
 */
export interface MeaningsResponse {
  meanings: Meaning[];
  total: number;
}

/**
 * 記憶Hook一覧レスポンス
 */
export interface MemoryHooksResponse {
  hooks: MemoryHook[];
  total: number;
}

/**
 * 単語検索結果
 */
export interface WordSearchResult {
  word: string;
  parts: string[]; // 品詞のリスト (e.g., ["n", "v"])
}

/**
 * 単語検索レスポンス
 */
export interface WordSearchResponse {
  words: WordSearchResult[];
  total: number;
}

/**
 * My単語帳レスポンス
 */
export interface UserWordsResponse {
  userWords: UserWord[];
  total: number;
}

/**
 * 外部APIのレスポンス型
 */
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

/**
 * オフラインミューテーションの型
 */
export interface OfflineMutation {
  id: string;
  type: OfflineMutationType;
  data: any;
  timestamp: number;
}

/**
 * オフラインミューテーションタイプ
 */
export type OfflineMutationType = 
  | 'createMeaningByWordText'
  | 'updateMeaning'
  | 'deleteMeaning'
  | 'createMemoryHookByWordText'
  | 'updateMemoryHook'
  | 'deleteMemoryHook'
  | 'saveToWordbook'
  | 'saveToWordbookByText'
  | 'removeFromWordbook'
  | 'updateProfile'
  | 'deleteUser';

/**
 * ナビゲーション用パラメータ型
 */
export interface WordDetailParams {
  wordId?: number;
  word: string;
}