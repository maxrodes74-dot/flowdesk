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
          subscription_tier: string
          ai_generations_used_this_month: number
          stripe_customer_id: string | null
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
          subscription_tier?: string
          ai_generations_used_this_month?: number
          stripe_customer_id?: string | null
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
          subscription_tier?: string
          ai_generations_used_this_month?: number
          stripe_customer_id?: string | null
        }
        Relationships: []
      }
      referrals: {
        Row: {
          id: string
          referrer_id: string
          referred_email: string
          referral_code: string
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          referrer_id: string
          referred_email: string
          referral_code: string
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          referrer_id?: string
          referred_email?: string
          referral_code?: string
          status?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "freelancers"
            referencedColumns: ["id"]
          },
        ]
      }
      testimonials: {
        Row: {
          id: string
          freelancer_id: string
          client_name: string
          rating: number
          text: string
          permission_to_use: boolean
          token: string
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          freelancer_id: string
          client_name: string
          rating?: number
          text?: string
          permission_to_use?: boolean
          token: string
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          freelancer_id?: string
          client_name?: string
          rating?: number
          text?: string
          permission_to_use?: boolean
          token?: string
          status?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "testimonials_freelancer_id_fkey"
            columns: ["freelancer_id"]
            isOneToOne: false
            referencedRelation: "freelancers"
            referencedColumns: ["id"]
          },
        ]
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
      api_keys: {
        Row: {
          id: string
          freelancer_id: string
          name: string
          key_hash: string
          key_prefix: string
          permissions: Json
          last_used_at: string | null
          request_count: number
          expires_at: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          freelancer_id: string
          name: string
          key_hash: string
          key_prefix: string
          permissions?: Json
          last_used_at?: string | null
          request_count?: number
          expires_at?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          freelancer_id?: string
          name?: string
          key_hash?: string
          key_prefix?: string
          permissions?: Json
          last_used_at?: string | null
          request_count?: number
          expires_at?: string | null
          is_active?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_freelancer_id_fkey"
            columns: ["freelancer_id"]
            isOneToOne: false
            referencedRelation: "freelancers"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          id: string
          freelancer_id: string
          client_id: string | null
          type: string
          template_id: string | null
          parent_id: string | null
          lineage_chain: Json
          title: string
          content: Json
          metadata: Json
          status: string
          version: number
          file_url: string | null
          file_type: string | null
          ai_generated: boolean
          agent_key_id: string | null
          created_at: string
          updated_at: string
          sent_at: string | null
          approved_at: string | null
        }
        Insert: {
          id?: string
          freelancer_id: string
          client_id?: string | null
          type: string
          template_id?: string | null
          parent_id?: string | null
          lineage_chain?: Json
          title: string
          content?: Json
          metadata?: Json
          status?: string
          version?: number
          file_url?: string | null
          file_type?: string | null
          ai_generated?: boolean
          agent_key_id?: string | null
          created_at?: string
          updated_at?: string
          sent_at?: string | null
          approved_at?: string | null
        }
        Update: {
          id?: string
          freelancer_id?: string
          client_id?: string | null
          type?: string
          template_id?: string | null
          parent_id?: string | null
          lineage_chain?: Json
          title?: string
          content?: Json
          metadata?: Json
          status?: string
          version?: number
          file_url?: string | null
          file_type?: string | null
          ai_generated?: boolean
          agent_key_id?: string | null
          created_at?: string
          updated_at?: string
          sent_at?: string | null
          approved_at?: string | null
        }
        Relationships: []
      }
      document_versions: {
        Row: {
          id: string
          document_id: string
          version: number
          content: Json
          metadata: Json
          file_url: string | null
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          document_id: string
          version: number
          content?: Json
          metadata?: Json
          file_url?: string | null
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          document_id?: string
          version?: number
          content?: Json
          metadata?: Json
          file_url?: string | null
          created_by?: string
          created_at?: string
        }
        Relationships: []
      }
      webhooks: {
        Row: {
          id: string
          freelancer_id: string
          url: string
          secret: string
          events: Json
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          freelancer_id: string
          url: string
          secret: string
          events?: Json
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          freelancer_id?: string
          url?: string
          secret?: string
          events?: Json
          is_active?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhooks_freelancer_id_fkey"
            columns: ["freelancer_id"]
            isOneToOne: false
            referencedRelation: "freelancers"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_deliveries: {
        Row: {
          id: string
          webhook_id: string
          event: string
          payload: Json
          status_code: number | null
          response_body: string | null
          attempt: number
          success: boolean
          delivered_at: string
        }
        Insert: {
          id?: string
          webhook_id: string
          event: string
          payload?: Json
          status_code?: number | null
          response_body?: string | null
          attempt?: number
          success?: boolean
          delivered_at?: string
        }
        Update: {
          id?: string
          webhook_id?: string
          event?: string
          payload?: Json
          status_code?: number | null
          response_body?: string | null
          attempt?: number
          success?: boolean
          delivered_at?: string
        }
        Relationships: []
      }
      templates: {
        Row: {
          id: string
          type: string
          name: string
          description: string
          category: string
          sections: Json
          metadata_schema: Json
          default_file_type: string
          styling: Json
          is_system: boolean
          freelancer_id: string | null
          tier_required: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          type: string
          name: string
          description?: string
          category?: string
          sections?: Json
          metadata_schema?: Json
          default_file_type?: string
          styling?: Json
          is_system?: boolean
          freelancer_id?: string | null
          tier_required?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          type?: string
          name?: string
          description?: string
          category?: string
          sections?: Json
          metadata_schema?: Json
          default_file_type?: string
          styling?: Json
          is_system?: boolean
          freelancer_id?: string | null
          tier_required?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      pending_approvals: {
        Row: {
          id: string
          freelancer_id: string
          api_key_id: string
          api_key_name: string
          action_category: string
          action_description: string
          action_payload: Json
          status: string
          created_at: string
          resolved_at: string | null
        }
        Insert: {
          id?: string
          freelancer_id: string
          api_key_id: string
          api_key_name: string
          action_category: string
          action_description?: string
          action_payload?: Json
          status?: string
          created_at?: string
          resolved_at?: string | null
        }
        Update: {
          id?: string
          freelancer_id?: string
          api_key_id?: string
          api_key_name?: string
          action_category?: string
          action_description?: string
          action_payload?: Json
          status?: string
          created_at?: string
          resolved_at?: string | null
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          id: string
          freelancer_id: string
          api_key_id: string
          action_category: string
          action: string
          resource_type: string
          resource_id: string
          result: string
          created_at: string
        }
        Insert: {
          id?: string
          freelancer_id: string
          api_key_id: string
          action_category: string
          action: string
          resource_type: string
          resource_id: string
          result?: string
          created_at?: string
        }
        Update: {
          id?: string
          freelancer_id?: string
          api_key_id?: string
          action_category?: string
          action?: string
          resource_type?: string
          resource_id?: string
          result?: string
          created_at?: string
        }
        Relationships: []
      }
      document_comments: {
        Row: {
          id: string
          document_id: string
          section_key: string | null
          author_type: string
          author_name: string
          body: string
          parent_comment_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          document_id: string
          section_key?: string | null
          author_type: string
          author_name: string
          body: string
          parent_comment_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          document_id?: string
          section_key?: string | null
          author_type?: string
          author_name?: string
          body?: string
          parent_comment_id?: string | null
          created_at?: string
        }
        Relationships: []
      }
      change_requests: {
        Row: {
          id: string
          document_id: string
          client_name: string
          description: string
          sections_affected: Json
          status: string
          change_order_id: string | null
          created_at: string
          resolved_at: string | null
        }
        Insert: {
          id?: string
          document_id: string
          client_name: string
          description?: string
          sections_affected?: Json
          status?: string
          change_order_id?: string | null
          created_at?: string
          resolved_at?: string | null
        }
        Update: {
          id?: string
          document_id?: string
          client_name?: string
          description?: string
          sections_affected?: Json
          status?: string
          change_order_id?: string | null
          created_at?: string
          resolved_at?: string | null
        }
        Relationships: []
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
