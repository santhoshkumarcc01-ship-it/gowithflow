import { supabase } from '@/lib/supabase';
import type { LearnerPreference } from '@/types/learner.types';

export const preferencesService = {
  async getPreferences(): Promise<LearnerPreference | null> {
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data, error } = await supabase
        .from('learner_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!error && data) return data as LearnerPreference;
    }

    try {
      const res = await fetch('/api/skillpath/overview');
      const json = await res.json();
      return json.data?.preferences || null;
    } catch {
      return null;
    }
  },

  async upsertPreferences(preferences: {
    weekly_learning_hours?: number;
    learning_style?: string;
    budget_preference?: string;
    preferred_language?: string;
    notification_enabled?: boolean;
  }): Promise<LearnerPreference | null> {
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data, error } = await supabase
        .from('learner_preferences')
        .upsert({
          user_id: user.id,
          ...preferences,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data as LearnerPreference;
    }

    return null;
  }
};
