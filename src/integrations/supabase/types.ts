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
      applications: {
        Row: {
          applicant_id: string
          created_at: string
          id: string
          job_id: string
          message: string | null
          status: string
        }
        Insert: {
          applicant_id: string
          created_at?: string
          id?: string
          job_id: string
          message?: string | null
          status?: string
        }
        Update: {
          applicant_id?: string
          created_at?: string
          id?: string
          job_id?: string
          message?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_lookups: {
        Row: {
          created_at: string
          id: string
          target_id: string
          viewer_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          target_id: string
          viewer_id: string
        }
        Update: {
          created_at?: string
          id?: string
          target_id?: string
          viewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_lookups_target_id_fkey"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_lookups_viewer_id_fkey"
            columns: ["viewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          name: string
          phone_number: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          name: string
          phone_number: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          name?: string
          phone_number?: string
        }
        Relationships: []
      }
      inquiries: {
        Row: {
          created_at: string
          id: string
          job_id: string | null
          message: string
          recipient_id: string
          sender_id: string
          skill_id: string | null
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          job_id?: string | null
          message: string
          recipient_id: string
          sender_id: string
          skill_id?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          job_id?: string | null
          message?: string
          recipient_id?: string
          sender_id?: string
          skill_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "inquiries_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inquiries_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inquiries_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inquiries_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          category: string
          compensation_details: string | null
          compensation_type: string | null
          created_at: string
          deadline: string | null
          description: string
          id: string
          location: string | null
          organization: string | null
          required_skills: string[]
          status: string
          title: string
          updated_at: string
          user_id: string
          work_mode: string | null
        }
        Insert: {
          category: string
          compensation_details?: string | null
          compensation_type?: string | null
          created_at?: string
          deadline?: string | null
          description: string
          id?: string
          location?: string | null
          organization?: string | null
          required_skills?: string[]
          status?: string
          title: string
          updated_at?: string
          user_id: string
          work_mode?: string | null
        }
        Update: {
          category?: string
          compensation_details?: string | null
          compensation_type?: string | null
          created_at?: string
          deadline?: string | null
          description?: string
          id?: string
          location?: string | null
          organization?: string | null
          required_skills?: string[]
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
          work_mode?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          availability: string | null
          avatar_url: string | null
          bio: string | null
          college: string | null
          contact_visible: boolean
          created_at: string
          email: string | null
          full_name: string
          id: string
          linkedin_url: string | null
          location: string | null
          phone: string | null
          portfolio_url: string | null
          role: string
          updated_at: string
        }
        Insert: {
          availability?: string | null
          avatar_url?: string | null
          bio?: string | null
          college?: string | null
          contact_visible?: boolean
          created_at?: string
          email?: string | null
          full_name?: string
          id: string
          linkedin_url?: string | null
          location?: string | null
          phone?: string | null
          portfolio_url?: string | null
          role?: string
          updated_at?: string
        }
        Update: {
          availability?: string | null
          avatar_url?: string | null
          bio?: string | null
          college?: string | null
          contact_visible?: boolean
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          linkedin_url?: string | null
          location?: string | null
          phone?: string | null
          portfolio_url?: string | null
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      saved_items: {
        Row: {
          created_at: string
          id: string
          item_type: string
          job_id: string | null
          skill_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_type: string
          job_id?: string | null
          skill_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          item_type?: string
          job_id?: string | null
          skill_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_items_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_items_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      skills: {
        Row: {
          availability: string | null
          category: string
          created_at: string
          description: string
          exchange_preference: string | null
          experience_level: string | null
          help_offered: string | null
          id: string
          is_active: boolean
          location: string | null
          title: string
          updated_at: string
          user_id: string
          work_mode: string | null
        }
        Insert: {
          availability?: string | null
          category: string
          created_at?: string
          description: string
          exchange_preference?: string | null
          experience_level?: string | null
          help_offered?: string | null
          id?: string
          is_active?: boolean
          location?: string | null
          title: string
          updated_at?: string
          user_id: string
          work_mode?: string | null
        }
        Update: {
          availability?: string | null
          category?: string
          created_at?: string
          description?: string
          exchange_preference?: string | null
          experience_level?: string | null
          help_offered?: string | null
          id?: string
          is_active?: boolean
          location?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          work_mode?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "skills_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_contact: {
        Args: { _user_id: string }
        Returns: {
          contact_visible: boolean
          email: string
          phone: string
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
