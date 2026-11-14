import { supabase } from '@/lib/supabase';
import type { ScoringReport } from '@/types/learner.types';

export const reportsService = {
  async getReports(): Promise<ScoringReport[]> {
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data, error } = await supabase
        .from('scoring_reports')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) return data as ScoringReport[];
    }

    try {
      const res = await fetch('/api/skillpath/overview');
      const json = await res.json();
      return json.data?.scoringReports || [];
    } catch {
      return [];
    }
  },

  async getLatestReport(): Promise<ScoringReport | null> {
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data, error } = await supabase
        .from('scoring_reports')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) return data as ScoringReport;
    }

    try {
      const res = await fetch('/api/skillpath/overview');
      const json = await res.json();
      return json.data?.latestScoringReport || null;
    } catch {
      return null;
    }
  },

  async saveReport(report: {
    targetRole?: string;
    overallScore: number;
    skillScore?: number;
    projectScore?: number;
    certificationScore?: number;
    portfolioScore?: number;
    careerPreparationScore?: number;
    evidenceCoverage?: number;
    reportData: any;
  }): Promise<ScoringReport | null> {
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data, error } = await supabase
        .from('scoring_reports')
        .insert({
          user_id: user.id,
          target_role: report.targetRole || 'Full Stack Developer',
          overall_score: report.overallScore,
          skill_score: report.skillScore || 80,
          project_score: report.projectScore || 85,
          certification_score: report.certificationScore || 75,
          portfolio_score: report.portfolioScore || 90,
          career_preparation_score: report.careerPreparationScore || 82,
          evidence_coverage: report.evidenceCoverage || 95,
          report_data: report.reportData
        })
        .select()
        .single();

      if (error) throw error;
      return data as ScoringReport;
    }

    return null;
  }
};
