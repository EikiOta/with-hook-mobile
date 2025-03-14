import { create } from 'zustand';
import { User, Word, Meaning, MemoryHook, UserWord } from '../types';
import { getSession, getCurrentUser, supabase } from '../services/supabase';

// 認証状態ストア
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isDeleted: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
  recoverAccount: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isDeleted: false,
  
  login: async () => {
    // ログイン処理は後で実装
  },
  
  logout: async () => {
    try {
      await supabase.auth.signOut();
      set({ user: null, isAuthenticated: false });
    } catch (error) {
      console.error('Logout error:', error);
    }
  },
  
  checkSession: async () => {
    set({ isLoading: true });
    try {
      const session = await getSession();
      const user = await getCurrentUser();
      
      if (user) {
        // ユーザーのSupabaseデータを取得
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        if (error) throw error;
        
        // 論理削除されているかチェック
        const isDeleted = data.deleted_at !== null;
        
        set({
          user: data,
          isAuthenticated: !!session,
          isDeleted,
        });
      } else {
        set({ user: null, isAuthenticated: false, isDeleted: false });
      }
    } catch (error) {
      console.error('Session check error:', error);
      set({ user: null, isAuthenticated: false, isDeleted: false });
    } finally {
      set({ isLoading: false });
    }
  },
  
  recoverAccount: async () => {
    try {
      const user = get().user;
      if (!user) return false;
      
      const { error } = await supabase
        .from('users')
        .update({ deleted_at: null })
        .eq('user_id', user.user_id);
      
      if (error) throw error;
      
      // 関連するデータも復旧
      await Promise.all([
        supabase.from('meanings').update({ deleted_at: null }).eq('user_id', user.user_id),
        supabase.from('memory_hooks').update({ deleted_at: null }).eq('user_id', user.user_id),
        supabase.from('user_words').update({ deleted_at: null }).eq('user_id', user.user_id),
      ]);
      
      set({ isDeleted: false });
      return true;
    } catch (error) {
      console.error('Account recovery error:', error);
      return false;
    }
  },
}));

// 検索状態ストア
interface SearchState {
  searchTerm: string;
  results: Word[];
  partOfSpeech: string;
  isLoading: boolean;
  page: number;
  totalPages: number;
  setSearchTerm: (term: string) => void;
  setPartOfSpeech: (pos: string) => void;
  search: () => Promise<void>;
  nextPage: () => void;
  prevPage: () => void;
}

export const useSearchStore = create<SearchState>((set, get) => ({
  searchTerm: '',
  results: [],
  partOfSpeech: '',
  isLoading: false,
  page: 1,
  totalPages: 1,
  
  setSearchTerm: (term) => set({ searchTerm: term }),
  setPartOfSpeech: (pos) => set({ partOfSpeech: pos }),
  
  search: async () => {
    // 検索処理は後で実装
  },
  
  nextPage: () => {
    const { page, totalPages } = get();
    if (page < totalPages) {
      set({ page: page + 1 });
      get().search();
    }
  },
  
  prevPage: () => {
    const { page } = get();
    if (page > 1) {
      set({ page: page - 1 });
      get().search();
    }
  },
}));

// 他にも必要なストアを定義（WordDetail、MyWordBook、Settingsなど）