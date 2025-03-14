// src/hooks/api/useWordQuery.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { wordService, isOffline } from '../../services/supabaseService';
import { Word } from '../../types';
import { addToMutationQueue } from '../useQueryClient';

// キャッシュのキー定義
export const wordKeys = {
  all: ['words'] as const,
  search: (prefix: string, page: number) => [...wordKeys.all, 'search', prefix, page] as const,
  detail: (wordId: number) => [...wordKeys.all, 'detail', wordId] as const,
};

// 単語検索クエリフック
export const useSearchWords = (prefix: string, page: number = 1, limit: number = 20) => {
  return useQuery({
    queryKey: wordKeys.search(prefix, page),
    queryFn: () => wordService.searchWords(prefix, page, limit),
    enabled: prefix.length > 0, // 検索語があるときのみ有効
    keepPreviousData: true, // ページ切り替え時に前のデータを維持
  });
};

// 単語詳細クエリフック
export const useWordDetails = (wordId: number) => {
  return useQuery({
    queryKey: wordKeys.detail(wordId),
    queryFn: () => wordService.getWordDetails(wordId),
    enabled: wordId > 0,
  });
};

// 単語の検索または作成ミューテーションフック
export const useFindOrCreateWord = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (wordText: string) => {
      // オフラインチェック
      if (await isOffline()) {
        throw new Error('単語の作成にはインターネット接続が必要です');
      }
      
      return wordService.findOrCreateWord(wordText);
    },
    onSuccess: (data) => {
      if (data) {
        // 単語詳細キャッシュに追加
        queryClient.setQueryData(wordKeys.detail(data.word_id), data);
      }
    },
  });
};

// 外部APIから単語情報を取得するフック
export const useExternalDictionary = (word: string) => {
  return useQuery({
    queryKey: ['dictionary', word],
    queryFn: async () => {
      // 外部API呼び出し
      const dictionaryApi = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`)
        .then(res => res.json())
        .catch(() => null);
      
      return dictionaryApi;
    },
    enabled: word.length > 0,
    staleTime: Infinity, // 辞書情報は長期間キャッシュ
    cacheTime: 1000 * 60 * 60 * 24, // 24時間キャッシュ
  });
};