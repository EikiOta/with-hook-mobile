// src/screens/RecoverAccountScreen.tsx
import React, { useState } from 'react';
import { View, StyleSheet, Image, Alert } from 'react-native';
import { Button, Text, Surface, ActivityIndicator } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../stores/authStore';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';

const RecoverAccountScreen = () => {
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const { user, logout, recoverAccount } = useAuthStore();

  // 削除日時を取得
  const deletedDate = user?.deleted_at ? new Date(user.deleted_at) : new Date();
  const timeAgo = formatDistanceToNow(deletedDate, { addSuffix: true, locale: ja });
  
  // 復元期限の計算（30日）
  const expiryDate = new Date(deletedDate);
  expiryDate.setDate(expiryDate.getDate() + 30);
  const daysLeft = Math.max(0, Math.ceil((expiryDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24)));

  // アカウント復旧処理
  const handleRecover = async () => {
    try {
      setLoading(true);
      const success = await recoverAccount();
      
      if (success) {
        Alert.alert('成功', 'アカウントを復旧しました。', [
          {
            text: 'OK',
            onPress: () => {
              // アカウント復旧成功後はホーム画面に遷移
              // @ts-ignore - ナビゲーションタイプエラーを無視
              navigation.reset({
                index: 0,
                routes: [{ name: 'Main' }],
              });
            }
          }
        ]);
      } else {
        throw new Error('復旧に失敗しました');
      }
    } catch (error) {
      console.error('アカウント復旧エラー:', error);
      Alert.alert('エラー', 'アカウントの復旧に失敗しました。時間をおいて再度お試しください。');
    } finally {
      setLoading(false);
    }
  };

  // ログアウト処理
  const handleLogout = async () => {
    try {
      setLoading(true);
      await logout();
      Alert.alert('ログアウト', 'ログアウトしました。新しいアカウントでログインできます。');
    } catch (error) {
      console.error('ログアウトエラー:', error);
      Alert.alert('エラー', 'ログアウトに失敗しました。時間をおいて再度お試しください。');
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
        
        <Text style={styles.title}>アカウント復旧</Text>
        
        <Text style={styles.infoText}>
          このアカウントは{timeAgo}削除されました。
        </Text>
        
        <Text style={styles.warningText}>
          復元期限: あと{daysLeft}日
        </Text>
        
        <Text style={styles.descriptionText}>
          復旧すると、あなたの単語帳データやユーザー情報が元に戻ります。このまま削除を続ける場合はログアウトしてください。
        </Text>
        
        <View style={styles.buttonContainer}>
          {loading ? (
            <ActivityIndicator size="large" style={styles.loader} />
          ) : (
            <>
              <Button
                mode="contained"
                icon="account-reactivate"
                onPress={handleRecover}
                style={[styles.button, styles.recoverButton]}
                labelStyle={styles.buttonLabel}
              >
                アカウントを復旧する
              </Button>
              
              <Button
                mode="outlined"
                icon="logout"
                onPress={handleLogout}
                style={styles.button}
                labelStyle={styles.buttonLabel}
              >
                ログアウト
              </Button>
            </>
          )}
        </View>
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
    width: 80,
    height: 80,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  infoText: {
    fontSize: 16,
    marginBottom: 10,
    textAlign: 'center',
  },
  warningText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginBottom: 20,
    textAlign: 'center',
  },
  descriptionText: {
    fontSize: 14,
    marginBottom: 30,
    textAlign: 'center',
    color: '#666',
  },
  buttonContainer: {
    width: '100%',
    gap: 15,
  },
  button: {
    width: '100%',
    borderRadius: 5,
    paddingVertical: 8,
  },
  recoverButton: {
    backgroundColor: '#3498db',
  },
  buttonLabel: {
    fontSize: 16,
    paddingVertical: 4,
  },
  loader: {
    marginVertical: 20,
  },
});

export default RecoverAccountScreen;