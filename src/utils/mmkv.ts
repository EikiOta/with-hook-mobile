import AsyncStorage from '@react-native-async-storage/async-storage';

// AsyncStorageのラッパー
export const appStorage = {
  setItem: async (key: string, value: any): Promise<boolean> => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('AsyncStorage setItem error:', error);
      return false;
    }
  },

  getItem: async (key: string): Promise<any> => {
    try {
      const value = await AsyncStorage.getItem(key);
      if (value) {
        return JSON.parse(value);
      }
      return null;
    } catch (error) {
      console.error('AsyncStorage getItem error:', error);
      return null;
    }
  },

  removeItem: async (key: string): Promise<boolean> => {
    try {
      await AsyncStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('AsyncStorage removeItem error:', error);
      return false;
    }
  },

  clearAll: async (): Promise<boolean> => {
    try {
      await AsyncStorage.clear();
      return true;
    } catch (error) {
      console.error('AsyncStorage clearAll error:', error);
      return false;
    }
  }
};