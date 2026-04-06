export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      notes: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          content: string;
          metadata: Json;
          embedding: number[] | null;
          is_archived: boolean;
          fts: unknown | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string;
          content?: string;
          metadata?: Json;
          embedding?: number[] | null;
          is_archived?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          content?: string;
          metadata?: Json;
          embedding?: number[] | null;
          is_archived?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      links: {
        Row: {
          id: string;
          source_note_id: string;
          target_note_id: string;
          context: string | null;
          auto_generated: boolean;
          strength: number;
          dismissed: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          source_note_id: string;
          target_note_id: string;
          context?: string | null;
          auto_generated?: boolean;
          strength?: number;
          dismissed?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          source_note_id?: string;
          target_note_id?: string;
          context?: string | null;
          auto_generated?: boolean;
          strength?: number;
          dismissed?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      tags: {
        Row: {
          id: string;
          note_id: string;
          tag: string;
          auto_generated: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          note_id: string;
          tag: string;
          auto_generated?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          note_id?: string;
          tag?: string;
          auto_generated?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      api_keys: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          key_hash: string;
          key_prefix: string;
          last_used_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name?: string;
          key_hash: string;
          key_prefix: string;
          last_used_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          key_hash?: string;
          key_prefix?: string;
          last_used_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          tier: string;
          settings: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          tier?: string;
          settings?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          tier?: string;
          settings?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      automations: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string;
          prompt: string;
          schedule: string;
          is_enabled: boolean;
          is_preset: boolean;
          preset_key: string | null;
          last_run_at: string | null;
          last_run_status: 'success' | 'error' | 'running' | null;
          last_run_result: string | null;
          run_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string;
          prompt: string;
          schedule?: string;
          is_enabled?: boolean;
          is_preset?: boolean;
          preset_key?: string | null;
          last_run_at?: string | null;
          last_run_status?: 'success' | 'error' | 'running' | null;
          last_run_result?: string | null;
          run_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string;
          prompt?: string;
          schedule?: string;
          is_enabled?: boolean;
          is_preset?: boolean;
          preset_key?: string | null;
          last_run_at?: string | null;
          last_run_status?: 'success' | 'error' | 'running' | null;
          last_run_result?: string | null;
          run_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      automation_runs: {
        Row: {
          id: string;
          automation_id: string;
          user_id: string;
          status: 'running' | 'success' | 'error';
          result: string | null;
          notes_created: number;
          notes_updated: number;
          links_created: number;
          links_removed: number;
          tokens_used: number;
          duration_ms: number | null;
          error_message: string | null;
          started_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          automation_id: string;
          user_id: string;
          status: 'running' | 'success' | 'error';
          result?: string | null;
          notes_created?: number;
          notes_updated?: number;
          links_created?: number;
          links_removed?: number;
          tokens_used?: number;
          duration_ms?: number | null;
          error_message?: string | null;
          started_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          automation_id?: string;
          user_id?: string;
          status?: 'running' | 'success' | 'error';
          result?: string | null;
          notes_created?: number;
          notes_updated?: number;
          links_created?: number;
          links_removed?: number;
          tokens_used?: number;
          duration_ms?: number | null;
          error_message?: string | null;
          started_at?: string;
          completed_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
