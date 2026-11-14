import { supabase } from '@/lib/supabase';
import type { CareerGoal, CareerGoalInsert, CareerGoalUpdate } from '@/types/learner.types';

export const careerGoalsService = {
  async getCareerGoals(): Promise<CareerGoal[]> {
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data, error } = await supabase
        .from('career_goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) return data as CareerGoal[];
    }

    try {
      const res = await fetch('/api/skillpath/overview');
      const json = await res.json();
      return json.data?.careerGoals || [];
    } catch {
      return [];
    }
  },

  async getActiveGoal(): Promise<CareerGoal | null> {
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data, error } = await supabase
        .from('career_goals')
        .select('*')
        .eq('user_id', user.id)
        .eq('goal_status', 'active')
        .maybeSingle();

      if (!error && data) return data as CareerGoal;
    }

    try {
      const res = await fetch('/api/skillpath/overview');
      const json = await res.json();
      return json.data?.currentCareerGoal || null;
    } catch {
      return null;
    }
  },

  async createGoal(goal: {
    targetRole?: string;
    primaryRole?: string;
    secondaryRole?: string;
    preferredIndustry?: string;
    targetIndustry?: string;
    targetTimeline?: string;
    targetDate?: string;
    motivation?: string;
    reason?: string;
    confidenceLevel?: number | string;
  }): Promise<CareerGoal | null> {
    const { data: { user } } = await supabase.auth.getUser();
    const role = goal.targetRole || goal.primaryRole || 'Full Stack Developer';
    const industry = goal.preferredIndustry || goal.targetIndustry || 'Technology & Software';
    const confLevel = typeof goal.confidenceLevel === 'number' 
      ? goal.confidenceLevel 
      : (goal.confidenceLevel === 'High' ? 90 : (goal.confidenceLevel === 'Medium' ? 70 : 80));

    if (user) {
      // Deactivate existing active goals
      await supabase
        .from('career_goals')
        .update({ goal_status: 'inactive' })
        .eq('user_id', user.id)
        .eq('goal_status', 'active');

      const insertData: CareerGoalInsert = {
        user_id: user.id,
        target_role: role,
        secondary_role: goal.secondaryRole || null,
        preferred_industry: industry,
        target_timeline: goal.targetTimeline || goal.targetDate || '6 Months',
        motivation: goal.motivation || goal.reason || 'Professional career advancement',
        confidence_level: confLevel,
        goal_status: 'active'
      };

      const { data, error } = await supabase
        .from('career_goals')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return data as CareerGoal;
    }

    const res = await fetch('/api/skillpath/career', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        primaryRole: role,
        targetRole: role,
        secondaryRole: goal.secondaryRole,
        preferredIndustry: industry,
        targetDate: goal.targetTimeline || goal.targetDate,
        reason: goal.motivation || goal.reason,
        confidenceLevel: goal.confidenceLevel
      })
    });
    const json = await res.json();
    return json.data || null;
  },

  async updateGoal(id: string, updates: CareerGoalUpdate): Promise<CareerGoal | null> {
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data, error } = await supabase
        .from('career_goals')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data as CareerGoal;
    }

    return null;
  },

  // Flexible overload for updateCareerGoal
  async updateCareerGoal(idOrGoal: string | any, updates?: CareerGoalUpdate): Promise<CareerGoal | null> {
    if (typeof idOrGoal === 'object' && idOrGoal !== null) {
      return this.createGoal(idOrGoal);
    }
    return this.updateGoal(idOrGoal, updates || {});
  }
};
