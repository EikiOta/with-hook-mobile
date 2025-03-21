import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Image, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
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
      
      const authMethod = provider === 'google' ? loginWithGoogle : loginWithGithub;
      const success = await authMethod();
      
      if (!success) {
        Alert.alert('認証エラー', `${provider}認証がキャンセルされたか失敗しました。`);
      }
    } catch (error) {
      Alert.alert('エラー', `${provider}ログインに失敗しました。`);
    } finally {
      setLoading(false);
    }
  }, [loginWithGoogle, loginWithGithub]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
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
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    padding: 30,
    borderRadius: 10,
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
    gap: 12,
  },
  loader: {
    marginVertical: 20,
  },
  versionText: {
    marginTop: 20,
    color: '#999',
    fontSize: 12,
  },
});

export default LoginScreen;