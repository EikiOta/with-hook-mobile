// src/hooks/api/keys.ts
export const wordKeys = {
    all: ['words'] as const,
    search: (prefix: string, page: number) => [...wordKeys.all, 'search', prefix, page] as const,
    detail: (wordId: number) => [...wordKeys.all, 'detail', wordId] as const,
  };
  
  export const meaningKeys = {
    all: ['meanings'] as const,
    byWord: (wordId: number, page: number) => [...meaningKeys.all, 'byWord', wordId, page] as const,
    my: (userId: string, page: number) => [...meaningKeys.all, 'my', userId, page] as const,
  };
  
  export const memoryHookKeys = {
    all: ['memoryHooks'] as const,
    byWord: (wordId: number, page: number) => [...memoryHookKeys.all, 'byWord', wordId, page] as const,
    my: (userId: string, page: number) => [...memoryHookKeys.all, 'my', userId, page] as const,
  };
  
  export const userWordKeys = {
    all: ['userWords'] as const,
    myWordbook: (userId: string, page: number) => [...userWordKeys.all, 'myWordbook', userId, page] as const,
    wordInWordbook: (userId: string, wordId: number) => [...userWordKeys.all, 'wordInWordbook', userId, wordId] as const,
  };