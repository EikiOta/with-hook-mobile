// src/screens/WordSearchScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput as RNTextInput } from 'react-native';
import { Searchbar, Card, Chip, Button, ActivityIndicator, Divider } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useWordSearch } from '../hooks/api/useWordQuery';

const WordSearchScreen = () => {
  const navigation = useNavigation();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [selectedPos, setSelectedPos] = useState('');
  
  // データ取得フック
  const { data: searchResults, isLoading, error } = useWordSearch(activeSearch);
  
  // 検索ハンドラ
  const handleSearch = () => {
    if (searchTerm.trim()) {
      setActiveSearch(searchTerm.trim());
    }
  };
  
  // 単語詳細に移動
  const handleWordSelect = (word: string) => {
    navigation.navigate('WordDetail', { word });
  };
  
  // 品詞フィルター
  const filterByPos = (word: any) => {
    if (!selectedPos || !word.parts) return true;
    return word.parts.includes(selectedPos);
  };
  
  // 検索結果表示
  const renderSearchResult = ({ item }) => (
    <Card 
      style={styles.wordCard} 
      onPress={() => handleWordSelect(item.word)}
    >
      <Card.Content>
        <Text style={styles.wordText}>{item.word}</Text>
        
        {item.parts && item.parts.length > 0 && (
          <View style={styles.partsContainer}>
            {item.parts.map((pos, index) => (
              <Chip 
                key={index} 
                style={styles.posChip}
                mode="outlined"
              >
                {pos === 'n' ? '名詞' :
                 pos === 'v' ? '動詞' :
                 pos === 'adj' ? '形容詞' :
                 pos === 'adv' ? '副詞' : pos}
              </Chip>
            ))}
          </View>
        )}
      </Card.Content>
    </Card>
  );
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>単語検索</Text>
      
      <Searchbar
        placeholder="英単語を入力"
        onChangeText={setSearchTerm}
        value={searchTerm}
        onSubmitEditing={handleSearch}
        style={styles.searchbar}
      />
      
      <View style={styles.filterContainer}>
        <Text style={styles.filterLabel}>品詞:</Text>
        
        <TouchableOpacity
          style={[styles.filterChip, selectedPos === '' && styles.activeFilter]}
          onPress={() => setSelectedPos('')}
        >
          <Text>すべて</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.filterChip, selectedPos === 'n' && styles.activeFilter]}
          onPress={() => setSelectedPos('n')}
        >
          <Text>名詞</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.filterChip, selectedPos === 'v' && styles.activeFilter]}
          onPress={() => setSelectedPos('v')}
        >
          <Text>動詞</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.filterChip, selectedPos === 'adj' && styles.activeFilter]}
          onPress={() => setSelectedPos('adj')}
        >
          <Text>形容詞</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.filterChip, selectedPos === 'adv' && styles.activeFilter]}
          onPress={() => setSelectedPos('adv')}
        >
          <Text>副詞</Text>
        </TouchableOpacity>
      </View>
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.loadingText}>検索中...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            エラーが発生しました。オンラインか確認してください。
          </Text>
          <Button mode="contained" onPress={handleSearch}>
            再試行
          </Button>
        </View>
      ) : !activeSearch ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            検索語を入力して英単語を検索してください
          </Text>
        </View>
      ) : searchResults && searchResults.words.length === 0 ? (
        <View style={styles.noResultsContainer}>
          <Text style={styles.noResultsText}>
            「{activeSearch}」に一致する単語は見つかりませんでした。
          </Text>
        </View>
      ) : (
        <FlatList
          data={searchResults?.words.filter(filterByPos) || []}
          renderItem={renderSearchResult}
          keyExtractor={(item) => item.word}
          contentContainerStyle={styles.resultsList}
        />
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
  searchbar: {
    marginBottom: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  filterLabel: {
    marginRight: 8,
    fontWeight: 'bold',
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#e0e0e0',
    marginRight: 8,
    marginBottom: 8,
  },
  activeFilter: {
    backgroundColor: '#3498db',
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginBottom: 20,
    textAlign: 'center',
    color: '#e74c3c',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noResultsText: {
    textAlign: 'center',
    color: '#666',
  },
  resultsList: {
    flexGrow: 1,
  },
  wordCard: {
    marginBottom: 8,
  },
  wordText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  partsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  posChip: {
    marginRight: 4,
    marginBottom: 4,
  },
});

export default WordSearchScreen;