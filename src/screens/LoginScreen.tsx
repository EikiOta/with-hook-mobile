import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Image, Alert, Platform, ScrollView } from 'react-native';
import { Text, Surface, ActivityIndicator, Button, Divider } from 'react-native-paper';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../stores/authStore';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import Constants from 'expo-constants';
import OAuthButton from '../components/OAuthButton';
import * as Linking from 'expo-linking';

// デバッグモード有効化
const DEBUG_MODE = true;

const LoginScreen = () => {
  const [loading, setLoading] = useState(false);
  const { checkSession } = useAuthStore();
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [debugOutput, setDebugOutput] = useState<string[]>([]);

  // デバッグログ関数
  const log = (message: string, data?: any) => {
    console.log(message, data);
    setDebugOutput(prev => [...prev, `${message} ${data ? JSON.stringify(data, null, 2) : ''}`]);
  };

  useEffect(() => {
    // 初期情報収集
    const collectInitialInfo = async () => {
      try {
        // 環境情報
        const envInfo = {
          expoVersion: Constants.expoVersion,
          deviceName: Constants.deviceName,
          appScheme: Constants.expoConfig?.scheme || 'unknown',
          platform: Platform.OS,
          supabaseUrl: Constants.expoConfig?.extra?.supabaseUrl || 'unknown',
        };

        // リダイレクトURI情報
        const expRedirectUri = makeRedirectUri({
          scheme: Constants.expoConfig?.scheme || 'with-hook',
          path: 'login-callback',
        });

        const nativeRedirectUri = `${Constants.expoConfig?.scheme || 'with-hook'}://login-callback`;

        // Linking情報
        const hasUrlOpener = typeof Linking.openURL === 'function';
        const initialUrl = await Linking.getInitialURL();
        const prefixes = Linking.createURL('/');

        // Supabase認証情報
        const { data: sessionData } = await supabase.auth.getSession();
        const hasActiveSession = !!sessionData?.session;

        // デバッグ情報を設定
        const info = {
          environment: envInfo,
          redirectUris: {
            expo: expRedirectUri,
            native: nativeRedirectUri,
            linking: prefixes,
          },
          linkingStatus: {
            hasUrlOpener,
            initialUrl,
          },
          authStatus: {
            hasActiveSession,
          },
        };

        setDebugInfo(info);
        log('初期デバッグ情報収集完了', info);
      } catch (error) {
        log('デバッグ情報収集エラー', error);
      }
    };

    collectInitialInfo();

    // ディープリンクのリスナー
    const subscription = Linking.addEventListener('url', ({ url }) => {
      log('ディープリンク受信', { url });
      
      // 認証コールバック処理
      if (url.includes('code=')) {
        handleAuthCallback(url);
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // 認証コールバック処理
  const handleAuthCallback = async (url: string) => {
    try {
      log('認証コールバック処理開始', { url });
      
      // URLからコードを抽出
      const codeMatch = url.match(/code=([^&]+)/);
      if (!codeMatch) {
        throw new Error('認証コードが見つかりません');
      }
      
      const code = codeMatch[1];
      log('認証コード抽出', { code: code.substring(0, 5) + '...' });
      
      // コードをセッションに交換
      log('セッション交換開始');
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        log('セッション交換エラー', error);
        throw error;
      }
      
      log('セッション交換成功', { 
        hasSession: !!data.session,
        expiresAt: data.session?.expires_at
      });
      
      // セッション確認
      await checkSession();
      log('セッション確認完了');
      
    } catch (error) {
      log('認証コールバック処理エラー', error);
      Alert.alert('認証エラー', 'ログイン処理中にエラーが発生しました。時間をおいて再度お試しください。');
    }
  };

  // OAuth認証ハンドラー
  const handleOAuth = async (provider: 'google' | 'github') => {
    try {
      setLoading(true);
      log(`${provider}認証開始`);
      
      // 各種リダイレクトURIを生成して比較（デバッグ用）
      const redirectMethods = {
        custom: `${Constants.expoConfig?.scheme || 'with-hook'}://login-callback`,
        makeRedirect: makeRedirectUri({
          scheme: Constants.expoConfig?.scheme || 'with-hook',
          path: 'login-callback',
        }),
        makeRedirectNative: makeRedirectUri({
          scheme: Constants.expoConfig?.scheme || 'with-hook',
          path: 'login-callback',
          native: `${Constants.expoConfig?.scheme || 'with-hook'}://login-callback`
        }),
        expoDefault: makeRedirectUri(),
        supabaseDefault: `${Constants.expoConfig?.extra?.supabaseUrl}/auth/v1/callback`,
      };
      
      log('リダイレクトURI比較', redirectMethods);
      
      // 実際に使用するリダイレクトURI
      const redirectUri = redirectMethods.makeRedirect;
      log('使用するリダイレクトURI', { redirectUri });
      
      // リダイレクトURIとGitHub設定の一致確認（推奨されるURL）
      log('GitHub設定推奨URL', { 
        message: '以下のURLをGitHubのOAuth App設定に登録してください',
        githubCallbackUrl: redirectUri
      });
      
      // Supabaseの認証URL作成
      log('Supabase認証URL作成開始');
      const authOptions = {
        provider,
        options: {
          redirectTo: redirectUri,
          skipBrowserRedirect: true,
        }
      };
      log('Supabase認証オプション', authOptions);
      
      const { data, error } = await supabase.auth.signInWithOAuth(authOptions);
      
      if (error) {
        log('Supabase認証URL作成エラー', error);
        throw error;
      }
      
      if (!data.url) {
        log('認証URL取得失敗');
        throw new Error('認証URLが取得できませんでした');
      }

      log('認証URL取得成功', { url: data.url });

      // 外部ブラウザでOAuth認証を実行
      log('ブラウザでの認証開始');
      const result = await WebBrowser.openAuthSessionAsync(
        data.url, 
        redirectUri,
        {
          showInRecents: true,
          createTask: true
        }
      );
      
      log('ブラウザ認証結果', { 
        type: result.type,
        url: result.url ? result.url.substring(0, 30) + '...' : 'なし'
      });
      
      // 認証結果の処理
      if (result.type === 'success' && result.url) {
        log('ブラウザ認証成功、コールバック処理開始');
        await handleAuthCallback(result.url);
      } else {
        log('ブラウザ認証キャンセルまたは失敗');
        Alert.alert('認証キャンセル', '認証プロセスがキャンセルされました。');
      }
      
    } catch (error: any) {
      log(`${provider}認証エラー`, error);
      Alert.alert('エラー', `${provider === 'google' ? 'Google' : 'GitHub'}ログインに失敗しました。時間をおいて再度お試しください。`);
    } finally {
      setLoading(false);
    }
  };

  // デバッグテスト（リンク機能確認用）
  const testDeepLink = async () => {
    try {
      const url = `${Constants.expoConfig?.scheme || 'with-hook'}://login-callback?test=1`;
      log('ディープリンクテスト開始', { url });
      
      const supported = await Linking.canOpenURL(url);
      log('ディープリンクサポート状況', { supported });
      
      if (supported) {
        await Linking.openURL(url);
        log('ディープリンク開始成功');
      } else {
        log('ディープリンクサポートなし');
        Alert.alert('エラー', 'このデバイスはディープリンクをサポートしていません');
      }
    } catch (error) {
      log('ディープリンクテストエラー', error);
    }
  };

  // 追加のデバッグコマンド
  const checkSupabaseSession = async () => {
    try {
      log('Supabaseセッションチェック開始');
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        log('セッション取得エラー', error);
      } else {
        log('現在のセッション情報', { 
          hasSession: !!data.session,
          expiresAt: data.session?.expires_at 
        });
      }
    } catch (error) {
      log('セッションチェックエラー', error);
    }
  };

  // アプリ設定確認
  const checkAppConfig = () => {
    log('アプリ設定確認', {
      appConfig: Constants.expoConfig,
      manifest: Constants.manifest,
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Surface style={styles.card}>
        <Image
          source={require('../../assets/splash-icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        
        <Text style={styles.title}>英単語帳アプリ</Text>
        <Text style={styles.subtitle}>with-hook</Text>
        
        <View style={styles.buttonContainer}>
          {loading ? (
            <ActivityIndicator size="large" style={styles.loader} />
          ) : (
            <>
              <OAuthButton 
                provider="google" 
                onPress={() => handleOAuth('google')} 
                loading={loading} 
              />
              
              <OAuthButton 
                provider="github" 
                onPress={() => handleOAuth('github')} 
                loading={loading} 
              />
            </>
          )}
        </View>
        
        <Text style={styles.versionText}>
          Version {Constants.expoConfig?.version}
        </Text>
      </Surface>
      
      {DEBUG_MODE && (
        <Surface style={styles.debugCard}>
          <Text style={styles.debugTitle}>デバッグ情報</Text>
          
          <View style={styles.debugButtonContainer}>
            <Button mode="outlined" onPress={checkSupabaseSession}>
              セッション確認
            </Button>
            <Button mode="outlined" onPress={testDeepLink}>
              リンクテスト
            </Button>
            <Button mode="outlined" onPress={checkAppConfig}>
              設定確認
            </Button>
          </View>
          
          <Divider style={styles.divider} />
          
          <Text style={styles.debugSubtitle}>環境情報:</Text>
          <Text style={styles.debugText}>
            スキーム: {debugInfo.environment?.appScheme || 'unknown'}{'\n'}
            プラットフォーム: {debugInfo.environment?.platform || 'unknown'}{'\n'}
            SupabaseURL: {debugInfo.environment?.supabaseUrl || 'unknown'}
          </Text>
          
          <Text style={styles.debugSubtitle}>リダイレクトURI:</Text>
          <Text style={styles.debugText}>
            Expo: {debugInfo.redirectUris?.expo || 'unknown'}{'\n'}
            Native: {debugInfo.redirectUris?.native || 'unknown'}
          </Text>
          
          <Divider style={styles.divider} />
          
          <Text style={styles.debugSubtitle}>ログ出力:</Text>
          <ScrollView style={styles.logContainer}>
            {debugOutput.map((log, index) => (
              <Text key={index} style={styles.logText}>{log}</Text>
            ))}
          </ScrollView>
        </Surface>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 20,
  },
  card: {
    padding: 30,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 4,
    marginBottom: 20,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 30,
    color: '#666',
  },
  buttonContainer: {
    width: '100%',
    gap: 15,
  },
  loader: {
    marginVertical: 20,
  },
  versionText: {
    marginTop: 30,
    color: '#999',
    fontSize: 12,
  },
  // デバッグスタイル
  debugCard: {
    padding: 20,
    borderRadius: 10,
    marginTop: 20,
    marginBottom: 40,
  },
  debugTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  debugSubtitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
  },
  debugText: {
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 10,
  },
  debugButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 10,
  },
  divider: {
    marginVertical: 10,
  },
  logContainer: {
    maxHeight: 300,
    marginTop: 5,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    padding: 10,
  },
  logText: {
    fontSize: 10,
    fontFamily: 'monospace',
    marginBottom: 5,
  },
});

export default LoginScreen;