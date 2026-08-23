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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      app_error_events: {
        Row: {
          created_at: string
          digest: string | null
          error_name: string
          id: string
          message: string
          path: string | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          digest?: string | null
          error_name: string
          id?: string
          message: string
          path?: string | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          digest?: string | null
          error_name?: string
          id?: string
          message?: string
          path?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      assignments: {
        Row: {
          active: boolean
          assigned_at: string | null
          assigned_by: string | null
          assignment_id: string
          note: string | null
          project_id: string
          role: Database["public"]["Enums"]["staff_role"]
          unassigned_at: string | null
          user_id: string
        }
        Insert: {
          active?: boolean
          assigned_at?: string | null
          assigned_by?: string | null
          assignment_id?: string
          note?: string | null
          project_id: string
          role: Database["public"]["Enums"]["staff_role"]
          unassigned_at?: string | null
          user_id: string
        }
        Update: {
          active?: boolean
          assigned_at?: string | null
          assigned_by?: string | null
          assignment_id?: string
          note?: string | null
          project_id?: string
          role?: Database["public"]["Enums"]["staff_role"]
          unassigned_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "staff_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_latest_update"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "assignments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "assignments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "staff_list"
            referencedColumns: ["id"]
          },
        ]
      }
      bundle_items: {
        Row: {
          bundle_id: string
          id: string
          service_id: string
        }
        Insert: {
          bundle_id: string
          id?: string
          service_id: string
        }
        Update: {
          bundle_id?: string
          id?: string
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bundle_items_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "bundles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bundle_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      bundles: {
        Row: {
          bundle_key: string
          bundle_price: number
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          label: string
          note: string | null
          promo_end: string | null
          promo_start: string | null
          promo_type: string
          promo_value: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          bundle_key: string
          bundle_price: number
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          label: string
          note?: string | null
          promo_end?: string | null
          promo_start?: string | null
          promo_type?: string
          promo_value?: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          bundle_key?: string
          bundle_price?: number
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          label?: string
          note?: string | null
          promo_end?: string | null
          promo_start?: string | null
          promo_type?: string
          promo_value?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      contact_inquiries: {
        Row: {
          company: string | null
          created_at: string
          email: string
          id: string
          ip_hash: string | null
          message: string
          name: string
          reason: string
          status: string
          subject: string
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          company?: string | null
          created_at?: string
          email: string
          id?: string
          ip_hash?: string | null
          message: string
          name: string
          reason: string
          status?: string
          subject: string
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string
          id?: string
          ip_hash?: string | null
          message?: string
          name?: string
          reason?: string
          status?: string
          subject?: string
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      data_privacy_requests: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          request_email: string | null
          request_type: string
          resolution_notes: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          request_email?: string | null
          request_type: string
          resolution_notes?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          request_email?: string | null
          request_type?: string
          resolution_notes?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      data_retention_rules: {
        Row: {
          data_category: string
          legal_basis: string
          retention_days: number
          updated_at: string
        }
        Insert: {
          data_category: string
          legal_basis: string
          retention_days: number
          updated_at?: string
        }
        Update: {
          data_category?: string
          legal_basis?: string
          retention_days?: number
          updated_at?: string
        }
        Relationships: []
      }
      discussion_messages: {
        Row: {
          author_id: string
          content: string
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          id: string
          project_id: string
          updated_at: string | null
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          project_id: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          project_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "discussion_messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_latest_update"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "discussion_messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "discussion_messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["project_id"]
          },
        ]
      }
      distributions: {
        Row: {
          distribution_id: string
          project_id: string
          publisher_id: string | null
          release_date: string | null
          status: string | null
        }
        Insert: {
          distribution_id?: string
          project_id: string
          publisher_id?: string | null
          release_date?: string | null
          status?: string | null
        }
        Update: {
          distribution_id?: string
          project_id?: string
          publisher_id?: string | null
          release_date?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "distributions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_latest_update"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "distributions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "distributions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["project_id"]
          },
        ]
      }
      drafts: {
        Row: {
          category: Database["public"]["Enums"]["draft_category"]
          created_at: string | null
          draft_id: string
          file_path: string
          project_id: string
          uploaded_by: string | null
          version: number
        }
        Insert: {
          category?: Database["public"]["Enums"]["draft_category"]
          created_at?: string | null
          draft_id?: string
          file_path: string
          project_id: string
          uploaded_by?: string | null
          version?: number
        }
        Update: {
          category?: Database["public"]["Enums"]["draft_category"]
          created_at?: string | null
          draft_id?: string
          file_path?: string
          project_id?: string
          uploaded_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "drafts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_latest_update"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "drafts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "drafts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["project_id"]
          },
        ]
      }
      feedbacks: {
        Row: {
          comment: string
          created_at: string | null
          draft_id: string
          feedback_id: string
          given_by: string | null
          to_user_id: string | null
        }
        Insert: {
          comment: string
          created_at?: string | null
          draft_id: string
          feedback_id?: string
          given_by?: string | null
          to_user_id?: string | null
        }
        Update: {
          comment?: string
          created_at?: string | null
          draft_id?: string
          feedback_id?: string
          given_by?: string | null
          to_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feedbacks_draft_id_fkey"
            columns: ["draft_id"]
            isOneToOne: false
            referencedRelation: "drafts"
            referencedColumns: ["draft_id"]
          },
        ]
      }
      invoice_delivery_logs: {
        Row: {
          attempt_count: number
          created_at: string
          created_by: string | null
          delivery_type: string
          error_message: string | null
          id: string
          invoice_id: string
          last_attempt_at: string | null
          next_retry_at: string | null
          opened_at: string | null
          provider_message_id: string | null
          recipient_email: string
          sent_at: string | null
          status: string
          template_version: string
          tracking_token: string
          updated_at: string
        }
        Insert: {
          attempt_count?: number
          created_at?: string
          created_by?: string | null
          delivery_type?: string
          error_message?: string | null
          id?: string
          invoice_id: string
          last_attempt_at?: string | null
          next_retry_at?: string | null
          opened_at?: string | null
          provider_message_id?: string | null
          recipient_email: string
          sent_at?: string | null
          status?: string
          template_version: string
          tracking_token?: string
          updated_at?: string
        }
        Update: {
          attempt_count?: number
          created_at?: string
          created_by?: string | null
          delivery_type?: string
          error_message?: string | null
          id?: string
          invoice_id?: string
          last_attempt_at?: string | null
          next_retry_at?: string | null
          opened_at?: string | null
          provider_message_id?: string | null
          recipient_email?: string
          sent_at?: string | null
          status?: string
          template_version?: string
          tracking_token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_delivery_logs_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          created_at: string
          description: string
          id: string
          invoice_id: string
          position: number
          qty: number
          service_id: string | null
          unit_price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          invoice_id: string
          position?: number
          qty?: number
          service_id?: string | null
          unit_price?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          invoice_id?: string
          position?: number
          qty?: number
          service_id?: string | null
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_total: number | null
          client_email: string | null
          client_id: string | null
          client_name: string | null
          created_at: string | null
          currency: string | null
          due_date: string | null
          id: string
          invoice_no: string
          issue_date: string | null
          notes: string | null
          payment_url: string | null
          project_id: string | null
          status: Database["public"]["Enums"]["invoice_status"]
        }
        Insert: {
          amount_total?: number | null
          client_email?: string | null
          client_id?: string | null
          client_name?: string | null
          created_at?: string | null
          currency?: string | null
          due_date?: string | null
          id?: string
          invoice_no?: string
          issue_date?: string | null
          notes?: string | null
          payment_url?: string | null
          project_id?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
        }
        Update: {
          amount_total?: number | null
          client_email?: string | null
          client_id?: string | null
          client_name?: string | null
          created_at?: string | null
          currency?: string | null
          due_date?: string | null
          id?: string
          invoice_no?: string
          issue_date?: string | null
          notes?: string | null
          payment_url?: string | null
          project_id?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_fk"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_client_fk"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_client_fk"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "staff_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_project_fk"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_latest_update"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "invoices_project_fk"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "invoices_project_fk"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["project_id"]
          },
        ]
      }
      meetings: {
        Row: {
          client_id: string
          created_at: string
          created_by: string | null
          duration_min: number
          id: string
          link: string | null
          notes: string | null
          project_id: string
          start_at: string
          title: string
        }
        Insert: {
          client_id: string
          created_at?: string
          created_by?: string | null
          duration_min?: number
          id?: string
          link?: string | null
          notes?: string | null
          project_id: string
          start_at: string
          title: string
        }
        Update: {
          client_id?: string
          created_at?: string
          created_by?: string | null
          duration_min?: number
          id?: string
          link?: string | null
          notes?: string | null
          project_id?: string
          start_at?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "meetings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_latest_update"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "meetings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "meetings_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["project_id"]
          },
        ]
      }
      music_genres: {
        Row: {
          created_at: string | null
          genre: string
          id: number
          sub_genre: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          genre: string
          id?: number
          sub_genre: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          genre?: string
          id?: number
          sub_genre?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      payment_schedules: {
        Row: {
          amount: number
          created_at: string
          currency: string
          due_date: string | null
          external_id: string | null
          id: string
          label: string
          milestone_id: string | null
          payment_link: string | null
          project_id: string
          provider: string | null
          status: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          due_date?: string | null
          external_id?: string | null
          id?: string
          label: string
          milestone_id?: string | null
          payment_link?: string | null
          project_id: string
          provider?: string | null
          status?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          due_date?: string | null
          external_id?: string | null
          id?: string
          label?: string
          milestone_id?: string | null
          payment_link?: string | null
          project_id?: string
          provider?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_schedules_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "project_milestones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_schedules_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_latest_update"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "payment_schedules_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "payment_schedules_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["project_id"]
          },
        ]
      }
      payment_transactions: {
        Row: {
          amount: number
          created_at: string
          currency: string
          external_id: string
          id: string
          paid_at: string | null
          provider: string
          raw: Json | null
          schedule_id: string
          status: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          external_id: string
          id?: string
          paid_at?: string | null
          provider: string
          raw?: Json | null
          schedule_id: string
          status: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          external_id?: string
          id?: string
          paid_at?: string | null
          provider?: string
          raw?: Json | null
          schedule_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "payment_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          payment_date: string | null
          payment_id: string
          project_id: string
          status: string | null
        }
        Insert: {
          amount: number
          payment_date?: string | null
          payment_id?: string
          project_id: string
          status?: string | null
        }
        Update: {
          amount?: number
          payment_date?: string | null
          payment_id?: string
          project_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_latest_update"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "payments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "payments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["project_id"]
          },
        ]
      }
      portfolio: {
        Row: {
          after_url: string | null
          aggregator: string[] | null
          album_title: string | null
          apple_music_link: string | null
          arrangement_solution: string | null
          arranger: string[] | null
          artwork_link: string | null
          before_url: string | null
          bpm: number | null
          challenge: string | null
          client_brief: string | null
          collecting_society: string[] | null
          composer: string[] | null
          copyright_owner: string[] | null
          created_at: string | null
          deliverables: string[]
          distributor: string[] | null
          duration_seconds: number | null
          explicit: boolean | null
          format: string | null
          genre: string | null
          id: number
          is_featured: boolean | null
          isrc_code: string | null
          iswc_code: string | null
          key_signature: string | null
          language: string | null
          last_updated: string | null
          licensing_info: string | null
          lyrics: string | null
          mastering_engineer: string[] | null
          mixing_engineer: string[] | null
          mood: string[] | null
          phonographic_copyright_owner: string[] | null
          platforms: string[] | null
          priority_order: number | null
          producer: string[] | null
          publisher: string[] | null
          registered_at: string | null
          release_country: string[] | null
          release_date_aggregator: string | null
          release_type: string | null
          revision_count: number | null
          rights_holder: string[] | null
          singer: string[] | null
          song_title: string
          songwriter: string[] | null
          spotify_link: string | null
          testimonial_name: string | null
          testimonial_quote: string | null
          theme: string[] | null
          turnaround_days: number | null
          upc_code: string | null
          work_type: string[]
          youtube_link: string | null
        }
        Insert: {
          after_url?: string | null
          aggregator?: string[] | null
          album_title?: string | null
          apple_music_link?: string | null
          arrangement_solution?: string | null
          arranger?: string[] | null
          artwork_link?: string | null
          before_url?: string | null
          bpm?: number | null
          challenge?: string | null
          client_brief?: string | null
          collecting_society?: string[] | null
          composer?: string[] | null
          copyright_owner?: string[] | null
          created_at?: string | null
          deliverables?: string[]
          distributor?: string[] | null
          duration_seconds?: number | null
          explicit?: boolean | null
          format?: string | null
          genre?: string | null
          id?: number
          is_featured?: boolean | null
          isrc_code?: string | null
          iswc_code?: string | null
          key_signature?: string | null
          language?: string | null
          last_updated?: string | null
          licensing_info?: string | null
          lyrics?: string | null
          mastering_engineer?: string[] | null
          mixing_engineer?: string[] | null
          mood?: string[] | null
          phonographic_copyright_owner?: string[] | null
          platforms?: string[] | null
          priority_order?: number | null
          producer?: string[] | null
          publisher?: string[] | null
          registered_at?: string | null
          release_country?: string[] | null
          release_date_aggregator?: string | null
          release_type?: string | null
          revision_count?: number | null
          rights_holder?: string[] | null
          singer?: string[] | null
          song_title: string
          songwriter?: string[] | null
          spotify_link?: string | null
          testimonial_name?: string | null
          testimonial_quote?: string | null
          theme?: string[] | null
          turnaround_days?: number | null
          upc_code?: string | null
          work_type?: string[]
          youtube_link?: string | null
        }
        Update: {
          after_url?: string | null
          aggregator?: string[] | null
          album_title?: string | null
          apple_music_link?: string | null
          arrangement_solution?: string | null
          arranger?: string[] | null
          artwork_link?: string | null
          before_url?: string | null
          bpm?: number | null
          challenge?: string | null
          client_brief?: string | null
          collecting_society?: string[] | null
          composer?: string[] | null
          copyright_owner?: string[] | null
          created_at?: string | null
          deliverables?: string[]
          distributor?: string[] | null
          duration_seconds?: number | null
          explicit?: boolean | null
          format?: string | null
          genre?: string | null
          id?: number
          is_featured?: boolean | null
          isrc_code?: string | null
          iswc_code?: string | null
          key_signature?: string | null
          language?: string | null
          last_updated?: string | null
          licensing_info?: string | null
          lyrics?: string | null
          mastering_engineer?: string[] | null
          mixing_engineer?: string[] | null
          mood?: string[] | null
          phonographic_copyright_owner?: string[] | null
          platforms?: string[] | null
          priority_order?: number | null
          producer?: string[] | null
          publisher?: string[] | null
          registered_at?: string | null
          release_country?: string[] | null
          release_date_aggregator?: string | null
          release_type?: string | null
          revision_count?: number | null
          rights_holder?: string[] | null
          singer?: string[] | null
          song_title?: string
          songwriter?: string[] | null
          spotify_link?: string | null
          testimonial_name?: string | null
          testimonial_quote?: string | null
          theme?: string[] | null
          turnaround_days?: number | null
          upc_code?: string | null
          work_type?: string[]
          youtube_link?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          artist_name: string | null
          avatar_path: string | null
          avatar_url: string | null
          created_at: string | null
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          location: string | null
          main_role: Database["public"]["Enums"]["global_role"] | null
          name: string | null
          phone_number: string | null
          staff_role: Database["public"]["Enums"]["staff_role"][]
          terms_accepted_at: string | null
          terms_version: string | null
          username: string | null
        }
        Insert: {
          artist_name?: string | null
          avatar_path?: string | null
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          location?: string | null
          main_role?: Database["public"]["Enums"]["global_role"] | null
          name?: string | null
          phone_number?: string | null
          staff_role?: Database["public"]["Enums"]["staff_role"][]
          terms_accepted_at?: string | null
          terms_version?: string | null
          username?: string | null
        }
        Update: {
          artist_name?: string | null
          avatar_path?: string | null
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          location?: string | null
          main_role?: Database["public"]["Enums"]["global_role"] | null
          name?: string | null
          phone_number?: string | null
          staff_role?: Database["public"]["Enums"]["staff_role"][]
          terms_accepted_at?: string | null
          terms_version?: string | null
          username?: string | null
        }
        Relationships: []
      }
      project_milestones: {
        Row: {
          created_at: string
          due_date: string | null
          id: string
          order_no: number
          project_id: string
          status: string
          title: string
        }
        Insert: {
          created_at?: string
          due_date?: string | null
          id?: string
          order_no?: number
          project_id: string
          status?: string
          title: string
        }
        Update: {
          created_at?: string
          due_date?: string | null
          id?: string
          order_no?: number
          project_id?: string
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_latest_update"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["project_id"]
          },
        ]
      }
      project_order_items: {
        Row: {
          created_at: string
          currency: string
          id: string
          included_in_bundle: boolean
          label: string
          project_id: string
          service_id: string | null
          service_key: string
          unit_price: number
        }
        Insert: {
          created_at?: string
          currency?: string
          id?: string
          included_in_bundle?: boolean
          label: string
          project_id: string
          service_id?: string | null
          service_key: string
          unit_price: number
        }
        Update: {
          created_at?: string
          currency?: string
          id?: string
          included_in_bundle?: boolean
          label?: string
          project_id?: string
          service_id?: string | null
          service_key?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "project_order_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_latest_update"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_order_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_order_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_order_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      project_services: {
        Row: {
          created_at: string
          id: string
          in_bundle: boolean
          is_subscription: boolean
          price: number
          project_id: string
          service_key: string
          service_label: string
        }
        Insert: {
          created_at?: string
          id?: string
          in_bundle?: boolean
          is_subscription?: boolean
          price?: number
          project_id: string
          service_key: string
          service_label: string
        }
        Update: {
          created_at?: string
          id?: string
          in_bundle?: boolean
          is_subscription?: boolean
          price?: number
          project_id?: string
          service_key?: string
          service_label?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_services_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_latest_update"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_services_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_services_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["project_id"]
          },
        ]
      }
      projects: {
        Row: {
          album_title: string | null
          artist_name: string | null
          artwork_path: string | null
          artwork_url: string | null
          budget_amount: number | null
          budget_currency: string | null
          client_id: string
          copyright_c: string | null
          copyright_p: string | null
          created_at: string | null
          deadline: string | null
          delivery_format: string | null
          description: string | null
          explicit: boolean | null
          genre: string | null
          idempotency_key: string | null
          invoice_id: string | null
          is_active: boolean | null
          is_finished: boolean | null
          isrc: string | null
          label_name: string | null
          language: string | null
          nda_required: boolean
          order_bundle_id: string | null
          payment_plan: Database["public"]["Enums"]["payment_plan_type"] | null
          platform_statuses: Json | null
          preferred_engineer_id: string | null
          primary_genre: string | null
          progress_percent: number | null
          project_id: string
          publishing_last_validated_at: string | null
          publishing_submission_status: string
          publishing_validation_errors: Json
          release_date: string | null
          royalty_splits: Json | null
          stage: Database["public"]["Enums"]["project_stage"] | null
          start_date: string | null
          status: Database["public"]["Enums"]["project_status"] | null
          sub_genre: string | null
          title: string
          upc: string | null
          updated_at: string | null
        }
        Insert: {
          album_title?: string | null
          artist_name?: string | null
          artwork_path?: string | null
          artwork_url?: string | null
          budget_amount?: number | null
          budget_currency?: string | null
          client_id: string
          copyright_c?: string | null
          copyright_p?: string | null
          created_at?: string | null
          deadline?: string | null
          delivery_format?: string | null
          description?: string | null
          explicit?: boolean | null
          genre?: string | null
          idempotency_key?: string | null
          invoice_id?: string | null
          is_active?: boolean | null
          is_finished?: boolean | null
          isrc?: string | null
          label_name?: string | null
          language?: string | null
          nda_required?: boolean
          order_bundle_id?: string | null
          payment_plan?: Database["public"]["Enums"]["payment_plan_type"] | null
          platform_statuses?: Json | null
          preferred_engineer_id?: string | null
          primary_genre?: string | null
          progress_percent?: number | null
          project_id?: string
          publishing_last_validated_at?: string | null
          publishing_submission_status?: string
          publishing_validation_errors?: Json
          release_date?: string | null
          royalty_splits?: Json | null
          stage?: Database["public"]["Enums"]["project_stage"] | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"] | null
          sub_genre?: string | null
          title: string
          upc?: string | null
          updated_at?: string | null
        }
        Update: {
          album_title?: string | null
          artist_name?: string | null
          artwork_path?: string | null
          artwork_url?: string | null
          budget_amount?: number | null
          budget_currency?: string | null
          client_id?: string
          copyright_c?: string | null
          copyright_p?: string | null
          created_at?: string | null
          deadline?: string | null
          delivery_format?: string | null
          description?: string | null
          explicit?: boolean | null
          genre?: string | null
          idempotency_key?: string | null
          invoice_id?: string | null
          is_active?: boolean | null
          is_finished?: boolean | null
          isrc?: string | null
          label_name?: string | null
          language?: string | null
          nda_required?: boolean
          order_bundle_id?: string | null
          payment_plan?: Database["public"]["Enums"]["payment_plan_type"] | null
          platform_statuses?: Json | null
          preferred_engineer_id?: string | null
          primary_genre?: string | null
          progress_percent?: number | null
          project_id?: string
          publishing_last_validated_at?: string | null
          publishing_submission_status?: string
          publishing_validation_errors?: Json
          release_date?: string | null
          royalty_splits?: Json | null
          stage?: Database["public"]["Enums"]["project_stage"] | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"] | null
          sub_genre?: string | null
          title?: string
          upc?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      publishing_analytics: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          listeners: number
          period_end: string
          period_start: string
          platform: string
          project_id: string
          revenue_amount: number
          revenue_currency: string
          source: string
          streams: number
          synced_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          listeners?: number
          period_end: string
          period_start: string
          platform: string
          project_id: string
          revenue_amount?: number
          revenue_currency?: string
          source?: string
          streams?: number
          synced_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          listeners?: number
          period_end?: string
          period_start?: string
          platform?: string
          project_id?: string
          revenue_amount?: number
          revenue_currency?: string
          source?: string
          streams?: number
          synced_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "publishing_analytics_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_latest_update"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "publishing_analytics_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "publishing_analytics_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["project_id"]
          },
        ]
      }
      publishing_delivery_logs: {
        Row: {
          action: string
          attempt_count: number
          created_at: string
          created_by: string | null
          distributor: string | null
          error_message: string | null
          id: string
          project_id: string
          request_payload: Json
          response_payload: Json
          status: string
          updated_at: string
        }
        Insert: {
          action: string
          attempt_count?: number
          created_at?: string
          created_by?: string | null
          distributor?: string | null
          error_message?: string | null
          id?: string
          project_id: string
          request_payload?: Json
          response_payload?: Json
          status?: string
          updated_at?: string
        }
        Update: {
          action?: string
          attempt_count?: number
          created_at?: string
          created_by?: string | null
          distributor?: string | null
          error_message?: string | null
          id?: string
          project_id?: string
          request_payload?: Json
          response_payload?: Json
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "publishing_delivery_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_latest_update"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "publishing_delivery_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "publishing_delivery_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["project_id"]
          },
        ]
      }
      reference_links: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          note: string | null
          project_id: string
          url: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          project_id: string
          url: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          project_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "reference_links_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_latest_update"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "reference_links_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "reference_links_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["project_id"]
          },
        ]
      }
      revisions: {
        Row: {
          created_at: string | null
          draft_id: string
          project_id: string
          reason: string | null
          requested_by: string | null
          revision_id: string
        }
        Insert: {
          created_at?: string | null
          draft_id: string
          project_id: string
          reason?: string | null
          requested_by?: string | null
          revision_id?: string
        }
        Update: {
          created_at?: string | null
          draft_id?: string
          project_id?: string
          reason?: string | null
          requested_by?: string | null
          revision_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "revisions_draft_id_fkey"
            columns: ["draft_id"]
            isOneToOne: false
            referencedRelation: "drafts"
            referencedColumns: ["draft_id"]
          },
          {
            foreignKeyName: "revisions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_latest_update"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "revisions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "revisions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["project_id"]
          },
        ]
      }
      roles: {
        Row: {
          description: string | null
          id: string
          name: string
        }
        Insert: {
          description?: string | null
          id: string
          name: string
        }
        Update: {
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          created_at: string
          description: string | null
          group_name: string
          id: string
          is_active: boolean
          is_subscription: boolean
          label: string
          price: number
          promo_end: string | null
          promo_start: string | null
          promo_type: string
          promo_value: number
          service_key: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          group_name: string
          id?: string
          is_active?: boolean
          is_subscription?: boolean
          label: string
          price: number
          promo_end?: string | null
          promo_start?: string | null
          promo_type?: string
          promo_value?: number
          service_key: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          group_name?: string
          id?: string
          is_active?: boolean
          is_subscription?: boolean
          label?: string
          price?: number
          promo_end?: string | null
          promo_start?: string | null
          promo_type?: string
          promo_value?: number
          service_key?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      assignment_view: {
        Row: {
          active: boolean | null
          assigned_at: string | null
          assigned_by: string | null
          assignment_id: string | null
          note: string | null
          project_id: string | null
          role: Database["public"]["Enums"]["staff_role"] | null
          staff_first_name: string | null
          unassigned_at: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "staff_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_latest_update"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "assignments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "assignments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "staff_list"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          email: string | null
          id: string | null
          is_active: boolean | null
          name: string | null
        }
        Insert: {
          email?: string | null
          id?: string | null
          is_active?: never
          name?: never
        }
        Update: {
          email?: string | null
          id?: string | null
          is_active?: never
          name?: never
        }
        Relationships: []
      }
      discussion_messages_view: {
        Row: {
          author_display_name: string | null
          author_id: string | null
          content: string | null
          created_at: string | null
          deleted_at: string | null
          id: string | null
          project_id: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "discussion_messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_latest_update"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "discussion_messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "discussion_messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["project_id"]
          },
        ]
      }
      genre_summary: {
        Row: {
          genre: string | null
          sub_genre_count: number | null
          sub_genres: string | null
        }
        Relationships: []
      }
      project_activity: {
        Row: {
          action: string | null
          actor: string | null
          at: string | null
          kind: string | null
          project_id: string | null
        }
        Relationships: []
      }
      project_latest_update: {
        Row: {
          latest_update: string | null
          project_id: string | null
        }
        Insert: {
          latest_update?: never
          project_id?: string | null
        }
        Update: {
          latest_update?: never
          project_id?: string | null
        }
        Relationships: []
      }
      project_summary: {
        Row: {
          anr_id: string | null
          artist_name: string | null
          client_avatar_path: string | null
          client_avatar_url: string | null
          client_email: string | null
          client_first_name: string | null
          client_id: string | null
          client_last_name: string | null
          client_location: string | null
          client_name: string | null
          client_phone_number: string | null
          composer_id: string | null
          description: string | null
          engineer_id: string | null
          genre: string | null
          is_active: boolean | null
          is_finished: boolean | null
          producer_id: string | null
          progress_percent: number | null
          project_id: string | null
          publisher_id: string | null
          stage: Database["public"]["Enums"]["project_stage"] | null
          status: Database["public"]["Enums"]["project_status"] | null
          title: string | null
          updated_at: string | null
        }
        Relationships: []
      }
      staff_list: {
        Row: {
          email: string | null
          first_name: string | null
          full_name: string | null
          id: string | null
          is_anr: boolean | null
          is_composer: boolean | null
          is_engineer: boolean | null
          is_producer: boolean | null
          is_publisher: boolean | null
          last_name: string | null
          main_role: Database["public"]["Enums"]["global_role"] | null
          staff_role: Database["public"]["Enums"]["staff_role"][] | null
        }
        Insert: {
          email?: string | null
          first_name?: string | null
          full_name?: never
          id?: string | null
          is_anr?: never
          is_composer?: never
          is_engineer?: never
          is_producer?: never
          is_publisher?: never
          last_name?: string | null
          main_role?: Database["public"]["Enums"]["global_role"] | null
          staff_role?: Database["public"]["Enums"]["staff_role"][] | null
        }
        Update: {
          email?: string | null
          first_name?: string | null
          full_name?: never
          id?: string | null
          is_anr?: never
          is_composer?: never
          is_engineer?: never
          is_producer?: never
          is_publisher?: never
          last_name?: string | null
          main_role?: Database["public"]["Enums"]["global_role"] | null
          staff_role?: Database["public"]["Enums"]["staff_role"][] | null
        }
        Relationships: []
      }
    }
    Functions: {
      _can_continue_project: {
        Args: { p_project_id: string }
        Returns: boolean
      }
      _is_admin_or_owner: { Args: { uid: string }; Returns: boolean }
      accept_project: { Args: { p_project_id: string }; Returns: number }
      can_manage_project: { Args: { p_project_id: string }; Returns: boolean }
      continue_project: { Args: { p_project_id: string }; Returns: undefined }
      gen_unique_username: {
        Args: { base_in: string; id_in: string }
        Returns: string
      }
      invoice_add_custom_item: {
        Args: {
          p_description: string
          p_invoice_id: string
          p_position?: number
          p_qty: number
          p_unit_price: number
        }
        Returns: {
          created_at: string
          description: string
          id: string
          invoice_id: string
          position: number
          qty: number
          service_id: string | null
          unit_price: number
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "invoice_items"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      invoice_add_item_from_service: {
        Args: {
          p_description?: string
          p_invoice_id: string
          p_position?: number
          p_qty?: number
          p_service_id: string
          p_unit_price?: number
        }
        Returns: {
          created_at: string
          description: string
          id: string
          invoice_id: string
          position: number
          qty: number
          service_id: string | null
          unit_price: number
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "invoice_items"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      invoices_next_no: { Args: never; Returns: string }
      is_admin: { Args: { uid?: string }; Returns: boolean }
      is_admin_or_owner:
        | { Args: never; Returns: boolean }
        | { Args: { uid: string }; Returns: boolean }
      is_assigned_to_project: {
        Args: { pid: string; uid: string }
        Returns: boolean
      }
      next_invoice_no: { Args: never; Returns: string }
      progress_from_stage: {
        Args: { p_stage: Database["public"]["Enums"]["project_stage"] }
        Returns: number
      }
      purge_expired_operational_data: { Args: never; Returns: Json }
      put_project_on_hold: { Args: { p_project_id: string }; Returns: number }
      resume_project: { Args: { p_project_id: string }; Returns: number }
      submit_project_request: {
        Args: {
          p_idempotency_key: string
          p_items: Json
          p_project: Json
          p_references: Json
          p_user_id: string
        }
        Returns: string
      }
    }
    Enums: {
      draft_category:
        | "mixing"
        | "mastering"
        | "composition"
        | "arrangement"
        | "production"
      global_role: "owner" | "admin" | "client" | "guest"
      invoice_status: "draft" | "unpaid" | "paid" | "cancelled"
      payment_plan_type: "upfront" | "half" | "milestone"
      project_stage:
        | "drafting"
        | "production"
        | "revision"
        | "mixing"
        | "mastering"
        | "distribution"
        | "recording"
        | "editing"
        | "completed"
        | "request_payment"
        | "awaiting_payment"
        | "assign_team"
        | "draft1_work"
        | "draft1_review"
        | "finalization"
        | "metadata"
        | "agreement"
        | "releasing"
      project_status:
        | "pending"
        | "in_progress"
        | "unpaid"
        | "approved"
        | "published"
        | "archived"
        | "cancelled"
        | "requested"
        | "finished"
        | "on_hold"
        | "hold"
      staff_role:
        | "anr"
        | "engineer"
        | "producer"
        | "composer"
        | "publisher"
        | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      draft_category: [
        "mixing",
        "mastering",
        "composition",
        "arrangement",
        "production",
      ],
      global_role: ["owner", "admin", "client", "guest"],
      invoice_status: ["draft", "unpaid", "paid", "cancelled"],
      payment_plan_type: ["upfront", "half", "milestone"],
      project_stage: [
        "drafting",
        "production",
        "revision",
        "mixing",
        "mastering",
        "distribution",
        "recording",
        "editing",
        "completed",
        "request_payment",
        "awaiting_payment",
        "assign_team",
        "draft1_work",
        "draft1_review",
        "finalization",
        "metadata",
        "agreement",
        "releasing",
      ],
      project_status: [
        "pending",
        "in_progress",
        "unpaid",
        "approved",
        "published",
        "archived",
        "cancelled",
        "requested",
        "finished",
        "on_hold",
        "hold",
      ],
      staff_role: [
        "anr",
        "engineer",
        "producer",
        "composer",
        "publisher",
        "admin",
      ],
    },
  },
} as const
