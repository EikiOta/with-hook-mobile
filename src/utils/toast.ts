// src/utils/toast.ts
import { Alert, Platform } from 'react-native';

type ToastType = 'success' | 'error' | 'info' | 'warning';

/**
 * クロスプラットフォームトースト通知ユーティリティ
 * React Nativeでは、統一されたトースト通知の仕組みがないため、
 * この関数を使うことで、プラットフォーム間での違いを吸収する
 */
export const toast = {
  /**
   * 成功通知
   * @param message 表示するメッセージ
   */
  success: (message: string): void => {
    if (Platform.OS === 'web') {
      // Webではwindow.alertを使用
      window.alert(message);
    } else {
      // iOS/Androidでは、Alertを使用
      Alert.alert('成功', message);
    }
  },

  /**
   * エラー通知
   * @param message 表示するメッセージ
   */
  error: (message: string): void => {
    if (Platform.OS === 'web') {
      window.alert(`エラー: ${message}`);
    } else {
      Alert.alert('エラー', message);
    }
  },

  /**
   * 情報通知
   * @param message 表示するメッセージ
   */
  info: (message: string): void => {
    if (Platform.OS === 'web') {
      window.alert(message);
    } else {
      Alert.alert('お知らせ', message);
    }
  },

  /**
   * 警告通知
   * @param message 表示するメッセージ
   */
  warning: (message: string): void => {
    if (Platform.OS === 'web') {
      window.alert(`警告: ${message}`);
    } else {
      Alert.alert('警告', message);
    }
  },

  /**
   * カスタム通知
   * @param title タイトル
   * @param message メッセージ
   * @param type 通知タイプ
   */
  show: (title: string, message: string, type: ToastType = 'info'): void => {
    if (Platform.OS === 'web') {
      window.alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  }
};