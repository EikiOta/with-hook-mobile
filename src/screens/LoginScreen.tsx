import React, { useState } from 'react';
import { View, StyleSheet, Image, Alert, Platform } from 'react-native';
import { Text, Surface, ActivityIndicator } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../stores';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import Constants from 'expo-constants';
import OAuthButton from '../components/OAuthButton';

// WebブラウザのリダイレクトURIの取得
const redirectUri = makeRedirectUri({
  scheme: 'with-hook'
});

const LoginScreen = () => {
  const [loading, setLoading] = useState(false);
  const { checkSession } = useAuthStore();

  // Google認証
  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      
      // Supabaseの認証URL作成
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUri,
          skipBrowserRedirect: true,
        }
      });
      
      if (error) throw error;
      if (!data.url) throw new Error('認証URLが取得できませんでした');

      // 外部ブラウザでOAuth認証を実行
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);
      
      if (result.type === 'success') {
        // URLからコードを取得
        const url = result.url;
        // セッションの確認
        await checkSession();
      }
    } catch (error: any) {
      console.error('Google認証エラー:', error.message);
      Alert.alert('エラー', 'Googleログインに失敗しました。時間をおいて再度お試しください。');
    } finally {
      setLoading(false);
    }
  };

  // GitHub認証
  const handleGithubLogin = async () => {
    try {
      setLoading(true);
      
      // Supabaseの認証URL作成
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: redirectUri,
          skipBrowserRedirect: true,
        }
      });
      
      if (error) throw error;
      if (!data.url) throw new Error('認証URLが取得できませんでした');

      // 外部ブラウザでOAuth認証を実行
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);
      
      if (result.type === 'success') {
        // セッションの確認
        await checkSession();
      }
    } catch (error: any) {
      console.error('GitHub認証エラー:', error.message);
      Alert.alert('エラー', 'GitHubログインに失敗しました。時間をおいて再度お試しください。');
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
                onPress={handleGoogleLogin} 
                loading={loading} 
              />
              
              <OAuthButton 
                provider="github" 
                onPress={handleGithubLogin} 
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