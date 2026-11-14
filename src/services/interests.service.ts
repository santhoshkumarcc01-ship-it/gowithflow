import { supabase } from '@/lib/supabase';
import type { LearnerInterest } from '@/types/learner.types';

export const interestsService = {
  async getInterests(): Promise<LearnerInterest[]> {
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data, error } = await supabase
        .from('learner_interests')
        .select('*')
        .eq('user_id', user.id);

      if (!error && data) return data as LearnerInterest[];
    }

    try {
      const res = await fetch('/api/skillpath/overview');
      const json = await res.json();
      return json.data?.interests || [];
    } catch {
      return [];
    }
  },

  async addInterest(interest: { interestName: string; category?: string }): Promise<LearnerInterest | null> {
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data, error } = await supabase
        .from('learner_interests')
        .insert({
          user_id: user.id,
          interest_name: interest.interestName,
          category: interest.category || 'General'
        })
        .select()
        .single();

      if (error) throw error;
      return data as LearnerInterest;
    }

    return null;
  },

  async deleteInterest(id: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { error } = await supabase
        .from('learner_interests')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      return true;
    }

    return false;
  }
};
