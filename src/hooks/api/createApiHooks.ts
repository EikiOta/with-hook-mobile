// src/hooks/api/createApiHooks.ts
import { useQuery, useMutation, useQueryClient, QueryKey } from '@tanstack/react-query';
import { useAuthStore } from '../../stores/authStore';
import { isOffline } from '../../services/supabaseService';
import { addToMutationQueue } from '../useQueryClient';

// 共通のAPI呼び出しフックファクトリ
// EntityTypeはデータ型、ServiceTypeはサービスの型
export function createApiHooks<EntityType, ServiceType>(
  // サービスオブジェクト
  service: ServiceType,
  // クエリキー生成関数
  keys: {
    all: readonly string[],
    byWord: (wordId: number, page: number) => readonly string[],
    byWordText: (wordText: string, page: number) => readonly string[],
    my: (userId: string, page: number) => readonly string[]
  }
) {
  // 単語IDによるデータ取得フック
  const useByWord = (wordId: number, page: number = 1, limit: number = 20) => {
    return useQuery({
      queryKey: keys.byWord(wordId, page),
      // @ts-ignore - serviceの型が完全に一致しないためignore
      queryFn: () => service.getByWord(wordId, page, limit),
      enabled: wordId > 0,
      keepPreviousData: true,
    });
  };

  // 単語テキストによるデータ取得フック
  const useByWordText = (wordText: string, page: number = 1, limit: number = 20) => {
    const { user } = useAuthStore();
    
    return useQuery({
      queryKey: keys.byWordText(wordText, page),
      queryFn: async () => {
        if (!user?.user_id) {
          return { items: [], total: 0 };
        }
        
        try {
          // @ts-ignore - serviceの型が完全に一致しないためignore
          return await service.getByWordText(wordText, user.user_id, page, limit);
        } catch (error) {
          console.error(`データ取得エラー:`, error);
          return { items: [], total: 0 };
        }
      },
      enabled: !!wordText && !!user?.user_id,
      keepPreviousData: true,
    });
  };

  // 自分のデータ一覧取得フック
  const useMy = (page: number = 1, limit: number = 20) => {
    const { user } = useAuthStore();
    
    return useQuery({
      queryKey: keys.my(user?.user_id || '', page),
      // @ts-ignore - serviceの型が完全に一致しないためignore
      queryFn: () => service.getMy(user?.user_id || '', page, limit),
      enabled: !!user?.user_id,
      keepPreviousData: true,
    });
  };

  // 単語テキストによる作成ミューテーションフック
  const useCreate = () => {
    const queryClient = useQueryClient();
    const { user } = useAuthStore();
    
    return useMutation({
      mutationFn: async (data: {
        wordText: string;
        meaningText?: string;
        hookText?: string;
        text?: string;
        isPublic: boolean;
      }) => {
        if (!user?.user_id) throw new Error('ログインが必要です');
        
        // textフィールドから適切なデータを取得
        const textContent = data.text || data.meaningText || data.hookText || '';
        
        // オフラインチェック
        if (await isOffline()) {
          await addToMutationQueue({
            // @ts-ignore - 型の不一致
            type: `create${service.entityName}ByWordText`,
            data: { 
              userId: user.user_id, 
              wordText: data.wordText,
              // @ts-ignore - サービス固有のフィールド名のためignore
              [service.textField]: textContent,
              isPublic: data.isPublic 
            },
          });
          return null; // オフライン時はnullを返す
        }
        
        try {
          console.log(`テキスト内容: "${textContent}"`); // デバッグログ
          
          // @ts-ignore - serviceの型が完全に一致しないためignore
          const entity = await service.createByWordText(
            user.user_id, 
            data.wordText, 
            textContent,  // ここで正しいテキスト内容を渡す
            data.isPublic
          );
          
          if (!entity) {
            throw new Error('作成に失敗しました');
          }
          
          return entity;
        } catch (error) {
          console.error('作成エラー:', error);
          throw error;
        }
      },
      onSuccess: (data, variables) => {
        if (data) {
          // 成功したら関連するキャッシュを無効化
          queryClient.invalidateQueries({
            queryKey: keys.byWordText(variables.wordText, 1),
          });
          queryClient.invalidateQueries({
            queryKey: keys.my(user?.user_id || '', 1),
          });
        }
      },
    });
  };

  // 更新ミューテーションフック
  const useUpdate = () => {
    const queryClient = useQueryClient();
    const { user } = useAuthStore();
    
    return useMutation({
      mutationFn: async (data: {
        id: number;
        text?: string;
        meaningText?: string;
        hookText?: string;
        isPublic: boolean;
        wordId: number;
      }) => {
        if (!user?.user_id) throw new Error('ログインが必要です');
        
        // textフィールドから適切なデータを取得
        const textContent = data.text || data.meaningText || data.hookText || '';
        
        // オフラインチェック
        if (await isOffline()) {
          await addToMutationQueue({
            // @ts-ignore - 型の不一致
            type: `update${service.entityName}`,
            data: { 
              // @ts-ignore - サービス固有のフィールド名
              [service.idField]: data.id, 
              userId: user.user_id, 
              // @ts-ignore - サービス固有のフィールド名
              [service.textField]: textContent, 
              isPublic: data.isPublic 
            },
          });
          return true; // オプティミスティックに成功を返す
        }
        
        // @ts-ignore - serviceの型が完全に一致しないためignore
        return service.update(data.id, user.user_id, textContent, data.isPublic);
      },
      onSuccess: (_, variables) => {
        // 成功したら関連するキャッシュを無効化
        queryClient.invalidateQueries({
          queryKey: keys.byWord(variables.wordId, 1),
        });
        queryClient.invalidateQueries({
          queryKey: keys.my(user?.user_id || '', 1),
        });
      },
    });
  };

  // 削除（論理削除）ミューテーションフック
  const useDelete = () => {
    const queryClient = useQueryClient();
    const { user } = useAuthStore();
    
    return useMutation({
      mutationFn: async (data: {
        id: number;
        wordId: number;
      }) => {
        if (!user?.user_id) throw new Error('ログインが必要です');
        
        // オフラインチェック
        if (await isOffline()) {
          await addToMutationQueue({
            // @ts-ignore - 型の不一致
            type: `delete${service.entityName}`,
            data: { 
              // @ts-ignore - サービス固有のフィールド名
              [service.idField]: data.id, 
              userId: user.user_id 
            },
          });
          return true; // オプティミスティックに成功を返す
        }
        
        // @ts-ignore - serviceの型が完全に一致しないためignore
        return service.delete(data.id, user.user_id);
      },
      onSuccess: (_, variables) => {
        // 成功したら関連するキャッシュを無効化
        queryClient.invalidateQueries({
          queryKey: keys.byWord(variables.wordId, 1),
        });
        queryClient.invalidateQueries({
          queryKey: keys.my(user?.user_id || '', 1),
        });
      },
    });
  };

  return {
    useByWord,
    useByWordText,
    useMy,
    useCreate,
    useUpdate,
    useDelete
  };
}