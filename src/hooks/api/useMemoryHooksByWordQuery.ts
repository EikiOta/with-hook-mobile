// src/hooks/api/useMemoryHooksByWordQuery.ts
import { useQuery } from '@tanstack/react-query';
import { memoryHookService } from '../../services/supabaseService';
import { useAuthStore } from '../../stores/authStore';
import { memoryHookKeys } from './keys';

// 単語に関連する記憶Hook一覧を取得するフック
export const useMemoryHooksByWord = (wordText: string, page: number = 1, limit: number = 20) => {
    const { user } = useAuthStore();
    
    return useQuery({
      queryKey: [...memoryHookKeys.all, 'byWordText', wordText, page],
      queryFn: async () => {
        // ユーザーIDが必要
        if (!user?.user_id) {
          return { hooks: [], total: 0 };
        }
        
        try {
          // wordTextで記憶Hookを取得
          return memoryHookService.getMemoryHooksByWordText(wordText, user.user_id, page, limit);
        } catch (error) {
          console.error('記憶Hook取得エラー:', error);
          return { hooks: [], total: 0 };
        }
      },
      enabled: !!wordText && !!user?.user_id,
      keepPreviousData: true,
    });
  };