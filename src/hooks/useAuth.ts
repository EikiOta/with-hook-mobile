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

  // GitHub認証 - 改善版
  const loginWithGithub = useCallback(async () => {
    try {
      console.log('[AUTH] GitHub認証開始');
      
      // アプリスキームを使用したリダイレクトURLを構築
      const redirectUrl = Linking.createURL('login-callback');
      console.log('[AUTH] 使用するリダイレクトURL:', redirectUrl);
      
      // ブラウザでログインを実行
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
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
      
      console.log('[AUTH] 認証URLを開きます:', data.url);
      
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
          console.log('[AUTH] コールバックURL:', callbackUrl);
          
          const url = new URL(callbackUrl);
          
          // フラグメントを解析（#を除去して処理）
          if (url.hash) {
            const hashParams = new URLSearchParams(url.hash.substring(1));
            
            // アクセストークンがフラグメントにある場合は手動で設定
            if (hashParams.has('access_token') && hashParams.has('refresh_token')) {
              console.log('[AUTH] トークンを検出、手動でセッションを設定します');
              
              try {
                // セッションを手動で設定
                const { error } = await supabase.auth.setSession({
                  access_token: hashParams.get('access_token') || '',
                  refresh_token: hashParams.get('refresh_token') || ''
                });
                
                if (error) {
                  console.error('[AUTH] セッション設定エラー:', error.message);
                } else {
                  console.log('[AUTH] セッションが正常に設定されました');
                }
              } catch (sessionError) {
                console.error('[AUTH] セッション設定中の例外:', sessionError);
              }
            }
          }
        } catch (urlError) {
          console.error('[AUTH] コールバックURL解析エラー:', urlError);
        }
        
        // セッションチェック前に少し待機して認証処理が完了するのを待つ
        console.log('[AUTH] セッション状態の更新を待っています...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // セッション状態を確認
        console.log('[AUTH] セッション状態を確認します');
        await checkSession();
        
        // セッション状態を再確認
        console.log('[AUTH] 認証状態:', isAuthenticated ? '認証済み' : '未認証');
        
        return true;
      } else {
        console.log('[AUTH] 認証キャンセルまたは失敗:', result.type);
        return false;
      }
    } catch (error) {
      console.error('[AUTH] GitHub認証エラー:', error);
      Alert.alert('エラー', 'GitHubログインに失敗しました。時間をおいて再度お試しください。');
      return false;
    }
  }, [checkSession, isAuthenticated]);

  // Google認証 - 改善版
  const loginWithGoogle = useCallback(async () => {
    try {
      console.log('[AUTH] Google認証開始');
      
      // アプリスキームを使用したリダイレクトURLを構築
      const redirectUrl = Linking.createURL('login-callback');
      console.log('[AUTH] 使用するリダイレクトURL:', redirectUrl);
      
      // ブラウザでログインを実行
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
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
      
      console.log('[AUTH] 認証URLを開きます:', data.url);
      
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
          console.log('[AUTH] コールバックURL:', callbackUrl);
          
          const url = new URL(callbackUrl);
          
          // フラグメントを解析（#を除去して処理）
          if (url.hash) {
            const hashParams = new URLSearchParams(url.hash.substring(1));
            
            // アクセストークンがフラグメントにある場合は手動で設定
            if (hashParams.has('access_token') && hashParams.has('refresh_token')) {
              console.log('[AUTH] トークンを検出、手動でセッションを設定します');
              
              try {
                // セッションを手動で設定
                const { error } = await supabase.auth.setSession({
                  access_token: hashParams.get('access_token') || '',
                  refresh_token: hashParams.get('refresh_token') || ''
                });
                
                if (error) {
                  console.error('[AUTH] セッション設定エラー:', error.message);
                } else {
                  console.log('[AUTH] セッションが正常に設定されました');
                }
              } catch (sessionError) {
                console.error('[AUTH] セッション設定中の例外:', sessionError);
              }
            }
          }
        } catch (urlError) {
          console.error('[AUTH] コールバックURL解析エラー:', urlError);
        }
        
        // セッションチェック前に少し待機して認証処理が完了するのを待つ
        console.log('[AUTH] セッション状態の更新を待っています...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // セッション状態を確認
        console.log('[AUTH] セッション状態を確認します');
        await checkSession();
        
        // セッション状態を再確認
        console.log('[AUTH] 認証状態:', isAuthenticated ? '認証済み' : '未認証');
        
        return true;
      } else {
        console.log('[AUTH] 認証キャンセルまたは失敗:', result.type);
        return false;
      }
    } catch (error) {
      console.error('[AUTH] Google認証エラー:', error);
      Alert.alert('エラー', 'Googleログインに失敗しました。時間をおいて再度お試しください。');
      return false;
    }
  }, [checkSession, isAuthenticated]);

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