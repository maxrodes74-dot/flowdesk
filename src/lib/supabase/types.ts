export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      automations: {
        Row: {
          config: Json
          created_at: string
          enabled: boolean
          freelancer_id: string
          id: string
          type: string
        }
        Insert: {
          config?: Json
          created_at?: string
          enabled?: boolean
          freelancer_id: string
          id?: string
          type: string
        }
        Update: {
          config?: Json
          created_at?: string
          enabled?: boolean
          freelancer_id?: string
          id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "automations_freelancer_id_fkey"
            columns: ["freelancer_id"]
            isOneToOne: false
            referencedRelation: "freelancers"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          company: string
          created_at: string
          email: string
          freelancer_id: string
          id: string
          name: string
          portal_slug: string
        }
        Insert: {
          company?: string
          created_at?: string
          email: string
          freelancer_id: string
          id?: string
          name: string
          portal_slug: string
        }
        Update: {
          company?: string
          created_at?: string
          email?: string
          freelancer_id?: string
          id?: string
          name?: string
          portal_slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_freelancer_id_fkey"
            columns: ["freelancer_id"]
            isOneToOne: false
            referencedRelation: "freelancers"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          clauses: Json
          created_at: string
          id: string
          proposal_id: string
          signature_ip: string | null
          signature_name: string | null
          signed_at: string | null
        }
        Insert: {
          clauses?: Json
          created_at?: string
          id?: string
          proposal_id: string
          signature_ip?: string | null
          signature_name?: string | null
          signed_at?: string | null
        }
        Update: {
          clauses?: Json
          created_at?: string
          id?: string
          proposal_id?: string
          signature_ip?: string | null
          signature_name?: string | null
          signed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contracts_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      freelancers: {
        Row: {
          brand_color: string
          created_at: string
          email: string
          hourly_rate: number
          id: string
          logo_url: string | null
          name: string
          portfolio_url: string | null
          profession: string
          services: string
          slug: string
          stripe_account_id: string | null
          tone: string
          user_id: string
        }
        Insert: {
          brand_color?: string
          created_at?: string
          email: string
          hourly_rate?: number
          id?: string
          logo_url?: string | null
          name: string
          portfolio_url?: string | null
          profession: string
          services?: string
          slug: string
          stripe_account_id?: string | null
          tone?: string
          user_id: string
        }
        Update: {
          brand_color?: string
          created_at?: string
          email?: string
          hourly_rate?: number
          id?: string
          logo_url?: string | null
          name?: string
          portfolio_url?: string | null
          profession?: string
          services?: string
          slug?: string
          stripe_account_id?: string | null
          tone?: string
          user_id?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          client_id: string
          created_at: string
          due_date: string
          freelancer_id: string
          id: string
          line_items: Json
          paid_at: string | null
          payment_terms: string
          status: string
          stripe_payment_id: string | null
          total: number
        }
        Insert: {
          client_id: string
          created_at?: string
          due_date: string
          freelancer_id: string
          id?: string
          line_items?: Json
          paid_at?: string | null
          payment_terms?: string
          status?: string
          stripe_payment_id?: string | null
          total?: number
        }
        Update: {
          client_id?: string
          created_at?: string
          due_date?: string
          freelancer_id?: string
          id?: string
          line_items?: Json
          paid_at?: string | null
          payment_terms?: string
          status?: string
          stripe_payment_id?: string | null
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_freelancer_id_fkey"
            columns: ["freelancer_id"]
            isOneToOne: false
            referencedRelation: "freelancers"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          client_id: string
          created_at: string
          id: string
          sender: string
        }
        Insert: {
          body: string
          client_id: string
          created_at?: string
          id?: string
          sender: string
        }
        Update: {
          body?: string
          client_id?: string
          created_at?: string
          id?: string
          sender?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      milestones: {
        Row: {
          created_at: string
          description: string
          due_date: string
          id: string
          invoice_id: string | null
          proposal_id: string
          sort_order: number
          status: string
          title: string
        }
        Insert: {
          created_at?: string
          description?: string
          due_date: string
          id?: string
          invoice_id?: string | null
          proposal_id: string
          sort_order?: number
          status?: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string
          due_date?: string
          id?: string
          invoice_id?: string | null
          proposal_id?: string
          sort_order?: number
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "milestones_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "milestones_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      proposals: {
        Row: {
          ai_generated: boolean
          brief: string
          budget: string
          client_id: string
          created_at: string
          freelancer_id: string
          id: string
          scope_json: Json
          status: string
          terms: string
          timeline: string
          title: string
          total_price: number
        }
        Insert: {
          ai_generated?: boolean
          brief?: string
          budget?: string
          client_id: string
          created_at?: string
          freelancer_id: string
          id?: string
          scope_json?: Json
          status?: string
          terms?: string
          timeline?: string
          title: string
          total_price?: number
        }
        Update: {
          ai_generated?: boolean
          brief?: string
          budget?: string
          client_id?: string
          created_at?: string
          freelancer_id?: string
          id?: string
          scope_json?: Json
          status?: string
          terms?: string
          timeline?: string
          title?: string
          total_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "proposals_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_freelancer_id_fkey"
            columns: ["freelancer_id"]
            isOneToOne: false
            referencedRelation: "freelancers"
            referencedColumns: ["id"]
          },
        ]
      }
      time_entries: {
        Row: {
          client_id: string
          created_at: string
          date: string
          description: string
          duration_minutes: number
          freelancer_id: string
          id: string
          milestone_id: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          date?: string
          description?: string
          duration_minutes?: number
          freelancer_id: string
          id?: string
          milestone_id?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          date?: string
          description?: string
          duration_minutes?: number
          freelancer_id?: string
          id?: string
          milestone_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "time_entries_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_freelancer_id_fkey"
            columns: ["freelancer_id"]
            isOneToOne: false
            referencedRelation: "freelancers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "milestones"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
