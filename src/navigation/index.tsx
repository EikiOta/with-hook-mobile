// src/navigation/index.tsx
import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { RootStackParamList, AuthStackParamList, MainStackParamList } from './types';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../stores/authStore';

// 画面のインポート
import LoginScreen from '../screens/LoginScreen';
import RecoverAccountScreen from '../screens/RecoverAccountScreen';
import HomeScreen from '../screens/HomeScreen';
import WordSearchScreen from '../screens/WordSearchScreen';
import WordDetailScreen from '../screens/WordDetailScreen';
import MyWordbookScreen from '../screens/MyWordbookScreen';
import ManagementScreen from '../screens/ManagementScreen';
import SettingsScreen from '../screens/SettingsScreen';
import MeaningEditScreen from '../screens/MeaningEditScreen';
import MemoryHookEditScreen from '../screens/MemoryHookEditScreen';

// スタックの作成
const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainStack = createNativeStackNavigator<MainStackParamList>();
const Tab = createBottomTabNavigator();

// ローディング画面
const LoadingScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <ActivityIndicator size="large" color="#3498db" />
  </View>
);

// タブナビゲーター
const MainTabsScreen = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Search') {
            iconName = focused ? 'search' : 'search-outline';
          } else if (route.name === 'MyWordbook') {
            iconName = focused ? 'book' : 'book-outline';
          } else if (route.name === 'Management') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          }

          // @ts-ignore: Ioniconsのタイプに関するエラーを無視
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        headerShown: false, // 各タブ内でヘッダーを管理するため
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ title: 'ホーム' }}
      />
      <Tab.Screen 
        name="Search" 
        component={WordSearchScreen} 
        options={{ title: '単語検索' }}
      />
      <Tab.Screen 
        name="MyWordbook" 
        component={MyWordbookScreen} 
        options={{ title: 'My単語帳' }}
      />
      <Tab.Screen 
        name="Management" 
        component={ManagementScreen} 
        options={{ title: '管理' }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen} 
        options={{ title: '設定' }}
      />
    </Tab.Navigator>
  );
};

// 認証スタックナビゲーター
const AuthNavigator = () => {
  // isDeletedに応じて初期ルートを設定（重要な修正点）
  const { isDeleted } = useAuthStore();
  
  return (
    <AuthStack.Navigator 
      screenOptions={{ headerShown: false }}
      initialRouteName={isDeleted ? "RecoverAccount" : "Login"}
    >
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
        options={({ route }) => ({ 
          title: route.params?.word || '単語詳細' 
        })}
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
            // 論理削除済みユーザーの場合、直接RecoverAccountScreenに遷移（重要な修正点）
            <RootStack.Screen name="RecoverAccount" component={RecoverAccountScreen} />
          ) : (
            // 認証済みかつ有効なユーザーの場合
            <RootStack.Screen name="Main" component={MainNavigator} />
          )
        ) : (
          // 未認証ユーザーの場合
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;