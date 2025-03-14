import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { RootStackParamList, AuthStackParamList, MainStackParamList } from './types';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import { useAuthStore } from '../stores/authStore';

// 画面のインポート
import LoginScreen from '../screens/LoginScreen';
import RecoverAccountScreen from '../screens/RecoverAccountScreen';

// スタックの作成
const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainStack = createNativeStackNavigator<MainStackParamList>();

// 後で実装する画面コンポーネント用のプレースホルダー
const MainTabsScreen = () => <HomeScreen />;
const WordDetailScreen = () => <View />;
const MeaningEditScreen = () => <View />;
const MemoryHookEditScreen = () => <View />;

const LoadingScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <ActivityIndicator size="large" color="#3498db" />
  </View>
);

// 認証スタックナビゲーター
const AuthNavigator = () => {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="RecoverAccount" component={RecoverAccountScreen} />
    </AuthStack.Navigator>
  );
};

// メインスタックナビゲーター
const MainNavigator = () => {
  return (
    <MainStack.Navigator>
      <MainStack.Screen
        name="MainTabs"
        component={MainTabsScreen}
        options={{ headerShown: false }}
      />
      <MainStack.Screen
        name="WordDetail"
        component={WordDetailScreen}
        options={({ route }) => ({ title: route.params.word })}
      />
      <MainStack.Screen
        name="MeaningEdit"
        component={MeaningEditScreen}
        options={{ title: '意味の編集' }}
      />
      <MainStack.Screen
        name="MemoryHookEdit"
        component={MemoryHookEditScreen}
        options={{ title: '記憶Hookの編集' }}
      />
    </MainStack.Navigator>
  );
};

// ルートナビゲーター
const AppNavigator = () => {
  const { isLoading, isAuthenticated, isDeleted, checkSession } = useAuthStore();

  useEffect(() => {
    // アプリ起動時に認証状態を確認
    checkSession();
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          isDeleted ? (
            // 論理削除済みユーザーの場合
            <RootStack.Screen name="Auth" component={AuthNavigator} initialParams={{ screen: 'RecoverAccount' }} />
          ) : (
            // 認証済みかつ有効なユーザーの場合
            <RootStack.Screen name="Main" component={MainNavigator} />
          )
        ) : (
          // 未認証ユーザーの場合
          <RootStack.Screen name="Auth" component={AuthNavigator} initialParams={{ screen: 'Login' }} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;