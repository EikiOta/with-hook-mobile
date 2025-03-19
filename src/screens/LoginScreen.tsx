import React, { useState } from 'react';
import { View, StyleSheet, Image, Alert } from 'react-native';
import { Text, Surface, ActivityIndicator } from 'react-native-paper';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../stores/authStore';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import Constants from 'expo-constants';
import OAuthButton from '../components/OAuthButton';

// WebブラウザのリダイレクトURIの取得 - スキーム設定を使う
const redirectUri = makeRedirectUri({
  scheme: 'with-hook',
  preferLocalhost: false,
  path: 'login-callback',
  native: 'with-hook://login-callback',
});

// 認証セッションの交換処理
const exchangeCodeForSession = async (url: string) => {
  try {
    // URLからコードを抽出
    const code = url.split('code=')[1]?.split('&')[0];
    if (!code) throw new Error('認証コードが見つかりません');
    
    // コードをセッションに交換
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw error;
    
    return data.session;
  } catch (error) {
    console.error('セッション交換エラー:', error);
    return null;
  }
};

const LoginScreen = () => {
  const [loading, setLoading] = useState(false);
  const { checkSession } = useAuthStore();

  // OAuth認証ハンドラー
  const handleOAuth = async (provider: 'google' | 'github') => {
    try {
      setLoading(true);
      
      // デバッグ情報
      console.log(`認証開始: ${provider}`);
      console.log(`リダイレクトURI: ${redirectUri}`);
      
      // Supabaseの認証URL作成
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectUri,
          skipBrowserRedirect: true,
        }
      });
      
      if (error) throw error;
      if (!data.url) throw new Error('認証URLが取得できませんでした');

      console.log('認証URL:', data.url);

      // 外部ブラウザでOAuth認証を実行
      const result = await WebBrowser.openAuthSessionAsync(
        data.url, 
        redirectUri,
        { showInRecents: true }
      );
      
      console.log('認証結果:', result.type);
      
      if (result.type === 'success' && result.url) {
        console.log('認証成功、コールバックURL:', result.url);
        
        // 認証コードを交換してセッションを確立
        await exchangeCodeForSession(result.url);
        
        // セッションの確認
        await checkSession();
      } else {
        console.log('認証キャンセルまたは失敗:', result);
        Alert.alert('認証キャンセル', '認証プロセスがキャンセルされました。');
      }
    } catch (error: any) {
      console.error(`${provider}認証エラー:`, error.message);
      Alert.alert('エラー', `${provider === 'google' ? 'Google' : 'GitHub'}ログインに失敗しました。時間をおいて再度お試しください。`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  card: {
    padding: 30,
    borderRadius: 10,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    elevation: 4,
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
});

export default LoginScreen;