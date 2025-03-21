// src/hooks/useQueryClient.ts
import { QueryClient } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { userService, meaningService, memoryHookService, userWordService } from '../services/supabaseService';

// クエリキャッシュとミューテーションキューのストレージキー
const QUERY_CACHE_KEY = 'WITHHOOK_QUERY_CACHE';
const MUTATION_QUEUE_KEY = 'WITHHOOK_MUTATION_QUEUE';

// QueryClientの作成
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5分間はキャッシュを新鮮として扱う
      gcTime: 1000 * 60 * 60, // 1時間キャッシュを保持
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      onError: (err) => {
        console.error('Query error:', err);
      },
    },
    mutations: {
      retry: 1,
      onError: (err) => {
        console.error('Mutation error:', err);
      },
    },
  },
});

// AsyncStorageを使用した永続化設定
export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: QUERY_CACHE_KEY,
  // シリアライズ/デシリアライズにJSON.stringifyとJSON.parseを使用
  serialize: data => JSON.stringify(data),
  deserialize: data => JSON.parse(data),
});

// ミューテーションタイプを明示的に定義
export type MutationType = 
  | 'createMeaningByWordText'
  | 'updateMeaning'
  | 'deleteMeaning'
  | 'createMemoryHookByWordText'
  | 'updateMemoryHook'
  | 'deleteMemoryHook'
  | 'saveToWordbook'
  | 'saveToWordbookByText'
  | 'removeFromWordbook'
  | 'updateProfile'
  | 'deleteUser';

// オフラインミューテーションのインターフェース
export interface OfflineMutation {
  id: string;
  type: MutationType;
  data: Record<string, any>;
  timestamp: number;
}

// オフラインミューテーションをキューに追加する関数
export const addToMutationQueue = async (
  mutation: { type: MutationType; data: Record<string, any> }
): Promise<string | null> => {
  try {
    const queueString = await AsyncStorage.getItem(MUTATION_QUEUE_KEY);
    const queue: OfflineMutation[] = queueString ? JSON.parse(queueString) : [];
    
    // IDとタイムスタンプを追加
    const newMutation: OfflineMutation = {
      id: Math.random().toString(36).substring(2, 15),
      type: mutation.type,
      data: mutation.data,
      timestamp: Date.now(),
    };
    
    queue.push(newMutation);
    await AsyncStorage.setItem(MUTATION_QUEUE_KEY, JSON.stringify(queue));
    
    console.log('Mutation added to offline queue', newMutation);
    
    return newMutation.id;
  } catch (error) {
    console.error('Error adding to mutation queue:', error);
    return null;
  }
};

// ミューテーションキューのサイズを取得する関数
export const getMutationQueueSize = async (): Promise<number> => {
  try {
    const queueString = await AsyncStorage.getItem(MUTATION_QUEUE_KEY);
    const queue: OfflineMutation[] = queueString ? JSON.parse(queueString) : [];
    return queue.length;
  } catch (error) {
    console.error('Error getting mutation queue size:', error);
    return 0;
  }
};

// ミューテーションキューを削除する関数
export const clearMutationQueue = async (): Promise<boolean> => {
  try {
    await AsyncStorage.removeItem(MUTATION_QUEUE_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing mutation queue:', error);
    return false;
  }
};

// ミューテーションプロセッサをセットアップする関数
export const setupMutationQueueProcessor = () => {
  console.log('Setting up mutation queue processor...');
  
  // 起動時に一度処理を実行
  setTimeout(async () => {
    try {
      await processMutationQueue();
    } catch (error) {
      console.error('Initial mutation queue processing error:', error);
    }
  }, 5000); // 起動から5秒後に実行
  
  // 定期的にミューテーションキューを処理する（5分ごと）
  const intervalId = setInterval(async () => {
    try {
      await processMutationQueue();
    } catch (error) {
      console.error('Error processing mutation queue:', error);
    }
  }, 5 * 60 * 1000);

  return () => clearInterval(intervalId);
};

// 各タイプのミューテーション処理を実行する関数
const processMutationByType = async (
  mutation: OfflineMutation
): Promise<boolean> => {
  const { type, data } = mutation;
  
  try {
    switch (type) {
      case 'updateProfile':
        return await userService.updateProfile(
          data.userId,
          data.data
        );
          
      case 'deleteUser':
        return await userService.deleteUser(data.userId);
          
      case 'createMeaningByWordText':
        const meaning = await meaningService.createMeaningByWordText(
          data.userId,
          data.wordText,
          data.meaningText,
          data.isPublic
        );
        return !!meaning;
          
      case 'updateMeaning':
        return await meaningService.updateMeaning(
          data.meaningId,
          data.userId,
          data.meaningText,
          data.isPublic
        );
          
      case 'deleteMeaning':
        return await meaningService.deleteMeaning(
          data.meaningId,
          data.userId
        );
          
      case 'createMemoryHookByWordText':
        const hook = await memoryHookService.createMemoryHookByWordText(
          data.userId,
          data.wordText,
          data.hookText,
          data.isPublic
        );
        return !!hook;
          
      case 'updateMemoryHook':
        return await memoryHookService.updateMemoryHook(
          data.hookId,
          data.userId,
          data.hookText,
          data.isPublic
        );
          
      case 'deleteMemoryHook':
        return await memoryHookService.deleteMemoryHook(
          data.hookId,
          data.userId
        );
          
      case 'saveToWordbook':
        const userWord = await userWordService.saveToWordbook(
          data.userId,
          data.wordId,
          data.meaningId,
          data.memoryHookId
        );
        return !!userWord;
          
      case 'saveToWordbookByText':
        const userWordByText = await userWordService.saveToWordbookByText(
          data.userId,
          data.wordText,
          data.meaningId,
          data.memoryHookId
        );
        return !!userWordByText;
          
      case 'removeFromWordbook':
        return await userWordService.removeFromWordbook(
          data.userId,
          data.userWordsId
        );
          
      default:
        console.warn(`Unknown mutation type: ${type}`);
        return false;
    }
  } catch (error) {
    console.error(`Error processing mutation ${type}:`, error);
    return false;
  }
};

// キューからミューテーションを取得して実行する関数
export const processMutationQueue = async (): Promise<string[]> => {
  try {
    const queueString = await AsyncStorage.getItem(MUTATION_QUEUE_KEY);
    if (!queueString) return [];
    
    const queue: OfflineMutation[] = JSON.parse(queueString);
    if (queue.length === 0) return [];
    
    console.log(`Processing ${queue.length} queued mutations`);
    
    // 処理に成功したミューテーションのIDリスト
    const processedIds: string[] = [];
    
    // ミューテーションを順番に実行
    for (const mutation of queue) {
      try {
        const success = await processMutationByType(mutation);
        
        if (success) {
          // 成功したらIDを記録
          processedIds.push(mutation.id);
          console.log(`Successfully processed mutation: ${mutation.type}`);
          
          // 関連するキャッシュを無効化
          invalidateRelatedQueries(mutation.type);
        }
      } catch (error) {
        console.error(`Error processing mutation ${mutation.type}:`, error);
      }
    }
    
    // 処理に成功したミューテーションをキューから削除
    if (processedIds.length > 0) {
      const updatedQueue = queue.filter(m => !processedIds.includes(m.id));
      await AsyncStorage.setItem(MUTATION_QUEUE_KEY, JSON.stringify(updatedQueue));
      console.log(`Removed ${processedIds.length} processed mutations from queue`);
    }
    
    return processedIds;
  } catch (error) {
    console.error('Error processing mutation queue:', error);
    return [];
  }
};

// 関連するキャッシュを無効化する関数
const invalidateRelatedQueries = (mutationType: MutationType) => {
  if (mutationType.includes('Meaning')) {
    queryClient.invalidateQueries({ queryKey: ['meanings'] });
  } else if (mutationType.includes('MemoryHook')) {
    queryClient.invalidateQueries({ queryKey: ['memoryHooks'] });
  } else if (mutationType.includes('Wordbook')) {
    queryClient.invalidateQueries({ queryKey: ['userWords'] });
  } else if (mutationType.includes('User')) {
    queryClient.invalidateQueries({ queryKey: ['users'] });
  }
};