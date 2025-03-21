// src/hooks/api/useEntityHooks.ts
import { meaningService, memoryHookService } from '../../services/supabaseService';
import { createApiHooks } from './createApiHooks';
import { meaningKeys, memoryHookKeys } from './keys';
import { Meaning, MemoryHook } from '../../types';

// 意味に関する拡張情報
const meaningServiceExt = {
  ...meaningService,
  entityName: 'Meaning',
  idField: 'meaningId',
  textField: 'meaningText',
  getByWord: meaningService.getMeaningsByWord,
  getByWordText: meaningService.getMeaningsByWordText,
  getMy: meaningService.getMyMeanings,
  createByWordText: meaningService.createMeaningByWordText,
  update: meaningService.updateMeaning,
  delete: meaningService.deleteMeaning
};

// 記憶Hookに関する拡張情報
const memoryHookServiceExt = {
  ...memoryHookService,
  entityName: 'MemoryHook',
  idField: 'hookId',
  textField: 'hookText',
  getByWord: memoryHookService.getMemoryHooksByWord,
  getByWordText: memoryHookService.getMemoryHooksByWordText,
  getMy: memoryHookService.getMyMemoryHooks,
  createByWordText: memoryHookService.createMemoryHookByWordText,
  update: memoryHookService.updateMemoryHook,
  delete: memoryHookService.deleteMemoryHook
};

// 意味用のキー調整
const adjustedMeaningKeys = {
  ...meaningKeys,
  byWordText: (wordText: string, page: number) => 
    [...meaningKeys.all, 'byWordText', wordText, page] as const
};

// 記憶Hook用のキー調整
const adjustedMemoryHookKeys = {
  ...memoryHookKeys,
  byWordText: (wordText: string, page: number) => 
    [...memoryHookKeys.all, 'byWordText', wordText, page] as const
};

// 意味用APIフック
export const meaningHooks = createApiHooks<Meaning, typeof meaningServiceExt>(
  meaningServiceExt,
  adjustedMeaningKeys
);

// 記憶Hook用APIフック
export const memoryHookHooks = createApiHooks<MemoryHook, typeof memoryHookServiceExt>(
  memoryHookServiceExt,
  adjustedMemoryHookKeys
);

// より明確なエクスポート
export const {
  useByWord: useMeaningsByWord,
  useByWordText: useMeaningsByWordText,
  useMy: useMyMeanings,
  useCreate: useCreateMeaning,
  useUpdate: useUpdateMeaning,
  useDelete: useDeleteMeaning
} = meaningHooks;

export const {
  useByWord: useMemoryHooksByWord,
  useByWordText: useMemoryHooksByWordText,
  useMy: useMyMemoryHooks,
  useCreate: useCreateMemoryHook,
  useUpdate: useUpdateMemoryHook,
  useDelete: useDeleteMemoryHook
} = memoryHookHooks;