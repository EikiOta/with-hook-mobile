export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      meanings: {
        Row: {
          created_at: string
          deleted_at: string | null
          is_public: boolean
          meaning: string
          meaning_id: number
          updated_at: string
          user_id: string
          word_id: number
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          is_public?: boolean
          meaning: string
          meaning_id?: number
          updated_at?: string
          user_id: string
          word_id: number
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          is_public?: boolean
          meaning?: string
          meaning_id?: number
          updated_at?: string
          user_id?: string
          word_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "meanings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "meanings_word_id_fkey"
            columns: ["word_id"]
            isOneToOne: false
            referencedRelation: "words"
            referencedColumns: ["word_id"]
          }
        ]
      }
      memory_hooks: {
        Row: {
          created_at: string
          deleted_at: string | null
          is_public: boolean
          memory_hook: string
          memory_hook_id: number
          updated_at: string
          user_id: string
          word_id: number
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          is_public?: boolean
          memory_hook: string
          memory_hook_id?: number
          updated_at?: string
          user_id: string
          word_id: number
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          is_public?: boolean
          memory_hook?: string
          memory_hook_id?: number
          updated_at?: string
          user_id?: string
          word_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "memory_hooks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "memory_hooks_word_id_fkey"
            columns: ["word_id"]
            isOneToOne: false
            referencedRelation: "words"
            referencedColumns: ["word_id"]
          }
        ]
      }
      user_words: {
        Row: {
          created_at: string
          deleted_at: string | null
          meaning_id: number
          memory_hook_id: number | null
          updated_at: string
          user_id: string
          user_words_id: number
          word_id: number
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          meaning_id: number
          memory_hook_id?: number | null
          updated_at?: string
          user_id: string
          user_words_id?: number
          word_id: number
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          meaning_id?: number
          memory_hook_id?: number | null
          updated_at?: string
          user_id?: string
          user_words_id?: number
          word_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_words_meaning_id_fkey"
            columns: ["meaning_id"]
            isOneToOne: false
            referencedRelation: "meanings"
            referencedColumns: ["meaning_id"]
          },
          {
            foreignKeyName: "user_words_memory_hook_id_fkey"
            columns: ["memory_hook_id"]
            isOneToOne: false
            referencedRelation: "memory_hooks"
            referencedColumns: ["memory_hook_id"]
          },
          {
            foreignKeyName: "user_words_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_words_word_id_fkey"
            columns: ["word_id"]
            isOneToOne: false
            referencedRelation: "words"
            referencedColumns: ["word_id"]
          }
        ]
      }
      users: {
        Row: {
          created_at: string
          deleted_at: string | null
          nickname: string
          profile_image: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          nickname: string
          profile_image?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          nickname?: string
          profile_image?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      words: {
        Row: {
          created_at: string
          updated_at: string
          word: string
          word_id: number
        }
        Insert: {
          created_at?: string
          updated_at?: string
          word: string
          word_id?: number
        }
        Update: {
          created_at?: string
          updated_at?: string
          word?: string
          word_id?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_active_users: {
        Args: Record<PropertyKey, never>
        Returns: {
          created_at: string
          deleted_at: string | null
          nickname: string
          profile_image: string | null
          updated_at: string
          user_id: string
        }[]
      }
      search_users: {
        Args: {
          search_term: string
        }
        Returns: {
          created_at: string
          deleted_at: string | null
          nickname: string
          profile_image: string | null
          updated_at: string
          user_id: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}