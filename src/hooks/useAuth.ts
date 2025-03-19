import { useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../stores/authStore';
import { Alert } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { makeRedirectUri } from 'expo-auth-session';

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

  // Expo専用のリダイレクトURIを取得
  const getRedirectUri = () => {
    return makeRedirectUri({
      scheme: 'with-hook',
      preferLocalhost: false,
      path: 'login-callback',
      native: 'with-hook://login-callback'
    });
  };

  // Google認証
  const loginWithGoogle = async () => {
    try {
      const redirectUri = getRedirectUri();
      console.log('Google認証リダイレクトURI:', redirectUri);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUri,
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
      const redirectUri = getRedirectUri();
      console.log('GitHub認証リダイレクトURI:', redirectUri);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: redirectUri,
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