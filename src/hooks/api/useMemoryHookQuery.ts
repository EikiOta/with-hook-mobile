// src/hooks/api/useMemoryHookQuery.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { memoryHookService, isOffline } from '../../services/supabaseService';
import { useAuthStore } from '../../stores/authStore';
import { addToMutationQueue } from '../useQueryClient';

// キャッシュのキー定義
export const memoryHookKeys = {
  all: ['memoryHooks'] as const,
  byWord: (wordId: number, page: number) => [...memoryHookKeys.all, 'byWord', wordId, page] as const,
  my: (userId: string, page: number) => [...memoryHookKeys.all, 'my', userId, page] as const,
};

// 単語に関連する記憶Hook一覧を取得するフック
export const useMemoryHooksByWord = (wordId: number, page: number = 1, limit: number = 20) => {
  return useQuery({
    queryKey: memoryHookKeys.byWord(wordId, page),
    queryFn: () => memoryHookService.getMemoryHooksByWord(wordId, page, limit),
    enabled: wordId > 0,
    keepPreviousData: true,
  });
};

// 自分が作成した記憶Hook一覧を取得するフック
export const useMyMemoryHooks = (page: number = 1, limit: number = 20) => {
  const { user } = useAuthStore();
  
  return useQuery({
    queryKey: memoryHookKeys.my(user?.user_id || '', page),
    queryFn: () => memoryHookService.getMyMemoryHooks(user?.user_id || '', page, limit),
    enabled: !!user?.user_id,
    keepPreviousData: true,
  });
};

// 記憶Hook作成ミューテーションフック
export const useCreateMemoryHook = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  
  return useMutation({
    mutationFn: async ({
      wordId,
      hookText,
      isPublic
    }: {
      wordId: number;
      hookText: string;
      isPublic: boolean;
    }) => {
      if (!user?.user_id) throw new Error('ログインが必要です');
      
      // オフラインチェック
      if (await isOffline()) {
        await addToMutationQueue({
          type: 'createMemoryHook',
          data: { userId: user.user_id, wordId, hookText, isPublic },
        });
        return null; // オフライン時はnullを返す
      }
      
      return memoryHookService.createMemoryHook(user.user_id, wordId, hookText, isPublic);
    },
    onSuccess: (data, variables) => {
      if (data) {
        // 成功したら関連するキャッシュを無効化
        queryClient.invalidateQueries({
          queryKey: memoryHookKeys.byWord(variables.wordId, 1),
        });
        queryClient.invalidateQueries({
          queryKey: memoryHookKeys.my(user?.user_id || '', 1),
        });
      }
    },
  });
};

// 記憶Hook更新ミューテーションフック
export const useUpdateMemoryHook = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  
  return useMutation({
    mutationFn: async ({
      hookId,
      hookText,
      isPublic,
      wordId,
    }: {
      hookId: number;
      hookText: string;
      isPublic: boolean;
      wordId: number; // キャッシュ更新用
    }) => {
      if (!user?.user_id) throw new Error('ログインが必要です');
      
      // オフラインチェック
      if (await isOffline()) {
        await addToMutationQueue({
          type: 'updateMemoryHook',
          data: { hookId, userId: user.user_id, hookText, isPublic },
        });
        return true; // オプティミスティックに成功を返す
      }
      
      return memoryHookService.updateMemoryHook(hookId, user.user_id, hookText, isPublic);
    },
    onSuccess: (_, variables) => {
      // 成功したら関連するキャッシュを無効化
      queryClient.invalidateQueries({
        queryKey: memoryHookKeys.byWord(variables.wordId, 1),
      });
      queryClient.invalidateQueries({
        queryKey: memoryHookKeys.my(user?.user_id || '', 1),
      });
    },
  });
};

// 記憶Hook削除（論理削除）ミューテーションフック
export const useDeleteMemoryHook = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  
  return useMutation({
    mutationFn: async ({
      hookId,
      wordId,
    }: {
      hookId: number;
      wordId: number; // キャッシュ更新用
    }) => {
      if (!user?.user_id) throw new Error('ログインが必要です');
      
      // オフラインチェック
      if (await isOffline()) {
        await addToMutationQueue({
          type: 'deleteMemoryHook',
          data: { hookId, userId: user.user_id },
        });
        return true; // オプティミスティックに成功を返す
      }
      
      return memoryHookService.deleteMemoryHook(hookId, user.user_id);
    },
    onSuccess: (_, variables) => {
      // 成功したら関連するキャッシュを無効化
      queryClient.invalidateQueries({
        queryKey: memoryHookKeys.byWord(variables.wordId, 1),
      });
      queryClient.invalidateQueries({
        queryKey: memoryHookKeys.my(user?.user_id || '', 1),
      });
    },
  });
};