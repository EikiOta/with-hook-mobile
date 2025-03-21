import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Card, Button, Divider, Chip } from 'react-native-paper';
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
import { useAuthStore } from '../stores/authStore';
import { toast } from '../utils/toast';
import MeaningForm from '../components/MeaningForm';
import MemoryHookForm from '../components/MemoryHookForm';

/**
 * WordDetailScreen - 単語詳細画面
 * 単語の辞書情報、意味、記憶hookを表示・編集する
 */
const WordDetailScreen = () => {
  // パラメータから単語を取得
  const route = useRoute();
  const navigation = useNavigation();
  // @ts-ignore - route.paramsの型エラーを無視
  const { word } = route.params || { word: '' };
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
      toast.error(error?.message || '意味の作成に失敗しました');
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
      toast.error(error?.message || '記憶hookの作成に失敗しました');
    }
  };
  
  // 単語帳保存ハンドラ
  const handleSaveToMyWords = async () => {
    if (!selectedMeaning) {
      toast.error('意味を選択してください');
      return;
    }
    
    try {
      await saveToWordbook.mutateAsync({
        wordText: word,
        meaningId: selectedMeaning.meaning_id,
        memoryHookId: selectedMemoryHook?.memory_hook_id
      });
      
      toast.success('My単語帳に保存しました');
      // @ts-ignore - navigationの型エラーを無視
      navigation.navigate('MainTabs', { screen: 'MyWordbook' });
    } catch (error) {
      console.error('単語帳保存エラー:', error);
      toast.error(error?.message || '保存に失敗しました');
    }
  };
  
  // 初期意味選択
  useEffect(() => {
    if (meaningData?.meanings?.length > 0 && !selectedMeaning) {
      setSelectedMeaning(meaningData.meanings[0]);
    }
  }, [meaningData, selectedMeaning]);
  
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
        return (
          <View style={styles.tabContent}>
            {dictionaryData && dictionaryData.length > 0 ? (
              dictionaryData.map((entry, index) => (
                <Card key={index} style={styles.definitionCard}>
                  <Card.Content>
                    <Text style={styles.wordTitle}>{entry.word}</Text>
                    {entry.phonetics && entry.phonetics.length > 0 && entry.phonetics[0].text && (
                      <Text style={styles.phonetic}>{entry.phonetics[0].text}</Text>
                    )}
                    {entry.meanings && entry.meanings.map((meaning, mIndex) => (
                      <View key={mIndex} style={styles.meaningBlock}>
                        <Text style={styles.partOfSpeech}>{meaning.partOfSpeech}</Text>
                        {meaning.definitions && meaning.definitions.map((def, dIndex) => (
                          <View key={dIndex} style={styles.definition}>
                            <Text>{dIndex + 1}. {def.definition}</Text>
                            {def.example && <Text style={styles.example}>例: {def.example}</Text>}
                          </View>
                        ))}
                      </View>
                    ))}
                  </Card.Content>
                </Card>
              ))
            ) : (
              <Text>辞書データがありません</Text>
            )}
          </View>
        );
      case 'meanings':
        return (
          <View style={styles.tabContent}>
            <Button
              mode="contained"
              onPress={() => setShowMeaningForm(true)}
              style={styles.addButton}
            >
              意味の新規作成
            </Button>
            
            {meaningData?.meanings?.length > 0 ? (
              meaningData.meanings.map((meaning, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.itemCard,
                    selectedMeaning?.meaning_id === meaning.meaning_id && styles.selectedCard
                  ]}
                  onPress={() => setSelectedMeaning(meaning)}
                >
                  <Text style={styles.itemTitle}>意味 #{index + 1}</Text>
                  <Text>{meaning.meaning}</Text>
                  <View style={styles.itemFooter}>
                    <Chip mode="outlined">{meaning.is_public ? '公開' : '非公開'}</Chip>
                    <Text style={styles.itemAuthor}>
                      作成者: {meaning.user_id === user?.user_id ? 'あなた' : '他のユーザー'}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.emptyText}>登録された意味はありません</Text>
            )}
          </View>
        );
      case 'hooks':
        return (
          <View style={styles.tabContent}>
            <View style={styles.buttonRow}>
              <Button
                mode="contained"
                onPress={() => setShowHookForm(true)}
                style={styles.addButton}
              >
                記憶hookの新規作成
              </Button>
              
              <Button
                mode="outlined"
                onPress={() => setSelectedMemoryHook(null)}
                style={styles.clearButton}
              >
                選択解除
              </Button>
            </View>
            
            {hooksData?.hooks?.length > 0 ? (
              hooksData.hooks.map((hook, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.itemCard,
                    selectedMemoryHook?.memory_hook_id === hook.memory_hook_id && styles.selectedCard
                  ]}
                  onPress={() => setSelectedMemoryHook(hook)}
                >
                  <Text style={styles.itemTitle}>記憶hook #{index + 1}</Text>
                  <Text>{hook.memory_hook}</Text>
                  <View style={styles.itemFooter}>
                    <Chip mode="outlined">{hook.is_public ? '公開' : '非公開'}</Chip>
                    <Text style={styles.itemAuthor}>
                      作成者: {hook.user_id === user?.user_id ? 'あなた' : '他のユーザー'}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.emptyText}>登録された記憶hookはありません</Text>
            )}
          </View>
        );
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
        
        <Text style={styles.tipText}>
          ※意味が選択されていないと押せない仕様
        </Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  wordCard: {
    margin: 10,
    marginBottom: 5,
  },
  tabContainer: {
    flexDirection: 'row',
    margin: 10,
    marginTop: 5,
    borderRadius: 5,
    overflow: 'hidden',
    backgroundColor: '#ddd',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#3498db',
  },
  tabText: {
    fontWeight: '500',
  },
  contentContainer: {
    margin: 10,
    marginTop: 5,
  },
  tabContent: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 5,
  },
  definitionCard: {
    marginBottom: 10,
  },
  wordTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  phonetic: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  meaningBlock: {
    marginBottom: 15,
  },
  partOfSpeech: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  definition: {
    marginBottom: 8,
    paddingLeft: 10,
  },
  example: {
    fontStyle: 'italic',
    color: '#666',
    paddingLeft: 15,
  },
  addButton: {
    marginBottom: 15,
  },
  clearButton: {
    marginBottom: 15,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  itemCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 5,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedCard: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196f3',
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  itemAuthor: {
    fontSize: 12,
    color: '#666',
  },
  emptyText: {
    textAlign: 'center',
    padding: 20,
    color: '#666',
  },
  actionContainer: {
    backgroundColor: 'white',
    margin: 10,
    padding: 15,
    borderRadius: 5,
  },
  selectionSummary: {
    marginBottom: 10,
  },
  saveButton: {
    marginBottom: 10,
  },
  tipText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});

export default WordDetailScreen;