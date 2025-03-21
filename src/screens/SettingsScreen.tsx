// src/screens/SettingsScreen.tsx
import React, { useState } from 'react';
import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import { Surface, Text, Button, Divider, List, Switch, ActivityIndicator, Avatar } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../stores/authStore';
import { clearApiCache } from '../utils/api';
import { clearMutationQueue } from '../hooks/useQueryClient';
import { appStorage } from '../utils/mmkv';
import { userService } from '../services/supabaseService';

const SettingsScreen = () => {
  const navigation = useNavigation();
  const { user, logout } = useAuthStore();
  
  const [isLoading, setIsLoading] = useState(false);
  
  // ログアウト処理
  const handleLogout = async () => {
    Alert.alert(
      'ログアウト確認',
      'ログアウトしますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: 'ログアウト',
          onPress: async () => {
            try {
              setIsLoading(true);
              await logout();
              // ログアウト後はAuthNavigatorに自動的にリダイレクトされる
            } catch (error) {
              console.error('ログアウトエラー:', error);
              Alert.alert('エラー', 'ログアウトに失敗しました。時間をおいて再度お試しください。');
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };
  
  // アカウント削除処理
  const handleDeleteAccount = () => {
    Alert.alert(
      'アカウント削除確認',
      'アカウントを削除しますか？この操作は取り消せません。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              
              // userServiceを使用してユーザーを削除
              const success = await userService.deleteUser(user?.user_id || '');
              
              if (!success) {
                throw new Error('削除処理に失敗しました');
              }
              
              // 削除成功後、ログアウト
              await logout();
              
              // 削除成功のアラート表示は不要（ログアウト後に表示されない）
            } catch (error) {
              console.error('アカウント削除エラー:', error);
              Alert.alert('エラー', 'アカウント削除に失敗しました。時間をおいて再度お試しください。');
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };
  
  // キャッシュクリア
  const handleClearCache = async () => {
    try {
      setIsLoading(true);
      
      // APIキャッシュをクリア
      await clearApiCache();
      
      // オフラインミューテーションキューをクリア
      await clearMutationQueue();
      
      Alert.alert('成功', 'キャッシュを削除しました');
    } catch (error) {
      console.error('キャッシュクリアエラー:', error);
      Alert.alert('エラー', 'キャッシュの削除に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>処理中...</Text>
      </View>
    );
  }
  
  return (
    <ScrollView style={styles.container}>
      <Surface style={styles.profileCard}>
        <Avatar.Text 
          size={80} 
          label={user?.nickname?.substring(0, 2) || 'ユ'}
          style={styles.avatar}
        />
        <Text style={styles.userName}>{user?.nickname || 'ユーザー'}</Text>
      </Surface>
      
      <Surface style={styles.settingsCard}>
        <Text style={styles.sectionTitle}>アカウント設定</Text>
        
        <List.Item
          title="プロフィール編集"
          description="ニックネーム、プロフィール画像などを編集"
          left={props => <List.Icon {...props} icon="account-edit" />}
          onPress={() => Alert.alert('お知らせ', 'この機能は現在準備中です')}
        />
        
        <Divider />
        
        <List.Item
          title="ログアウト"
          description="アプリからログアウトします"
          left={props => <List.Icon {...props} icon="logout" />}
          onPress={handleLogout}
        />
        
        <Divider />
        
        <List.Item
          title="アカウント削除"
          description="アカウントと関連データを削除します"
          left={props => <List.Icon {...props} icon="account-remove" color="#e74c3c" />}
          titleStyle={{ color: '#e74c3c' }}
          onPress={handleDeleteAccount}
        />
      </Surface>
      
      <Surface style={styles.settingsCard}>
        <Text style={styles.sectionTitle}>アプリ設定</Text>
        
        <List.Item
          title="キャッシュをクリア"
          description="アプリのキャッシュを削除します"
          left={props => <List.Icon {...props} icon="cached" />}
          onPress={handleClearCache}
        />
        
        <Divider />
        
        <List.Item
          title="バージョン情報"
          description="with-hook mobile v1.0.0"
          left={props => <List.Icon {...props} icon="information" />}
        />
      </Surface>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  profileCard: {
    margin: 16,
    padding: 16,
    borderRadius: 10,
    elevation: 4,
    alignItems: 'center',
  },
  avatar: {
    marginBottom: 16,
    backgroundColor: '#3498db',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  settingsCard: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 10,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  deleteButton: {
    marginTop: 16,
    backgroundColor: '#e74c3c',
  },
});

export default SettingsScreen;