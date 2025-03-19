// src/hooks/api/useCheckWordInWordbookQuery.ts
import { useQuery } from '@tanstack/react-query';
import { userWordService } from '../../services/supabaseService';
import { useAuthStore } from '../../stores/authStore';
import { userWordKeys } from './keys';

// 特定の単語が単語帳に登録されているか確認するフック
export const useCheckWordInWordbook = (wordText: string) => {
  const { user } = useAuthStore();
  
  return useQuery({
    queryKey: [...userWordKeys.all, 'wordInWordbookByText', user?.user_id || '', wordText],
    queryFn: async () => {
      if (!user?.user_id || !wordText) {
        return null;
      }
      
      return userWordService.checkWordInWordbookByText(user.user_id, wordText);
    },
    enabled: !!user?.user_id && !!wordText,
  });
};