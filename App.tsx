import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import AppNavigator from './src/navigation';
import { theme } from './src/constants/theme';
import { queryClient, asyncStoragePersister, setupMutationQueueProcessor } from './src/hooks/useQueryClient';
import { supabase } from './src/services/supabase';
import Constants from 'expo-constants';
import { useAuthStore } from './src/stores/authStore';
import OfflineSyncManager from './src/components/OfflineSyncManager';

// React Queryの永続化設定
persistQueryClient({
  queryClient,
  persister: asyncStoragePersister,
  maxAge: 1000 * 60 * 60 * 24 * 7, // 1週間
});

export default function App() {
  const { checkSession } = useAuthStore();
  
  useEffect(() => {
    const testSupabase = async () => {
      console.log('=== Supabase接続テスト開始 ===');
      // 環境変数から直接URLを取得する（Must_Read.mdに従い修正）
      console.log('Supabase URL:', Constants.expoConfig?.extra?.supabaseUrl);
      
      try {
        // 単純な接続テスト
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        console.log('認証サービス接続テスト:', sessionError ? '失敗' : '成功');
        
        try {
          // ユーザーテーブルへの接続テスト
          const { data: usersData, error: usersError } = await supabase.from('users').select('count').limit(1);
          console.log('ユーザーテーブル接続テスト:', usersError ? '失敗' : '成功');
          
          if (sessionError || usersError) {
            console.error('Supabaseエラー:', sessionError || usersError);
          } else {
            console.log('Supabase接続成功！');
          }
        } catch (e) {
          console.error('Supabaseテーブル接続エラー:', e);
        }
      } catch (e) {
        console.error('Supabaseテスト例外:', e);
      }
      console.log('=== Supabase接続テスト終了 ===');
    };
    
    // Supabase接続テスト実行
    testSupabase();
    
    // 認証状態を初期化
    checkSession();
    
    // オフラインミューテーションプロセッサをセットアップ
    const unsubscribeMutationProcessor = setupMutationQueueProcessor();
    
    return () => {
      // クリーンアップ
      unsubscribeMutationProcessor();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <PaperProvider theme={theme}>
        <SafeAreaProvider>
          <OfflineSyncManager>
            <AppNavigator />
          </OfflineSyncManager>
        </SafeAreaProvider>
      </PaperProvider>
    </QueryClientProvider>
  );
}