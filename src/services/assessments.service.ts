import { supabase } from '@/lib/supabase';
import type { Assessment } from '@/types/learner.types';

export const assessmentsService = {
  async getAssessments(): Promise<Assessment[]> {
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data, error } = await supabase
        .from('assessments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) return data as Assessment[];
    }

    try {
      const res = await fetch('/api/skillpath/overview');
      const json = await res.json();
      return json.data?.assessments || [];
    } catch {
      return [];
    }
  },

  async saveAssessment(assessment: {
    skillName: string;
    assessmentType?: string;
    questions?: any;
    answers?: any;
    score?: number;
    feedback?: any;
  }): Promise<Assessment | null> {
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data, error } = await supabase
        .from('assessments')
        .insert({
          user_id: user.id,
          skill_name: assessment.skillName,
          assessment_type: assessment.assessmentType || 'Diagnostic',
          questions: assessment.questions || null,
          answers: assessment.answers || null,
          score: assessment.score || 85,
          feedback: assessment.feedback || null,
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data as Assessment;
    }

    return null;
  }
};
