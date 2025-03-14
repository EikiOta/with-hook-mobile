// src/utils/api.ts
import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { getSession } from '../services/supabase';
import NetInfo from '@react-native-community/netinfo';
import { addToMutationQueue, queryClient } from '../hooks/useQueryClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

// オフラインキャッシュのプレフィックス
const OFFLINE_CACHE_PREFIX = 'OFFLINE_API_CACHE_';

// Axios インスタンスの作成
export const apiClient = axios.create({
  timeout: 10000, // 10秒タイムアウト
  headers: {
    'Content-Type': 'application/json',
  },
});

// リクエストインターセプター（認証トークンの追加など）
apiClient.interceptors.request.use(
  async (config) => {
    const session = await getSession();
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
    
    // オフラインチェック（GET リクエストの場合）
    if (config.method?.toLowerCase() === 'get') {
      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected) {
        // オフラインならキャッシュを確認
        const cacheKey = `${OFFLINE_CACHE_PREFIX}${config.url}`;
        const cachedData = await AsyncStorage.getItem(cacheKey);
        
        if (cachedData) {
          console.log(`Using cached data for: ${config.url}`);
          // オフラインキャッシュがある場合、リクエストをキャンセルし、キャッシュを返す
          // Axiosのキャンセルトークンを使用
          const source = axios.CancelToken.source();
          config.cancelToken = source.token;
          setTimeout(() => {
            source.cancel(cachedData);
          }, 0);
        }
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// レスポンスインターセプター（エラーハンドリング、キャッシュなど）
apiClient.interceptors.response.use(
  async (response: AxiosResponse) => {
    // GETリクエストの結果をキャッシュ
    if (response.config.method?.toLowerCase() === 'get') {
      const cacheKey = `${OFFLINE_CACHE_PREFIX}${response.config.url}`;
      try {
        await AsyncStorage.setItem(cacheKey, JSON.stringify({
          data: response.data,
          timestamp: Date.now(),
          headers: response.headers,
        }));
      } catch (cacheError) {
        console.warn('Failed to cache API response:', cacheError);
      }
    }
    
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig;
    
    // キャンセルエラーがキャッシュデータを含む場合
    if (axios.isCancel(error) && typeof error.message === 'string') {
      try {
        const cachedResponse = JSON.parse(error.message);
        // 擬似的なAxiosレスポンスを返す
        return {
          ...cachedResponse,
          status: 200,
          statusText: 'OK (cached)',
          config: originalRequest,
          headers: cachedResponse.headers || {},
          fromCache: true,
        };
      } catch (e) {
        console.error('Error parsing cached response:', e);
      }
    }
    
    // ネットワークエラーの場合
    if (error.message === 'Network Error' || !error.response) {
      const netInfo = await NetInfo.fetch();
      
      // オフライン時にミューテーションをキューに追加
      if (!netInfo.isConnected && originalRequest && originalRequest.method !== 'get') {
        await addToMutationQueue({
          type: 'httpRequest',
          data: {
            url: originalRequest.url,
            method: originalRequest.method,
            data: originalRequest.data,
            headers: originalRequest.headers,
          },
        });
        
        // ユーザーに通知するためのカスタムエラー
        return Promise.reject({
          isOffline: true,
          queued: true,
          message: 'リクエストはオフラインキューに保存されました。オンラインに戻ったら実行されます。',
        });
      }
      
      // GET リクエストでオフラインならキャッシュを確認
      if (netInfo.isConnected === false && originalRequest?.method?.toLowerCase() === 'get') {
        const cacheKey = `${OFFLINE_CACHE_PREFIX}${originalRequest.url}`;
        try {
          const cachedData = await AsyncStorage.getItem(cacheKey);
          if (cachedData) {
            const parsedCache = JSON.parse(cachedData);
            // 擬似的なAxiosレスポンスを返す
            return {
              data: parsedCache.data,
              status: 200,
              statusText: 'OK (cached)',
              config: originalRequest,
              headers: parsedCache.headers || {},
              fromCache: true,
            };
          }
        } catch (cacheError) {
          console.error('Error retrieving cached response:', cacheError);
        }
      }
    }
    
    // 認証エラー（401）の場合の処理
    if (error.response?.status === 401) {
      // 認証切れを処理（ログアウトなど）
      queryClient.invalidateQueries({ queryKey: ['users', 'current'] });
      // ここでログアウト関数を呼び出すなど
    }
    
    return Promise.reject(error);
  }
);

// 外部APIのヘルパー関数

// Dictionary API
export const fetchWordFromDictionary = async (word: string) => {
  try {
    // オフラインチェック
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      // オフラインキャッシュを確認
      const cacheKey = `DICTIONARY_API_${word}`;
      const cachedData = await AsyncStorage.getItem(cacheKey);
      if (cachedData) {
        return JSON.parse(cachedData);
      }
      throw new Error('オフライン状態です。インターネット接続を確認してください。');
    }
    
    const response = await axios.get(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`
    );
    
    // 結果をキャッシュ
    const cacheKey = `DICTIONARY_API_${word}`;
    await AsyncStorage.setItem(cacheKey, JSON.stringify(response.data));
    
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      // エラーが404の場合は単語が見つからないことを示す
      if (error.response?.status === 404) {
        return null;
      }
    }
    console.error('Dictionary API error:', error);
    return null;
  }
};

// Datamuse API
export const fetchWordsFromDatamuse = async (prefix: string, partOfSpeech?: string) => {
  try {
    // オフラインチェック
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      // オフラインキャッシュを確認
      const cacheKey = `DATAMUSE_API_${prefix}_${partOfSpeech || 'all'}`;
      const cachedData = await AsyncStorage.getItem(cacheKey);
      if (cachedData) {
        return JSON.parse(cachedData);
      }
      return []; // オフラインで未キャッシュの場合は空配列
    }
    
    let url = `https://api.datamuse.com/words?sp=${prefix}*`;
    if (partOfSpeech) {
      url += `&md=p`;
    }
    
    const response = await axios.get(url);
    
    // 結果をキャッシュ
    const cacheKey = `DATAMUSE_API_${prefix}_${partOfSpeech || 'all'}`;
    
    // 品詞でフィルタリング（必要な場合）
    let filteredData = response.data;
    if (partOfSpeech) {
      filteredData = response.data.filter((item: any) => 
        item.tags && item.tags.includes(partOfSpeech)
      );
    }
    
    await AsyncStorage.setItem(cacheKey, JSON.stringify(filteredData));
    
    return filteredData;
  } catch (error) {
    console.error('Datamuse API error:', error);
    return [];
  }
};

// キャッシュの有効期限チェック（1週間）
export const isCacheValid = (timestamp: number): boolean => {
  const now = Date.now();
  const oneWeek = 7 * 24 * 60 * 60 * 1000;
  return now - timestamp < oneWeek;
};

// API関連キャッシュをクリア
export const clearApiCache = async (): Promise<void> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(key => 
      key.startsWith(OFFLINE_CACHE_PREFIX) || 
      key.startsWith('DICTIONARY_API_') || 
      key.startsWith('DATAMUSE_API_')
    );
    
    if (cacheKeys.length > 0) {
      await AsyncStorage.multiRemove(cacheKeys);
      console.log(`Cleared ${cacheKeys.length} API cache entries`);
    }
  } catch (error) {
    console.error('Error clearing API cache:', error);
  }
};