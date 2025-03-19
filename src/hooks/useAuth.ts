import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../stores/authStore';
import { Alert, Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

export const useAuth = () => {
  // グローバルストアから必要な状態のみ取得
  const { user, isAuthenticated, isLoading, isDeleted, checkSession } = useAuthStore();
  
  // 初期化状態追跡
  const initialized = useRef(false);
  
  // 初期化 - 一度だけ実行
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    
    // 認証状態の変化を監視
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (['SIGNED_IN', 'SIGNED_OUT'].includes(event)) {
        console.log('[AUTH] 認証状態変更:', event);
        checkSession();
      }
    });
    
    // クリーンアップ
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // GitHub認証 - Expo Go 互換フロー
  const loginWithGithub = useCallback(async () => {
    try {
      console.log('[AUTH] GitHub認証開始 (Expo Go 互換)');
      
      // ブラウザでログインを実行
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          // リダイレクトURLを指定しない（デフォルトでSupabaseのページに戻る）
        }
      });
      
      if (error) {
        console.error('[AUTH] 認証エラー:', error.message);
        throw error;
      }
      
      if (!data.url) {
        throw new Error('認証URLの取得に失敗しました');
      }
      
      // ブラウザでOAuth認証を開始
      await WebBrowser.openBrowserAsync(data.url);
      
      // 注意: このフローでは認証後にアプリに自動的に戻らない
      // ユーザーは手動でアプリに戻る必要がある
      
      // 一定時間後にセッションチェック
      setTimeout(async () => {
        console.log('[AUTH] セッションを確認します');
        await checkSession();
      }, 3000);
      
      Alert.alert(
        '認証手順',
        'ブラウザでGitHubログインを完了した後、このアプリに戻ってください。',
        [{ text: 'OK', onPress: () => console.log('OK Pressed') }]
      );
      
      return true;
    } catch (error) {
      console.error('[AUTH] GitHub認証エラー:', error);
      Alert.alert('エラー', 'GitHubログインに失敗しました。時間をおいて再度お試しください。');
      return false;
    }
  }, []);

  // Google認証 - Expo Go 互換フロー
  const loginWithGoogle = useCallback(async () => {
    try {
      console.log('[AUTH] Google認証開始 (Expo Go 互換)');
      
      // ブラウザでログインを実行
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          // リダイレクトURLを指定しない（デフォルトでSupabaseのページに戻る）
        }
      });
      
      if (error) {
        console.error('[AUTH] 認証エラー:', error.message);
        throw error;
      }
      
      if (!data.url) {
        throw new Error('認証URLの取得に失敗しました');
      }
      
      // ブラウザでOAuth認証を開始
      await WebBrowser.openBrowserAsync(data.url);
      
      // 一定時間後にセッションチェック
      setTimeout(async () => {
        console.log('[AUTH] セッションを確認します');
        await checkSession();
      }, 3000);
      
      Alert.alert(
        '認証手順',
        'ブラウザでGoogleログインを完了した後、このアプリに戻ってください。',
        [{ text: 'OK', onPress: () => console.log('OK Pressed') }]
      );
      
      return true;
    } catch (error) {
      console.error('[AUTH] Google認証エラー:', error);
      Alert.alert('エラー', 'Googleログインに失敗しました。時間をおいて再度お試しください。');
      return false;
    }
  }, []);

  // デバッグ情報取得
  const getDebugInfo = useCallback(async () => {
    try {
      return {
        auth: {
          isAuthenticated,
          isLoading,
          isDeleted,
          hasUser: !!user
        },
        platform: Platform.OS,
        isDev: __DEV__
      };
    } catch (error) {
      return { error: String(error) };
    }
  }, [isAuthenticated, isLoading, isDeleted, user]);

  // 必要最小限のメソッドのみ公開
  return {
    user,
    isAuthenticated,
    isLoading,
    isDeleted,
    loginWithGoogle,
    loginWithGithub,
    checkSession,
    getDebugInfo
  };
};