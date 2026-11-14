import { supabase } from '@/lib/supabase';
import type { LearningResource, LearningResourceInsert } from '@/types/learner.types';

export const resourcesService = {
  async getResources(roadmapId?: string): Promise<LearningResource[]> {
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      let query = supabase
        .from('learning_resources')
        .select('*')
        .eq('user_id', user.id);

      if (roadmapId) {
        query = query.eq('roadmap_id', roadmapId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (!error && data) return data as LearningResource[];
    }

    try {
      const res = await fetch('/api/skillpath/overview');
      const json = await res.json();
      return json.data?.resources || [];
    } catch {
      return [];
    }
  },

  async addResource(resource: {
    resourceTitle: string;
    skillName: string;
    provider?: string;
    resourceUrl: string;
    resourceType?: string;
    difficulty?: string;
    pricing?: string;
    estimatedHours?: number;
    roadmapId?: string;
  }): Promise<LearningResource | null> {
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const insertData: LearningResourceInsert = {
        user_id: user.id,
        resource_title: resource.resourceTitle,
        skill_name: resource.skillName,
        provider: resource.provider || 'Self Directed',
        resource_url: resource.resourceUrl,
        resource_type: resource.resourceType || 'Documentation',
        difficulty: resource.difficulty || 'Intermediate',
        pricing: resource.pricing || 'Free',
        estimated_hours: resource.estimatedHours || 5,
        roadmap_id: resource.roadmapId || null,
        verification_status: 'verified',
        status: 'recommended'
      };

      const { data, error } = await supabase
        .from('learning_resources')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return data as LearningResource;
    }

    return null;
  },

  async updateResourceStatus(id: string, status: string): Promise<LearningResource | null> {
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data, error } = await supabase
        .from('learning_resources')
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data as LearningResource;
    }

    return null;
  }
};
