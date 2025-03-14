import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Database } from '../types/supabase';
import NetInfo from '@react-native-community/netinfo';

// 環境変数を読み込む
const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || '';
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || '';

// 開発モードの場合はコンソールに環境変数を表示
if (__DEV__) {
  console.log('Supabase URL:', supabaseUrl);
  console.log('Supabase Anon Key:', supabaseAnonKey ? 'Set' : 'Not Set');
}

// Expoでのセキュアストレージのラッパー
// 認証情報をSecureStoreまたはAsyncStorageに保存するためのカスタムストレージ
const CustomAuthStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      // まずSecureStoreで試す
      const value = await SecureStore.getItemAsync(key);
      if (value !== null) return value;
      
      // SecureStoreで取得できなかった場合はAsyncStorageを使用
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error('Storage getItem error:', error);
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      // SecureStoreとAsyncStorageの両方に保存を試みる
      try {
        await SecureStore.setItemAsync(key, value);
      } catch (secureError) {
        console.warn('SecureStore not available, falling back to AsyncStorage:', secureError);
      }
      
      // バックアップとしてAsyncStorageに保存
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error('Storage setItem error:', error);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      // SecureStoreから削除を試みる
      try {
        await SecureStore.deleteItemAsync(key);
      } catch (secureError) {
        console.warn('SecureStore remove error:', secureError);
      }
      
      // AsyncStorageからも削除
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Storage removeItem error:', error);
    }
  },
};

// Supabaseクライアントの作成
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: CustomAuthStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: {
    headers: {
      'Content-Type': 'application/json',
    },
  },
});

// セッション管理のヘルパー関数
export const getSession = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Error getting session:', error.message);
      return null;
    }
    return data.session;
  } catch (error) {
    console.error('Exception getting session:', error);
    return null;
  }
};

export const getCurrentUser = async () => {
  try {
    const session = await getSession();
    if (!session) {
      return null;
    }
    
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      // 未認証状態では通常のエラーなのでERRORレベルのログ出力は不要
      if (__DEV__) console.log('User not authenticated:', error.message);
      return null;
    }
    return data.user;
  } catch (error) {
    console.error('Exception getting user:', error);
    return null;
  }
};