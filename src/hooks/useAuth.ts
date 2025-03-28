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

  // OAuth認証共通ロジック
  const loginWithOAuth = useCallback(async (provider: 'google' | 'github') => {
    try {
      console.log(`[AUTH] ${provider}認証開始`);
      
      // アプリスキームを使用したリダイレクトURLを構築
      const redirectUrl = Linking.createURL('login-callback');
      console.log('[AUTH] 使用するリダイレクトURL:', redirectUrl);
      
      // ブラウザでログインを実行
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectUrl, // 明示的にリダイレクトURLを指定
          skipBrowserRedirect: true // ブラウザ自動リダイレクトをスキップして手動で処理
        }
      });
      
      if (error) {
        console.error('[AUTH] 認証エラー:', error.message);
        throw error;
      }
      
      if (!data.url) {
        throw new Error('認証URLの取得に失敗しました');
      }
      
      console.log('[AUTH] 認証URLを開きます');
      
      // ブラウザでOAuth認証を開始し、結果を待つ
      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        redirectUrl,
        {
          showInRecents: true,
          createTask: true
        }
      );
      
      console.log('[AUTH] 認証結果:', result.type);
      
      // 結果に基づいて処理
      if (result.type === 'success') {
        console.log('[AUTH] 認証成功、セッションを確認します');
        
        // URLを解析して認証情報を取得
        try {
          const callbackUrl = result.url;
          
          const url = new URL(callbackUrl);
          
          // フラグメントを解析（#を除去して処理）
          if (url.hash) {
            const hashParams = new URLSearchParams(url.hash.substring(1));
            
            // アクセストークンがフラグメントにある場合は手動で設定
            if (hashParams.has('access_token') && hashParams.has('refresh_token')) {
              console.log('[AUTH] トークンを検出、手動でセッションを設定します');
              
              try {
                // セッションを手動で設定
                await supabase.auth.setSession({
                  access_token: hashParams.get('access_token') || '',
                  refresh_token: hashParams.get('refresh_token') || ''
                });
              } catch (sessionError) {
                console.error('[AUTH] セッション設定中の例外:', sessionError);
              }
            }
          }
        } catch (urlError) {
          console.error('[AUTH] コールバックURL解析エラー:', urlError);
        }
        
        // セッションチェック前に少し待機して認証処理が完了するのを待つ
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // セッション状態を確認（削除状態も含めて更新される）
        await checkSession();
        
        // セッション確認後に削除状態をチェック
        const currentState = await getDebugInfo();
        if (currentState.auth.isDeleted) {
          console.log('[AUTH] 削除済みアカウントを検出しました');
          // 削除済みアカウントは AppNavigator で処理される
        }
        
        return true;
      } else {
        console.log('[AUTH] 認証キャンセルまたは失敗:', result.type);
        return false;
      }
    } catch (error) {
      console.error(`[AUTH] ${provider}認証エラー:`, error);
      Alert.alert('エラー', `${provider}ログインに失敗しました。時間をおいて再度お試しください。`);
      return false;
    }
  }, [checkSession]);

  // Google認証
  const loginWithGoogle = useCallback(() => {
    return loginWithOAuth('google');
  }, [loginWithOAuth]);

  // GitHub認証
  const loginWithGithub = useCallback(() => {
    return loginWithOAuth('github');
  }, [loginWithOAuth]);

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