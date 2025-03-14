import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';

// アプリのプライマリカラーを定義
const primaryColor = '#3498db'; // メインカラー
const secondaryColor = '#2ecc71'; // セカンダリカラー
const errorColor = '#e74c3c'; // エラーカラー

// ライトテーマ設定
export const lightTheme: MD3Theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: primaryColor,
    secondary: secondaryColor,
    error: errorColor,
  },
};

// ダークテーマ設定
export const darkTheme: MD3Theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: primaryColor,
    secondary: secondaryColor,
    error: errorColor,
  },
};

// デフォルトテーマをエクスポート
export const theme = lightTheme;