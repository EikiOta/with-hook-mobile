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

// React Queryの永続化設定
persistQueryClient({
  queryClient,
  persister: asyncStoragePersister,
  maxAge: 1000 * 60 * 60 * 24 * 7, // 1週間
});

// グローバルの初期化（一度だけ実行）
const initializeApp = async () => {
  console.log('=== Supabase接続テスト開始 ===');
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
  
  // オフラインミューテーションプロセッサをセットアップ
  setupMutationQueueProcessor();

  // Deep Linkハンドラーを設定
  const handleDeepLink = async (event) => {
    console.log('=== 着信リンク検出 ===');
    console.log('URL:', event.url);

    try {
      // URLパラメータを解析
      const url = new URL(event.url);
      console.log('パス:', url.pathname);
      console.log('クエリパラメータ:', url.search);
      console.log('URLフラグメント:', url.hash);
      
      // クエリパラメータを確認
      const params = new URLSearchParams(url.search);
      console.log('クエリ - access_token存在:', params.has('access_token'));
      console.log('クエリ - refresh_token存在:', params.has('refresh_token'));
      
      // フラグメントを解析（#を除去して処理）
      if (url.hash) {
        const hashParams = new URLSearchParams(url.hash.substring(1));
        console.log('フラグメント - access_token存在:', hashParams.has('access_token'));
        console.log('フラグメント - refresh_token存在:', hashParams.has('refresh_token'));
        
        // アクセストークンがフラグメントにある場合
        if (hashParams.has('access_token') && hashParams.has('refresh_token')) {
          console.log('認証トークンをフラグメントから検出しました');
          
          // 手動でセッションを設定
          const session = {
            access_token: hashParams.get('access_token'),
            refresh_token: hashParams.get('refresh_token'),
            expires_in: parseInt(hashParams.get('expires_in') || '3600'),
            token_type: hashParams.get('token_type') || 'bearer',
            provider_token: hashParams.get('provider_token'),
            provider_refresh_token: hashParams.get('provider_refresh_token')
          };
          
          try {
            console.log('セッションを手動で設定します...');
            
            // セッションを手動で設定
            const { error } = await supabase.auth.setSession({
              access_token: session.access_token,
              refresh_token: session.refresh_token
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
      if (params.has('error')) {
        console.error('認証エラー:', params.get('error'));
        console.error('エラー説明:', params.get('error_description'));
      }
    } catch (error) {
      console.error('URLパース失敗:', error);
    }
    
    console.log('=== リンク解析終了 ===');
  };
  
  // リンクリスナーを登録
  Linking.addEventListener('url', handleDeepLink);

  // 起動時URLをチェック
  const initialUrl = await Linking.getInitialURL();
  if (initialUrl) {
    console.log('起動時URL:', initialUrl);
    handleDeepLink({ url: initialUrl });
  }

  // URLスキームを確認
  const scheme = Constants.expoConfig?.scheme;
  const prefix = Linking.createURL('');
  console.log('アプリスキーム:', scheme);
  console.log('リンクプレフィックス:', prefix);
};

// アプリ初期化を実行（アプリコンポーネントの外で）
initializeApp();

export default function App() {
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