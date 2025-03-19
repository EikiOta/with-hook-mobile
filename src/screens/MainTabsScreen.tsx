// src/screens/MainTabsScreen.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from './HomeScreen';
import WordSearchScreen from './WordSearchScreen';
import MyWordbookScreen from './MyWordbookScreen';
import ManagementScreen from './ManagementScreen';
import SettingsScreen from './SettingsScreen';

const Tab = createBottomTabNavigator();

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

          return <Ionicons name={iconName} size={size} color={color} />;
        },
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

export default MainTabsScreen;