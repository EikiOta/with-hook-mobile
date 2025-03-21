// src/screens/WordDetailScreen.tsx の改善版（一部抜粋）
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Divider, Button, Chip, ActivityIndicator, Card } from 'react-native-paper';
import { useRoute, useNavigation } from '@react-navigation/native';
import { 
  useExternalDictionary, 
  useMeaningsByWordText, 
  useMemoryHooksByWordText, 
  useCreateMeaning, 
  useCreateMemoryHook,
  useSaveToWordbook, 
  useCheckWordInWordbook
} from '../hooks/api';
import MeaningForm from '../components/MeaningForm';
import MemoryHookForm from '../components/MemoryHookForm';
import { useAuthStore } from '../stores/authStore';
import { toast } from '../utils/toast';

/**
 * WordDetailScreen - 単語詳細画面
 * 単語の辞書情報、意味、記憶hookを表示・編集する
 */
const WordDetailScreen = () => {
  // パラメータから単語を取得
  const route = useRoute();
  const navigation = useNavigation();
  const { word } = route.params;
  const { user } = useAuthStore();
  
  // 表示状態管理
  const [activeTab, setActiveTab] = useState('definition');
  const [showMeaningForm, setShowMeaningForm] = useState(false);
  const [showHookForm, setShowHookForm] = useState(false);
  const [selectedMeaning, setSelectedMeaning] = useState(null);
  const [selectedMemoryHook, setSelectedMemoryHook] = useState(null);
  
  // データ取得フック
  const { 
    data: dictionaryData, 
    isLoading: isDictLoading 
  } = useExternalDictionary(word);
  
  const { 
    data: meaningData, 
    isLoading: isMeaningLoading, 
    refetch: refetchMeanings 
  } = useMeaningsByWordText(word);
  
  const { 
    data: hooksData, 
    isLoading: isHooksLoading, 
    refetch: refetchHooks 
  } = useMemoryHooksByWordText(word);
  
  const { 
    data: wordInWordbook, 
    isLoading: isCheckingWordbook 
  } = useCheckWordInWordbook(word);
  
  // ミューテーションフック
  const createMeaning = useCreateMeaning();
  const createMemoryHook = useCreateMemoryHook();
  const saveToWordbook = useSaveToWordbook();
  
  // 意味作成ハンドラ
  const handleCreateMeaning = async (meaningText, isPublic) => {
    try {
      await createMeaning.mutateAsync({
        wordText: word,
        text: meaningText,
        isPublic
      });
      
      setShowMeaningForm(false);
      refetchMeanings();
      toast.success('意味を作成しました');
    } catch (error) {
      console.error('意味作成エラー:', error);
      Alert.alert('エラー', error.message || '意味の作成に失敗しました');
    }
  };
  
  // 記憶hook作成ハンドラ
  const handleCreateMemoryHook = async (hookText, isPublic) => {
    try {
      await createMemoryHook.mutateAsync({
        wordText: word,
        text: hookText,
        isPublic
      });
      
      setShowHookForm(false);
      refetchHooks();
      toast.success('記憶hookを作成しました');
    } catch (error) {
      console.error('記憶hook作成エラー:', error);
      Alert.alert('エラー', error.message || '記憶hookの作成に失敗しました');
    }
  };
  
  // 単語帳保存ハンドラ
  const handleSaveToMyWords = async () => {
    if (!selectedMeaning) {
      Alert.alert('エラー', '意味を選択してください');
      return;
    }
    
    try {
      await saveToWordbook.mutateAsync({
        wordText: word,
        meaningId: selectedMeaning.meaning_id,
        memoryHookId: selectedMemoryHook?.memory_hook_id
      });
      
      Alert.alert(
        '成功', 
        'My単語帳に保存しました',
        [
          { 
            text: 'OK', 
            onPress: () => navigation.navigate('MainTabs', { screen: 'MyWordbook' })
          }
        ]
      );
    } catch (error) {
      console.error('単語帳保存エラー:', error);
      Alert.alert('エラー', error.message || '保存に失敗しました');
    }
  };
  
  // ローディング表示
  const isLoading = isDictLoading || isMeaningLoading || isHooksLoading || isCheckingWordbook;
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>データを読み込み中...</Text>
      </View>
    );
  }
  
  // タブ表示コンテンツの切り替え
  const renderTabContent = () => {
    switch (activeTab) {
      case 'definition':
        return renderDefinitionTab();
      case 'meanings':
        return renderMeaningsTab();
      case 'hooks':
        return renderHooksTab();
      default:
        return null;
    }
  };
  
  return (
    <ScrollView style={styles.container}>
      <Card style={styles.wordCard}>
        <Card.Title title={word} subtitle="英単語" />
        <Card.Content>
          {dictionaryData && dictionaryData[0]?.phonetics?.[0]?.text && (
            <Text style={styles.phonetic}>{dictionaryData[0].phonetics[0].text}</Text>
          )}
        </Card.Content>
      </Card>
      
      {/* タブ切り替え */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'definition' && styles.activeTab]}
          onPress={() => setActiveTab('definition')}
        >
          <Text style={styles.tabText}>定義</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'meanings' && styles.activeTab]}
          onPress={() => setActiveTab('meanings')}
        >
          <Text style={styles.tabText}>意味一覧</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'hooks' && styles.activeTab]}
          onPress={() => setActiveTab('hooks')}
        >
          <Text style={styles.tabText}>記憶hook</Text>
        </TouchableOpacity>
      </View>
      
      {/* タブコンテンツ */}
      <View style={styles.contentContainer}>
        {renderTabContent()}
      </View>
      
      {/* 単語帳保存 */}
      <View style={styles.actionContainer}>
        <Text style={styles.selectionSummary}>
          選択中: {selectedMeaning ? '意味あり' : '意味なし'} / 
                 {selectedMemoryHook ? '記憶hookあり' : '記憶hookなし'}
        </Text>
        
        <Button 
          mode="contained" 
          disabled={!selectedMeaning}
          loading={saveToWordbook.isLoading}
          onPress={handleSaveToMyWords}
          style={styles.saveButton}
        >
          {wordInWordbook ? 'My単語帳へ更新' : 'My単語帳に追加'}
        </Button>
      </View>
      
      {/* フォームモーダル */}
      {showMeaningForm && (
        <MeaningForm
          word={word}
          onSubmit={handleCreateMeaning}
          onCancel={() => setShowMeaningForm(false)}
        />
      )}
      
      {showHookForm && (
        <MemoryHookForm
          word={word}
          onSubmit={handleCreateMemoryHook}
          onCancel={() => setShowHookForm(false)}
        />
      )}
    </ScrollView>
  );
};