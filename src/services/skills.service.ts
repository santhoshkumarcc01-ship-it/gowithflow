import { supabase } from '@/lib/supabase';
import type { LearnerSkill, LearnerSkillInsert, LearnerSkillUpdate } from '@/types/learner.types';

export const skillsService = {
  async getSkills(): Promise<LearnerSkill[]> {
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data, error } = await supabase
        .from('learner_skills')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) return data as LearnerSkill[];
    }

    try {
      const res = await fetch('/api/skillpath/skills');
      const json = await res.json();
      return json.data || [];
    } catch {
      return [];
    }
  },

  async addSkill(skill: {
    skillName: string;
    proficiency?: string;
    source?: string;
    category?: string;
    selfAssessedScore?: number;
    evidenceDescription?: string;
  }): Promise<LearnerSkill | null> {
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const insertData: LearnerSkillInsert = {
        user_id: user.id,
        skill_name: skill.skillName,
        proficiency_level: skill.proficiency || 'Beginner',
        category: skill.category || 'Core Stacks',
        self_assessed_score: skill.selfAssessedScore || 70,
        evidence_source: skill.source || 'Self Assessment',
        evidence_description: skill.evidenceDescription || 'Coursework & projects'
      };

      const { data, error } = await supabase
        .from('learner_skills')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return data as LearnerSkill;
    }

    const res = await fetch('/api/skillpath/skills', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(skill)
    });
    const json = await res.json();
    return json.data || null;
  },

  async updateSkill(id: string, updates: LearnerSkillUpdate): Promise<LearnerSkill | null> {
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data, error } = await supabase
        .from('learner_skills')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data as LearnerSkill;
    }

    return null;
  },

  async deleteSkill(id: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { error } = await supabase
        .from('learner_skills')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      return true;
    }

    const res = await fetch(`/api/skillpath/skills?id=${id}`, { method: 'DELETE' });
    const json = await res.json();
    return json.success;
  }
};
