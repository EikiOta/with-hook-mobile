// src/hooks/api/index.ts
// ユーザー関連
export {
  useCurrentUser,
  useUserStats,
  useUpdateProfile,
  useDeleteUser,
  useRecoverUser,
} from './useUserQuery';

// 単語関連
export {
  useSearchWords,
  useWordDetails,
  useFindOrCreateWord,
  useExternalDictionary,
  useWordSearch,
} from './useWordQuery';

// 意味関連
export {
  useMeaningsByWord,
  useMyMeanings,
  useCreateMeaning,
  useUpdateMeaning,
  useDeleteMeaning,
} from './useMeaningQuery';

// 単語テキストから意味を取得する特殊フック
export { useMeaningsByWord as useMeaningsByWordText } from './useMeaningsByWordQuery';

// 記憶Hook関連
export {
  useMemoryHooksByWord,
  useMyMemoryHooks,
  useCreateMemoryHook,
  useUpdateMemoryHook,
  useDeleteMemoryHook,
} from './useMemoryHookQuery';

// 単語テキストから記憶hookを取得する特殊フック
export { useMemoryHooksByWord as useMemoryHooksByWordText } from './useMemoryHooksByWordQuery';

// 単語帳関連
export {
  useMyWordbook,
  useRemoveFromWordbook,
} from './useUserWordQuery';

// 単語テキストでの単語帳確認フック
export { useCheckWordInWordbook } from './useCheckWordInWordbookQuery';

// 単語テキストでの単語帳保存フック
export { useSaveToWordbook } from './useSaveToWordbookQuery';