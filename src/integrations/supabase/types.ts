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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action_type: string
          actor_id: string
          created_at: string
          description: string | null
          event_id: string | null
          id: string
          match_id: string | null
          metadata: Json | null
          reason: string
          target_id: string
        }
        Insert: {
          action_type: string
          actor_id: string
          created_at?: string
          description?: string | null
          event_id?: string | null
          id?: string
          match_id?: string | null
          metadata?: Json | null
          reason: string
          target_id: string
        }
        Update: {
          action_type?: string
          actor_id?: string
          created_at?: string
          description?: string | null
          event_id?: string | null
          id?: string
          match_id?: string | null
          metadata?: Json | null
          reason?: string
          target_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      event_attendees: {
        Row: {
          event_id: string
          id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          event_id: string
          id?: string
          joined_at?: string
          user_id: string
        }
        Update: {
          event_id?: string
          id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_attendees_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_attendees_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      event_departures: {
        Row: {
          event_id: string
          id: string
          left_at: string
          reason: string | null
          user_id: string
        }
        Insert: {
          event_id: string
          id?: string
          left_at?: string
          reason?: string | null
          user_id: string
        }
        Update: {
          event_id?: string
          id?: string
          left_at?: string
          reason?: string | null
          user_id?: string
        }
        Relationships: []
      }
      event_requests: {
        Row: {
          created_at: string
          email: string
          event_id: string | null
          expected_guests: number
          id: string
          message: string | null
          partner1_name: string
          partner2_name: string
          phone: string
          status: string
          submitter_type: string
          updated_at: string
          wedding_date: string
        }
        Insert: {
          created_at?: string
          email: string
          event_id?: string | null
          expected_guests: number
          id?: string
          message?: string | null
          partner1_name: string
          partner2_name: string
          phone: string
          status?: string
          submitter_type?: string
          updated_at?: string
          wedding_date: string
        }
        Update: {
          created_at?: string
          email?: string
          event_id?: string | null
          expected_guests?: number
          id?: string
          message?: string | null
          partner1_name?: string
          partner2_name?: string
          phone?: string
          status?: string
          submitter_type?: string
          updated_at?: string
          wedding_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_requests_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          close_date: string
          created_at: string
          created_by: string
          date: string | null
          description: string | null
          id: string
          image_url: string | null
          invite_code: string
          matchmaking_close_date: string | null
          matchmaking_start_date: string | null
          matchmaking_start_time: string | null
          name: string
          plan: string
          status: string
          updated_at: string
        }
        Insert: {
          close_date?: string
          created_at?: string
          created_by: string
          date?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          invite_code: string
          matchmaking_close_date?: string | null
          matchmaking_start_date?: string | null
          matchmaking_start_time?: string | null
          name: string
          plan?: string
          status?: string
          updated_at?: string
        }
        Update: {
          close_date?: string
          created_at?: string
          created_by?: string
          date?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          invite_code?: string
          matchmaking_close_date?: string | null
          matchmaking_start_date?: string | null
          matchmaking_start_time?: string | null
          name?: string
          plan?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      hidden_events: {
        Row: {
          event_id: string
          hidden_at: string
          id: string
          user_id: string
        }
        Insert: {
          event_id: string
          hidden_at?: string
          id?: string
          user_id: string
        }
        Update: {
          event_id?: string
          hidden_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      matches: {
        Row: {
          event_id: string
          id: string
          matched_at: string
          user1_id: string
          user2_id: string
        }
        Insert: {
          event_id: string
          id?: string
          matched_at?: string
          user1_id: string
          user2_id: string
        }
        Update: {
          event_id?: string
          id?: string
          matched_at?: string
          user1_id?: string
          user2_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "matches_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_user1_id_fkey"
            columns: ["user1_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "matches_user1_id_profiles_fkey"
            columns: ["user1_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "matches_user2_id_fkey"
            columns: ["user2_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "matches_user2_id_profiles_fkey"
            columns: ["user2_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string
          event_id: string | null
          id: string
          match_id: string | null
          read_at: string | null
          recipient_id: string | null
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          event_id?: string | null
          id?: string
          match_id?: string | null
          read_at?: string | null
          recipient_id?: string | null
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          event_id?: string | null
          id?: string
          match_id?: string | null
          read_at?: string | null
          recipient_id?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_logs: {
        Row: {
          conversation_id: string | null
          created_at: string
          event_id: string
          id: string
          notification_type: string
          sent_at: string
          user_id: string
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string
          event_id: string
          id?: string
          notification_type: string
          sent_at?: string
          user_id: string
        }
        Update: {
          conversation_id?: string | null
          created_at?: string
          event_id?: string
          id?: string
          notification_type?: string
          sent_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_logs_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          age: number | null
          age_max: number | null
          age_min: number | null
          bio: string | null
          created_at: string
          email_like_notifications: boolean | null
          email_match_notifications: boolean | null
          gender: string | null
          id: string
          instagram_username: string | null
          interested_in: string | null
          interests: string[] | null
          name: string
          photos: string[] | null
          prompts: Json | null
          theme_preference: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          age?: number | null
          age_max?: number | null
          age_min?: number | null
          bio?: string | null
          created_at?: string
          email_like_notifications?: boolean | null
          email_match_notifications?: boolean | null
          gender?: string | null
          id?: string
          instagram_username?: string | null
          interested_in?: string | null
          interests?: string[] | null
          name: string
          photos?: string[] | null
          prompts?: Json | null
          theme_preference?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          age?: number | null
          age_max?: number | null
          age_min?: number | null
          bio?: string | null
          created_at?: string
          email_like_notifications?: boolean | null
          email_match_notifications?: boolean | null
          gender?: string | null
          id?: string
          instagram_username?: string | null
          interested_in?: string | null
          interests?: string[] | null
          name?: string
          photos?: string[] | null
          prompts?: Json | null
          theme_preference?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          custom_reason: string | null
          event_id: string
          id: string
          match_id: string
          reason: string
          reported_user_id: string
          reporter_id: string
        }
        Insert: {
          created_at?: string
          custom_reason?: string | null
          event_id: string
          id?: string
          match_id: string
          reason: string
          reported_user_id: string
          reporter_id: string
        }
        Update: {
          created_at?: string
          custom_reason?: string | null
          event_id?: string
          id?: string
          match_id?: string
          reason?: string
          reported_user_id?: string
          reporter_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          amount_cents: number
          cancelled_at: string | null
          created_at: string
          currency: string
          event_id: string
          expires_at: string | null
          id: string
          metadata: Json | null
          platform: Database["public"]["Enums"]["subscription_platform"]
          status: Database["public"]["Enums"]["subscription_status"]
          transaction_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_cents: number
          cancelled_at?: string | null
          created_at?: string
          currency?: string
          event_id: string
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          platform: Database["public"]["Enums"]["subscription_platform"]
          status?: Database["public"]["Enums"]["subscription_status"]
          transaction_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_cents?: number
          cancelled_at?: string | null
          created_at?: string
          currency?: string
          event_id?: string
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          platform?: Database["public"]["Enums"]["subscription_platform"]
          status?: Database["public"]["Enums"]["subscription_status"]
          transaction_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      swipes: {
        Row: {
          created_at: string
          direction: string
          event_id: string
          id: string
          swiped_user_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          direction: string
          event_id: string
          id?: string
          swiped_user_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          direction?: string
          event_id?: string
          id?: string
          swiped_user_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "swipes_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "swipes_swiped_user_id_fkey"
            columns: ["swiped_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "swipes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "swipes_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      unmatches: {
        Row: {
          created_at: string
          description: string | null
          event_id: string
          id: string
          match_id: string | null
          reason: string
          unmatched_user_id: string
          unmatcher_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_id: string
          id?: string
          match_id?: string | null
          reason: string
          unmatched_user_id: string
          unmatcher_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          event_id?: string
          id?: string
          match_id?: string | null
          reason?: string
          unmatched_user_id?: string
          unmatcher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "unmatches_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unmatches_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          granted_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          granted_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          granted_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_join_event: { Args: { _event_id: string }; Returns: boolean }
      get_event_guest_count: { Args: { _event_id: string }; Returns: number }
      has_active_premium: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      report_user_transaction: {
        Args: {
          _custom_reason: string
          _event_id: string
          _match_id: string
          _reason: string
          _reported_user_id: string
          _reporter_id: string
        }
        Returns: undefined
      }
      unmatch_user_transaction: {
        Args: {
          _description: string
          _event_id: string
          _match_id: string
          _reason: string
          _unmatched_user_id: string
          _unmatcher_id: string
        }
        Returns: undefined
      }
      user_is_event_attendee: {
        Args: { _event_id: string; _user_id: string }
        Returns: boolean
      }
      user_is_event_host: {
        Args: { _event_id: string; _user_id: string }
        Returns: boolean
      }
      users_share_active_event: {
        Args: { user_a: string; user_b: string }
        Returns: boolean
      }
      users_share_event: {
        Args: { user_a: string; user_b: string }
        Returns: boolean
      }
      validate_invite_code: {
        Args: { code: string }
        Returns: {
          event_date: string
          event_description: string
          event_id: string
          event_name: string
          event_status: string
          event_theme: string
          guest_count: number
          image_url: string
        }[]
      }
    }
    Enums: {
      app_role: "free" | "premium" | "admin"
      subscription_platform: "web" | "ios" | "android"
      subscription_status: "active" | "expired" | "cancelled" | "pending"
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
      app_role: ["free", "premium", "admin"],
      subscription_platform: ["web", "ios", "android"],
      subscription_status: ["active", "expired", "cancelled", "pending"],
    },
  },
} as const
