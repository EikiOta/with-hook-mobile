// src/screens/MeaningEditScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import { TextInput, Surface, Text, Switch, Button, ActivityIndicator } from 'react-native-paper';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useUpdateMeaning } from '../hooks/api/useMeaningQuery';
import { useAuthStore } from '../stores/authStore';
import { supabase } from '../services/supabase'; // supabaseクライアントをインポート

interface RouteParams {
  meaningId?: number;
  wordId: number;
  word: string;
}

const MeaningEditScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { meaningId, wordId, word } = route.params as RouteParams;
  const { user } = useAuthStore();
  
  const [meaningText, setMeaningText] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // データ取得と更新用のフック
  const updateMeaning = useUpdateMeaning();
  
  // 初期データの取得
  useEffect(() => {
    const fetchMeaning = async () => {
      if (!meaningId) {
        setIsLoading(false);
        return;
      }
      
      try {
        // 意味データを取得
        const { data: meaningData, error } = await supabase
          .from('meanings')
          .select('*')
          .eq('meaning_id', meaningId)
          .single();
        
        if (error) throw error;
        
        if (meaningData) {
          setMeaningText(meaningData.meaning);
          setIsPublic(meaningData.is_public);
        }
      } catch (error) {
        console.error('意味データ取得エラー:', error);
        Alert.alert('エラー', 'データの取得に失敗しました');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMeaning();
  }, [meaningId]);
  
  // 意味を更新
  const handleUpdate = async () => {
    if (!user?.user_id) {
      Alert.alert('エラー', 'ログインが必要です');
      return;
    }
    
    if (!meaningText.trim()) {
      Alert.alert('エラー', '意味を入力してください');
      return;
    }
    
    try {
      setIsLoading(true);
      
      if (meaningId) {
        // 既存の意味を更新
        await updateMeaning.mutateAsync({
          meaningId,
          meaningText,
          isPublic,
          wordId,
        });
        
        Alert.alert('成功', '意味を更新しました', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert('エラー', '更新対象の意味が見つかりません');
      }
    } catch (error) {
      console.error('意味更新エラー:', error);
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
        <Text style={styles.title}>意味の編集</Text>
        <Text style={styles.wordText}>単語: {word}</Text>
        
        <TextInput
          label="意味"
          value={meaningText}
          onChangeText={setMeaningText}
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
            disabled={!meaningText.trim() || updateMeaning.isLoading}
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

export default MeaningEditScreen;