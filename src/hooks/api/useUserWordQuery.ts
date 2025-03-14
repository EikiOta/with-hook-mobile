// src/hooks/api/useUserWordQuery.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userWordService, isOffline } from '../../services/supabaseService';
import { useAuthStore } from '../../stores/authStore';
import { addToMutationQueue } from '../useQueryClient';

// キャッシュのキー定義
export const userWordKeys = {
  all: ['userWords'] as const,
  myWordbook: (userId: string, page: number) => [...userWordKeys.all, 'myWordbook', userId, page] as const,
  wordInWordbook: (userId: string, wordId: number) => [...userWordKeys.all, 'wordInWordbook', userId, wordId] as const,
};

// 自分の単語帳一覧を取得するフック
export const useMyWordbook = (page: number = 1, limit: number = 20) => {
  const { user } = useAuthStore();
  
  return useQuery({
    queryKey: userWordKeys.myWordbook(user?.user_id || '', page),
    queryFn: () => userWordService.getMyWordbook(user?.user_id || '', page, limit),
    enabled: !!user?.user_id,
    keepPreviousData: true,
  });
};

// 特定の単語が単語帳に登録されているか確認するフック
export const useCheckWordInWordbook = (wordId: number) => {
  const { user } = useAuthStore();
  
  return useQuery({
    queryKey: userWordKeys.wordInWordbook(user?.user_id || '', wordId),
    queryFn: () => userWordService.checkWordInWordbook(user?.user_id || '', wordId),
    enabled: !!user?.user_id && wordId > 0,
  });
};

// 単語帳に単語を追加または更新するミューテーションフック
export const useSaveToWordbook = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  
  return useMutation({
    mutationFn: async ({
      wordId,
      meaningId,
      memoryHookId,
    }: {
      wordId: number;
      meaningId: number;
      memoryHookId?: number;
    }) => {
      if (!user?.user_id) throw new Error('ログインが必要です');
      
      // オフラインチェック
      if (await isOffline()) {
        await addToMutationQueue({
          type: 'saveToWordbook',
          data: { userId: user.user_id, wordId, meaningId, memoryHookId },
        });
        return null; // オフライン時はnullを返す
      }
      
      return userWordService.saveToWordbook(user.user_id, wordId, meaningId, memoryHookId);
    },
    onSuccess: (data, variables) => {
      if (data) {
        // 成功したら関連するキャッシュを無効化
        queryClient.invalidateQueries({
          queryKey: userWordKeys.myWordbook(user?.user_id || '', 1),
        });
        queryClient.invalidateQueries({
          queryKey: userWordKeys.wordInWordbook(user?.user_id || '', variables.wordId),
        });
      }
    },
  });
};

// 単語帳から削除（論理削除）するミューテーションフック
export const useRemoveFromWordbook = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  
  return useMutation({
    mutationFn: async ({
      userWordsId,
      wordId,
    }: {
      userWordsId: number;
      wordId: number; // キャッシュ更新用
    }) => {
      if (!user?.user_id) throw new Error('ログインが必要です');
      
      // オフラインチェック
      if (await isOffline()) {
        await addToMutationQueue({
          type: 'removeFromWordbook',
          data: { userId: user.user_id, userWordsId },
        });
        return true; // オプティミスティックに成功を返す
      }
      
      return userWordService.removeFromWordbook(user.user_id, userWordsId);
    },
    onSuccess: (_, variables) => {
      // 成功したら関連するキャッシュを無効化
      queryClient.invalidateQueries({
        queryKey: userWordKeys.myWordbook(user?.user_id || '', 1),
      });
      queryClient.invalidateQueries({
        queryKey: userWordKeys.wordInWordbook(user?.user_id || '', variables.wordId),
      });
    },
  });
};