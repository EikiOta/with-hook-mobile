import { MMKV } from 'react-native-mmkv';

// MMKV インスタンスの作成
export const storage = new MMKV({
  id: 'with-hook-app',
  encryptionKey: 'with-hook-secure-key',
});

// MMKVストレージのラッパー
export const appStorage = {
  setItem: (key: string, value: any): boolean => {
    try {
      storage.set(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('MMKV setItem error:', error);
      return false;
    }
  },

  getItem: (key: string): any => {
    try {
      const value = storage.getString(key);
      if (value) {
        return JSON.parse(value);
      }
      return null;
    } catch (error) {
      console.error('MMKV getItem error:', error);
      return null;
    }
  },

  removeItem: (key: string): boolean => {
    try {
      storage.delete(key);
      return true;
    } catch (error) {
      console.error('MMKV removeItem error:', error);
      return false;
    }
  },

  clearAll: (): boolean => {
    try {
      storage.clearAll();
      return true;
    } catch (error) {
      console.error('MMKV clearAll error:', error);
      return false;
    }
  }
};