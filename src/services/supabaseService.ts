// src/services/supabaseService.ts
import { supabase } from './supabase';
import { User, Meaning, MemoryHook, UserWord, Word } from '../types';
import { sanitizeInput } from '../utils/validation';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  
  // 単語テキストから単語を取得
  getWordByText: async (wordText: string): Promise<Word | null> => {
    try {
      const { data, error } = await supabase
        .from('words')
        .select('*')
        .eq('word', wordText.toLowerCase().trim())
        .maybeSingle(); // single()からmaybeSingle()に変更
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('単語取得エラー:', error);
      return null;
    }
  },
  
  // 単語が存在するか確認し、存在しなければ作成
  findOrCreateWord: async (wordText: string): Promise<Word | null> => {
    try {
      // 入力値のサニタイズ
      const sanitizedWord = sanitizeInput(wordText.toLowerCase().trim());
      if (!sanitizedWord) return null;
      
      // まず既存の単語を検索
      const { data: existingWord, error: searchError } = await supabase
        .from('words')
        .select('*')
        .eq('word', sanitizedWord)
        .maybeSingle();
      
      if (searchError) {
        console.error('単語検索エラー:', searchError);
        return null;
      }
      
      // 既存の単語が見つかった場合はそれを返す
      if (existingWord) {
        console.log(`単語「${sanitizedWord}」が見つかりました (ID: ${existingWord.word_id})`);
        return existingWord;
      }
      
      // 見つからなければ新規作成を試みる
      console.log(`単語「${sanitizedWord}」を新規作成します`);
      const { data: newWord, error: insertError } = await supabase
        .from('words')
        .insert({ word: sanitizedWord })
        .select()
        .single();
      
      if (insertError) {
        console.error('単語作成エラー:', insertError);
        return null;
      }
      
      console.log(`単語「${sanitizedWord}」を作成しました:`, newWord);
      return newWord;
    } catch (error) {
      console.error('単語の検索または作成エラー:', error);
      return null;
    }
  },

  // 検索結果をキャッシュに保存
  cacheSearchResults: async (prefix: string, results: any): Promise<boolean> => {
    try {
      const key = `SEARCH_CACHE_${prefix.toLowerCase()}`;
      await AsyncStorage.setItem(key, JSON.stringify({
        data: results,
        timestamp: Date.now()
      }));
      return true;
    } catch (error) {
      console.error('検索結果キャッシュエラー:', error);
      return false;
    }
  },

  // キャッシュから検索結果を取得
  getCachedSearchResults: async (prefix: string): Promise<any> => {
    try {
      const key = `SEARCH_CACHE_${prefix.toLowerCase()}`;
      const cachedString = await AsyncStorage.getItem(key);
      
      if (cachedString) {
        const cached = JSON.parse(cachedString);
        // 1週間以内のキャッシュのみ有効
        if (Date.now() - cached.timestamp < 7 * 24 * 60 * 60 * 1000) {
          return cached.data;
        }
      }
      return null;
    } catch (error) {
      console.error('キャッシュ取得エラー:', error);
      return null;
    }
  },

  // Dictionary APIデータをキャッシュに保存
  cacheDictionaryData: async (word: string, data: any): Promise<boolean> => {
    try {
      const key = `DICT_CACHE_${word.toLowerCase()}`;
      await AsyncStorage.setItem(key, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
      return true;
    } catch (error) {
      console.error('辞書データキャッシュエラー:', error);
      return false;
    }
  },

  // キャッシュからDictionary APIデータを取得
  getCachedDictionaryData: async (word: string): Promise<any> => {
    try {
      const key = `DICT_CACHE_${word.toLowerCase()}`;
      const cachedString = await AsyncStorage.getItem(key);
      
      if (cachedString) {
        const cached = JSON.parse(cachedString);
        // 1ヶ月以内のキャッシュのみ有効
        if (Date.now() - cached.timestamp < 30 * 24 * 60 * 60 * 1000) {
          return cached.data;
        }
      }
      return null;
    } catch (error) {
      console.error('辞書キャッシュ取得エラー:', error);
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
  
  // 単語テキストに関連する意味一覧を取得
  getMeaningsByWordText: async (wordText: string, userId: string, page: number = 1, limit: number = 20): Promise<{ meanings: Meaning[], total: number }> => {
    try {
      // まず単語を検索
      const word = await wordService.getWordByText(wordText);
      if (!word) {
        console.log(`単語「${wordText}」が存在しません`);
        return { meanings: [], total: 0 };
      }
      
      // 単語IDで意味を検索
      const { data, error, count } = await supabase
        .from('meanings')
        .select('*, user:users(*)', { count: 'exact' })
        .eq('word_id', word.word_id)
        .is('deleted_at', null)
        // 自分の投稿か公開されているものだけ取得
        .or(`user_id.eq.${userId},is_public.eq.true`)
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);
      
      if (error) throw error;
      
      return {
        meanings: data || [],
        total: count || 0
      };
    } catch (error) {
      console.error('単語テキストによる意味一覧取得エラー:', error);
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
  
  // 単語テキストで意味を作成
  createMeaningByWordText: async (userId: string, wordText: string, meaningText: string, isPublic: boolean): Promise<Meaning | null> => {
    try {
      // まず単語があるか確認し、なければ作成
      const word = await wordService.findOrCreateWord(wordText);
      if (!word) {
        console.error(`単語の作成に失敗しました: ${wordText}`);
        throw new Error('単語の作成に失敗しました');
      }
      
      // 作成された単語のIDを確認
      console.log(`意味作成のための単語ID: ${word.word_id}`);
      
      // word_idが存在することを確認
      if (!word.word_id) {
        console.error('単語IDが取得できませんでした');
        throw new Error('単語IDが取得できません');
      }
      
      // 意味を作成
      return await meaningService.createMeaning(userId, word.word_id, meaningText, isPublic);
    } catch (error) {
      console.error('単語テキストによる意味作成エラー:', error);
      throw error; // エラーを再スローして上位で捕捉できるようにする
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
  
  // 単語テキストに関連する記憶Hook一覧を取得
  getMemoryHooksByWordText: async (wordText: string, userId: string, page: number = 1, limit: number = 20): Promise<{ hooks: MemoryHook[], total: number }> => {
    try {
      // まず単語を検索
      const word = await wordService.getWordByText(wordText);
      if (!word) {
        console.log(`単語「${wordText}」が存在しません`);
        return { hooks: [], total: 0 };
      }
      
      // 単語IDで記憶Hookを検索
      const { data, error, count } = await supabase
        .from('memory_hooks')
        .select('*, user:users(*)', { count: 'exact' })
        .eq('word_id', word.word_id)
        .is('deleted_at', null)
        // 自分の投稿か公開されているものだけ取得
        .or(`user_id.eq.${userId},is_public.eq.true`)
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);
      
      if (error) throw error;
      
      return {
        hooks: data || [],
        total: count || 0
      };
    } catch (error) {
      console.error('単語テキストによる記憶Hook一覧取得エラー:', error);
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
  
  // 単語テキストで記憶Hookを作成
  createMemoryHookByWordText: async (userId: string, wordText: string, hookText: string, isPublic: boolean): Promise<MemoryHook | null> => {
    try {
      // まず単語があるか確認し、なければ作成
      const word = await wordService.findOrCreateWord(wordText);
      if (!word) {
        console.error(`単語の作成に失敗しました: ${wordText}`);
        throw new Error('単語の作成に失敗しました');
      }
      
      // 作成された単語のIDを確認
      console.log(`記憶Hook作成のための単語ID: ${word.word_id}`);
      
      // word_idが存在することを確認
      if (!word.word_id) {
        console.error('単語IDが取得できませんでした');
        throw new Error('単語IDが取得できません');
      }
      
      // 記憶Hookを作成
      return await memoryHookService.createMemoryHook(userId, word.word_id, hookText, isPublic);
    } catch (error) {
      console.error('単語テキストによる記憶Hook作成エラー:', error);
      throw error; // エラーを再スローして上位で捕捉できるようにする
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
  
  // 単語テキストを使って単語帳に追加または更新
  saveToWordbookByText: async (userId: string, wordText: string, meaningId: number, memoryHookId?: number): Promise<UserWord | null> => {
    try {
      // まず単語を検索または作成
      const word = await wordService.findOrCreateWord(wordText);
      if (!word) throw new Error('単語の作成に失敗しました');
      
      // UserWordを保存
      return await userWordService.saveToWordbook(userId, word.word_id, meaningId, memoryHookId);
    } catch (error) {
      console.error('単語テキストによる単語帳保存エラー:', error);
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
  },
  
  // 単語テキストが単語帳に登録されているか確認
  checkWordInWordbookByText: async (userId: string, wordText: string): Promise<UserWord | null> => {
    try {
      // まず単語を検索
      const word = await wordService.getWordByText(wordText);
      if (!word) return null;
      
      // 単語IDで登録を確認
      return await userWordService.checkWordInWordbook(userId, word.word_id);
    } catch (error) {
      console.error('単語テキストによる単語帳確認エラー:', error);
      return null;
    }
  }
};