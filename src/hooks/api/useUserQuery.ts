// src/hooks/api/useUserQuery.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../services/supabase';
import { userService, isOffline } from '../../services/supabaseService';
import { addToMutationQueue } from '../useQueryClient';
import { useAuthStore } from '../../stores/authStore';
import { User } from '../../types';

// ユーザー関連のキャッシュキー
const userKeys = {
  all: ['users'] as const,
  current: () => [...userKeys.all, 'current'] as const,
  stats: (userId: string) => [...userKeys.all, 'stats', userId] as const,
};

// 現在のユーザー情報を取得するフック
export const useCurrentUser = () => {
  const { user } = useAuthStore();
  
  return useQuery({
    queryKey: userKeys.current(),
    queryFn: userService.getCurrentUser,
    enabled: !!user?.user_id,
    staleTime: 1000 * 60 * 5, // 5分間キャッシュを新鮮として扱う
  });
};

// ユーザー統計情報を取得するフック
export const useUserStats = () => {
  const { user } = useAuthStore();
  
  return useQuery({
    queryKey: userKeys.stats(user?.user_id || ''),
    queryFn: () => userService.getUserStats(user?.user_id || ''),
    enabled: !!user?.user_id,
  });
};

// プロフィール更新ミューテーションフック
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const { user, updateUserProfile } = useAuthStore();
  
  return useMutation({
    mutationFn: async (data: Partial<User>) => {
      if (!user?.user_id) throw new Error('ログインが必要です');
      
      // オフラインチェック
      if (await isOffline()) {
        await addToMutationQueue({
          type: 'updateProfile',
          data: { userId: user.user_id, data },
        });
        return true; // オプティミスティックに成功を返す
      }
      
      const success = await updateUserProfile(data);
      if (!success) throw new Error('プロフィール更新に失敗しました');
      return success;
    },
    onSuccess: () => {
      // 成功したら関連するキャッシュを無効化
      queryClient.invalidateQueries({
        queryKey: userKeys.current(),
      });
    },
  });
};

// ユーザー削除ミューテーションフック
export const useDeleteUser = () => {
  const { user } = useAuthStore();
  
  return useMutation({
    mutationFn: async () => {
      if (!user?.user_id) throw new Error('ログインが必要です');
      
      // オフラインチェック
      if (await isOffline()) {
        await addToMutationQueue({
          type: 'deleteUser',
          data: { userId: user.user_id },
        });
        return true; // オプティミスティックに成功を返す
      }
      
      return userService.deleteUser(user.user_id);
    },
  });
};

// ユーザー復旧ミューテーションフック
export const useRecoverUser = () => {
  const queryClient = useQueryClient();
  const { user, recoverAccount } = useAuthStore();
  
  return useMutation({
    mutationFn: async () => {
      if (!user?.user_id) throw new Error('ログインが必要です');
      if (!user?.deleted_at) throw new Error('削除されていないアカウントは復旧できません');
      
      // オンラインでのみ処理を実行（オフラインでは復旧不可）
      if (await isOffline()) {
        throw new Error('オフライン状態ではアカウントを復旧できません');
      }
      
      const success = await recoverAccount();
      if (!success) throw new Error('アカウント復旧に失敗しました');
      return success;
    },
    onSuccess: () => {
      // 成功したら関連するキャッシュを無効化
      queryClient.invalidateQueries({
        queryKey: userKeys.current(),
      });
    },
  });
};