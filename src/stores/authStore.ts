import { create } from 'zustand';
import { User } from '../types';
import { getSession, getCurrentUser, supabase } from '../services/supabase';
import { saveUserData, removeUserData } from '../utils/storage';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isDeleted: boolean;
  checkSession: () => Promise<void>;
  logout: () => Promise<void>;
  recoverAccount: () => Promise<boolean>;
  updateUserProfile: (data: Partial<User>) => Promise<boolean>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isDeleted: false,
  
  // セッション状態を確認
  checkSession: async () => {
    set({ isLoading: true });
    try {
      const session = await getSession();
      const authUser = await getCurrentUser();
      
      if (authUser) {
        // ユーザーのSupabaseデータを取得
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('user_id', authUser.id)
          .single();
        
        if (error) {
          console.error('ユーザーデータ取得エラー:', error);
          set({ user: null, isAuthenticated: false, isDeleted: false });
          return;
        }
        
        // 論理削除されているかチェック
        const isDeleted = data?.deleted_at !== null;
        
        // ユーザー情報を保存
        await saveUserData(data);
        
        set({
          user: data,
          isAuthenticated: !!session,
          isDeleted,
        });
      } else {
        // ユーザーデータをクリア
        await removeUserData();
        set({ user: null, isAuthenticated: false, isDeleted: false });
      }
    } catch (error) {
      console.error('セッション確認エラー:', error);
      set({ user: null, isAuthenticated: false, isDeleted: false });
    } finally {
      set({ isLoading: false });
    }
  },
  
  // ログアウト
  logout: async () => {
    try {
      await supabase.auth.signOut();
      await removeUserData();
      set({ user: null, isAuthenticated: false, isDeleted: false });
    } catch (error) {
      console.error('ログアウトエラー:', error);
      throw error;
    }
  },
  
  // アカウント復旧
  recoverAccount: async () => {
    try {
      const user = get().user;
      if (!user) return false;
      
      // ユーザーの論理削除フラグを解除
      const { error: userError } = await supabase
        .from('users')
        .update({ deleted_at: null })
        .eq('user_id', user.user_id);
      
      if (userError) throw userError;
      
      // 関連するデータも復旧
      await Promise.all([
        supabase.from('meanings').update({ deleted_at: null }).eq('user_id', user.user_id),
        supabase.from('memory_hooks').update({ deleted_at: null }).eq('user_id', user.user_id),
        supabase.from('user_words').update({ deleted_at: null }).eq('user_id', user.user_id),
      ]);
      
      // 最新のユーザーデータを取得
      await get().checkSession();
      
      return true;
    } catch (error) {
      console.error('アカウント復旧エラー:', error);
      return false;
    }
  },
  
  // ユーザープロフィール更新
  updateUserProfile: async (data: Partial<User>) => {
    try {
      const user = get().user;
      if (!user) return false;
      
      const { error } = await supabase
        .from('users')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.user_id);
      
      if (error) throw error;
      
      // セッション情報を更新
      await get().checkSession();
      
      return true;
    } catch (error) {
      console.error('プロフィール更新エラー:', error);
      return false;
    }
  },
}));