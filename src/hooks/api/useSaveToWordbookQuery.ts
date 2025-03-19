// src/hooks/api/useSaveToWordbookQuery.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userWordService, isOffline } from '../../services/supabaseService';
import { useAuthStore } from '../../stores/authStore';
import { addToMutationQueue } from '../useQueryClient';
import { userWordKeys } from './keys';

// 単語テキストで単語帳に追加するフック
export const useSaveToWordbook = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  
  return useMutation({
    mutationFn: async ({
      wordText,
      meaningId,
      memoryHookId
    }: {
      wordText: string;
      meaningId: number;
      memoryHookId?: number;
    }) => {
      if (!user?.user_id) throw new Error('ログインが必要です');
      
      // オフラインチェック
      if (await isOffline()) {
        await addToMutationQueue({
          type: 'saveToWordbookByText',
          data: { userId: user.user_id, wordText, meaningId, memoryHookId },
        });
        return null; // オフライン時はnullを返す
      }
      
      return userWordService.saveToWordbookByText(user.user_id, wordText, meaningId, memoryHookId);
    },
    onSuccess: (_, variables) => {
      // 成功したら関連するキャッシュを無効化
      queryClient.invalidateQueries({
        queryKey: userWordKeys.myWordbook(user?.user_id || '', 1),
      });
      queryClient.invalidateQueries({
        queryKey: [...userWordKeys.all, 'wordInWordbookByText', user?.user_id || '', variables.wordText],
      });
    },
  });
};