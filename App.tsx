import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';
import { QueryClientProvider } from '@tanstack/react-query';
import AppNavigator from './src/navigation';
import { theme } from './src/constants/theme';
import { queryClient } from './src/hooks/useQueryClient';
import { supabase } from './src/services/supabase';
import { useEffect } from 'react';
export default function App() {
  useEffect(() => {
    const testSupabase = async () => {
      console.log('Supabase URL:', supabase.supabaseUrl);
      try {
        // 単純なリクエストでテスト
        const { data, error } = await supabase.from('_schema').select('*').limit(1);
        console.log('Supabase connection test:', error ? 'Failed' : 'Success');
        if (error) console.error('Error:', error);
      } catch (e) {
        console.error('Supabase test error:', e);
      }
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