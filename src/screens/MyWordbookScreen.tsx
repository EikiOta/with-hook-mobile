// src/screens/MyWordbookScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { Card, Button, ActivityIndicator, Divider, IconButton, Chip } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useMyWordbook, useRemoveFromWordbook } from '../hooks/api/useUserWordQuery';
import { useAuthStore } from '../stores/authStore';
import { isDeleted } from '../utils/validation';

const MyWordbookScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  
  // データ取得フック
  const { data: wordbook, isLoading, refetch } = useMyWordbook(page, 5);
  
  // 削除ミューテーションフック
  const removeWordMutation = useRemoveFromWordbook();
  
  // ナビゲーション時にデータを更新
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      refetch();
    });
    
    return unsubscribe;
  }, [navigation, refetch]);
  
  // 単語詳細に移動
  const handleEditWord = (wordId: number, word: string) => {
    navigation.navigate('WordDetail', { wordId, word });
  };
  
  // 単語帳から削除
  const handleRemoveWord = (userWordsId: number, wordId: number) => {
    // 確認ダイアログを表示
    Alert.alert(
      '削除確認',
      'この単語をMy単語帳から削除しますか？',
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
              setDeleteTarget(userWordsId);
              await removeWordMutation.mutateAsync({
                userWordsId,
                wordId
              });
              
              Alert.alert('成功', '単語を削除しました');
              refetch();
            } catch (error) {
              console.error('単語削除エラー:', error);
              Alert.alert('エラー', '削除に失敗しました。時間をおいて再度お試しください。');
            } finally {
              setDeleteTarget(null);
            }
          },
        },
      ]
    );
  };
  
  // 次のページへ
  const handleNextPage = () => {
    if (wordbook && wordbook.total > page * 5) {
      setPage(prev => prev + 1);
    }
  };
  
  // 前のページへ
  const handlePrevPage = () => {
    if (page > 1) {
      setPage(prev => prev - 1);
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

  if (!wordbook || wordbook.userWords.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>単語帳に単語がありません</Text>
        <Button
          mode="contained"
          onPress={() => navigation.navigate('Search')}
          style={styles.emptyButton}
        >
          単語を検索して追加
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My単語帳</Text>
      
      <FlatList
        data={wordbook.userWords}
        keyExtractor={(item) => item.user_words_id.toString()}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.wordHeader}>
                <Text style={styles.wordText}>{item.words.word}</Text>
                <View style={styles.actionButtons}>
                  <IconButton
                    icon="pencil"
                    size={20}
                    onPress={() => handleEditWord(item.words.word_id, item.words.word)}
                  />
                  <IconButton
                    icon="delete"
                    size={20}
                    disabled={removeWordMutation.isLoading && deleteTarget === item.user_words_id}
                    onPress={() => handleRemoveWord(item.user_words_id, item.words.word_id)}
                  />
                </View>
              </View>
              
              <Divider style={styles.divider} />
              
              <View style={styles.meaningContainer}>
                <Text style={styles.sectionLabel}>意味:</Text>
                <Text style={[
                  styles.meaningText,
                  item.meanings && isDeleted(item.meanings) && styles.deletedText
                ]}>
                  {item.meanings?.meaning || '（意味なし）'}
                </Text>
              </View>
              
              {item.memory_hooks && (
                <View style={styles.hookContainer}>
                  <Text style={styles.sectionLabel}>記憶Hook:</Text>
                  <Text style={[
                    styles.hookText,
                    isDeleted(item.memory_hooks) && styles.deletedText
                  ]}>
                    {item.memory_hooks.memory_hook}
                  </Text>
                </View>
              )}
            </Card.Content>
          </Card>
        )}
        contentContainerStyle={styles.listContent}
      />
      
      {/* ページネーション */}
      {wordbook.total > 0 && (
        <View style={styles.pagination}>
          <Button
            mode="outlined"
            disabled={page === 1}
            onPress={handlePrevPage}
          >
            前へ
          </Button>
          
          <Text style={styles.pageInfo}>
            {page} / {Math.ceil(wordbook.total / 5)}
          </Text>
          
          <Button
            mode="outlined"
            disabled={page >= Math.ceil(wordbook.total / 5)}
            onPress={handleNextPage}
          >
            次へ
          </Button>
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
  wordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  wordText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
  },
  divider: {
    marginVertical: 8,
  },
  meaningContainer: {
    marginBottom: 12,
  },
  hookContainer: {
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 4,
  },
  meaningText: {
    fontSize: 16,
  },
  hookText: {
    fontSize: 16,
  },
  deletedText: {
    color: '#e74c3c',
    fontStyle: 'italic',
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

export default MyWordbookScreen;