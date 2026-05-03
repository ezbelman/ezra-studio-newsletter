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
          default_language?: string
        }
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
    }
    Views: Record<string, never>
    Functions: {
      is_org_member:     { Args: { org_id: string }; Returns: boolean }
      org_role:          { Args: { org_id: string }; Returns: Role }
      is_platform_admin: { Args: Record<string, never>; Returns: boolean }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
