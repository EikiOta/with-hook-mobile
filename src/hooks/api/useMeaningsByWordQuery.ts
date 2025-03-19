// src/hooks/api/useMeaningsByWordQuery.ts
import { useQuery } from '@tanstack/react-query';
import { meaningService } from '../../services/supabaseService';
import { useAuthStore } from '../../stores/authStore';
import { meaningKeys } from './keys';

// 単語に関連する意味一覧を取得するフック
export const useMeaningsByWord = (wordText: string, page: number = 1, limit: number = 20) => {
  const { user } = useAuthStore();
  
  return useQuery({
    queryKey: [...meaningKeys.all, 'byWordText', wordText, page],
    queryFn: async () => {
      // ユーザーIDが必要
      if (!user?.user_id) {
        return { meanings: [], total: 0 };
      }
      
      // wordTextで意味を取得
      return meaningService.getMeaningsByWordText(wordText, user.user_id, page, limit);
    },
    enabled: !!wordText && !!user?.user_id,
    keepPreviousData: true,
  });
};