// src/components/MemoryHookForm.tsx
import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Switch, Text, Button } from 'react-native-paper';

const MemoryHookForm = ({ word, onSubmit, onCancel }) => {
  const [hookText, setHookText] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  
  const handleSubmit = () => {
    if (hookText.trim()) {
      onSubmit(hookText, isPublic);
    }
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>記憶hookを登録</Text>
      <Text style={styles.wordText}>単語: {word}</Text>
      
      <TextInput
        label="記憶hook"
        value={hookText}
        onChangeText={setHookText}
        multiline
        numberOfLines={3}
        style={styles.input}
      />
      
      <View style={styles.switchContainer}>
        <Text>公開する</Text>
        <Switch
          value={isPublic}
          onValueChange={setIsPublic}
        />
      </View>
      
      <View style={styles.buttonContainer}>
        <Button 
          mode="outlined" 
          onPress={onCancel}
          style={styles.button}
        >
          キャンセル
        </Button>
        <Button 
          mode="contained" 
          onPress={handleSubmit}
          disabled={!hookText.trim()}
          style={styles.button}
        >
          保存
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginVertical: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  wordText: {
    fontSize: 16,
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    width: '48%',
  },
});

export default MemoryHookForm;