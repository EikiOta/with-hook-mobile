import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Image, Alert, ScrollView } from 'react-native';
import { Text, Surface, ActivityIndicator, Button } from 'react-native-paper';
import { useAuth } from '../hooks/useAuth';
import Constants from 'expo-constants';
import OAuthButton from '../components/OAuthButton';

const LoginScreen = () => {
  const [loading, setLoading] = useState(false);
  const { loginWithGoogle, loginWithGithub } = useAuth();

  // OAuth認証ハンドラー
  const handleOAuth = useCallback(async (provider: 'google' | 'github') => {
    try {
      setLoading(true);
      console.log(`${provider}認証開始`);
      
      const authMethod = provider === 'google' ? loginWithGoogle : loginWithGithub;
      const success = await authMethod();
      
      console.log(`${provider}認証結果:`, success ? '成功' : '失敗またはキャンセル');
    } catch (error) {
      console.error(`${provider}認証エラー:`, error);
      Alert.alert('エラー', `${provider === 'google' ? 'Google' : 'GitHub'}ログインに失敗しました。`);
    } finally {
      setLoading(false);
    }
  }, [loginWithGoogle, loginWithGithub]);

  return (
    <ScrollView style={styles.container}>
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
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  card: {
    padding: 30,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 4,
    margin: 20,
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