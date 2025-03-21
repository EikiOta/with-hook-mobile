// src/hooks/useQueryClient.ts - プロセスミューテーションキュー部分のみ抜粋

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

// 各タイプのミューテーション処理を実行する関数
const processMutationByType = async (
  mutation: OfflineMutation, 
  services: Record<string, any>
): Promise<boolean> => {
  const { type, data } = mutation;
  
  try {
    switch (type) {
      case 'updateProfile':
        return await services.userService.updateProfile(
          data.userId,
          data.data
        );
          
      case 'deleteUser':
        return await services.userService.deleteUser(data.userId);
          
      case 'createMeaningByWordText':
        const meaning = await services.meaningService.createMeaningByWordText(
          data.userId,
          data.wordText,
          data.meaningText,
          data.isPublic
        );
        return !!meaning;
          
      case 'updateMeaning':
        return await services.meaningService.updateMeaning(
          data.meaningId,
          data.userId,
          data.meaningText,
          data.isPublic
        );
          
      case 'deleteMeaning':
        return await services.meaningService.deleteMeaning(
          data.meaningId,
          data.userId
        );
          
      case 'createMemoryHookByWordText':
        const hook = await services.memoryHookService.createMemoryHookByWordText(
          data.userId,
          data.wordText,
          data.hookText,
          data.isPublic
        );
        return !!hook;
          
      case 'updateMemoryHook':
        return await services.memoryHookService.updateMemoryHook(
          data.hookId,
          data.userId,
          data.hookText,
          data.isPublic
        );
          
      case 'deleteMemoryHook':
        return await services.memoryHookService.deleteMemoryHook(
          data.hookId,
          data.userId
        );
          
      case 'saveToWordbook':
        const userWord = await services.userWordService.saveToWordbook(
          data.userId,
          data.wordId,
          data.meaningId,
          data.memoryHookId
        );
        return !!userWord;
          
      case 'saveToWordbookByText':
        const userWordByText = await services.userWordService.saveToWordbookByText(
          data.userId,
          data.wordText,
          data.meaningId,
          data.memoryHookId
        );
        return !!userWordByText;
          
      case 'removeFromWordbook':
        return await services.userWordService.removeFromWordbook(
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

// キューからミューテーションを取得して実行する関数（改善版）
export const processMutationQueue = async (): Promise<string[]> => {
  try {
    const queueString = await AsyncStorage.getItem(MUTATION_QUEUE_KEY);
    if (!queueString) return [];
    
    const queue: OfflineMutation[] = JSON.parse(queueString);
    if (queue.length === 0) return [];
    
    console.log(`Processing ${queue.length} queued mutations`);
    
    // 処理に成功したミューテーションのIDリスト
    const processedIds: string[] = [];
    
    // サービスをまとめる
    const services = {
      userService,
      meaningService,
      memoryHookService,
      userWordService
    };
    
    // ミューテーションを順番に実行
    for (const mutation of queue) {
      try {
        const success = await processMutationByType(mutation, services);
        
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