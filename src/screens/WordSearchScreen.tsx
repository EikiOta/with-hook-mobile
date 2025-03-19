// src/hooks/api/useWordQuery.ts の更新版
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { isOffline } from '../../services/supabaseService';
import { wordService } from '../../services/supabaseService';
import { wordKeys } from './keys';

// 単語検索API (外部APIと連携)
export const useWordSearch = (prefix: string) => {
  return useQuery({
    queryKey: wordKeys.search(prefix, 1),
    queryFn: async () => {
      // オフラインチェック
      if (await isOffline()) {
        // キャッシュから取得してみる
        const cachedData = await wordService.getCachedSearchResults(prefix);
        if (cachedData) return cachedData;
        throw new Error('オフライン状態です');
      }
      
      // 検索語が空の場合は結果なしを返す
      if (!prefix.trim()) {
        return { words: [], total: 0 };
      }
      
      try {
        // Dictionary APIから完全一致検索
        const dictResults = [];
        try {
          const dictRes = await axios.get(
            `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(prefix)}`
          );
          
          if (dictRes.status === 200) {
            dictRes.data.forEach(entry => {
              if (entry.meanings) {
                entry.meanings.forEach(meaning => {
                  let posCode = meaning.partOfSpeech;
                  if (posCode === "noun") posCode = "n";
                  else if (posCode === "verb") posCode = "v";
                  else if (posCode === "adjective") posCode = "adj";
                  else if (posCode === "adverb") posCode = "adv";
                  
                  dictResults.push({ 
                    word: entry.word, 
                    pos: posCode 
                  });
                });
              }
            });
          }
        } catch (error) {
          // 404エラーなどは無視（結果なしとして処理）
          console.log('Dictionary API error:', error);
        }
        
        // Datamuse APIから前方一致検索
        const suggestionResults = [];
        try {
          const dmRes = await axios.get(
            `https://api.datamuse.com/words?sp=${encodeURIComponent(prefix)}*&md=p`
          );
          
          if (dmRes.status === 200) {
            dmRes.data.forEach(item => {
              const word = item.word;
              if (item.tags) {
                item.tags.forEach(tag => {
                  if (["n", "v", "adj", "adv"].includes(tag)) {
                    suggestionResults.push({ word, pos: tag });
                  }
                });
              }
            });
          }
        } catch (error) {
          console.log('Datamuse API error:', error);
        }
        
        // 両方の結果を統合（重複を避ける）
        const combinedResults = [...dictResults];
        suggestionResults.forEach(s => {
          if (!combinedResults.some(r => r.word === s.word && r.pos === s.pos)) {
            combinedResults.push(s);
          }
        });
        
        // 同じ単語に複数の品詞があればまとめる
        const wordMap = new Map();
        combinedResults.forEach(({ word, pos }) => {
          if (!wordMap.has(word)) {
            wordMap.set(word, new Set());
          }
          wordMap.get(word).add(pos);
        });
        
        // 最終結果を生成
        const finalResults = [];
        wordMap.forEach((posSet, word) => {
          finalResults.push({
            word,
            parts: Array.from(posSet),
          });
        });
        
        // アルファベット順にソート
        finalResults.sort((a, b) => a.word.localeCompare(b.word));
        
        // 結果をキャッシュしておく
        await wordService.cacheSearchResults(prefix, {
          words: finalResults,
          total: finalResults.length
        });
        
        return {
          words: finalResults,
          total: finalResults.length
        };
      } catch (error) {
        console.error('単語検索エラー:', error);
        throw error;
      }
    },
    enabled: prefix.trim().length > 0,
  });
};

// 外部APIの追加
export const useExternalDictionary = (word: string) => {
  return useQuery({
    queryKey: ['dictionary', word],
    queryFn: async () => {
      // オフラインチェック
      if (await isOffline()) {
        // キャッシュから取得してみる
        const cachedData = await wordService.getCachedDictionaryData(word);
        if (cachedData) return cachedData;
        throw new Error('オフライン状態です');
      }
      
      if (!word.trim()) return null;
      
      try {
        const response = await axios.get(
          `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`
        );
        
        // 結果をキャッシュ
        await wordService.cacheDictionaryData(word, response.data);
        
        return response.data;
      } catch (error) {
        console.error('Dictionary API エラー:', error);
        return null;
      }
    },
    enabled: word.trim().length > 0,
    staleTime: 24 * 60 * 60 * 1000, // 24時間キャッシュ
  });
};