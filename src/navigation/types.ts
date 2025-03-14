import { NavigatorScreenParams } from '@react-navigation/native';
import { WordDetailParams } from '../types';

// メインタブのルート定義
export type MainTabParamList = {
  Home: undefined;
  Search: undefined;
  MyWordbook: undefined;
  Management: undefined;
  Settings: undefined;
};

// 認証スタックのルート定義
export type AuthStackParamList = {
  Login: undefined;
  RecoverAccount: undefined;
};

// メインスタックのルート定義
export type MainStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList>;
  WordDetail: WordDetailParams;
  MeaningEdit: { meaningId?: number; wordId: number; word: string };
  MemoryHookEdit: { memoryHookId?: number; wordId: number; word: string };
};

// ルートスタックの定義
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainStackParamList>;
  Loading: undefined;
};

// 型補助
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}