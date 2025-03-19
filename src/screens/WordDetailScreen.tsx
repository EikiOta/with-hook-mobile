// src/screens/WordDetailScreen.tsx
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
  useCheckWordInWordbook,
  useFindOrCreateWord // 追加: 単語を検索または作成する機能
} from '../hooks/api';
import MeaningForm from '../components/MeaningForm';
import MemoryHookForm from '../components/MemoryHookForm';
import { useAuthStore } from '../stores/authStore';

const WordDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { word } = route.params;
  const { user } = useAuthStore();
  
  const [activeTab, setActiveTab] = useState('definition');
  const [showMeaningForm, setShowMeaningForm] = useState(false);
  const [showHookForm, setShowHookForm] = useState(false);
  const [selectedMeaning, setSelectedMeaning] = useState(null);
  const [selectedMemoryHook, setSelectedMemoryHook] = useState(null);
  const [isWordExisting, setIsWordExisting] = useState(false);
  const [isCreatingWord, setIsCreatingWord] = useState(false);
  
  // 単語の検索または作成機能を使用
  const findOrCreateWord = useFindOrCreateWord();
  
  // データ取得フック
  const { data: dictionaryData, isLoading: isDictLoading } = useExternalDictionary(word);
  const { data: meaningData, isLoading: isMeaningLoading, refetch: refetchMeanings } = useMeaningsByWordText(word);
  const { data: hooksData, isLoading: isHooksLoading, refetch: refetchHooks } = useMemoryHooksByWordText(word);
  const { data: wordInWordbook, isLoading: isCheckingWordbook } = useCheckWordInWordbook(word);
  
  // ミューテーションフック
  const createMeaning = useCreateMeaning();
  const createMemoryHook = useCreateMemoryHook();
  const saveToWordbook = useSaveToWordbook();
  
  // 単語のチェックと必要に応じて作成
  useEffect(() => {
    const checkAndCreateWord = async () => {
      try {
        // まず単語の存在チェックと単語の作成を一度に行う
        setIsCreatingWord(true);
        const wordRecord = await findOrCreateWord.mutateAsync(word);
        
        if (wordRecord) {
          setIsWordExisting(true);
        } else {
          // 単語の作成に失敗した場合
          setIsWordExisting(false);
          console.warn('単語の作成に失敗しました:', word);
        }
      } catch (error) {
        console.error('単語チェック/作成エラー:', error);
        setIsWordExisting(false);
      } finally {
        setIsCreatingWord(false);
      }
    };
    
    checkAndCreateWord();
  }, [word]);
  
  // 意味作成ハンドラ
  const handleCreateMeaning = async (meaningText, isPublic) => {
    try {
      await createMeaning.mutateAsync({
        wordText: word,
        meaningText,
        isPublic
      });
      setShowMeaningForm(false);
      refetchMeanings();
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
        hookText,
        isPublic
      });
      setShowHookForm(false);
      refetchHooks();
    } catch (error) {
      console.error('記憶hook作成エラー:', error);
      Alert.alert('エラー', error.message || '記憶hookの作成に失敗しました');
    }
  };
  
  // 単語帳保存ハンドラ
  const handleSaveToWordbook = async () => {
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
            onPress: () => navigation.navigate('MyWordbook') 
          }
        ]
      );
    } catch (error) {
      console.error('単語帳保存エラー:', error);
      Alert.alert('エラー', error.message || '保存に失敗しました');
    }
  };
  
  const isLoading = isDictLoading || isMeaningLoading || isHooksLoading || isCheckingWordbook || isCreatingWord;
  
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
      <Card style={styles.wordCard}>
        <Card.Title title={word} subtitle="英単語" />
        <Card.Content>
          {dictionaryData && dictionaryData[0]?.phonetics?.[0]?.text && (
            <Text style={styles.phonetic}>{dictionaryData[0].phonetics[0].text}</Text>
          )}
        </Card.Content>
      </Card>
      
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
      
      <View style={styles.contentContainer}>
        {activeTab === 'definition' && (
          <View>
            <Text style={styles.sectionTitle}>辞書定義</Text>
            {dictionaryData ? (
              dictionaryData[0]?.meanings?.map((meaning, index) => (
                <Card key={index} style={styles.definitionCard}>
                  <Card.Title 
                    title={meaning.partOfSpeech} 
                    subtitle={`定義${index + 1}`} 
                  />
                  <Card.Content>
                    {meaning.definitions.map((def, idx) => (
                      <View key={idx} style={styles.definition}>
                        <Text style={styles.definitionText}>{def.definition}</Text>
                        {def.example && (
                          <Text style={styles.exampleText}>例: {def.example}</Text>
                        )}
                      </View>
                    ))}
                  </Card.Content>
                </Card>
              ))
            ) : (
              <Text style={styles.noDataText}>外部APIからの定義が見つかりませんでした。</Text>
            )}
          </View>
        )}
        
        {activeTab === 'meanings' && (
          <View>
            <View style={styles.headerWithButton}>
              <Text style={styles.sectionTitle}>ユーザー登録の意味</Text>
              <Button 
                mode="contained" 
                onPress={() => setShowMeaningForm(true)}
              >
                新規作成
              </Button>
            </View>
            
            {meaningData?.meanings.length > 0 ? (
              meaningData.meanings.map((meaning, index) => (
                <TouchableOpacity
                  key={meaning.meaning_id}
                  style={[
                    styles.meaningItem,
                    selectedMeaning?.meaning_id === meaning.meaning_id && styles.selectedItem
                  ]}
                  onPress={() => setSelectedMeaning(meaning)}
                >
                  <View style={styles.meaningHeader}>
                    <Text style={styles.meaningAuthor}>
                      {meaning.user_id === user?.user_id ? '自分' : meaning.user?.nickname || '匿名'}
                    </Text>
                    <Chip>{meaning.is_public ? '公開' : '非公開'}</Chip>
                  </View>
                  <Text style={styles.meaningText}>{meaning.meaning}</Text>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.noDataText}>まだ意味が登録されていません。</Text>
            )}
            
            {showMeaningForm && (
              <MeaningForm
                word={word}
                onSubmit={handleCreateMeaning}
                onCancel={() => setShowMeaningForm(false)}
              />
            )}
          </View>
        )}
        
        {activeTab === 'hooks' && (
          <View>
            <View style={styles.headerWithButton}>
              <Text style={styles.sectionTitle}>記憶hook</Text>
              <Button 
                mode="contained" 
                onPress={() => setShowHookForm(true)}
              >
                新規作成
              </Button>
            </View>
            
            {hooksData?.hooks.length > 0 ? (
              hooksData.hooks.map((hook, index) => (
                <TouchableOpacity
                  key={hook.memory_hook_id}
                  style={[
                    styles.hookItem,
                    selectedMemoryHook?.memory_hook_id === hook.memory_hook_id && styles.selectedItem
                  ]}
                  onPress={() => setSelectedMemoryHook(hook)}
                >
                  <View style={styles.hookHeader}>
                    <Text style={styles.hookAuthor}>
                      {hook.user_id === user?.user_id ? '自分' : hook.user?.nickname || '匿名'}
                    </Text>
                    <Chip>{hook.is_public ? '公開' : '非公開'}</Chip>
                  </View>
                  <Text style={styles.hookText}>{hook.memory_hook}</Text>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.noDataText}>まだ記憶hookが登録されていません。</Text>
            )}
            
            {showHookForm && (
              <MemoryHookForm
                word={word}
                onSubmit={handleCreateMemoryHook}
                onCancel={() => setShowHookForm(false)}
              />
            )}
          </View>
        )}
      </View>
      
      <View style={styles.actionContainer}>
        <Text style={styles.selectionSummary}>
          選択中: {selectedMeaning ? '意味あり' : '意味なし'} / 
                 {selectedMemoryHook ? '記憶hookあり' : '記憶hookなし'}
        </Text>
        
        <Button 
          mode="contained" 
          disabled={!selectedMeaning}
          loading={saveToWordbook.isLoading}
          onPress={handleSaveToWordbook}
          style={styles.saveButton}
        >
          {wordInWordbook ? 'My単語帳を更新' : 'My単語帳に追加'}
        </Button>
      </View>
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
  wordCard: {
    margin: 16,
    elevation: 4,
  },
  phonetic: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
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
    marginHorizontal: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  headerWithButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  definitionCard: {
    marginBottom: 12,
  },
  definition: {
    marginBottom: 8,
  },
  definitionText: {
    fontSize: 15,
    marginBottom: 4,
  },
  exampleText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  meaningItem: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedItem: {
    borderColor: '#3498db',
    borderWidth: 2,
    backgroundColor: '#ebf5fb',
  },
  meaningHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  meaningAuthor: {
    fontWeight: '500',
  },
  meaningText: {
    fontSize: 15,
  },
  hookItem: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  hookHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  hookAuthor: {
    fontWeight: '500',
  },
  hookText: {
    fontSize: 15,
  },
  noDataText: {
    textAlign: 'center',
    padding: 20,
    color: '#666',
  },
  actionContainer: {
    margin: 16,
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    elevation: 2,
  },
  selectionSummary: {
    textAlign: 'center',
    marginBottom: 12,
  },
  saveButton: {
    padding: 4,
  },
});

export default WordDetailScreen;