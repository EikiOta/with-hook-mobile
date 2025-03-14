import { useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../stores/authStore';
import { Alert } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

export const useAuth = () => {
  const { checkSession, isAuthenticated, isLoading, user, isDeleted } = useAuthStore();

  // 認証状態の監視
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event);
      checkSession();
    });

    // ネットワーク接続の監視
    const unsubscribeNetInfo = NetInfo.addEventListener(state => {
      if (state.isConnected && !isAuthenticated && !isLoading) {
        // オンラインになったらセッション再確認
        checkSession();
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
      unsubscribeNetInfo();
    };
  }, [isAuthenticated, isLoading]);

  // Google認証
  const loginWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'with-hook://login-callback',
        },
      });
      
      if (error) throw error;
      return true;
      
    } catch (error: any) {
      console.error('Google login error:', error.message);
      Alert.alert('エラー', 'Googleログインに失敗しました');
      return false;
    }
  };

  // GitHub認証
  const loginWithGithub = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: 'with-hook://login-callback',
        },
      });
      
      if (error) throw error;
      return true;
      
    } catch (error: any) {
      console.error('GitHub login error:', error.message);
      Alert.alert('エラー', 'GitHubログインに失敗しました');
      return false;
    }
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    isDeleted,
    loginWithGoogle,
    loginWithGithub,
    checkSession,
  };
};