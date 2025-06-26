export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      api_keys: {
        Row: {
          created_at: string
          encrypted_key: string
          id: string
          is_active: boolean
          last_validated_at: string | null
          service: string
          updated_at: string
          user_id: string
          validation_status: string | null
        }
        Insert: {
          created_at?: string
          encrypted_key: string
          id?: string
          is_active?: boolean
          last_validated_at?: string | null
          service: string
          updated_at?: string
          user_id: string
          validation_status?: string | null
        }
        Update: {
          created_at?: string
          encrypted_key?: string
          id?: string
          is_active?: boolean
          last_validated_at?: string | null
          service?: string
          updated_at?: string
          user_id?: string
          validation_status?: string | null
        }
        Relationships: []
      }
      approvals: {
        Row: {
          affected_videos_count: number
          approval_reason: string | null
          approved_at: string | null
          created_at: string
          data: Json
          description: string | null
          id: string
          rejected_at: string | null
          rejection_reason: string | null
          status: Database["public"]["Enums"]["approval_status"]
          title: string
          type: Database["public"]["Enums"]["approval_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          affected_videos_count?: number
          approval_reason?: string | null
          approved_at?: string | null
          created_at?: string
          data?: Json
          description?: string | null
          id?: string
          rejected_at?: string | null
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["approval_status"]
          title: string
          type: Database["public"]["Enums"]["approval_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          affected_videos_count?: number
          approval_reason?: string | null
          approved_at?: string | null
          created_at?: string
          data?: Json
          description?: string | null
          id?: string
          rejected_at?: string | null
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["approval_status"]
          title?: string
          type?: Database["public"]["Enums"]["approval_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      blocks: {
        Row: {
          content: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          priority: number | null
          scheduled_end: string | null
          scheduled_start: string | null
          scope: string | null
          title: string
          type: string | null
          updated_at: string | null
          user_id: string | null
          video_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          priority?: number | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          scope?: string | null
          title: string
          type?: string | null
          updated_at?: string | null
          user_id?: string | null
          video_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          priority?: number | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          scope?: string | null
          title?: string
          type?: string | null
          updated_at?: string | null
          user_id?: string | null
          video_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blocks_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      prompts: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          max_tokens: number | null
          name: string
          prompt: string
          temperature: number | null
          top_p: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          max_tokens?: number | null
          name: string
          prompt: string
          temperature?: number | null
          top_p?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          max_tokens?: number | null
          name?: string
          prompt?: string
          temperature?: number | null
          top_p?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prompts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          updated_at: string | null
          youtube_access_token: string | null
          youtube_channel_id: string | null
          youtube_channel_name: string | null
          youtube_refresh_token: string | null
          youtube_token_expiry: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          updated_at?: string | null
          youtube_access_token?: string | null
          youtube_channel_id?: string | null
          youtube_channel_name?: string | null
          youtube_refresh_token?: string | null
          youtube_token_expiry?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          updated_at?: string | null
          youtube_access_token?: string | null
          youtube_channel_id?: string | null
          youtube_channel_name?: string | null
          youtube_refresh_token?: string | null
          youtube_token_expiry?: string | null
        }
        Relationships: []
      }
      videos: {
        Row: {
          ai_chapters: Json | null
          ai_description: string | null
          ai_generated_tags: string[] | null
          ai_summary: string | null
          compiled_description: string | null
          configuration_status: string | null
          created_at: string | null
          current_description: string | null
          current_tags: string[] | null
          id: string
          original_description: string | null
          original_tags: string[] | null
          published_at: string | null
          title: string
          transcription: string | null
          update_status: string | null
          updated_at: string | null
          user_id: string | null
          video_type: string | null
          youtube_id: string
          youtube_url: string
        }
        Insert: {
          ai_chapters?: Json | null
          ai_description?: string | null
          ai_generated_tags?: string[] | null
          ai_summary?: string | null
          compiled_description?: string | null
          configuration_status?: string | null
          created_at?: string | null
          current_description?: string | null
          current_tags?: string[] | null
          id?: string
          original_description?: string | null
          original_tags?: string[] | null
          published_at?: string | null
          title: string
          transcription?: string | null
          update_status?: string | null
          updated_at?: string | null
          user_id?: string | null
          video_type?: string | null
          youtube_id: string
          youtube_url: string
        }
        Update: {
          ai_chapters?: Json | null
          ai_description?: string | null
          ai_generated_tags?: string[] | null
          ai_summary?: string | null
          compiled_description?: string | null
          configuration_status?: string | null
          created_at?: string | null
          current_description?: string | null
          current_tags?: string[] | null
          id?: string
          original_description?: string | null
          original_tags?: string[] | null
          published_at?: string | null
          title?: string
          transcription?: string | null
          update_status?: string | null
          updated_at?: string | null
          user_id?: string | null
          video_type?: string | null
          youtube_id?: string
          youtube_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "videos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      youtube_tokens: {
        Row: {
          access_token: string
          channel_id: string | null
          channel_name: string | null
          channel_thumbnail: string | null
          created_at: string
          expires_at: string
          id: string
          refresh_token: string
          scope: string
          subscriber_count: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          channel_id?: string | null
          channel_name?: string | null
          channel_thumbnail?: string | null
          created_at?: string
          expires_at: string
          id?: string
          refresh_token: string
          scope: string
          subscriber_count?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          channel_id?: string | null
          channel_name?: string | null
          channel_thumbnail?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          refresh_token?: string
          scope?: string
          subscriber_count?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      ensure_manual_block_exists: {
        Args: { p_user_id: string }
        Returns: string
      }
    }
    Enums: {
      approval_status: "PENDING" | "APPROVED" | "REJECTED"
      approval_type:
        | "BLOCK_CHANGE"
        | "MASS_UPDATE"
        | "SYNC_OPERATION"
        | "CATEGORY_CHANGE"
        | "TAG_UPDATE"
        | "SEASONAL_TEMPLATE"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      approval_status: ["PENDING", "APPROVED", "REJECTED"],
      approval_type: [
        "BLOCK_CHANGE",
        "MASS_UPDATE",
        "SYNC_OPERATION",
        "CATEGORY_CHANGE",
        "TAG_UPDATE",
        "SEASONAL_TEMPLATE",
      ],
    },
  },
} as const
