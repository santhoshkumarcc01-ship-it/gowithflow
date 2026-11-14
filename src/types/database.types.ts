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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      agent_runs: {
        Row: {
          agent_type: string
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          id: string
          request_data: Json | null
          request_id: string
          response_data: Json | null
          status: string | null
          user_id: string
        }
        Insert: {
          agent_type: string
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          request_data?: Json | null
          request_id: string
          response_data?: Json | null
          status?: string | null
          user_id: string
        }
        Update: {
          agent_type?: string
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          request_data?: Json | null
          request_id?: string
          response_data?: Json | null
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      assessments: {
        Row: {
          answers: Json | null
          assessment_type: string | null
          completed_at: string | null
          created_at: string | null
          feedback: Json | null
          id: string
          questions: Json | null
          score: number | null
          skill_name: string
          status: string | null
          user_id: string
        }
        Insert: {
          answers?: Json | null
          assessment_type?: string | null
          completed_at?: string | null
          created_at?: string | null
          feedback?: Json | null
          id?: string
          questions?: Json | null
          score?: number | null
          skill_name: string
          status?: string | null
          user_id: string
        }
        Update: {
          answers?: Json | null
          assessment_type?: string | null
          completed_at?: string | null
          created_at?: string | null
          feedback?: Json | null
          id?: string
          questions?: Json | null
          score?: number | null
          skill_name?: string
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      career_goals: {
        Row: {
          confidence_level: number | null
          created_at: string | null
          goal_status: string | null
          id: string
          motivation: string | null
          preferred_industry: string | null
          secondary_role: string | null
          target_role: string
          target_timeline: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          confidence_level?: number | null
          created_at?: string | null
          goal_status?: string | null
          id?: string
          motivation?: string | null
          preferred_industry?: string | null
          secondary_role?: string | null
          target_role: string
          target_timeline?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          confidence_level?: number | null
          created_at?: string | null
          goal_status?: string | null
          id?: string
          motivation?: string | null
          preferred_industry?: string | null
          secondary_role?: string | null
          target_role?: string
          target_timeline?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      certifications: {
        Row: {
          certification_name: string
          created_at: string | null
          credential_id: string | null
          credential_url: string | null
          document_path: string | null
          expiry_date: string | null
          id: string
          issue_date: string | null
          issuing_organization: string | null
          updated_at: string | null
          user_id: string
          verification_status: string | null
        }
        Insert: {
          certification_name: string
          created_at?: string | null
          credential_id?: string | null
          credential_url?: string | null
          document_path?: string | null
          expiry_date?: string | null
          id?: string
          issue_date?: string | null
          issuing_organization?: string | null
          updated_at?: string | null
          user_id: string
          verification_status?: string | null
        }
        Update: {
          certification_name?: string
          created_at?: string | null
          credential_id?: string | null
          credential_url?: string | null
          document_path?: string | null
          expiry_date?: string | null
          id?: string
          issue_date?: string | null
          issuing_organization?: string | null
          updated_at?: string | null
          user_id?: string
          verification_status?: string | null
        }
        Relationships: []
      }
      learner_interests: {
        Row: {
          category: string | null
          created_at: string | null
          id: string
          interest_name: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: string
          interest_name: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string
          interest_name?: string
          user_id?: string
        }
        Relationships: []
      }
      learner_preferences: {
        Row: {
          budget_preference: string | null
          created_at: string | null
          id: string
          learning_style: string | null
          notification_enabled: boolean | null
          preferred_language: string | null
          updated_at: string | null
          user_id: string
          weekly_learning_hours: number | null
        }
        Insert: {
          budget_preference?: string | null
          created_at?: string | null
          id?: string
          learning_style?: string | null
          notification_enabled?: boolean | null
          preferred_language?: string | null
          updated_at?: string | null
          user_id: string
          weekly_learning_hours?: number | null
        }
        Update: {
          budget_preference?: string | null
          created_at?: string | null
          id?: string
          learning_style?: string | null
          notification_enabled?: boolean | null
          preferred_language?: string | null
          updated_at?: string | null
          user_id?: string
          weekly_learning_hours?: number | null
        }
        Relationships: []
      }
      learner_progress: {
        Row: {
          completed_at: string | null
          completion_status: string | null
          id: string
          progress_percentage: number | null
          resource_id: string | null
          roadmap_id: string | null
          started_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          completion_status?: string | null
          id?: string
          progress_percentage?: number | null
          resource_id?: string | null
          roadmap_id?: string | null
          started_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          completion_status?: string | null
          id?: string
          progress_percentage?: number | null
          resource_id?: string | null
          roadmap_id?: string | null
          started_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learner_progress_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "learning_resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learner_progress_roadmap_id_fkey"
            columns: ["roadmap_id"]
            isOneToOne: false
            referencedRelation: "learning_roadmaps"
            referencedColumns: ["id"]
          },
        ]
      }
      learner_skills: {
        Row: {
          assessment_score: number | null
          category: string | null
          created_at: string | null
          evidence_description: string | null
          evidence_source: string | null
          id: string
          proficiency_level: string
          self_assessed_score: number | null
          skill_name: string
          updated_at: string | null
          user_id: string
          verification_status: string | null
        }
        Insert: {
          assessment_score?: number | null
          category?: string | null
          created_at?: string | null
          evidence_description?: string | null
          evidence_source?: string | null
          id?: string
          proficiency_level?: string
          self_assessed_score?: number | null
          skill_name: string
          updated_at?: string | null
          user_id: string
          verification_status?: string | null
        }
        Update: {
          assessment_score?: number | null
          category?: string | null
          created_at?: string | null
          evidence_description?: string | null
          evidence_source?: string | null
          id?: string
          proficiency_level?: string
          self_assessed_score?: number | null
          skill_name?: string
          updated_at?: string | null
          user_id?: string
          verification_status?: string | null
        }
        Relationships: []
      }
      learning_resources: {
        Row: {
          created_at: string | null
          difficulty: string | null
          estimated_hours: number | null
          id: string
          pricing: string | null
          provider: string | null
          resource_title: string
          resource_type: string | null
          resource_url: string
          roadmap_id: string | null
          skill_name: string
          status: string | null
          updated_at: string | null
          user_id: string
          verification_status: string | null
        }
        Insert: {
          created_at?: string | null
          difficulty?: string | null
          estimated_hours?: number | null
          id?: string
          pricing?: string | null
          provider?: string | null
          resource_title: string
          resource_type?: string | null
          resource_url: string
          roadmap_id?: string | null
          skill_name: string
          status?: string | null
          updated_at?: string | null
          user_id: string
          verification_status?: string | null
        }
        Update: {
          created_at?: string | null
          difficulty?: string | null
          estimated_hours?: number | null
          id?: string
          pricing?: string | null
          provider?: string | null
          resource_title?: string
          resource_type?: string | null
          resource_url?: string
          roadmap_id?: string | null
          skill_name?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
          verification_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "learning_resources_roadmap_id_fkey"
            columns: ["roadmap_id"]
            isOneToOne: false
            referencedRelation: "learning_roadmaps"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_roadmaps: {
        Row: {
          career_goal_id: string | null
          description: string | null
          duration_weeks: number | null
          generated_at: string | null
          id: string
          roadmap_data: Json
          status: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          career_goal_id?: string | null
          description?: string | null
          duration_weeks?: number | null
          generated_at?: string | null
          id?: string
          roadmap_data?: Json
          status?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          career_goal_id?: string | null
          description?: string | null
          duration_weeks?: number | null
          generated_at?: string | null
          id?: string
          roadmap_data?: Json
          status?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_roadmaps_career_goal_id_fkey"
            columns: ["career_goal_id"]
            isOneToOne: false
            referencedRelation: "career_goals"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          department: string | null
          education_level: string | null
          email: string | null
          full_name: string
          github_url: string | null
          graduation_year: number | null
          id: string
          institution: string | null
          linkedin_url: string | null
          onboarding_status: string
          portfolio_url: string | null
          profile_completion: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          department?: string | null
          education_level?: string | null
          email?: string | null
          full_name?: string
          github_url?: string | null
          graduation_year?: number | null
          id: string
          institution?: string | null
          linkedin_url?: string | null
          onboarding_status?: string
          portfolio_url?: string | null
          profile_completion?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          department?: string | null
          education_level?: string | null
          email?: string | null
          full_name?: string
          github_url?: string | null
          graduation_year?: number | null
          id?: string
          institution?: string | null
          linkedin_url?: string | null
          onboarding_status?: string
          portfolio_url?: string | null
          profile_completion?: number
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          attachment_path: string | null
          created_at: string | null
          deployment_url: string | null
          description: string | null
          github_url: string | null
          id: string
          outcomes: string | null
          project_category: string | null
          project_name: string
          project_type: string | null
          role: string | null
          technologies: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          attachment_path?: string | null
          created_at?: string | null
          deployment_url?: string | null
          description?: string | null
          github_url?: string | null
          id?: string
          outcomes?: string | null
          project_category?: string | null
          project_name: string
          project_type?: string | null
          role?: string | null
          technologies?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          attachment_path?: string | null
          created_at?: string | null
          deployment_url?: string | null
          description?: string | null
          github_url?: string | null
          id?: string
          outcomes?: string | null
          project_category?: string | null
          project_name?: string
          project_type?: string | null
          role?: string | null
          technologies?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      scoring_reports: {
        Row: {
          career_preparation_score: number | null
          certification_score: number | null
          created_at: string | null
          evidence_coverage: number | null
          id: string
          overall_score: number | null
          portfolio_score: number | null
          project_score: number | null
          report_data: Json
          skill_score: number | null
          target_role: string | null
          user_id: string
        }
        Insert: {
          career_preparation_score?: number | null
          certification_score?: number | null
          created_at?: string | null
          evidence_coverage?: number | null
          id?: string
          overall_score?: number | null
          portfolio_score?: number | null
          project_score?: number | null
          report_data?: Json
          skill_score?: number | null
          target_role?: string | null
          user_id: string
        }
        Update: {
          career_preparation_score?: number | null
          certification_score?: number | null
          created_at?: string | null
          evidence_coverage?: number | null
          id?: string
          overall_score?: number | null
          portfolio_score?: number | null
          project_score?: number | null
          report_data?: Json
          skill_score?: number | null
          target_role?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      complete_learner_onboarding: {
        Args: {
          p_career_goal: Json
          p_certifications: Json
          p_interests: Json
          p_preferences: Json
          p_profile: Json
          p_projects: Json
          p_skills: Json
        }
        Returns: Json
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
