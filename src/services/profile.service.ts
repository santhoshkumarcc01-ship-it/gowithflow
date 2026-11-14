import { supabase } from '@/lib/supabase';
import type { Profile, ProfileUpdate } from '@/types/learner.types';

export const profileService = {
  async getProfile(): Promise<Profile | null> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (!error && data) return data as Profile;
    }

    // Fallback to local server endpoint
    try {
      const res = await fetch('/api/skillpath/overview');
      const json = await res.json();
      return json.data?.profile || null;
    } catch {
      return null;
    }
  },

  async updateProfile(updates: ProfileUpdate): Promise<Profile | null> {
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data as Profile;
    }

    // Fallback to local endpoint
    const res = await fetch('/api/student/onboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    const json = await res.json();
    return json.data || null;
  }
};
