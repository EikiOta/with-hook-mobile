// 認証ストアをエクスポート
export { useAuthStore } from './authStore';

// 検索状態ストア
import { create } from 'zustand';
import { Word } from '../types';

interface SearchState {
  searchTerm: string;
  results: Word[];
  partOfSpeech: string;
  isLoading: boolean;
  page: number;
  totalPages: number;
  setSearchTerm: (term: string) => void;
  setPartOfSpeech: (pos: string) => void;
  search: () => Promise<void>;
  nextPage: () => void;
  prevPage: () => void;
}

export const useSearchStore = create<SearchState>((set, get) => ({
  searchTerm: '',
  results: [],
  partOfSpeech: '',
  isLoading: false,
  page: 1,
  totalPages: 1,
  
  setSearchTerm: (term) => set({ searchTerm: term }),
  setPartOfSpeech: (pos) => set({ partOfSpeech: pos }),
  
  search: async () => {
    // 検索処理は後で実装
  },
  
  nextPage: () => {
    const { page, totalPages } = get();
    if (page < totalPages) {
      set({ page: page + 1 });
      get().search();
    }
  },
  
  prevPage: () => {
    const { page } = get();
    if (page > 1) {
      set({ page: page - 1 });
      get().search();
    }
  },
}));

// 他にも必要なストアを定義（WordDetail、MyWordBook、Settingsなど）