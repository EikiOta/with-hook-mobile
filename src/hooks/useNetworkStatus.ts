// src/hooks/useNetworkStatus.ts
import { useState, useEffect } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { getMutationQueueSize } from './useQueryClient';

interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string;
  pendingMutations: number;
  lastChecked: Date;
}

export const useNetworkStatus = () => {
  const [status, setStatus] = useState<NetworkStatus>({
    isConnected: true,
    isInternetReachable: null,
    type: 'unknown',
    pendingMutations: 0,
    lastChecked: new Date(),
  });

  useEffect(() => {
    // 初期状態の取得
    const fetchInitialStatus = async () => {
      const netInfo = await NetInfo.fetch();
      const queueSize = await getMutationQueueSize();
      
      setStatus({
        isConnected: netInfo.isConnected ?? true,
        isInternetReachable: netInfo.isInternetReachable,
        type: netInfo.type,
        pendingMutations: queueSize,
        lastChecked: new Date(),
      });
    };
    
    fetchInitialStatus();
    
    // ネットワーク状態変化のリスナー
    const unsubscribe = NetInfo.addEventListener(async (state: NetInfoState) => {
      const queueSize = await getMutationQueueSize();
      
      setStatus({
        isConnected: state.isConnected ?? true,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
        pendingMutations: queueSize,
        lastChecked: new Date(),
      });
    });
    
    // Cleanup
    return () => {
      unsubscribe();
    };
  }, []);
  
  // 手動で再チェックする関数
  const checkConnection = async () => {
    const netInfo = await NetInfo.fetch();
    const queueSize = await getMutationQueueSize();
    
    setStatus({
      isConnected: netInfo.isConnected ?? true,
      isInternetReachable: netInfo.isInternetReachable,
      type: netInfo.type,
      pendingMutations: queueSize,
      lastChecked: new Date(),
    });
    
    return netInfo.isConnected && netInfo.isInternetReachable;
  };
  
  return {
    ...status,
    checkConnection,
  };
};