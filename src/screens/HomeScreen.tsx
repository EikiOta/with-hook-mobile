// src/screens/HomeScreen.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';

const HomeScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>英単語帳アプリへようこそ</Text>
      <Text style={styles.subtitle}>初期設定が完了しました</Text>
      <Button mode="contained" style={styles.button}>
        テストボタン
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 30,
  },
  button: {
    width: '80%',
  },
});

export default HomeScreen;