// src/components/OfflineSyncManager.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Snackbar, IconButton } from 'react-native-paper';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { processMutationQueue, getMutationQueueSize } from '../hooks/useQueryClient';
import NetInfo from '@react-native-community/netinfo';

interface OfflineSyncManagerProps {
  children: React.ReactNode;
}

const OfflineSyncManager: React.FC<OfflineSyncManagerProps> = ({ children }) => {
  const { isConnected, pendingMutations, checkConnection } = useNetworkStatus();
  const [syncSnackVisible, setSyncSnackVisible] = useState(false);
  const [offlineSnackVisible, setOfflineSnackVisible] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  
  // オフライン状態の変化を監視
  useEffect(() => {
    if (!isConnected) {
      setOfflineSnackVisible(true);
    } else {
      setOfflineSnackVisible(false);
      // オンラインになった時にキューを確認
      checkQueuedMutations();
    }
  }, [isConnected]);
  
  // キューされたミューテーションの確認
  const checkQueuedMutations = useCallback(async () => {
    const queueSize = await getMutationQueueSize();
    
    if (queueSize > 0) {
      setSyncMessage(`${queueSize}件の保存待ち操作を同期しています...`);
      setSyncSnackVisible(true);
      
      // オンラインならミューテーションを処理
      const netInfo = await NetInfo.fetch();
      if (netInfo.isConnected) {
        const processed = await processMutationQueue();
        
        if (processed.length > 0) {
          setSyncMessage(`${processed.length}件の操作を同期しました`);
          // 少し待ってから非表示に
          setTimeout(() => setSyncSnackVisible(false), 3000);
        } else {
          setSyncSnackVisible(false);
        }
      }
    }
  }, []);

  // 定期的にキューを確認（5分ごと）
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (isConnected) {
        checkQueuedMutations();
      }
    }, 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [isConnected, checkQueuedMutations]);
  
  // 初回マウント時とオンラインになった時にキューを確認
  useEffect(() => {
    checkQueuedMutations();
    
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected) {
        checkQueuedMutations();
      }
    });
    
    return () => unsubscribe();
  }, [checkQueuedMutations]);
  
  return (
    <View style={styles.container}>
      {children}
      
      {/* オフライン通知 */}
      <Snackbar
        visible={offlineSnackVisible}
        onDismiss={() => setOfflineSnackVisible(false)}
        action={{
          label: '確認',
          onPress: () => setOfflineSnackVisible(false),
        }}
        duration={Infinity}
        style={styles.offlineSnack}
      >
        <View style={styles.snackContent}>
          <IconButton
            icon="wifi-off"
            size={20}
            iconColor="#fff"
            style={styles.snackIcon}
          />
          <Text style={styles.snackText}>オフライン状態です。変更は後で同期されます。</Text>
        </View>
      </Snackbar>
      
      {/* 同期通知 */}
      <Snackbar
        visible={syncSnackVisible}
        onDismiss={() => setSyncSnackVisible(false)}
        duration={5000}
        style={styles.syncSnack}
      >
        <View style={styles.snackContent}>
          <IconButton
            icon="sync"
            size={20}
            iconColor="#fff"
            style={styles.snackIcon}
          />
          <Text style={styles.snackText}>{syncMessage}</Text>
        </View>
      </Snackbar>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  offlineSnack: {
    backgroundColor: '#E53935',
  },
  syncSnack: {
    backgroundColor: '#2196F3',
  },
  snackContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  snackIcon: {
    margin: 0,
    padding: 0,
  },
  snackText: {
    color: '#fff',
    marginLeft: 4,
  },
});

export default OfflineSyncManager;