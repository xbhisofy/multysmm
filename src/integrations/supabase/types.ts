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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          amount_inr: number | null
          amount_usd: number | null
          created_at: string
          id: string
          ip_address: string | null
          metadata: Json | null
          notes: string | null
          target_email: string | null
          target_user_id: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          amount_inr?: number | null
          amount_usd?: number | null
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          notes?: string | null
          target_email?: string | null
          target_user_id?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          amount_inr?: number | null
          amount_usd?: number | null
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          notes?: string | null
          target_email?: string | null
          target_user_id?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      bundle_items: {
        Row: {
          bundle_id: string
          created_at: string | null
          default_drip_interval: number | null
          default_drip_interval_unit: string | null
          default_drip_qty_per_run: number | null
          engagement_type: string
          id: string
          is_base: boolean | null
          price_per_k: number | null
          ratio_percent: number | null
          service_id: string | null
          sort_order: number | null
        }
        Insert: {
          bundle_id: string
          created_at?: string | null
          default_drip_interval?: number | null
          default_drip_interval_unit?: string | null
          default_drip_qty_per_run?: number | null
          engagement_type: string
          id?: string
          is_base?: boolean | null
          price_per_k?: number | null
          ratio_percent?: number | null
          service_id?: string | null
          sort_order?: number | null
        }
        Update: {
          bundle_id?: string
          created_at?: string | null
          default_drip_interval?: number | null
          default_drip_interval_unit?: string | null
          default_drip_qty_per_run?: number | null
          engagement_type?: string
          id?: string
          is_base?: boolean | null
          price_per_k?: number | null
          ratio_percent?: number | null
          service_id?: string | null
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bundle_items_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "engagement_bundles"
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
      chat_conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string | null
          status: string
          updated_at: string
          user_email: string
          user_id: string
          user_name: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          status?: string
          updated_at?: string
          user_email: string
          user_id: string
          user_name?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          status?: string
          updated_at?: string
          user_email?: string
          user_id?: string
          user_name?: string | null
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          sender_id: string
          sender_role: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          sender_id: string
          sender_role: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          sender_id?: string
          sender_role?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      deposits: {
        Row: {
          admin_notes: string | null
          amount: number
          created_at: string | null
          currency: string | null
          id: string
          payment_method: string | null
          proof_url: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          created_at?: string | null
          currency?: string | null
          id?: string
          payment_method?: string | null
          proof_url?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          created_at?: string | null
          currency?: string | null
          id?: string
          payment_method?: string | null
          proof_url?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      engagement_bundles: {
        Row: {
          ai_organic_enabled: boolean | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          platform: string
          provider_id: string | null
          sort_order: number | null
          updated_at: string | null
          use_custom_ratios: boolean | null
        }
        Insert: {
          ai_organic_enabled?: boolean | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          platform: string
          provider_id?: string | null
          sort_order?: number | null
          updated_at?: string | null
          use_custom_ratios?: boolean | null
        }
        Update: {
          ai_organic_enabled?: boolean | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          platform?: string
          provider_id?: string | null
          sort_order?: number | null
          updated_at?: string | null
          use_custom_ratios?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "engagement_bundles_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "engagement_bundles_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      engagement_order_items: {
        Row: {
          created_at: string | null
          drip_interval: number | null
          drip_interval_unit: string | null
          drip_qty_per_run: number | null
          engagement_order_id: string
          engagement_type: string
          error_message: string | null
          id: string
          is_enabled: boolean | null
          price: number
          provider_order_id: string | null
          quantity: number
          service_id: string | null
          speed_preset: string | null
          start_count: number | null
          start_count_captured_at: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          drip_interval?: number | null
          drip_interval_unit?: string | null
          drip_qty_per_run?: number | null
          engagement_order_id: string
          engagement_type: string
          error_message?: string | null
          id?: string
          is_enabled?: boolean | null
          price: number
          provider_order_id?: string | null
          quantity: number
          service_id?: string | null
          speed_preset?: string | null
          start_count?: number | null
          start_count_captured_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          drip_interval?: number | null
          drip_interval_unit?: string | null
          drip_qty_per_run?: number | null
          engagement_order_id?: string
          engagement_type?: string
          error_message?: string | null
          id?: string
          is_enabled?: boolean | null
          price?: number
          provider_order_id?: string | null
          quantity?: number
          service_id?: string | null
          speed_preset?: string | null
          start_count?: number | null
          start_count_captured_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "engagement_order_items_engagement_order_id_fkey"
            columns: ["engagement_order_id"]
            isOneToOne: false
            referencedRelation: "engagement_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "engagement_order_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      engagement_orders: {
        Row: {
          base_quantity: number
          bundle_id: string | null
          completed_at: string | null
          config_snapshot: Json | null
          created_at: string | null
          error_message: string | null
          id: string
          is_organic_mode: boolean | null
          link: string
          order_number: number
          peak_hours_enabled: boolean | null
          status: string | null
          total_price: number
          updated_at: string | null
          user_id: string
          variance_percent: number | null
        }
        Insert: {
          base_quantity: number
          bundle_id?: string | null
          completed_at?: string | null
          config_snapshot?: Json | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          is_organic_mode?: boolean | null
          link: string
          order_number?: number
          peak_hours_enabled?: boolean | null
          status?: string | null
          total_price: number
          updated_at?: string | null
          user_id: string
          variance_percent?: number | null
        }
        Update: {
          base_quantity?: number
          bundle_id?: string | null
          completed_at?: string | null
          config_snapshot?: Json | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          is_organic_mode?: boolean | null
          link?: string
          order_number?: number
          peak_hours_enabled?: boolean | null
          status?: string | null
          total_price?: number
          updated_at?: string | null
          user_id?: string
          variance_percent?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "engagement_orders_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "engagement_bundles"
            referencedColumns: ["id"]
          },
        ]
      }
      order_health_alerts: {
        Row: {
          created_at: string
          first_alerted_at: string
          id: string
          issue_code: string
          last_alerted_at: string
          last_details: Json | null
          next_reminder_at: string | null
          notification_count: number
          order_kind: string
          order_ref: string
          priority: string
          reminder_step: number
          resolved: boolean
          resolved_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          first_alerted_at?: string
          id?: string
          issue_code: string
          last_alerted_at?: string
          last_details?: Json | null
          next_reminder_at?: string | null
          notification_count?: number
          order_kind: string
          order_ref: string
          priority?: string
          reminder_step?: number
          resolved?: boolean
          resolved_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          first_alerted_at?: string
          id?: string
          issue_code?: string
          last_alerted_at?: string
          last_details?: Json | null
          next_reminder_at?: string | null
          notification_count?: number
          order_kind?: string
          order_ref?: string
          priority?: string
          reminder_step?: number
          resolved?: boolean
          resolved_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      order_templates: {
        Row: {
          category: string | null
          color_label: string | null
          config: Json
          created_at: string
          description: string | null
          id: string
          is_archived: boolean
          is_favorite: boolean
          last_used_at: string | null
          name: string
          platform: string | null
          service_id: string | null
          service_snapshot: Json
          updated_at: string
          usage_count: number
          user_id: string
        }
        Insert: {
          category?: string | null
          color_label?: string | null
          config?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_archived?: boolean
          is_favorite?: boolean
          last_used_at?: string | null
          name: string
          platform?: string | null
          service_id?: string | null
          service_snapshot?: Json
          updated_at?: string
          usage_count?: number
          user_id: string
        }
        Update: {
          category?: string | null
          color_label?: string | null
          config?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_archived?: boolean
          is_favorite?: boolean
          last_used_at?: string | null
          name?: string
          platform?: string | null
          service_id?: string | null
          service_snapshot?: Json
          updated_at?: string
          usage_count?: number
          user_id?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          created_at: string | null
          drip_interval: number | null
          drip_interval_unit: string | null
          drip_quantity_per_run: number | null
          drip_runs: number | null
          error_message: string | null
          id: string
          is_drip_feed: boolean | null
          is_organic_mode: boolean | null
          link: string
          order_number: number
          peak_hours_enabled: boolean | null
          price: number
          provider_order_id: string | null
          quantity: number
          remains: number | null
          service_id: string | null
          start_count: number | null
          status: string | null
          updated_at: string | null
          user_id: string
          variance_percent: number | null
        }
        Insert: {
          created_at?: string | null
          drip_interval?: number | null
          drip_interval_unit?: string | null
          drip_quantity_per_run?: number | null
          drip_runs?: number | null
          error_message?: string | null
          id?: string
          is_drip_feed?: boolean | null
          is_organic_mode?: boolean | null
          link: string
          order_number?: number
          peak_hours_enabled?: boolean | null
          price: number
          provider_order_id?: string | null
          quantity: number
          remains?: number | null
          service_id?: string | null
          start_count?: number | null
          status?: string | null
          updated_at?: string | null
          user_id: string
          variance_percent?: number | null
        }
        Update: {
          created_at?: string | null
          drip_interval?: number | null
          drip_interval_unit?: string | null
          drip_quantity_per_run?: number | null
          drip_runs?: number | null
          error_message?: string | null
          id?: string
          is_drip_feed?: boolean | null
          is_organic_mode?: boolean | null
          link?: string
          order_number?: number
          peak_hours_enabled?: boolean | null
          price?: number
          provider_order_id?: string | null
          quantity?: number
          remains?: number | null
          service_id?: string | null
          start_count?: number | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
          variance_percent?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      organic_run_schedule: {
        Row: {
          base_quantity: number
          completed_at: string | null
          created_at: string | null
          engagement_order_item_id: string | null
          error_message: string | null
          id: string
          last_status_check: string | null
          order_id: string | null
          peak_multiplier: number | null
          provider_account_id: string | null
          provider_account_name: string | null
          provider_charge: number | null
          provider_order_id: string | null
          provider_remains: number | null
          provider_response: Json | null
          provider_start_count: number | null
          provider_status: string | null
          quantity_to_send: number
          retry_count: number | null
          rotation_lock_key: string | null
          run_number: number
          scheduled_at: string
          started_at: string | null
          status: string | null
          variance_applied: number | null
        }
        Insert: {
          base_quantity: number
          completed_at?: string | null
          created_at?: string | null
          engagement_order_item_id?: string | null
          error_message?: string | null
          id?: string
          last_status_check?: string | null
          order_id?: string | null
          peak_multiplier?: number | null
          provider_account_id?: string | null
          provider_account_name?: string | null
          provider_charge?: number | null
          provider_order_id?: string | null
          provider_remains?: number | null
          provider_response?: Json | null
          provider_start_count?: number | null
          provider_status?: string | null
          quantity_to_send: number
          retry_count?: number | null
          rotation_lock_key?: string | null
          run_number: number
          scheduled_at: string
          started_at?: string | null
          status?: string | null
          variance_applied?: number | null
        }
        Update: {
          base_quantity?: number
          completed_at?: string | null
          created_at?: string | null
          engagement_order_item_id?: string | null
          error_message?: string | null
          id?: string
          last_status_check?: string | null
          order_id?: string | null
          peak_multiplier?: number | null
          provider_account_id?: string | null
          provider_account_name?: string | null
          provider_charge?: number | null
          provider_order_id?: string | null
          provider_remains?: number | null
          provider_response?: Json | null
          provider_start_count?: number | null
          provider_status?: string | null
          quantity_to_send?: number
          retry_count?: number | null
          rotation_lock_key?: string | null
          run_number?: number
          scheduled_at?: string
          started_at?: string | null
          status?: string | null
          variance_applied?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "organic_run_schedule_engagement_order_item_id_fkey"
            columns: ["engagement_order_item_id"]
            isOneToOne: false
            referencedRelation: "engagement_order_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organic_run_schedule_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organic_run_schedule_provider_account_id_fkey"
            columns: ["provider_account_id"]
            isOneToOne: false
            referencedRelation: "provider_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      oxapay_deposits: {
        Row: {
          amount_inr: number
          amount_usd: number
          created_at: string
          credited: boolean
          id: string
          order_id: string
          pay_currency: string | null
          payment_url: string | null
          raw_payload: Json | null
          status: string
          track_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_inr: number
          amount_usd: number
          created_at?: string
          credited?: boolean
          id?: string
          order_id: string
          pay_currency?: string | null
          payment_url?: string | null
          raw_payload?: Json | null
          status?: string
          track_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_inr?: number
          amount_usd?: number
          created_at?: string
          credited?: boolean
          id?: string
          order_id?: string
          pay_currency?: string | null
          payment_url?: string | null
          raw_payload?: Json | null
          status?: string
          track_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      oxapay_webhook_events: {
        Row: {
          created_at: string
          error_message: string | null
          headers: Json | null
          hmac_valid: boolean
          id: string
          order_id: string | null
          processed: boolean
          raw_payload: Json | null
          track_id: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          headers?: Json | null
          hmac_valid?: boolean
          id?: string
          order_id?: string | null
          processed?: boolean
          raw_payload?: Json | null
          track_id?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          headers?: Json | null
          hmac_valid?: boolean
          id?: string
          order_id?: string | null
          processed?: boolean
          raw_payload?: Json | null
          track_id?: string | null
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          created_at: string | null
          global_markup_percent: number | null
          id: string
          maintenance_mode: boolean | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          global_markup_percent?: number | null
          id?: string
          maintenance_mode?: boolean | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          global_markup_percent?: number | null
          id?: string
          maintenance_mode?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      popup_ads: {
        Row: {
          created_at: string
          description: string
          enabled: boolean
          ends_at: string | null
          id: string
          last_force_trigger: string | null
          skip_after_seconds: number
          starts_at: string | null
          title: string
          updated_at: string
          version: number
          video_layout: string
          youtube_video_id: string
        }
        Insert: {
          created_at?: string
          description?: string
          enabled?: boolean
          ends_at?: string | null
          id?: string
          last_force_trigger?: string | null
          skip_after_seconds?: number
          starts_at?: string | null
          title?: string
          updated_at?: string
          version?: number
          video_layout?: string
          youtube_video_id?: string
        }
        Update: {
          created_at?: string
          description?: string
          enabled?: boolean
          ends_at?: string | null
          id?: string
          last_force_trigger?: string | null
          skip_after_seconds?: number
          starts_at?: string | null
          title?: string
          updated_at?: string
          version?: number
          video_layout?: string
          youtube_video_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          api_key: string | null
          avatar_url: string | null
          banned_at: string | null
          banned_reason: string | null
          created_at: string | null
          currency: string | null
          email: string
          full_name: string | null
          id: string
          is_banned: boolean
          is_organic_mode_default: boolean | null
          organic_peak_hours_enabled: boolean | null
          organic_ratios: Json | null
          organic_variance_percent: number | null
          telegram_chat_id: string | null
          telegram_id: string | null
          telegram_notifications_enabled: boolean | null
          telegram_username: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          api_key?: string | null
          avatar_url?: string | null
          banned_at?: string | null
          banned_reason?: string | null
          created_at?: string | null
          currency?: string | null
          email: string
          full_name?: string | null
          id?: string
          is_banned?: boolean
          is_organic_mode_default?: boolean | null
          organic_peak_hours_enabled?: boolean | null
          organic_ratios?: Json | null
          organic_variance_percent?: number | null
          telegram_chat_id?: string | null
          telegram_id?: string | null
          telegram_notifications_enabled?: boolean | null
          telegram_username?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          api_key?: string | null
          avatar_url?: string | null
          banned_at?: string | null
          banned_reason?: string | null
          created_at?: string | null
          currency?: string | null
          email?: string
          full_name?: string | null
          id?: string
          is_banned?: boolean
          is_organic_mode_default?: boolean | null
          organic_peak_hours_enabled?: boolean | null
          organic_ratios?: Json | null
          organic_variance_percent?: number | null
          telegram_chat_id?: string | null
          telegram_id?: string | null
          telegram_notifications_enabled?: boolean | null
          telegram_username?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      provider_accounts: {
        Row: {
          api_key: string
          api_url: string
          balance: number | null
          balance_checked_at: string | null
          balance_currency: string | null
          created_at: string | null
          delivery_multiplier: number
          id: string
          is_active: boolean | null
          last_balance_error: string | null
          last_low_balance_alert_at: string | null
          last_used_at: string | null
          low_balance_threshold: number
          name: string
          priority: number | null
          provider_id: string
          updated_at: string | null
        }
        Insert: {
          api_key: string
          api_url: string
          balance?: number | null
          balance_checked_at?: string | null
          balance_currency?: string | null
          created_at?: string | null
          delivery_multiplier?: number
          id?: string
          is_active?: boolean | null
          last_balance_error?: string | null
          last_low_balance_alert_at?: string | null
          last_used_at?: string | null
          low_balance_threshold?: number
          name: string
          priority?: number | null
          provider_id: string
          updated_at?: string | null
        }
        Update: {
          api_key?: string
          api_url?: string
          balance?: number | null
          balance_checked_at?: string | null
          balance_currency?: string | null
          created_at?: string | null
          delivery_multiplier?: number
          id?: string
          is_active?: boolean | null
          last_balance_error?: string | null
          last_low_balance_alert_at?: string | null
          last_used_at?: string | null
          low_balance_threshold?: number
          name?: string
          priority?: number | null
          provider_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      providers: {
        Row: {
          api_key: string
          api_url: string
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          api_key: string
          api_url: string
          created_at?: string | null
          id: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          api_key?: string
          api_url?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      razorpay_webhook_events: {
        Row: {
          event_id: string
          event_type: string | null
          id: string
          payload: Json | null
          payment_id: string | null
          processed_at: string
        }
        Insert: {
          event_id: string
          event_type?: string | null
          id?: string
          payload?: Json | null
          payment_id?: string | null
          processed_at?: string
        }
        Update: {
          event_id?: string
          event_type?: string | null
          id?: string
          payload?: Json | null
          payment_id?: string | null
          processed_at?: string
        }
        Relationships: []
      }
      rotation_alert_state: {
        Row: {
          alert_key: string
          last_alerted_at: string
          last_count: number
          resolved_at: string | null
        }
        Insert: {
          alert_key: string
          last_alerted_at?: string
          last_count?: number
          resolved_at?: string | null
        }
        Update: {
          alert_key?: string
          last_alerted_at?: string
          last_count?: number
          resolved_at?: string | null
        }
        Relationships: []
      }
      service_provider_mapping: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          provider_account_id: string | null
          provider_service_id: string
          service_id: string | null
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          provider_account_id?: string | null
          provider_service_id: string
          service_id?: string | null
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          provider_account_id?: string | null
          provider_service_id?: string
          service_id?: string | null
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "service_provider_mapping_provider_account_id_fkey"
            columns: ["provider_account_id"]
            isOneToOne: false
            referencedRelation: "provider_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_provider_mapping_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          cancel_allowed: string | null
          category: string
          created_at: string | null
          description: string | null
          drip_feed_enabled: boolean | null
          drop_type: string | null
          id: string
          is_active: boolean | null
          max_quantity: number
          min_quantity: number
          name: string
          price: number
          provider_id: string | null
          provider_service_id: string
          quality: string | null
          refill: string | null
          speed: string | null
          start_time: string | null
          updated_at: string | null
        }
        Insert: {
          cancel_allowed?: string | null
          category: string
          created_at?: string | null
          description?: string | null
          drip_feed_enabled?: boolean | null
          drop_type?: string | null
          id?: string
          is_active?: boolean | null
          max_quantity?: number
          min_quantity?: number
          name: string
          price?: number
          provider_id?: string | null
          provider_service_id: string
          quality?: string | null
          refill?: string | null
          speed?: string | null
          start_time?: string | null
          updated_at?: string | null
        }
        Update: {
          cancel_allowed?: string | null
          category?: string
          created_at?: string | null
          description?: string | null
          drip_feed_enabled?: boolean | null
          drop_type?: string | null
          id?: string
          is_active?: boolean | null
          max_quantity?: number
          min_quantity?: number
          name?: string
          price?: number
          provider_id?: string | null
          provider_service_id?: string
          quality?: string | null
          refill?: string | null
          speed?: string | null
          start_time?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "services_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_requests: {
        Row: {
          admin_notes: string | null
          created_at: string | null
          email: string
          full_name: string
          id: string
          message: string | null
          phone: string
          plan_type: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          message?: string | null
          phone: string
          plan_type: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          message?: string | null
          phone?: string
          plan_type?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          activated_at: string | null
          activated_by: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          plan_type: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          activated_at?: string | null
          activated_by?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          plan_type?: string
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          activated_at?: string | null
          activated_by?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          plan_type?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          category: string | null
          created_at: string | null
          id: string
          message: string
          order_id: string | null
          priority: string | null
          status: string | null
          subject: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: string
          message: string
          order_id?: string | null
          priority?: string | null
          status?: string | null
          subject: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string
          message?: string
          order_id?: string | null
          priority?: string | null
          status?: string | null
          subject?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      template_settings: {
        Row: {
          allow_archive: boolean
          allow_categories: boolean
          allow_color_labels: boolean
          allow_dashboard_widget: boolean
          allow_descriptions: boolean
          allow_duplicate: boolean
          allow_favorites: boolean
          allow_save_after_order: boolean
          allow_save_from_repeat: boolean
          enabled: boolean
          id: boolean
          max_description_length: number
          max_name_length: number
          max_per_user: number
          updated_at: string
        }
        Insert: {
          allow_archive?: boolean
          allow_categories?: boolean
          allow_color_labels?: boolean
          allow_dashboard_widget?: boolean
          allow_descriptions?: boolean
          allow_duplicate?: boolean
          allow_favorites?: boolean
          allow_save_after_order?: boolean
          allow_save_from_repeat?: boolean
          enabled?: boolean
          id?: boolean
          max_description_length?: number
          max_name_length?: number
          max_per_user?: number
          updated_at?: string
        }
        Update: {
          allow_archive?: boolean
          allow_categories?: boolean
          allow_color_labels?: boolean
          allow_dashboard_widget?: boolean
          allow_descriptions?: boolean
          allow_duplicate?: boolean
          allow_favorites?: boolean
          allow_save_after_order?: boolean
          allow_save_from_repeat?: boolean
          enabled?: boolean
          id?: boolean
          max_description_length?: number
          max_name_length?: number
          max_per_user?: number
          updated_at?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string | null
          description: string | null
          id: string
          order_id: string | null
          payment_method: string | null
          payment_reference: string | null
          status: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string | null
          description?: string | null
          id?: string
          order_id?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          status?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string | null
          description?: string | null
          id?: string
          order_id?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          status?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wallets: {
        Row: {
          balance: number | null
          created_at: string | null
          id: string
          total_deposited: number | null
          total_spent: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          balance?: number | null
          created_at?: string | null
          id?: string
          total_deposited?: number | null
          total_spent?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          balance?: number | null
          created_at?: string | null
          id?: string
          total_deposited?: number | null
          total_spent?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      zapupi_deposits: {
        Row: {
          amount_inr: number
          amount_usd: number | null
          created_at: string
          credited: boolean
          gateway_response: Json | null
          id: string
          mismatch_meta: Json | null
          order_id: string
          payment_url: string | null
          status: string
          txn_id: string | null
          updated_at: string
          user_id: string
          utr: string | null
        }
        Insert: {
          amount_inr: number
          amount_usd?: number | null
          created_at?: string
          credited?: boolean
          gateway_response?: Json | null
          id?: string
          mismatch_meta?: Json | null
          order_id: string
          payment_url?: string | null
          status?: string
          txn_id?: string | null
          updated_at?: string
          user_id: string
          utr?: string | null
        }
        Update: {
          amount_inr?: number
          amount_usd?: number | null
          created_at?: string
          credited?: boolean
          gateway_response?: Json | null
          id?: string
          mismatch_meta?: Json | null
          order_id?: string
          payment_url?: string | null
          status?: string
          txn_id?: string | null
          updated_at?: string
          user_id?: string
          utr?: string | null
        }
        Relationships: []
      }
      zapupi_webhook_events: {
        Row: {
          created_at: string
          event_key: string
          id: string
          order_id: string | null
          payload: Json | null
          source: string
          status: string | null
          txn_id: string | null
          utr: string | null
        }
        Insert: {
          created_at?: string
          event_key: string
          id?: string
          order_id?: string | null
          payload?: Json | null
          source: string
          status?: string | null
          txn_id?: string | null
          utr?: string | null
        }
        Update: {
          created_at?: string
          event_key?: string
          id?: string
          order_id?: string | null
          payload?: Json | null
          source?: string
          status?: string | null
          txn_id?: string | null
          utr?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      providers_public: {
        Row: {
          api_url: string | null
          created_at: string | null
          id: string | null
          is_active: boolean | null
          name: string | null
          updated_at: string | null
        }
        Insert: {
          api_url?: string | null
          created_at?: string | null
          id?: string | null
          is_active?: boolean | null
          name?: string | null
          updated_at?: string | null
        }
        Update: {
          api_url?: string | null
          created_at?: string | null
          id?: string | null
          is_active?: boolean | null
          name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      v_orders_missing_debit: {
        Row: {
          amt: number | null
          created_at: string | null
          id: string | null
          kind: string | null
          order_number: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_adjust_wallet: {
        Args: {
          p_action: string
          p_inr: number
          p_notes?: string
          p_target_user_id: string
          p_usd: number
        }
        Returns: Json
      }
      admin_set_user_ban: {
        Args: { ban: boolean; reason?: string; target_user_id: string }
        Returns: undefined
      }
      cancel_order_with_refund: {
        Args: { p_actor: string; p_is_admin: boolean; p_order_id: string }
        Returns: Json
      }
      cleanup_old_completed_engagement_orders: { Args: never; Returns: Json }
      credit_wallet_oxapay: { Args: { p_order_id: string }; Returns: Json }
      credit_wallet_zapupi: {
        Args: {
          p_gateway_response?: Json
          p_order_id: string
          p_txn_id?: string
          p_utr?: string
        }
        Returns: Json
      }
      debit_wallet_for_order: {
        Args: {
          p_amount: number
          p_description?: string
          p_engagement_order_id?: string
          p_order_id?: string
          p_user_id: string
        }
        Returns: Json
      }
      get_admin_analytics: {
        Args: { p_from: string; p_to: string }
        Returns: Json
      }
      get_admin_dashboard_stats: { Args: never; Returns: Json }
      get_admin_users_summary: { Args: never; Returns: Json }
      get_provider_topup_breakdown: {
        Args: never
        Returns: {
          pending_quantity: number
          pending_runs: number
          pending_user_usd: number
          provider_id: string
          provider_name: string
          service_category: string
          service_id: string
          service_name: string
        }[]
      }
      get_provider_topup_plan: {
        Args: never
        Returns: {
          markup_percent: number
          pending_runs: number
          pending_user_usd: number
          provider_id: string
          provider_name: string
        }[]
      }
      get_public_markup: { Args: never; Returns: number }
      get_top_pending_users: {
        Args: { p_limit?: number }
        Returns: {
          email: string
          full_name: string
          pending_orders: number
          pending_value_usd: number
          total_deposited: number
          total_spent: number
          user_id: string
          wallet_balance: number
        }[]
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_maintenance_mode: { Args: never; Returns: boolean }
      pg_advisory_xact_lock: { Args: { key: number }; Returns: undefined }
      record_zapupi_fraud_strike: {
        Args: { p_meta?: Json; p_reason_code: string; p_user_id: string }
        Returns: Json
      }
      reschedule_organic_run: {
        Args: { p_quantity: number; p_run_id: string; p_scheduled_at: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
