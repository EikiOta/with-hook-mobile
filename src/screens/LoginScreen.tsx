import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, Image, Alert, ScrollView, Text as RNText } from 'react-native';
import { Text, Surface, ActivityIndicator, Button } from 'react-native-paper';
import { useAuth } from '../hooks/useAuth';
import Constants from 'expo-constants';
import OAuthButton from '../components/OAuthButton';
import * as Linking from 'expo-linking';

const LoginScreen = () => {
  const [loading, setLoading] = useState(false);
  const { loginWithGoogle, loginWithGithub, getDebugInfo } = useAuth();
  const [debugInfo, setDebugInfo] = useState({});
  const [logs, setLogs] = useState([]);

  // デバッグ情報を収集
  useEffect(() => {
    const collectDebugInfo = async () => {
      const info = await getDebugInfo();
      setDebugInfo(info);
      addLog('デバッグ情報収集', info);
    };
    
    collectDebugInfo();
    
    // ディープリンクリスナー（デバッグ用）
    const subscription = Linking.addEventListener('url', ({ url }) => {
      addLog('ディープリンク検知', { url });
    });
    
    return () => subscription.remove();
  }, []);
  
  // デバッグログ追加
  const addLog = (message, data) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `${timestamp} - ${message}${data ? ': ' + JSON.stringify(data) : ''}`;
    setLogs(prevLogs => [logEntry, ...prevLogs.slice(0, 19)]);
  };

  // OAuth認証ハンドラー
  const handleOAuth = useCallback(async (provider) => {
    try {
      setLoading(true);
      addLog(`${provider}認証開始`);
      
      const authMethod = provider === 'google' ? loginWithGoogle : loginWithGithub;
      const success = await authMethod();
      
      addLog(`${provider}認証結果`, success ? '成功' : '失敗またはキャンセル');
    } catch (error) {
      addLog(`${provider}認証エラー`, error.message || error);
      Alert.alert('エラー', `${provider}ログインに失敗しました。`);
    } finally {
      setLoading(false);
    }
  }, [loginWithGoogle, loginWithGithub]);

  // リンクURLデバッグ
  const testLink = async () => {
    try {
      const url = `with-hook://login-callback?test=1`;
      addLog('テストリンク', url);
      const supported = await Linking.canOpenURL(url);
      addLog('リンクサポート状況', { supported });
      
      if (supported) {
        await Linking.openURL(url);
        addLog('リンク開始成功');
      }
    } catch (error) {
      addLog('リンクテストエラー', error.message || error);
    }
  };

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
              
              <Button mode="outlined" onPress={testLink}>
                リンクテスト
              </Button>
            </>
          )}
        </View>
        
        <Text style={styles.versionText}>
          Version {Constants.expoConfig?.version}
        </Text>
      </Surface>
      
      {/* デバッグ情報 */}
      <Surface style={styles.debugCard}>
        <Text style={styles.debugTitle}>デバッグ情報</Text>
        
        <View style={styles.debugSection}>
          <Text style={styles.sectionTitle}>環境情報:</Text>
          <RNText style={styles.debugText}>
            Platform: {debugInfo?.platform || '不明'}{'\n'}
            Scheme: {Constants.expoConfig?.scheme || '不明'}{'\n'}
            Redirect URI: {debugInfo?.redirectUri || '不明'}{'\n'}
            Dev Mode: {debugInfo?.isDev ? 'Yes' : 'No'}
          </RNText>
        </View>
        
        <View style={styles.debugSection}>
          <Text style={styles.sectionTitle}>ログ出力:</Text>
          <ScrollView style={styles.logContainer}>
            {logs.map((log, index) => (
              <RNText key={index} style={styles.logText}>{log}</RNText>
            ))}
          </ScrollView>
        </View>
      </Surface>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    padding: 30,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 4,
    margin: 20,
  },
  logo: {
    width: 100,
    height: 100,
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
  debugCard: {
    padding: 16,
    borderRadius: 10,
    margin: 20,
    marginTop: 0,
  },
  debugTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  debugSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  debugText: {
    fontFamily: 'monospace',
    fontSize: 12,
  },
  logContainer: {
    backgroundColor: '#f0f0f0',
    padding: 8,
    borderRadius: 4,
    maxHeight: 200,
  },
  logText: {
    fontFamily: 'monospace',
    fontSize: 10,
    marginBottom: 4,
  },
});

export default LoginScreen;