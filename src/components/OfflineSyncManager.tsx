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

interface SyncState {
  syncVisible: boolean;
  offlineVisible: boolean;
  syncMessage: string;
}

const OfflineSyncManager: React.FC<OfflineSyncManagerProps> = ({ children }) => {
  const { isConnected } = useNetworkStatus();
  const [syncState, setSyncState] = useState<SyncState>({
    syncVisible: false,
    offlineVisible: false,
    syncMessage: ''
  });
  
  // オフライン状態の変化を監視
  useEffect(() => {
    setSyncState(prev => ({
      ...prev,
      offlineVisible: !isConnected
    }));
    
    if (isConnected) {
      checkQueuedMutations();
    }
  }, [isConnected]);
  
  // キューされたミューテーションの確認と処理
  const checkQueuedMutations = useCallback(async () => {
    const queueSize = await getMutationQueueSize();
    
    if (queueSize > 0) {
      setSyncState(prev => ({
        ...prev,
        syncVisible: true,
        syncMessage: `${queueSize}件の保存待ち操作を同期しています...`
      }));
      
      // オンラインならミューテーションを処理
      const netInfo = await NetInfo.fetch();
      if (netInfo.isConnected) {
        const processed = await processMutationQueue();
        
        if (processed.length > 0) {
          setSyncState(prev => ({
            ...prev,
            syncMessage: `${processed.length}件の操作を同期しました`
          }));
          
          // 少し待ってから非表示に
          setTimeout(() => {
            setSyncState(prev => ({ ...prev, syncVisible: false }));
          }, 3000);
        } else {
          setSyncState(prev => ({ ...prev, syncVisible: false }));
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
        visible={syncState.offlineVisible}
        onDismiss={() => setSyncState(prev => ({ ...prev, offlineVisible: false }))}
        action={{
          label: '確認',
          onPress: () => setSyncState(prev => ({ ...prev, offlineVisible: false })),
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
        visible={syncState.syncVisible}
        onDismiss={() => setSyncState(prev => ({ ...prev, syncVisible: false }))}
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
          <Text style={styles.snackText}>{syncState.syncMessage}</Text>
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