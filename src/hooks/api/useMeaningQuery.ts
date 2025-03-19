// src/hooks/api/useMeaningQuery.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { meaningService, isOffline } from '../../services/supabaseService';
import { useAuthStore } from '../../stores/authStore';
import { addToMutationQueue } from '../useQueryClient';

// キャッシュのキー定義
export const meaningKeys = {
  all: ['meanings'] as const,
  byWord: (wordId: number, page: number) => [...meaningKeys.all, 'byWord', wordId, page] as const,
  my: (userId: string, page: number) => [...meaningKeys.all, 'my', userId, page] as const,
};

// 単語に関連する意味一覧を取得するフック
export const useMeaningsByWord = (wordId: number, page: number = 1, limit: number = 20) => {
  return useQuery({
    queryKey: meaningKeys.byWord(wordId, page),
    queryFn: () => meaningService.getMeaningsByWord(wordId, page, limit),
    enabled: wordId > 0,
    keepPreviousData: true,
  });
};

// 自分が作成した意味一覧を取得するフック
export const useMyMeanings = (page: number = 1, limit: number = 20) => {
  const { user } = useAuthStore();
  
  return useQuery({
    queryKey: meaningKeys.my(user?.user_id || '', page),
    queryFn: () => meaningService.getMyMeanings(user?.user_id || '', page, limit),
    enabled: !!user?.user_id,
    keepPreviousData: true,
  });
};

// 意味作成ミューテーションフック
export const useCreateMeaning = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  
  return useMutation({
    mutationFn: async ({
      wordText,
      meaningText,
      isPublic
    }: {
      wordText: string;
      meaningText: string;
      isPublic: boolean;
    }) => {
      if (!user?.user_id) throw new Error('ログインが必要です');
      
      // オフラインチェック
      if (await isOffline()) {
        await addToMutationQueue({
          type: 'createMeaningByWordText',
          data: { userId: user.user_id, wordText, meaningText, isPublic },
        });
        return null; // オフライン時はnullを返す
      }
      
      try {
        // 単語テキストから意味を作成（この中で単語が存在しなければ作成する）
        const meaning = await meaningService.createMeaningByWordText(
          user.user_id, 
          wordText, 
          meaningText, 
          isPublic
        );
        
        if (!meaning) {
          throw new Error('意味の作成に失敗しました');
        }
        
        return meaning;
      } catch (error) {
        console.error('意味作成エラー:', error);
        throw error; // エラーを上位に伝播させる
      }
    },
    onSuccess: (data, variables) => {
      if (data) {
        // 成功したら関連するキャッシュを無効化
        queryClient.invalidateQueries({
          queryKey: [...meaningKeys.all, 'byWordText', variables.wordText, 1],
        });
        queryClient.invalidateQueries({
          queryKey: meaningKeys.my(user?.user_id || '', 1),
        });
      }
    },
  });
};

// 意味更新ミューテーションフック
export const useUpdateMeaning = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  
  return useMutation({
    mutationFn: async ({
      meaningId,
      meaningText,
      isPublic,
      wordId,
    }: {
      meaningId: number;
      meaningText: string;
      isPublic: boolean;
      wordId: number; // キャッシュ更新用
    }) => {
      if (!user?.user_id) throw new Error('ログインが必要です');
      
      // オフラインチェック
      if (await isOffline()) {
        await addToMutationQueue({
          type: 'updateMeaning',
          data: { meaningId, userId: user.user_id, meaningText, isPublic },
        });
        return true; // オプティミスティックに成功を返す
      }
      
      return meaningService.updateMeaning(meaningId, user.user_id, meaningText, isPublic);
    },
    onSuccess: (_, variables) => {
      // 成功したら関連するキャッシュを無効化
      queryClient.invalidateQueries({
        queryKey: meaningKeys.byWord(variables.wordId, 1),
      });
      queryClient.invalidateQueries({
        queryKey: meaningKeys.my(user?.user_id || '', 1),
      });
    },
  });
};

// 意味削除（論理削除）ミューテーションフック
export const useDeleteMeaning = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  
  return useMutation({
    mutationFn: async ({
      meaningId,
      wordId,
    }: {
      meaningId: number;
      wordId: number; // キャッシュ更新用
    }) => {
      if (!user?.user_id) throw new Error('ログインが必要です');
      
      // オフラインチェック
      if (await isOffline()) {
        await addToMutationQueue({
          type: 'deleteMeaning',
          data: { meaningId, userId: user.user_id },
        });
        return true; // オプティミスティックに成功を返す
      }
      
      return meaningService.deleteMeaning(meaningId, user.user_id);
    },
    onSuccess: (_, variables) => {
      // 成功したら関連するキャッシュを無効化
      queryClient.invalidateQueries({
        queryKey: meaningKeys.byWord(variables.wordId, 1),
      });
      queryClient.invalidateQueries({
        queryKey: meaningKeys.my(user?.user_id || '', 1),
      });
    },
  });
};