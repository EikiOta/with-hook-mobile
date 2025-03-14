import { QueryClient } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';

// QueryClient の作成
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5分
      cacheTime: 1000 * 60 * 60, // 1時間
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnMount: true,
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
    },
  },
});

// AsyncStorage向けのPersisterを作成
export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'REACT_QUERY_OFFLINE_CACHE',
});

// オフラインミューテーション用のキー
export const MUTATION_QUEUE_KEY = 'WITH_HOOK_OFFLINE_MUTATIONS';

// オフラインミューテーションをキューに追加する関数
export const addToMutationQueue = async (mutation: any) => {
  try {
    const queueString = await AsyncStorage.getItem(MUTATION_QUEUE_KEY);
    const queue = queueString ? JSON.parse(queueString) : [];
    queue.push(mutation);
    await AsyncStorage.setItem(MUTATION_QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.error('Error adding to mutation queue:', error);
  }
};

// キューからミューテーションを取得して実行する関数
export const processMutationQueue = async () => {
  try {
    const queueString = await AsyncStorage.getItem(MUTATION_QUEUE_KEY);
    if (!queueString) return;
    
    const queue = JSON.parse(queueString);
    if (queue.length === 0) return;
    
    // キューをクリア
    await AsyncStorage.setItem(MUTATION_QUEUE_KEY, JSON.stringify([]));
    
    // ミューテーションを順番に実行
    for (const mutation of queue) {
      try {
        // ここでミューテーションを実行
        // これは具体的なAPIの実装によって異なります
      } catch (error) {
        console.error('Error processing queued mutation:', error);
      }
    }
  } catch (error) {
    console.error('Error processing mutation queue:', error);
  }
};