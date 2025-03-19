// src/screens/MemoryHookEditScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import { TextInput, Surface, Text, Switch, Button, ActivityIndicator } from 'react-native-paper';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useUpdateMemoryHook } from '../hooks/api/useMemoryHookQuery';
import { useAuthStore } from '../stores/authStore';
import { supabase } from '../services/supabase'; // supabaseクライアントをインポート

interface RouteParams {
  memoryHookId?: number;
  wordId: number;
  word: string;
}

const MemoryHookEditScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { memoryHookId, wordId, word } = route.params as RouteParams;
  const { user } = useAuthStore();
  
  const [hookText, setHookText] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // データ更新用のフック
  const updateMemoryHook = useUpdateMemoryHook();
  
  // 初期データの取得
  useEffect(() => {
    const fetchMemoryHook = async () => {
      if (!memoryHookId) {
        setIsLoading(false);
        return;
      }
      
      try {
        // 記憶Hookデータを取得
        const { data: hookData, error } = await supabase
          .from('memory_hooks')
          .select('*')
          .eq('memory_hook_id', memoryHookId)
          .single();
        
        if (error) throw error;
        
        if (hookData) {
          setHookText(hookData.memory_hook);
          setIsPublic(hookData.is_public);
        }
      } catch (error) {
        console.error('記憶Hook取得エラー:', error);
        Alert.alert('エラー', 'データの取得に失敗しました');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMemoryHook();
  }, [memoryHookId]);
  
  // 記憶Hookを更新
  const handleUpdate = async () => {
    if (!user?.user_id) {
      Alert.alert('エラー', 'ログインが必要です');
      return;
    }
    
    if (!hookText.trim()) {
      Alert.alert('エラー', '記憶Hookを入力してください');
      return;
    }
    
    try {
      setIsLoading(true);
      
      if (memoryHookId) {
        // 既存の記憶Hookを更新
        await updateMemoryHook.mutateAsync({
          hookId: memoryHookId,
          hookText,
          isPublic,
          wordId,
        });
        
        Alert.alert('成功', '記憶Hookを更新しました', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert('エラー', '更新対象の記憶Hookが見つかりません');
      }
    } catch (error) {
      console.error('記憶Hook更新エラー:', error);
      Alert.alert('エラー', '更新に失敗しました。時間をおいて再度お試しください。');
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>データを読み込み中...</Text>
      </View>
    );
  }
  
  return (
    <ScrollView style={styles.container}>
      <Surface style={styles.surface}>
        <Text style={styles.title}>記憶Hookの編集</Text>
        <Text style={styles.wordText}>単語: {word}</Text>
        
        <TextInput
          label="記憶Hook"
          value={hookText}
          onChangeText={setHookText}
          multiline
          numberOfLines={4}
          style={styles.input}
        />
        
        <View style={styles.switchContainer}>
          <Text>公開する</Text>
          <Switch
            value={isPublic}
            onValueChange={setIsPublic}
          />
        </View>
        
        <View style={styles.buttonContainer}>
          <Button
            mode="outlined"
            onPress={() => navigation.goBack()}
            style={styles.button}
          >
            キャンセル
          </Button>
          
          <Button
            mode="contained"
            onPress={handleUpdate}
            disabled={!hookText.trim() || updateMemoryHook.isLoading}
            style={styles.button}
          >
            更新
          </Button>
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
  surface: {
    margin: 16,
    padding: 16,
    borderRadius: 10,
    elevation: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  wordText: {
    fontSize: 16,
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    width: '48%',
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
});

export default MemoryHookEditScreen;