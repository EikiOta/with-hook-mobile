import axios from 'axios';
import { getSession } from '../services/supabase';
import NetInfo from '@react-native-community/netinfo';
import { addToMutationQueue } from '../hooks/useQueryClient';

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
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// レスポンスインターセプター（エラーハンドリングなど）
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // ネットワークエラーの場合
    if (error.message === 'Network Error') {
      const netInfo = await NetInfo.fetch();
      
      // オフライン時にミューテーションをキューに追加
      if (!netInfo.isConnected && originalRequest.method !== 'get') {
        await addToMutationQueue({
          url: originalRequest.url,
          method: originalRequest.method,
          data: originalRequest.data,
          headers: originalRequest.headers,
        });
        
        // ユーザーに通知するためのカスタムエラー
        return Promise.reject({
          isOffline: true,
          message: 'リクエストはオフラインキューに保存されました。オンラインに戻ったら実行されます。',
        });
      }
    }
    
    // トークン期限切れの場合などの処理
    
    return Promise.reject(error);
  }
);

// 外部APIのヘルパー関数

// Dictionary API
export const fetchWordFromDictionary = async (word: string) => {
  try {
    const response = await axios.get(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`
    );
    return response.data;
  } catch (error) {
    console.error('Dictionary API error:', error);
    return null;
  }
};

// Datamuse API
export const fetchWordsFromDatamuse = async (prefix: string, partOfSpeech?: string) => {
  try {
    let url = `https://api.datamuse.com/words?sp=${prefix}*`;
    if (partOfSpeech) {
      url += `&md=p`;
    }
    
    const response = await axios.get(url);
    
    // 品詞でフィルタリング（必要な場合）
    if (partOfSpeech) {
      return response.data.filter((item: any) => 
        item.tags && item.tags.includes(partOfSpeech)
      );
    }
    
    return response.data;
  } catch (error) {
    console.error('Datamuse API error:', error);
    return [];
  }
};