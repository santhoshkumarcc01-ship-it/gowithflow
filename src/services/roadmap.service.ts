import { supabase } from '@/lib/supabase';
import type { LearningRoadmap, LearningRoadmapInsert } from '@/types/learner.types';

export const roadmapService = {
  async getRoadmaps(): Promise<LearningRoadmap[]> {
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data, error } = await supabase
        .from('learning_roadmaps')
        .select('*')
        .eq('user_id', user.id)
        .order('generated_at', { ascending: false });

      if (!error && data) return data as LearningRoadmap[];
    }

    try {
      const res = await fetch('/api/skillpath/overview');
      const json = await res.json();
      return json.data?.roadmaps || [];
    } catch {
      return [];
    }
  },

  async getActiveRoadmap(): Promise<LearningRoadmap | null> {
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data, error } = await supabase
        .from('learning_roadmaps')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('generated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) return data as LearningRoadmap;
    }

    try {
      const res = await fetch('/api/skillpath/overview');
      const json = await res.json();
      return json.data?.currentRoadmap || null;
    } catch {
      return null;
    }
  },

  async createRoadmap(roadmap: {
    title: string;
    description?: string;
    careerGoalId?: string;
    durationWeeks?: number;
    roadmapData: any;
  }): Promise<LearningRoadmap | null> {
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      // Mark existing active roadmaps as archived
      await supabase
        .from('learning_roadmaps')
        .update({ status: 'archived' })
        .eq('user_id', user.id)
        .eq('status', 'active');

      const insertData: LearningRoadmapInsert = {
        user_id: user.id,
        title: roadmap.title,
        description: roadmap.description || null,
        career_goal_id: roadmap.careerGoalId || null,
        duration_weeks: roadmap.durationWeeks || 12,
        roadmap_data: roadmap.roadmapData,
        status: 'active'
      };

      const { data, error } = await supabase
        .from('learning_roadmaps')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return data as LearningRoadmap;
    }

    return null;
  }
};
