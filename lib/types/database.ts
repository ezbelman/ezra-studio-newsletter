export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export type Role = 'owner' | 'admin' | 'editor' | 'viewer' | 'reader'
export type IssueStatus = 'draft' | 'pending_approval' | 'approved' | 'scheduled' | 'published'
export type SubscriberStatus = 'active' | 'unsubscribed' | 'bounced'
export type Plan = 'trial' | 'starter' | 'growth' | 'enterprise'

type Relationship = {
  foreignKeyName: string
  columns: string[]
  isOneToOne: boolean
  referencedRelation: string
  referencedColumns: string[]
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          avatar_url: string | null
          is_platform_admin: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          avatar_url?: string | null
          is_platform_admin?: boolean
        }
        Update: {
          full_name?: string | null
          avatar_url?: string | null
          is_platform_admin?: boolean
        }
        Relationships: []
      }
      organizations: {
        Row: {
          id: string
          name: string
          slug: string
          logo_url: string | null
          plan: Plan
          primary_color: string
          accent_color: string
          anthropic_api_key: string | null
          openai_api_key: string | null
          gemini_api_key: string | null
          ai_provider: string
          default_language: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          logo_url?: string | null
          plan?: Plan
          primary_color?: string
          accent_color?: string
          anthropic_api_key?: string | null
          openai_api_key?: string | null
          gemini_api_key?: string | null
          ai_provider?: string
          default_language?: string
        }
        Update: {
          name?: string
          slug?: string
          logo_url?: string | null
          plan?: Plan
          primary_color?: string
          accent_color?: string
          anthropic_api_key?: string | null
          openai_api_key?: string | null
          gemini_api_key?: string | null
          ai_provider?: string
          default_language?: string
        }
        Relationships: []
      }
      org_invitations: {
        Row: {
          id: string
          org_id: string
          email: string
          role: string
          token: string
          invited_by: string | null
          accepted_at: string | null
          expires_at: string
          created_at: string
        }
        Insert: {
          id?: string
          org_id: string
          email: string
          role?: string
          invited_by?: string | null
        }
        Update: {
          accepted_at?: string | null
        }
        Relationships: [
          { foreignKeyName: 'org_invitations_org_id_fkey'; columns: ['org_id']; isOneToOne: false; referencedRelation: 'organizations'; referencedColumns: ['id'] }
        ]
      }
      rate_limits: {
        Row: { key: string; count: number; reset_at: string }
        Insert: { key: string; count?: number; reset_at: string }
        Update: { count?: number; reset_at?: string }
        Relationships: []
      }
      org_members: {
        Row: {
          id: string
          org_id: string
          user_id: string
          role: Role
          invited_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          org_id: string
          user_id: string
          role?: Role
          invited_by?: string | null
        }
        Update: {
          role?: Role
        }
        Relationships: [
          { foreignKeyName: 'org_members_org_id_fkey'; columns: ['org_id']; isOneToOne: false; referencedRelation: 'organizations'; referencedColumns: ['id'] },
          { foreignKeyName: 'org_members_user_id_fkey'; columns: ['user_id']; isOneToOne: false; referencedRelation: 'users'; referencedColumns: ['id'] }
        ]
      }
      newsletters: {
        Row: {
          id: string
          org_id: string
          name: string
          description: string | null
          slug: string
          template: string
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          org_id: string
          name: string
          description?: string | null
          slug: string
          template?: string
          status?: string
        }
        Update: {
          name?: string
          description?: string | null
          slug?: string
          template?: string
          status?: string
        }
        Relationships: [
          { foreignKeyName: 'newsletters_org_id_fkey'; columns: ['org_id']; isOneToOne: false; referencedRelation: 'organizations'; referencedColumns: ['id'] }
        ]
      }
      issues: {
        Row: {
          id: string
          newsletter_id: string
          org_id: string
          vol: string
          title: string | null
          status: IssueStatus
          issue_date: string | null
          raw_notes: Json | null
          polished_json: Json | null
          html_web: string | null
          html_email: string | null
          scheduled_at: string | null
          published_at: string | null
          created_by: string | null
          approved_by: string | null
          ab_subject_b: string | null
          ab_winner: string | null
          ab_status: 'none' | 'running' | 'complete'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          newsletter_id: string
          org_id: string
          vol: string
          title?: string | null
          status?: IssueStatus
          issue_date?: string | null
          raw_notes?: Json | null
          polished_json?: Json | null
          html_web?: string | null
          html_email?: string | null
          scheduled_at?: string | null
          published_at?: string | null
          created_by?: string | null
          approved_by?: string | null
          ab_subject_b?: string | null
          ab_winner?: string | null
          ab_status?: 'none' | 'running' | 'complete'
        }
        Update: {
          title?: string | null
          status?: IssueStatus
          issue_date?: string | null
          raw_notes?: Json | null
          polished_json?: Json | null
          html_web?: string | null
          html_email?: string | null
          scheduled_at?: string | null
          published_at?: string | null
          approved_by?: string | null
          ab_subject_b?: string | null
          ab_winner?: string | null
          ab_status?: 'none' | 'running' | 'complete'
        }
        Relationships: [
          { foreignKeyName: 'issues_newsletter_id_fkey'; columns: ['newsletter_id']; isOneToOne: false; referencedRelation: 'newsletters'; referencedColumns: ['id'] },
          { foreignKeyName: 'issues_org_id_fkey'; columns: ['org_id']; isOneToOne: false; referencedRelation: 'organizations'; referencedColumns: ['id'] }
        ]
      }
      subscribers: {
        Row: {
          id: string
          newsletter_id: string
          org_id: string
          email: string
          name: string | null
          status: SubscriberStatus
          subscribed_at: string
          unsubscribed_at: string | null
        }
        Insert: {
          id?: string
          newsletter_id: string
          org_id: string
          email: string
          name?: string | null
          status?: SubscriberStatus
        }
        Update: {
          name?: string | null
          status?: SubscriberStatus
          unsubscribed_at?: string | null
        }
        Relationships: [
          { foreignKeyName: 'subscribers_newsletter_id_fkey'; columns: ['newsletter_id']; isOneToOne: false; referencedRelation: 'newsletters'; referencedColumns: ['id'] }
        ]
      }
      email_sends: {
        Row: {
          id: string
          issue_id: string
          org_id: string
          resend_batch_id: string | null
          sent_at: string
          recipient_count: number
          delivered_count: number
          opened_count: number
          clicked_count: number
          ab_variant: 'a' | 'b' | null
        }
        Insert: {
          id?: string
          issue_id: string
          org_id: string
          resend_batch_id?: string | null
          recipient_count?: number
          delivered_count?: number
          opened_count?: number
          clicked_count?: number
          ab_variant?: 'a' | 'b' | null
        }
        Update: {
          delivered_count?: number
          opened_count?: number
          clicked_count?: number
        }
        Relationships: [
          { foreignKeyName: 'email_sends_issue_id_fkey'; columns: ['issue_id']; isOneToOne: false; referencedRelation: 'issues'; referencedColumns: ['id'] }
        ]
      }
      issue_versions: {
        Row: {
          id: string
          issue_id: string
          org_id: string
          version_number: number
          title: string | null
          raw_notes: Json | null
          polished_json: Json | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          issue_id: string
          org_id: string
          version_number?: number
          title?: string | null
          raw_notes?: Json | null
          polished_json?: Json | null
          created_by?: string | null
        }
        Update: never
        Relationships: [
          { foreignKeyName: 'issue_versions_issue_id_fkey'; columns: ['issue_id']; isOneToOne: false; referencedRelation: 'issues'; referencedColumns: ['id'] }
        ]
      }
      activity_logs: {
        Row: {
          id: string
          org_id: string | null
          user_id: string | null
          action: string
          resource_type: string | null
          resource_id: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          org_id?: string | null
          user_id?: string | null
          action: string
          resource_type?: string | null
          resource_id?: string | null
          metadata?: Json | null
        }
        Update: never
        Relationships: []
      }
      segments: {
        Row: {
          id: string
          org_id: string
          newsletter_id: string | null
          name: string
          description: string | null
          rules: Json
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          newsletter_id?: string | null
          name: string
          description?: string | null
          rules?: Json
          created_by?: string | null
        }
        Update: {
          name?: string
          description?: string | null
          rules?: Json
          newsletter_id?: string | null
        }
        Relationships: [
          { foreignKeyName: 'segments_org_id_fkey'; columns: ['org_id']; isOneToOne: false; referencedRelation: 'organizations'; referencedColumns: ['id'] }
        ]
      }
      templates: {
        Row: {
          id: string
          org_id: string | null
          name: string
          description: string | null
          structure: Json
          is_platform: boolean
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          org_id?: string | null
          name: string
          description?: string | null
          structure?: Json
          is_platform?: boolean
          created_by?: string | null
        }
        Update: {
          name?: string
          description?: string | null
          structure?: Json
        }
        Relationships: [
          { foreignKeyName: 'templates_org_id_fkey'; columns: ['org_id']; isOneToOne: false; referencedRelation: 'organizations'; referencedColumns: ['id'] }
        ]
      }
      automations: {
        Row: {
          id: string
          org_id: string
          newsletter_id: string
          name: string
          status: 'active' | 'paused' | 'archived'
          trigger_type: 'new_subscriber' | 'tag_added' | 'no_open' | 'date'
          trigger_config: Json
          steps: Json
          enrolled_count: number
          completed_count: number
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          newsletter_id: string
          name: string
          status?: 'active' | 'paused' | 'archived'
          trigger_type?: 'new_subscriber' | 'tag_added' | 'no_open' | 'date'
          trigger_config?: Json
          steps?: Json
          created_by?: string | null
        }
        Update: {
          name?: string
          status?: 'active' | 'paused' | 'archived'
          trigger_type?: 'new_subscriber' | 'tag_added' | 'no_open' | 'date'
          trigger_config?: Json
          steps?: Json
          enrolled_count?: number
          completed_count?: number
        }
        Relationships: [
          { foreignKeyName: 'automations_org_id_fkey'; columns: ['org_id']; isOneToOne: false; referencedRelation: 'organizations'; referencedColumns: ['id'] },
          { foreignKeyName: 'automations_newsletter_id_fkey'; columns: ['newsletter_id']; isOneToOne: false; referencedRelation: 'newsletters'; referencedColumns: ['id'] }
        ]
      }
      automation_enrollments: {
        Row: {
          id: string
          automation_id: string
          subscriber_id: string
          current_step: number
          status: 'in_progress' | 'completed' | 'exited'
          next_step_at: string | null
          enrolled_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          automation_id: string
          subscriber_id: string
          current_step?: number
          status?: 'in_progress' | 'completed' | 'exited'
          next_step_at?: string | null
        }
        Update: {
          current_step?: number
          status?: 'in_progress' | 'completed' | 'exited'
          next_step_at?: string | null
          completed_at?: string | null
        }
        Relationships: [
          { foreignKeyName: 'automation_enrollments_automation_id_fkey'; columns: ['automation_id']; isOneToOne: false; referencedRelation: 'automations'; referencedColumns: ['id'] },
          { foreignKeyName: 'automation_enrollments_subscriber_id_fkey'; columns: ['subscriber_id']; isOneToOne: false; referencedRelation: 'subscribers'; referencedColumns: ['id'] }
        ]
      }
      org_usage: {
        Row: {
          org_id:    string
          month:     string
          sends:     number
          ai_polish: number
        }
        Insert: {
          org_id:    string
          month:     string
          sends?:    number
          ai_polish?: number
        }
        Update: {
          sends?:    number
          ai_polish?: number
        }
        Relationships: [
          { foreignKeyName: 'org_usage_org_id_fkey'; columns: ['org_id']; isOneToOne: false; referencedRelation: 'organizations'; referencedColumns: ['id'] }
        ]
      }
    }
    Views: Record<string, never>
    Functions: {
      is_org_member:     { Args: { org_id: string }; Returns: boolean }
      org_role:          { Args: { org_id: string }; Returns: Role }
      is_platform_admin: { Args: Record<string, never>; Returns: boolean }
      check_rate_limit:  {
        Args: { p_key: string; p_max_requests: number; p_window_seconds: number }
        Returns: { allowed: boolean; count: number; retry_after?: number }
      }
      create_organization_for_user: {
        Args: { p_name: string; p_slug: string }
        Returns: string
      }
      increment_org_usage: {
        Args: { p_org_id: string; p_month: string; p_field: string; p_amount?: number }
        Returns: void
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
