import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase, getSession, getCurrentUser } from '../services/supabase';
import { useAuthStore } from '../stores/authStore';
import { Alert, Platform } from 'react-native';
import { makeRedirectUri } from 'expo-auth-session';
import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

// アプリスキームを取得
const APP_SCHEME = Constants.expoConfig?.scheme || 'with-hook';

// リダイレクトURIを直接ここで生成（副作用なし）
const generateRedirectUri = () => {
  return `${APP_SCHEME}://login-callback`;
};

export const useAuth = () => {
  // グローバルストアから必要な状態のみ取得
  const { user, isAuthenticated, isLoading, isDeleted, checkSession } = useAuthStore();
  
  // 初期化状態追跡
  const isInitialized = useRef(false);
  
  // リダイレクトURI
  const redirectUri = useRef(generateRedirectUri());
  
  // 初期化 - 一度だけ実行
  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;
    
    // 認証状態チェック
    console.log('[AUTH] 初期化時のセッションチェック');
    checkSession();
    
    // Auth状態変更リスナー
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (['SIGNED_IN', 'SIGNED_OUT'].includes(event)) {
        console.log('[AUTH] 認証状態変更:', event);
        checkSession();
      }
    });
    
    // ディープリンクリスナー
    const deepLinkListener = Linking.addEventListener('url', ({ url }) => {
      console.log('[AUTH] ディープリンク検知:', url);
      if (url.includes('code=')) {
        handleAuthCallback(url);
      }
    });
    
    return () => {
      authListener.subscription.unsubscribe();
      deepLinkListener.remove();
    };
  }, []); // 空の依存配列 - 初回マウント時のみ実行

  // 認証コールバック処理
  const handleAuthCallback = async (url) => {
    try {
      console.log('[AUTH] コールバック処理開始');
      
      const codeMatch = url.match(/code=([^&]+)/);
      if (!codeMatch) return false;
      
      const code = codeMatch[1];
      console.log('[AUTH] 認証コード取得成功');
      
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error('[AUTH] セッション交換エラー:', error.message);
        return false;
      }
      
      console.log('[AUTH] セッション交換成功');
      checkSession();
      return true;
      
    } catch (error) {
      console.error('[AUTH] コールバック処理エラー:', error);
      return false;
    }
  };

  // Google認証
  const loginWithGoogle = useCallback(async () => {
    try {
      const uri = redirectUri.current;
      console.log('[AUTH] Googleログイン開始:', uri);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: uri,
          skipBrowserRedirect: true,
        }
      });
      
      if (error || !data.url) {
        throw new Error(error?.message || 'URLの取得に失敗しました');
      }
      
      const result = await WebBrowser.openAuthSessionAsync(data.url, uri);
      
      if (result.type === 'success' && result.url) {
        return await handleAuthCallback(result.url);
      }
      
      return false;
    } catch (error) {
      console.error('[AUTH] Googleログインエラー:', error);
      Alert.alert('エラー', 'Googleログインに失敗しました');
      return false;
    }
  }, []);

  // GitHub認証
  const loginWithGithub = useCallback(async () => {
    try {
      const uri = redirectUri.current;
      console.log('[AUTH] GitHubログイン開始:', uri);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: uri,
          skipBrowserRedirect: true,
        }
      });
      
      if (error || !data.url) {
        throw new Error(error?.message || 'URLの取得に失敗しました');
      }
      
      const result = await WebBrowser.openAuthSessionAsync(data.url, uri);
      
      if (result.type === 'success' && result.url) {
        return await handleAuthCallback(result.url);
      }
      
      return false;
    } catch (error) {
      console.error('[AUTH] GitHubログインエラー:', error);
      Alert.alert('エラー', 'GitHubログインに失敗しました');
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
        redirectUri: redirectUri.current,
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