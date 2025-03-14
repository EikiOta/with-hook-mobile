import { MMKV } from 'react-native-mmkv';
import AsyncStorage from '@react-native-async-storage/async-storage';

// MMKVインスタンスの作成
export const storage = new MMKV({
  id: 'with-hook-app-storage',
});

// MMKVとAsyncStorageを両方使うヘルパー
export const appStorage = {
  // データを保存
  setItem: async (key: string, value: any) => {
    try {
      // オブジェクトや配列の場合はJSON文字列に変換
      const valueToStore = typeof value === 'object' 
        ? JSON.stringify(value) 
        : String(value);
      
      // MMKVに保存
      storage.set(key, valueToStore);
      
      // バックアップとしてAsyncStorageにも保存
      await AsyncStorage.setItem(key, valueToStore);
      
      return true;
    } catch (error) {
      console.error('Storage setItem error:', error);
      return false;
    }
  },
  
  // データを取得
  getItem: async (key: string) => {
    try {
      // まずMMKVから読み込み
      let value = storage.getString(key);
      
      // MMKVになければAsyncStorageから読み込む
      if (value === undefined) {
        value = await AsyncStorage.getItem(key);
        
        // AsyncStorageから取得できたらMMKVにも保存
        if (value !== null) {
          storage.set(key, value);
        }
      }
      
      // JSON文字列の場合はパース
      if (value && (value.startsWith('{') || value.startsWith('['))) {
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      }
      
      return value;
    } catch (error) {
      console.error('Storage getItem error:', error);
      return null;
    }
  },
  
  // データを削除
  removeItem: async (key: string) => {
    try {
      // MMKVから削除
      storage.delete(key);
      
      // AsyncStorageからも削除
      await AsyncStorage.removeItem(key);
      
      return true;
    } catch (error) {
      console.error('Storage removeItem error:', error);
      return false;
    }
  },
  
  // 全データをクリア
  clear: async () => {
    try {
      // MMKVをクリア
      storage.clearAll();
      
      // AsyncStorageもクリア
      await AsyncStorage.clear();
      
      return true;
    } catch (error) {
      console.error('Storage clear error:', error);
      return false;
    }
  }
};