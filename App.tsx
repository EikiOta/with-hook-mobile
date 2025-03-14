import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';
import { QueryClientProvider } from '@tanstack/react-query';
import AppNavigator from './src/navigation';
import { theme } from './src/constants/theme';
import { queryClient } from './src/hooks/useQueryClient';
import { supabase } from './src/services/supabase';
import { useEffect } from 'react';
import Constants from 'expo-constants';

export default function App() {
  useEffect(() => {
    const testSupabase = async () => {
      console.log('=== Supabase接続テスト開始 ===');
      // 環境変数から直接URLを取得する
      console.log('Supabase URL:', Constants.expoConfig?.extra?.supabaseUrl);
      
      try {
        // 単純なバージョン情報取得でテスト
        const { data, error } = await supabase.from('pg_catalog.pg_version').select('*').limit(1);
        console.log('Supabase接続テスト:', error ? '失敗' : '成功');
        
        if (error) {
          console.error('Supabaseエラー:', error);
          
          // もっとシンプルな接続テスト
          try {
            const { error: serviceError } = await supabase.auth.getSession();
            console.log('認証サービス接続テスト:', serviceError ? '失敗' : '成功');
            if (serviceError) {
              console.error('認証サービスエラー:', serviceError);
            }
          } catch (authError) {
            console.error('認証サービス例外:', authError);
          }
        } else {
          console.log('Supabase接続成功！');
        }
      } catch (e) {
        console.error('Supabaseテスト例外:', e);
      }
      console.log('=== Supabase接続テスト終了 ===');
    };
    
    testSupabase();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <PaperProvider theme={theme}>
        <SafeAreaProvider>
          <AppNavigator />
        </SafeAreaProvider>
      </PaperProvider>
    </QueryClientProvider>
  );
}