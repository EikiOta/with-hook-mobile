// src/services/index.ts
// Supabaseクライアント
export { supabase, getSession, getCurrentUser } from './supabase';

// サービス
export {
  userService,
  wordService,
  meaningService,
  memoryHookService,
  userWordService,
  isOffline,
} from './supabaseService';