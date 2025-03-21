import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';
import { QueryClientProvider } from '@tanstack/react-query';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import AppNavigator from './src/navigation';
import { theme } from './src/constants/theme';
import { queryClient, asyncStoragePersister, setupMutationQueueProcessor } from './src/hooks/useQueryClient';
import { supabase } from './src/services/supabase';
import Constants from 'expo-constants';
import OfflineSyncManager from './src/components/OfflineSyncManager';
import * as Linking from 'expo-linking';

// Supabase接続テスト関数
const testSupabaseConnection = async () => {
  console.log('=== Supabase接続テスト開始 ===');
  console.log('Supabase URL:', Constants.expoConfig?.extra?.supabaseUrl);
  
  try {
    // 認証サービス接続テスト
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    console.log('認証サービス接続テスト:', sessionError ? '失敗' : '成功');
    
    try {
      // ユーザーテーブル接続テスト
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

// Deep Linkハンドラーのセットアップ
const setupDeepLinkHandlers = async () => {
  // Deep Linkハンドラー
  const handleDeepLink = async (event: { url: string }) => {
    try {
      // URLパラメータを解析
      const url = new URL(event.url);
      
      // フラグメントを解析（#を除去して処理）
      if (url.hash) {
        const hashParams = new URLSearchParams(url.hash.substring(1));
        
        // アクセストークンがフラグメントにある場合
        if (hashParams.has('access_token') && hashParams.has('refresh_token')) {
          console.log('認証トークンをフラグメントから検出しました');
          
          try {
            // セッションを手動で設定
            const { error } = await supabase.auth.setSession({
              access_token: hashParams.get('access_token') || '',
              refresh_token: hashParams.get('refresh_token') || ''
            });
            
            if (error) {
              console.error('セッション設定エラー:', error.message);
            } else {
              console.log('セッションが正常に設定されました');
            }
          } catch (sessionError) {
            console.error('セッション設定中の例外:', sessionError);
          }
        }
      }
      
      // エラーチェック
      const params = new URLSearchParams(url.search);
      if (params.has('error')) {
        console.error('認証エラー:', params.get('error'));
      }
    } catch (error) {
      console.error('URLパース失敗:', error);
    }
  };
  
  // リンクリスナーを登録
  Linking.addEventListener('url', handleDeepLink);

  // 起動時URLをチェック
  const initialUrl = await Linking.getInitialURL();
  if (initialUrl) {
    handleDeepLink({ url: initialUrl });
  }

  // URLスキームの情報を出力
  const scheme = Constants.expoConfig?.scheme;
  const prefix = Linking.createURL('');
  console.log('アプリスキーム:', scheme);
  console.log('リンクプレフィックス:', prefix);
};

export default function App() {
  // アプリ初期化
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Supabase接続テスト
        await testSupabaseConnection();
        
        // React Queryの永続化設定（useEffect内で一度だけ実行）
        await persistQueryClient({
          queryClient,
          persister: asyncStoragePersister,
          maxAge: 1000 * 60 * 60 * 24 * 7, // 1週間
        });
        
        // オフラインミューテーションプロセッサをセットアップ
        setupMutationQueueProcessor();
  
        // Deep Linkハンドラーを設定
        setupDeepLinkHandlers();
      } catch (error) {
        console.error("初期化エラー:", error);
      }
    };

    initializeApp();
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