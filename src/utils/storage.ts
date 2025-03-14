import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { appStorage } from './mmkv';

// ユーザー関連のストレージキー
const USER_KEY = 'WITH_HOOK_USER';
const AUTH_TOKEN_KEY = 'WITH_HOOK_AUTH_TOKEN';
const USER_PREFERENCES_KEY = 'WITH_HOOK_USER_PREFERENCES';

// ユーザー情報の保存と取得
export const saveUserData = async (userData: any) => {
  try {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(userData));
    return true;
  } catch (error) {
    console.error('AsyncStorage save error:', error);
    return false;
  }
};

export const getUserData = async () => {
  try {
    const data = await AsyncStorage.getItem(USER_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('AsyncStorage get error:', error);
    return null;
  }
};

export const removeUserData = async () => {
  try {
    await AsyncStorage.removeItem(USER_KEY);
    return true;
  } catch (error) {
    console.error('AsyncStorage remove error:', error);
    return false;
  }
};

// セキュアストレージへの保存（認証トークンなど）
export const saveSecureValue = async (key: string, value: string) => {
  try {
    await SecureStore.setItemAsync(key, value);
    return true;
  } catch (error) {
    console.error('SecureStore save error:', error);
    return false;
  }
};

export const getSecureValue = async (key: string) => {
  try {
    return await SecureStore.getItemAsync(key);
  } catch (error) {
    console.error('SecureStore get error:', error);
    return null;
  }
};

export const removeSecureValue = async (key: string) => {
  try {
    await SecureStore.deleteItemAsync(key);
    return true;
  } catch (error) {
    console.error('SecureStore remove error:', error);
    return false;
  }
};

// 認証トークンの保存と取得
export const saveAuthToken = async (token: string) => {
  return saveSecureValue(AUTH_TOKEN_KEY, token);
};

export const getAuthToken = async () => {
  return getSecureValue(AUTH_TOKEN_KEY);
};

export const removeAuthToken = async () => {
  return removeSecureValue(AUTH_TOKEN_KEY);
};

// ユーザー設定の保存と取得
export const saveUserPreferences = async (preferences: any) => {
  try {
    await AsyncStorage.setItem(USER_PREFERENCES_KEY, JSON.stringify(preferences));
    return true;
  } catch (error) {
    console.error('AsyncStorage save preferences error:', error);
    return false;
  }
};

export const getUserPreferences = async () => {
  try {
    const data = await AsyncStorage.getItem(USER_PREFERENCES_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('AsyncStorage get preferences error:', error);
    return null;
  }
};