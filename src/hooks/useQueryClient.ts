// src/hooks/useQueryClient.ts
import { QueryClient } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { userService, meaningService, memoryHookService, userWordService } from '../services/supabaseService';

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
      // オフライン対応の設定
      refetchOnReconnect: true,
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
  // 最大キャッシュ期間を設定（7日）
  maxAge: 1000 * 60 * 60 * 24 * 7,
  // オプション：キャッシュのサイズ制限など
  serialize: (data) => JSON.stringify(data),
  deserialize: (data) => JSON.parse(data),
});

// オフラインミューテーション用のキー
export const MUTATION_QUEUE_KEY = 'WITH_HOOK_OFFLINE_MUTATIONS';

// オフラインミューテーションの型定義
export type OfflineMutation = {
  id: string;
  type: string;
  data: any;
  timestamp: number;
};

// オフラインミューテーションをキューに追加する関数
export const addToMutationQueue = async (mutation: { type: string; data: any }) => {
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

// キューからミューテーションを取得して実行する関数
export const processMutationQueue = async () => {
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
        console.log(`Processing mutation: ${mutation.type}`, mutation.data);
        
        let success = false;
        
        // ミューテーションタイプに応じた処理
        switch (mutation.type) {
          case 'updateProfile':
            success = await userService.updateProfile(
              mutation.data.userId,
              mutation.data.data
            );
            break;
            
          case 'deleteUser':
            success = await userService.deleteUser(mutation.data.userId);
            break;
            
          case 'createMeaning':
            const meaning = await meaningService.createMeaning(
              mutation.data.userId,
              mutation.data.wordId,
              mutation.data.meaningText,
              mutation.data.isPublic
            );
            success = !!meaning;
            break;
            
          case 'createMeaningByWordText':
            // 単語テキストから意味を作成
            const meaningByText = await meaningService.createMeaningByWordText(
              mutation.data.userId,
              mutation.data.wordText,
              mutation.data.meaningText,
              mutation.data.isPublic
            );
            success = !!meaningByText;
            break;
            
          case 'updateMeaning':
            success = await meaningService.updateMeaning(
              mutation.data.meaningId,
              mutation.data.userId,
              mutation.data.meaningText,
              mutation.data.isPublic
            );
            break;
            
          case 'deleteMeaning':
            success = await meaningService.deleteMeaning(
              mutation.data.meaningId,
              mutation.data.userId
            );
            break;
            
          case 'createMemoryHook':
            const hook = await memoryHookService.createMemoryHook(
              mutation.data.userId,
              mutation.data.wordId,
              mutation.data.hookText,
              mutation.data.isPublic
            );
            success = !!hook;
            break;
            
          case 'createMemoryHookByWordText':
            // 単語テキストから記憶hookを作成
            const hookByText = await memoryHookService.createMemoryHookByWordText(
              mutation.data.userId,
              mutation.data.wordText,
              mutation.data.hookText,
              mutation.data.isPublic
            );
            success = !!hookByText;
            break;
            
          case 'updateMemoryHook':
            success = await memoryHookService.updateMemoryHook(
              mutation.data.hookId,
              mutation.data.userId,
              mutation.data.hookText,
              mutation.data.isPublic
            );
            break;
            
          case 'deleteMemoryHook':
            success = await memoryHookService.deleteMemoryHook(
              mutation.data.hookId,
              mutation.data.userId
            );
            break;
            
          case 'saveToWordbook':
            const userWord = await userWordService.saveToWordbook(
              mutation.data.userId,
              mutation.data.wordId,
              mutation.data.meaningId,
              mutation.data.memoryHookId
            );
            success = !!userWord;
            break;
            
          case 'saveToWordbookByText':
            // 単語テキストから単語帳に保存
            const userWordByText = await userWordService.saveToWordbookByText(
              mutation.data.userId,
              mutation.data.wordText,
              mutation.data.meaningId,
              mutation.data.memoryHookId
            );
            success = !!userWordByText;
            break;
            
          case 'removeFromWordbook':
            success = await userWordService.removeFromWordbook(
              mutation.data.userId,
              mutation.data.userWordsId
            );
            break;
            
          default:
            console.warn(`Unknown mutation type: ${mutation.type}`);
            success = false;
        }
        
        if (success) {
          // 成功したらIDを記録
          processedIds.push(mutation.id);
          console.log(`Successfully processed mutation: ${mutation.type}`);
          
          // 関連するキャッシュを無効化
          if (mutation.type.includes('Meaning')) {
            queryClient.invalidateQueries({ queryKey: ['meanings'] });
          } else if (mutation.type.includes('MemoryHook')) {
            queryClient.invalidateQueries({ queryKey: ['memoryHooks'] });
          } else if (mutation.type.includes('Wordbook')) {
            queryClient.invalidateQueries({ queryKey: ['userWords'] });
          } else if (mutation.type.includes('User')) {
            queryClient.invalidateQueries({ queryKey: ['users'] });
          }
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

// ネットワーク状態の変化を監視して、オンラインになったらキューを処理する
export const setupMutationQueueProcessor = () => {
  // アプリ起動時とネットワーク接続時にキューを処理
  const handleOnline = async () => {
    const netInfo = await NetInfo.fetch();
    if (netInfo.isConnected) {
      console.log('Network is connected, processing mutation queue');
      await processMutationQueue();
    }
  };

  // 初回実行
  handleOnline();

  // ネットワーク状態の変化を監視するリスナーを設定
  const unsubscribe = NetInfo.addEventListener(state => {
    if (state.isConnected) {
      handleOnline();
    }
  });

  // リスナーの解除関数を返す
  return unsubscribe;
};

// オフラインミューテーションのキュー状態を取得
export const getMutationQueue = async (): Promise<OfflineMutation[]> => {
  try {
    const queueString = await AsyncStorage.getItem(MUTATION_QUEUE_KEY);
    return queueString ? JSON.parse(queueString) : [];
  } catch (error) {
    console.error('Error getting mutation queue:', error);
    return [];
  }
};

// キューサイズの取得（UI通知用）
export const getMutationQueueSize = async (): Promise<number> => {
  const queue = await getMutationQueue();
  return queue.length;
};

// キューのクリア（デバッグ用）
export const clearMutationQueue = async (): Promise<boolean> => {
  try {
    await AsyncStorage.setItem(MUTATION_QUEUE_KEY, JSON.stringify([]));
    return true;
  } catch (error) {
    console.error('Error clearing mutation queue:', error);
    return false;
  }
};