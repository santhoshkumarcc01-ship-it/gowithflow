import { supabase } from '@/lib/supabase';
import type { LearnerProgress } from '@/types/learner.types';

export const progressService = {
  async getProgress(): Promise<LearnerProgress | null> {
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data, error } = await supabase
        .from('learner_progress')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) return data as LearnerProgress;
    }

    try {
      const res = await fetch('/api/skillpath/overview');
      const json = await res.json();
      return json.data?.progress || null;
    } catch {
      return null;
    }
  },

  async updateProgress(progress: {
    roadmapId?: string;
    resourceId?: string;
    progressPercentage: number;
    completionStatus?: string;
  }): Promise<LearnerProgress | null> {
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data, error } = await supabase
        .from('learner_progress')
        .upsert({
          user_id: user.id,
          roadmap_id: progress.roadmapId || null,
          resource_id: progress.resourceId || null,
          progress_percentage: progress.progressPercentage,
          completion_status: progress.completionStatus || 'in_progress',
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data as LearnerProgress;
    }

    return null;
  }
};
