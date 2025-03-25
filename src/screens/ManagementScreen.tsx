// src/screens/ManagementScreen.tsx
import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, FlatList, Alert } from 'react-native';
import { Text, Card, Divider, Button, Chip, ActivityIndicator, IconButton } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useMyMeanings, useDeleteMeaning } from '../hooks/api/useMeaningQuery';
import { useMyMemoryHooks, useDeleteMemoryHook } from '../hooks/api/useMemoryHookQuery';

const ManagementScreen = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('meanings');
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  
  // データ取得フック
  const { 
    data: meaningsData, 
    isLoading: isMeaningLoading, 
    refetch: refetchMeanings 
  } = useMyMeanings(page, 5);
  
  const { 
    data: hooksData, 
    isLoading: isHookLoading,
    refetch: refetchHooks 
  } = useMyMemoryHooks(page, 5);
  
  // ミューテーションフック
  const deleteMeaning = useDeleteMeaning();
  const deleteMemoryHook = useDeleteMemoryHook();
  
  // 次のページへ
  const handleNextPage = () => {
    const total = activeTab === 'meanings' 
      ? meaningsData?.total
      : hooksData?.total;
      
    if (total && total > page * 5) {
      setPage(prev => prev + 1);
    }
  };
  
  // 前のページへ
  const handlePrevPage = () => {
    if (page > 1) {
      setPage(prev => prev - 1);
    }
  };
  
  // 意味編集画面に移動
  const handleEditMeaning = (meaningId: number, wordId: number, word: string) => {
    navigation.navigate('MeaningEdit', { meaningId, wordId, word });
  };
  
  // 意味の削除
  const handleDeleteMeaning = async (meaningId: number, wordId: number) => {
    Alert.alert(
      '削除確認',
      'この意味を削除しますか？',
      [
        {
          text: 'キャンセル',
          style: 'cancel',
        },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleteTarget(meaningId);
              console.log(`意味削除リクエスト: meaningId=${meaningId}, wordId=${wordId}`);
              
              // ユーザーIDの確認
              if (!user?.user_id) {
                throw new Error('ユーザー情報がありません');
              }
              
              const success = await deleteMeaning.mutateAsync({
                meaningId,
                wordId
              });
              
              if (success) {
                toast.success('削除しました！');
                refetchMeanings();
              } else {
                throw new Error('削除処理に失敗しました');
              }
            } catch (error) {
              console.error('意味削除エラー:', error);
              
              // エラーメッセージを作成
              let errorMessage = '削除に失敗しました。時間をおいて再度お試しください。';
              if (error instanceof Error) {
                errorMessage = error.message;
              }
              
              Alert.alert('エラー', errorMessage);
            } finally {
              setDeleteTarget(null);
            }
          },
        },
      ]
    );
  };
  
  // 記憶Hook編集画面に移動
  const handleEditMemoryHook = (memoryHookId: number, wordId: number, word: string) => {
    navigation.navigate('MemoryHookEdit', { memoryHookId, wordId, word });
  };
  
  // 記憶Hookの削除
  const handleDeleteMemoryHook = async (hookId: number, wordId: number) => {
    Alert.alert(
      '削除確認',
      'この記憶Hookを削除しますか？',
      [
        {
          text: 'キャンセル',
          style: 'cancel',
        },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleteTarget(hookId);
              console.log(`記憶Hook削除リクエスト: hookId=${hookId}, wordId=${wordId}`);
              
              // ユーザーIDの確認
              if (!user?.user_id) {
                throw new Error('ユーザー情報がありません');
              }
              
              const success = await deleteMemoryHook.mutateAsync({
                hookId,
                wordId
              });
              
              if (success) {
                toast.success('削除しました！');
                refetchHooks();
              } else {
                throw new Error('削除処理に失敗しました');
              }
            } catch (error) {
              console.error('記憶Hook削除エラー:', error);
              
              // エラーメッセージを作成
              let errorMessage = '削除に失敗しました。時間をおいて再度お試しください。';
              if (error instanceof Error) {
                errorMessage = error.message;
              }
              
              Alert.alert('エラー', errorMessage);
            } finally {
              setDeleteTarget(null);
            }
          },
        },
      ]
    );
  };
  
  const isLoading = activeTab === 'meanings' ? isMeaningLoading : isHookLoading;
  const tabData = activeTab === 'meanings' ? meaningsData : hooksData;
  
  // 空状態の表示
  const renderEmptyState = () => {
    const message = activeTab === 'meanings'
      ? '登録した意味がありません'
      : '登録した記憶Hookがありません';
      
    const action = activeTab === 'meanings'
      ? '単語を検索して意味を登録'
      : '単語を検索して記憶Hookを登録';
      
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>{message}</Text>
        <Button
          mode="contained"
          onPress={() => navigation.navigate('Search')}
          style={styles.emptyButton}
        >
          {action}
        </Button>
      </View>
    );
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>管理画面</Text>
      
      {/* タブ切り替え */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'meanings' && styles.activeTab]}
          onPress={() => {
            setActiveTab('meanings');
            setPage(1);
          }}
        >
          <Text style={styles.tabText}>意味一覧</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'hooks' && styles.activeTab]}
          onPress={() => {
            setActiveTab('hooks');
            setPage(1);
          }}
        >
          <Text style={styles.tabText}>記憶Hook一覧</Text>
        </TouchableOpacity>
      </View>
      
      {/* ローディング表示 */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.loadingText}>データを読み込み中...</Text>
        </View>
      ) : tabData && 
          ((activeTab === 'meanings' && tabData.meanings && tabData.meanings.length === 0) ||
           (activeTab === 'hooks' && tabData.hooks && tabData.hooks.length === 0)) ? (
        renderEmptyState()
      ) : (
        <View style={styles.contentContainer}>
          {activeTab === 'meanings' && meaningsData && (
            <FlatList
              data={meaningsData.meanings}
              keyExtractor={(item) => item.meaning_id.toString()}
              renderItem={({ item }) => (
                <Card style={styles.card}>
                  <Card.Content>
                    <View style={styles.cardHeader}>
                      <Text style={styles.wordText}>{item.words.word}</Text>
                      <Chip>{item.is_public ? '公開' : '非公開'}</Chip>
                    </View>
                    
                    <Divider style={styles.divider} />
                    
                    <Text style={styles.meaningText}>{item.meaning}</Text>
                    
                    <View style={styles.actionButtons}>
                      <IconButton
                        icon="pencil"
                        size={20}
                        onPress={() => handleEditMeaning(item.meaning_id, item.word_id, item.words.word)}
                      />
                      <IconButton
                        icon="delete"
                        size={20}
                        disabled={deleteMeaning.isLoading && deleteTarget === item.meaning_id}
                        onPress={() => handleDeleteMeaning(item.meaning_id, item.word_id)}
                      />
                    </View>
                  </Card.Content>
                </Card>
              )}
              contentContainerStyle={styles.listContent}
            />
          )}
          
          {activeTab === 'hooks' && hooksData && (
            <FlatList
              data={hooksData.hooks}
              keyExtractor={(item) => item.memory_hook_id.toString()}
              renderItem={({ item }) => (
                <Card style={styles.card}>
                  <Card.Content>
                    <View style={styles.cardHeader}>
                      <Text style={styles.wordText}>{item.words.word}</Text>
                      <Chip>{item.is_public ? '公開' : '非公開'}</Chip>
                    </View>
                    
                    <Divider style={styles.divider} />
                    
                    <Text style={styles.hookText}>{item.memory_hook}</Text>
                    
                    <View style={styles.actionButtons}>
                      <IconButton
                        icon="pencil"
                        size={20}
                        onPress={() => handleEditMemoryHook(item.memory_hook_id, item.word_id, item.words.word)}
                      />
                      <IconButton
                        icon="delete"
                        size={20}
                        disabled={deleteMemoryHook.isLoading && deleteTarget === item.memory_hook_id}
                        onPress={() => handleDeleteMemoryHook(item.memory_hook_id, item.word_id)}
                      />
                    </View>
                  </Card.Content>
                </Card>
              )}
              contentContainerStyle={styles.listContent}
            />
          )}
          
          {/* ページネーション */}
          {tabData && ((activeTab === 'meanings' && tabData.total > 0) || 
                      (activeTab === 'hooks' && tabData.total > 0)) && (
            <View style={styles.pagination}>
              <Button
                mode="outlined"
                disabled={page === 1}
                onPress={handlePrevPage}
              >
                前へ
              </Button>
              
              <Text style={styles.pageInfo}>
                {page} / {Math.ceil(tabData.total / 5)}
              </Text>
              
              <Button
                mode="outlined"
                disabled={page >= Math.ceil(tabData.total / 5)}
                onPress={handleNextPage}
              >
                次へ
              </Button>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  tabContainer: {
    flexDirection: 'row',
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
    flex: 1,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    marginBottom: 20,
    color: '#666',
  },
  emptyButton: {
    paddingHorizontal: 16,
  },
  card: {
    marginBottom: 12,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  wordText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  divider: {
    marginVertical: 8,
  },
  meaningText: {
    fontSize: 16,
    marginBottom: 8,
  },
  hookText: {
    fontSize: 16,
    marginBottom: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  listContent: {
    flexGrow: 1,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  pageInfo: {
    fontSize: 16,
  },
});

export default ManagementScreen;