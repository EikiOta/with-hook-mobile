import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { getCurrentUser } from '../services/supabase';
import { RootStackParamList, AuthStackParamList, MainStackParamList } from './types';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';

// スタックの作成
const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainStack = createNativeStackNavigator<MainStackParamList>();

// 後で実装する画面コンポーネント用のプレースホルダー
const LoginScreen = () => <View />;
const RecoverAccountScreen = () => <View />;
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
  const [isLoading, setIsLoading] = useState(true);
  const [userSession, setUserSession] = useState<any>(null);

  useEffect(() => {
    // 認証状態の確認
    const checkUser = async () => {
      try {
        const user = await getCurrentUser();
        setUserSession(user);
      } catch (error) {
        console.error('Error checking auth state:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {userSession ? (
          <RootStack.Screen name="Main" component={MainNavigator} />
        ) : (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;