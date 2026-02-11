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
      activity_logs: {
        Row: {
          action_label: string
          action_type: string
          company_name: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          is_error: boolean | null
          metadata: Json | null
          user_email: string
          user_id: string
        }
        Insert: {
          action_label: string
          action_type: string
          company_name?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_error?: boolean | null
          metadata?: Json | null
          user_email: string
          user_id: string
        }
        Update: {
          action_label?: string
          action_type?: string
          company_name?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_error?: boolean | null
          metadata?: Json | null
          user_email?: string
          user_id?: string
        }
        Relationships: []
      }
      analyses: {
        Row: {
          candidates: Json
          created_at: string
          duration_seconds: number | null
          id: string
          job_description: string
          job_posting_id: string | null
          job_title: string | null
          results: Json | null
          status: string
          tokens_used: number | null
          user_id: string
        }
        Insert: {
          candidates?: Json
          created_at?: string
          duration_seconds?: number | null
          id?: string
          job_description: string
          job_posting_id?: string | null
          job_title?: string | null
          results?: Json | null
          status?: string
          tokens_used?: number | null
          user_id: string
        }
        Update: {
          candidates?: Json
          created_at?: string
          duration_seconds?: number | null
          id?: string
          job_description?: string
          job_posting_id?: string | null
          job_title?: string | null
          results?: Json | null
          status?: string
          tokens_used?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analyses_job_posting_id_fkey"
            columns: ["job_posting_id"]
            isOneToOne: false
            referencedRelation: "job_postings"
            referencedColumns: ["id"]
          },
        ]
      }
      analysis_jobs: {
        Row: {
          created_at: string | null
          current_step: string | null
          duration_seconds: number | null
          error_message: string | null
          files_count: number
          id: string
          progress: number
          result: Json | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_step?: string | null
          duration_seconds?: number | null
          error_message?: string | null
          files_count?: number
          id?: string
          progress?: number
          result?: Json | null
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_step?: string | null
          duration_seconds?: number | null
          error_message?: string | null
          files_count?: number
          id?: string
          progress?: number
          result?: Json | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      form_templates: {
        Row: {
          created_at: string
          description: string | null
          fields: Json
          id: string
          is_default: boolean | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          fields?: Json
          id?: string
          is_default?: boolean | null
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          fields?: Json
          id?: string
          is_default?: boolean | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      invites: {
        Row: {
          created_at: string
          email: string
          id: string
          inviter_user_id: string
          status: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          inviter_user_id: string
          status?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          inviter_user_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "invites_inviter_user_id_fkey"
            columns: ["inviter_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      job_applications: {
        Row: {
          analysis_id: string | null
          applicant_email: string | null
          applicant_name: string | null
          created_at: string
          form_data: Json
          id: string
          job_posting_id: string
          resume_filename: string | null
          resume_url: string | null
          status: string
          triage_status: string
        }
        Insert: {
          analysis_id?: string | null
          applicant_email?: string | null
          applicant_name?: string | null
          created_at?: string
          form_data?: Json
          id?: string
          job_posting_id: string
          resume_filename?: string | null
          resume_url?: string | null
          status?: string
          triage_status?: string
        }
        Update: {
          analysis_id?: string | null
          applicant_email?: string | null
          applicant_name?: string | null
          created_at?: string
          form_data?: Json
          id?: string
          job_posting_id?: string
          resume_filename?: string | null
          resume_url?: string | null
          status?: string
          triage_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "analyses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_applications_job_posting_id_fkey"
            columns: ["job_posting_id"]
            isOneToOne: false
            referencedRelation: "job_postings"
            referencedColumns: ["id"]
          },
        ]
      }
      job_postings: {
        Row: {
          analyzed_at: string | null
          brand_color: string | null
          closed_at: string | null
          company_logo_url: string | null
          company_name: string | null
          created_at: string
          description: string
          expires_at: string | null
          form_template_id: string | null
          id: string
          location: string | null
          public_slug: string
          requirements: string | null
          salary_range: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
          work_type: string | null
        }
        Insert: {
          analyzed_at?: string | null
          brand_color?: string | null
          closed_at?: string | null
          company_logo_url?: string | null
          company_name?: string | null
          created_at?: string
          description: string
          expires_at?: string | null
          form_template_id?: string | null
          id?: string
          location?: string | null
          public_slug: string
          requirements?: string | null
          salary_range?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
          work_type?: string | null
        }
        Update: {
          analyzed_at?: string | null
          brand_color?: string | null
          closed_at?: string | null
          company_logo_url?: string | null
          company_name?: string | null
          created_at?: string
          description?: string
          expires_at?: string | null
          form_template_id?: string | null
          id?: string
          location?: string | null
          public_slug?: string
          requirements?: string | null
          salary_range?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
          work_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_postings_form_template_id_fkey"
            columns: ["form_template_id"]
            isOneToOne: false
            referencedRelation: "form_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      job_templates: {
        Row: {
          created_at: string
          description: string
          id: string
          location: string | null
          requirements: string | null
          salary_range: string | null
          title: string
          work_type: string | null
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          location?: string | null
          requirements?: string | null
          salary_range?: string | null
          title: string
          work_type?: string | null
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          location?: string | null
          requirements?: string | null
          salary_range?: string | null
          title?: string
          work_type?: string | null
        }
        Relationships: []
      }
      pipeline_stages: {
        Row: {
          color: string
          created_at: string | null
          icon: string
          id: string
          is_default: boolean | null
          name: string
          order: number
          slug: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string | null
          icon?: string
          id?: string
          is_default?: boolean | null
          name: string
          order?: number
          slug: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string | null
          icon?: string
          id?: string
          is_default?: boolean | null
          name?: string
          order?: number
          slug?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          brand_color: string | null
          careers_cta_text: string | null
          careers_hero_image_url: string | null
          careers_page_enabled: boolean | null
          careers_page_slug: string | null
          careers_show_about: boolean | null
          careers_show_benefits: boolean | null
          careers_show_culture: boolean | null
          careers_show_social: boolean | null
          cargo: string | null
          company_about: string | null
          company_benefits: Json | null
          company_culture: string | null
          company_instagram: string | null
          company_linkedin: string | null
          company_logo_url: string | null
          company_name: string | null
          company_tagline: string | null
          company_website: string | null
          created_at: string
          email: string | null
          employee_count: string | null
          hr_hub_user_id: string | null
          id: string
          is_blocked: boolean
          lead_source: string | null
          name: string | null
          phone: string | null
          referral_code: string | null
          referred_by_code: string | null
          show_marq_banner: boolean
          source: string | null
          total_resumes: number
          updated_at: string
          user_id: string
        }
        Insert: {
          brand_color?: string | null
          careers_cta_text?: string | null
          careers_hero_image_url?: string | null
          careers_page_enabled?: boolean | null
          careers_page_slug?: string | null
          careers_show_about?: boolean | null
          careers_show_benefits?: boolean | null
          careers_show_culture?: boolean | null
          careers_show_social?: boolean | null
          cargo?: string | null
          company_about?: string | null
          company_benefits?: Json | null
          company_culture?: string | null
          company_instagram?: string | null
          company_linkedin?: string | null
          company_logo_url?: string | null
          company_name?: string | null
          company_tagline?: string | null
          company_website?: string | null
          created_at?: string
          email?: string | null
          employee_count?: string | null
          hr_hub_user_id?: string | null
          id?: string
          is_blocked?: boolean
          lead_source?: string | null
          name?: string | null
          phone?: string | null
          referral_code?: string | null
          referred_by_code?: string | null
          show_marq_banner?: boolean
          source?: string | null
          total_resumes?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          brand_color?: string | null
          careers_cta_text?: string | null
          careers_hero_image_url?: string | null
          careers_page_enabled?: boolean | null
          careers_page_slug?: string | null
          careers_show_about?: boolean | null
          careers_show_benefits?: boolean | null
          careers_show_culture?: boolean | null
          careers_show_social?: boolean | null
          cargo?: string | null
          company_about?: string | null
          company_benefits?: Json | null
          company_culture?: string | null
          company_instagram?: string | null
          company_linkedin?: string | null
          company_logo_url?: string | null
          company_name?: string | null
          company_tagline?: string | null
          company_website?: string | null
          created_at?: string
          email?: string | null
          employee_count?: string | null
          hr_hub_user_id?: string | null
          id?: string
          is_blocked?: boolean
          lead_source?: string | null
          name?: string | null
          phone?: string | null
          referral_code?: string | null
          referred_by_code?: string | null
          show_marq_banner?: boolean
          source?: string | null
          total_resumes?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_get_users_with_stats: {
        Args: never
        Returns: {
          cargo: string
          company_name: string
          created_at: string
          email: string
          is_blocked: boolean
          name: string
          phone: string
          resumes_analyzed: number
          role: string
          total_analyses: number
          total_resumes: number
          total_tokens_used: number
          user_id: string
        }[]
      }
      admin_update_user_profile: {
        Args: {
          _resumes_to_add?: number
          _set_blocked?: boolean
          _target_user_id: string
        }
        Returns: undefined
      }
      generate_careers_slug: { Args: { company: string }; Returns: string }
      generate_referral_code: { Args: never; Returns: string }
      get_user_password_hash: { Args: { p_user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_email: { Args: never; Returns: boolean }
      is_corporate_email: { Args: { email: string }; Returns: boolean }
      is_full_access: { Args: { _user_id: string }; Returns: boolean }
      is_template_authorized_email: { Args: never; Returns: boolean }
      is_user_blocked: { Args: { _user_id: string }; Returns: boolean }
      update_user_password_hash: {
        Args: { p_password_hash: string; p_user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "lead" | "full_access"
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
      app_role: ["lead", "full_access"],
    },
  },
} as const
