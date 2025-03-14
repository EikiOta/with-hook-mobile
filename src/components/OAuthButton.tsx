import React from 'react';
import { StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';

interface OAuthButtonProps {
  provider: 'google' | 'github';
  onPress: () => void;
  loading: boolean;
}

const OAuthButton: React.FC<OAuthButtonProps> = ({ provider, onPress, loading }) => {
  const isGoogle = provider === 'google';
  
  return (
    <Button
      mode="contained"
      icon={provider}
      onPress={onPress}
      disabled={loading}
      style={[styles.button, isGoogle ? styles.googleButton : styles.githubButton]}
      labelStyle={styles.buttonLabel}
    >
      {isGoogle ? 'Googleでログイン' : 'GitHubでログイン'}
    </Button>
  );
};

const styles = StyleSheet.create({
  button: {
    width: '100%',
    borderRadius: 5,
    paddingVertical: 8,
  },
  googleButton: {
    backgroundColor: '#4285F4',
  },
  githubButton: {
    backgroundColor: '#24292e',
  },
  buttonLabel: {
    fontSize: 16,
    paddingVertical: 4,
  },
});

export default OAuthButton;