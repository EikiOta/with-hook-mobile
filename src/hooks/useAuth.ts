import { useEffect, useState } from 'react';
import { supabase, getSession, getCurrentUser, generateAuthUrl } from '../services/supabase';
import { useAuthStore } from '../stores/authStore';
import { Alert, Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { makeRedirectUri } from 'expo-auth-session';
import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

// デバッグモード
const DEBUG = true;

// デバッグログ関数
const logDebug = (message: string, data?: any) => {
  if (DEBUG) {
    console.log(`[AUTH] ${message}`, data ? data : '');
  }
};

// アプリスキームを取得
const APP_SCHEME = Constants.expoConfig?.scheme || 'with-hook';

export const useAuth = () => {
  const { checkSession, isAuthenticated, isLoading, user, isDeleted } = useAuthStore();
  const [authState, setAuthState] = useState<{
    redirectUri: string;
    lastAuthError: string | null;
    lastAuthProvider: string | null;
  }>({
    redirectUri: '',
    lastAuthError: null,
    lastAuthProvider: null,
  });

  // 初期化時にURIを生成
  useEffect(() => {
    const initRedirectUri = () => {
      try {
        // リダイレクトURI生成
        const uri = getRedirectUri();
        setAuthState(prev => ({ ...prev, redirectUri: uri }));
        logDebug('リダイレクトURI初期化', { uri });
      } catch (error) {
        logDebug('リダイレクトURI初期化エラー', error);
      }
    };

    initRedirectUri();
  }, []);

  // 認証状態の監視
  useEffect(() => {
    logDebug('認証状態監視を開始');
    
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      logDebug('認証状態変更イベント', { event, hasSession: !!session });
      checkSession();
    });

    // ネットワーク接続の監視
    const unsubscribeNetInfo = NetInfo.addEventListener(state => {
      if (state.isConnected && !isAuthenticated && !isLoading) {
        logDebug('オンライン検知、セッション再確認');
        // オンラインになったらセッション再確認
        checkSession();
      }
    });

    // ディープリンクの監視（コールバックURL処理用）
    const linkingSubscription = Linking.addEventListener('url', ({ url }) => {
      logDebug('ディープリンク検知', { url });
      if (url.includes('code=')) {
        handleAuthCallback(url);
      }
    });

    return () => {
      logDebug('認証状態監視を終了');
      authListener.subscription.unsubscribe();
      unsubscribeNetInfo();
      linkingSubscription.remove();
    };
  }, [isAuthenticated, isLoading]);

  // 認証コールバックの処理
  const handleAuthCallback = async (url: string) => {
    try {
      logDebug('認証コールバック処理開始', { url });
      
      // コードを抽出
      const codeMatch = url.match(/code=([^&]+)/);
      if (!codeMatch) {
        throw new Error('認証コードが見つかりません');
      }
      
      const code = codeMatch[1];
      logDebug('認証コード抽出成功', { codePreview: code.substring(0, 5) + '...' });
      
      // セッション交換
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        logDebug('セッション交換エラー', error);
        throw error;
      }
      
      logDebug('セッション交換成功', { hasSession: !!data.session });
      
      // セッション確認
      await checkSession();
      
      return !!data.session;
    } catch (error) {
      logDebug('認証コールバック処理エラー', error);
      return false;
    }
  };

  // 環境に適したリダイレクトURIを取得
  const getRedirectUri = () => {
    try {
      // 各種方法でリダイレクトURI生成を試みる
      const methods = {
        // 方法1: makeRedirectUri関数を使用
        standard: makeRedirectUri({
          scheme: APP_SCHEME,
          path: 'login-callback',
        }),
        
        // 方法2: 完全カスタム
        custom: `${APP_SCHEME}://login-callback`,
        
        // 方法3: 開発環境特有のURI
        devSpecific: __DEV__ 
          ? `exp://${Platform.select({
              ios: Constants.expoConfig?.hostUri || 'localhost:8081',
              android: Constants.expoConfig?.hostUri || 'localhost:8081',
              default: 'localhost:8081',
            })}/--/login-callback`
          : `${APP_SCHEME}://login-callback`,
            
        // 方法4: Linkingを使用
        linking: Linking.createURL('login-callback'),
      };
      
      logDebug('リダイレクトURI生成オプション', methods);
      
      // 環境に応じたURIを選択
      let selectedUri = '';
      
      if (__DEV__) {
        // 開発環境ではExpo URIを使用
        selectedUri = methods.standard;
      } else {
        // 本番環境では固定URIを使用
        selectedUri = methods.custom;
      }
      
      logDebug('選択したリダイレクトURI', { uri: selectedUri });
      return selectedUri;
    } catch (error) {
      logDebug('リダイレクトURI生成エラー', error);
      // エラー時のフォールバック
      return __DEV__ 
        ? `exp://localhost:8081/--/login-callback`
        : `${APP_SCHEME}://login-callback`;
    }
  };

  // Google認証
  const loginWithGoogle = async () => {
    try {
      logDebug('Google認証開始');
      setAuthState(prev => ({ ...prev, lastAuthProvider: 'google', lastAuthError: null }));
      
      const redirectUri = getRedirectUri();
      logDebug('Google認証リダイレクトURI', { redirectUri });
      
      // 方法1: カスタム認証URL生成関数を使用
      const authUrl = await generateAuthUrl('google', redirectUri);
      logDebug('カスタム生成認証URL', { authUrl });
      
      // ブラウザでOAuth認証を実行
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        redirectUri,
        {
          showInRecents: true,
          createTask: true,
        }
      );
      
      logDebug('認証ブラウザ結果', { 
        type: result.type,
        url: result.url ? `${result.url.substring(0, 30)}...` : 'なし'
      });
      
      if (result.type === 'success' && result.url) {
        return await handleAuthCallback(result.url);
      }
      
      return false;
    } catch (error: any) {
      logDebug('Google認証エラー', error);
      setAuthState(prev => ({ ...prev, lastAuthError: error.message }));
      Alert.alert('エラー', 'Googleログインに失敗しました');
      return false;
    }
  };

  // GitHub認証
  const loginWithGithub = async () => {
    try {
      logDebug('GitHub認証開始');
      setAuthState(prev => ({ ...prev, lastAuthProvider: 'github', lastAuthError: null }));
      
      const redirectUri = getRedirectUri();
      logDebug('GitHub認証リダイレクトURI', { redirectUri });
      
      // カスタム認証URL生成
      const authUrl = await generateAuthUrl('github', redirectUri);
      logDebug('カスタム生成認証URL', { authUrl });
      
      // ブラウザでOAuth認証を実行
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        redirectUri,
        {
          showInRecents: true,
          createTask: true,
        }
      );
      
      logDebug('認証ブラウザ結果', { 
        type: result.type,
        url: result.url ? `${result.url.substring(0, 30)}...` : 'なし'
      });
      
      if (result.type === 'success' && result.url) {
        return await handleAuthCallback(result.url);
      }
      
      return false;
    } catch (error: any) {
      logDebug('GitHub認証エラー', error);
      setAuthState(prev => ({ ...prev, lastAuthError: error.message }));
      Alert.alert('エラー', 'GitHubログインに失敗しました');
      return false;
    }
  };

  // デバッグ用の追加情報
  const getDebugInfo = async () => {
    try {
      const sessionData = await getSession();
      const userData = await getCurrentUser();
      
      return {
        auth: {
          isAuthenticated,
          isLoading,
          isDeleted,
          hasUser: !!user,
        },
        session: {
          active: !!sessionData,
          expiresAt: sessionData?.expires_at,
        },
        user: {
          id: userData?.id,
          email: userData?.email,
        },
        redirectUri: authState.redirectUri,
        lastAuthProvider: authState.lastAuthProvider,
        lastAuthError: authState.lastAuthError,
        platform: Platform.OS,
        isDev: __DEV__,
      };
    } catch (error) {
      return {
        error: String(error),
      };
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
    getDebugInfo, // デバッグ情報取得用
  };
};