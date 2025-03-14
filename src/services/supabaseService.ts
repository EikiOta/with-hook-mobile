import { supabase } from './supabase';
import { User, Meaning, MemoryHook, UserWord, Word } from '../types';
import { sanitizeInput } from '../utils/validation';
import NetInfo from '@react-native-community/netinfo';

// オフライン状態チェック
export const isOffline = async (): Promise<boolean> => {
  const netInfo = await NetInfo.fetch();
  return !netInfo.isConnected;
};

// ユーザー関連サービス
export const userService = {
  // 自分のユーザー情報を取得
  getCurrentUser: async (): Promise<User | null> => {
    try {
      const { data: authUser, error: authError } = await supabase.auth.getUser();
      if (authError || !authUser.user) return null;
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('user_id', authUser.user.id)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('ユーザー情報取得エラー:', error);
      return null;
    }
  },
  
  // ユーザープロフィールを更新
  updateProfile: async (userId: string, data: Partial<User>): Promise<boolean> => {
    try {
      // 入力値サニタイズ
      const sanitizedData = {
        ...(data.nickname && { nickname: sanitizeInput(data.nickname) }),
        ...(data.profile_image && { profile_image: data.profile_image }),
      };
      
      const { error } = await supabase
        .from('users')
        .update(sanitizedData)
        .eq('user_id', userId);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('プロフィール更新エラー:', error);
      return false;
    }
  },
  
  // ユーザーを論理削除
  deleteUser: async (userId: string): Promise<boolean> => {
    try {
      const now = new Date().toISOString();
      
      // トランザクション的に複数の更新を実行
      const { error: userError } = await supabase
        .from('users')
        .update({ deleted_at: now })
        .eq('user_id', userId);
      
      if (userError) throw userError;
      
      // 関連データも論理削除
      await Promise.all([
        supabase.from('meanings')
          .update({ 
            deleted_at: now,
            meaning: '削除済み: ' + Math.random().toString(36).substring(2, 15) 
          })
          .eq('user_id', userId),
          
        supabase.from('memory_hooks')
          .update({ 
            deleted_at: now,
            memory_hook: '削除済み: ' + Math.random().toString(36).substring(2, 15) 
          })
          .eq('user_id', userId),
          
        supabase.from('user_words')
          .update({ deleted_at: now })
          .eq('user_id', userId),
      ]);
      
      return true;
    } catch (error) {
      console.error('ユーザー削除エラー:', error);
      return false;
    }
  },
  
  // ユーザーを復旧
  recoverUser: async (userId: string): Promise<boolean> => {
    try {
      // ユーザーの論理削除を解除
      const { error: userError } = await supabase
        .from('users')
        .update({ deleted_at: null })
        .eq('user_id', userId);
      
      if (userError) throw userError;
      
      // 関連データも復旧
      await Promise.all([
        supabase.from('meanings')
          .update({ deleted_at: null })
          .eq('user_id', userId),
          
        supabase.from('memory_hooks')
          .update({ deleted_at: null })
          .eq('user_id', userId),
          
        supabase.from('user_words')
          .update({ deleted_at: null })
          .eq('user_id', userId),
      ]);
      
      return true;
    } catch (error) {
      console.error('ユーザー復旧エラー:', error);
      return false;
    }
  },
  
  // ユーザーの統計情報を取得
  getUserStats: async (userId: string): Promise<any> => {
    try {
      // 各エンティティの数を取得
      const [meanings, hooks, words] = await Promise.all([
        supabase.from('meanings')
          .select('*', { count: 'exact' })
          .eq('user_id', userId)
          .is('deleted_at', null),
          
        supabase.from('memory_hooks')
          .select('*', { count: 'exact' })
          .eq('user_id', userId)
          .is('deleted_at', null),
          
        supabase.from('user_words')
          .select('*', { count: 'exact' })
          .eq('user_id', userId)
          .is('deleted_at', null),
      ]);
      
      return {
        meaningsCount: meanings.count || 0,
        hooksCount: hooks.count || 0,
        wordsCount: words.count || 0,
      };
    } catch (error) {
      console.error('ユーザー統計情報取得エラー:', error);
      return {
        meaningsCount: 0,
        hooksCount: 0,
        wordsCount: 0,
      };
    }
  },
};

// 単語関連サービス
export const wordService = {
  // 単語を検索
  searchWords: async (prefix: string, page: number = 1, limit: number = 20): Promise<{ words: Word[], total: number }> => {
    try {
      // 検索条件が空の場合は空の結果を返す
      if (!prefix.trim()) {
        return { words: [], total: 0 };
      }
      
      // 単語の先頭が一致するものを検索
      const from = (page - 1) * limit;
      const to = page * limit - 1;
      
      const { data, error, count } = await supabase
        .from('words')
        .select('*', { count: 'exact' })
        .ilike('word', `${prefix}%`)
        .order('word', { ascending: true })
        .range(from, to);
      
      if (error) throw error;
      
      return {
        words: data || [],
        total: count || 0
      };
    } catch (error) {
      console.error('単語検索エラー:', error);
      return { words: [], total: 0 };
    }
  },
  
  // 単語詳細を取得
  getWordDetails: async (wordId: number): Promise<Word | null> => {
    try {
      const { data, error } = await supabase
        .from('words')
        .select('*')
        .eq('word_id', wordId)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('単語詳細取得エラー:', error);
      return null;
    }
  },
  
  // 単語が存在するか確認し、存在しなければ作成
  findOrCreateWord: async (wordText: string): Promise<Word | null> => {
    try {
      // まず既存の単語を検索
      const sanitizedWord = sanitizeInput(wordText.toLowerCase().trim());
      
      const { data: existingWord, error: searchError } = await supabase
        .from('words')
        .select('*')
        .eq('word', sanitizedWord)
        .maybeSingle();
      
      if (searchError) throw searchError;
      
      // 既存の単語が見つかった場合はそれを返す
      if (existingWord) {
        return existingWord;
      }
      
      // 見つからなければ新規作成
      const { data: newWord, error: insertError } = await supabase
        .from('words')
        .insert({ word: sanitizedWord })
        .select()
        .single();
      
      if (insertError) throw insertError;
      return newWord;
    } catch (error) {
      console.error('単語の検索または作成エラー:', error);
      return null;
    }
  }
};

// 意味関連サービス
export const meaningService = {
  // 単語に関連する意味一覧を取得
  getMeaningsByWord: async (wordId: number, page: number = 1, limit: number = 20): Promise<{ meanings: Meaning[], total: number }> => {
    try {
      const from = (page - 1) * limit;
      const to = page * limit - 1;
      
      const { data, error, count } = await supabase
        .from('meanings')
        .select('*', { count: 'exact' })
        .eq('word_id', wordId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .range(from, to);
      
      if (error) throw error;
      
      return {
        meanings: data || [],
        total: count || 0
      };
    } catch (error) {
      console.error('意味一覧取得エラー:', error);
      return { meanings: [], total: 0 };
    }
  },
  
  // 意味を作成
  createMeaning: async (userId: string, wordId: number, meaningText: string, isPublic: boolean): Promise<Meaning | null> => {
    try {
      const sanitizedMeaning = sanitizeInput(meaningText);
      
      const { data, error } = await supabase
        .from('meanings')
        .insert({
          user_id: userId,
          word_id: wordId,
          meaning: sanitizedMeaning,
          is_public: isPublic
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('意味作成エラー:', error);
      return null;
    }
  },
  
  // 意味を更新
  updateMeaning: async (meaningId: number, userId: string, meaningText: string, isPublic: boolean): Promise<boolean> => {
    try {
      const sanitizedMeaning = sanitizeInput(meaningText);
      
      const { error } = await supabase
        .from('meanings')
        .update({
          meaning: sanitizedMeaning,
          is_public: isPublic,
          updated_at: new Date().toISOString()
        })
        .eq('meaning_id', meaningId)
        .eq('user_id', userId);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('意味更新エラー:', error);
      return false;
    }
  },
  
  // 意味を論理削除
  deleteMeaning: async (meaningId: number, userId: string): Promise<boolean> => {
    try {
      const now = new Date().toISOString();
      const randomSuffix = Math.random().toString(36).substring(2, 15);
      
      const { error } = await supabase
        .from('meanings')
        .update({
          deleted_at: now,
          meaning: `削除済み: ${randomSuffix}`,
          is_public: false
        })
        .eq('meaning_id', meaningId)
        .eq('user_id', userId);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('意味削除エラー:', error);
      return false;
    }
  },
  
  // 自分が作成した意味一覧を取得
  getMyMeanings: async (userId: string, page: number = 1, limit: number = 20): Promise<{ meanings: Meaning[], total: number }> => {
    try {
      const from = (page - 1) * limit;
      const to = page * limit - 1;
      
      const { data, error, count } = await supabase
        .from('meanings')
        .select('*, words!inner(*)', { count: 'exact' })
        .eq('user_id', userId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .range(from, to);
      
      if (error) throw error;
      
      return {
        meanings: data || [],
        total: count || 0
      };
    } catch (error) {
      console.error('自分の意味一覧取得エラー:', error);
      return { meanings: [], total: 0 };
    }
  }
};

// 記憶Hook関連サービス
export const memoryHookService = {
  // 単語に関連する記憶Hook一覧を取得
  getMemoryHooksByWord: async (wordId: number, page: number = 1, limit: number = 20): Promise<{ hooks: MemoryHook[], total: number }> => {
    try {
      const from = (page - 1) * limit;
      const to = page * limit - 1;
      
      const { data, error, count } = await supabase
        .from('memory_hooks')
        .select('*', { count: 'exact' })
        .eq('word_id', wordId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .range(from, to);
      
      if (error) throw error;
      
      return {
        hooks: data || [],
        total: count || 0
      };
    } catch (error) {
      console.error('記憶Hook一覧取得エラー:', error);
      return { hooks: [], total: 0 };
    }
  },
  
  // 記憶Hookを作成
  createMemoryHook: async (userId: string, wordId: number, hookText: string, isPublic: boolean): Promise<MemoryHook | null> => {
    try {
      const sanitizedHook = sanitizeInput(hookText);
      
      const { data, error } = await supabase
        .from('memory_hooks')
        .insert({
          user_id: userId,
          word_id: wordId,
          memory_hook: sanitizedHook,
          is_public: isPublic
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('記憶Hook作成エラー:', error);
      return null;
    }
  },
  
  // 記憶Hookを更新
  updateMemoryHook: async (hookId: number, userId: string, hookText: string, isPublic: boolean): Promise<boolean> => {
    try {
      const sanitizedHook = sanitizeInput(hookText);
      
      const { error } = await supabase
        .from('memory_hooks')
        .update({
          memory_hook: sanitizedHook,
          is_public: isPublic,
          updated_at: new Date().toISOString()
        })
        .eq('memory_hook_id', hookId)
        .eq('user_id', userId);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('記憶Hook更新エラー:', error);
      return false;
    }
  },
  
  // 記憶Hookを論理削除
  deleteMemoryHook: async (hookId: number, userId: string): Promise<boolean> => {
    try {
      const now = new Date().toISOString();
      const randomSuffix = Math.random().toString(36).substring(2, 15);
      
      const { error } = await supabase
        .from('memory_hooks')
        .update({
          deleted_at: now,
          memory_hook: `削除済み: ${randomSuffix}`,
          is_public: false
        })
        .eq('memory_hook_id', hookId)
        .eq('user_id', userId);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('記憶Hook削除エラー:', error);
      return false;
    }
  },
  
  // 自分が作成した記憶Hook一覧を取得
  getMyMemoryHooks: async (userId: string, page: number = 1, limit: number = 20): Promise<{ hooks: MemoryHook[], total: number }> => {
    try {
      const from = (page - 1) * limit;
      const to = page * limit - 1;
      
      const { data, error, count } = await supabase
        .from('memory_hooks')
        .select('*, words!inner(*)', { count: 'exact' })
        .eq('user_id', userId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .range(from, to);
      
      if (error) throw error;
      
      return {
        hooks: data || [],
        total: count || 0
      };
    } catch (error) {
      console.error('自分の記憶Hook一覧取得エラー:', error);
      return { hooks: [], total: 0 };
    }
  }
};

// ユーザー単語帳関連サービス
export const userWordService = {
  // 自分の単語帳一覧を取得
  getMyWordbook: async (userId: string, page: number = 1, limit: number = 20): Promise<{ userWords: UserWord[], total: number }> => {
    try {
      const from = (page - 1) * limit;
      const to = page * limit - 1;
      
      const { data, error, count } = await supabase
        .from('user_words')
        .select(`
          *,
          words(*),
          meanings(*),
          memory_hooks(*)
        `, { count: 'exact' })
        .eq('user_id', userId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .range(from, to);
      
      if (error) throw error;
      
      return {
        userWords: data || [],
        total: count || 0
      };
    } catch (error) {
      console.error('単語帳一覧取得エラー:', error);
      return { userWords: [], total: 0 };
    }
  },
  
  // 単語帳に単語を追加または更新
  saveToWordbook: async (userId: string, wordId: number, meaningId: number, memoryHookId?: number): Promise<UserWord | null> => {
    try {
      // 既存の登録があるか確認
      const { data: existingEntry, error: searchError } = await supabase
        .from('user_words')
        .select('*')
        .eq('user_id', userId)
        .eq('word_id', wordId)
        .is('deleted_at', null)
        .maybeSingle();
      
      if (searchError) throw searchError;
      
      // データ準備
      const userData = {
        user_id: userId,
        word_id: wordId,
        meaning_id: meaningId,
        memory_hook_id: memoryHookId || null,
        updated_at: new Date().toISOString()
      };
      
      let result;
      
      // 既存の登録がある場合は更新、なければ新規作成
      if (existingEntry) {
        const { data, error } = await supabase
          .from('user_words')
          .update(userData)
          .eq('user_words_id', existingEntry.user_words_id)
          .select()
          .single();
        
        if (error) throw error;
        result = data;
      } else {
        const { data, error } = await supabase
          .from('user_words')
          .insert(userData)
          .select()
          .single();
        
        if (error) throw error;
        result = data;
      }
      
      return result;
    } catch (error) {
      console.error('単語帳保存エラー:', error);
      return null;
    }
  },
  
  // 単語帳から削除（論理削除）
  removeFromWordbook: async (userId: string, userWordsId: number): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('user_words')
        .update({
          deleted_at: new Date().toISOString()
        })
        .eq('user_words_id', userWordsId)
        .eq('user_id', userId);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('単語帳削除エラー:', error);
      return false;
    }
  },
  
  // 特定の単語が単語帳に登録されているか確認
  checkWordInWordbook: async (userId: string, wordId: number): Promise<UserWord | null> => {
    try {
      const { data, error } = await supabase
        .from('user_words')
        .select('*')
        .eq('user_id', userId)
        .eq('word_id', wordId)
        .is('deleted_at', null)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('単語帳確認エラー:', error);
      return null;
    }
  }
};