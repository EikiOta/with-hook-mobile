// app.config.js
require('dotenv').config();


module.exports = {
    name: 'with-hook-mobile',
    slug: 'with-hook-mobile',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    newArchEnabled: true,
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    scheme: 'with-hook', // アプリスキーム（重要）
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.yourdomain.withhookmobile'
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      package: 'com.yourdomain.withhookmobile',
      // ディープリンク設定の追加
      intentFilters: [
        {
          action: "VIEW",
          autoVerify: true,
          data: [
            {
              scheme: "with-hook"
            }
          ],
          category: ["BROWSABLE", "DEFAULT"]
        }
      ]
    },
    web: {
      favicon: './assets/favicon.png',
    },
    plugins: [
      "expo-secure-store"
    ],
    extra: {
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
      eas: {
        projectId: 'your-eas-project-id'
      }
    },
  };