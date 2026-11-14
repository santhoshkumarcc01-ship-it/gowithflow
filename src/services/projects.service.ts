import { supabase } from '@/lib/supabase';
import type { Project, ProjectInsert, ProjectUpdate } from '@/types/learner.types';

export const projectsService = {
  async getProjects(): Promise<Project[]> {
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) return data as Project[];
    }

    try {
      const res = await fetch('/api/skillpath/projects');
      const json = await res.json();
      return json.data || [];
    } catch {
      return [];
    }
  },

  async addProject(project: {
    name?: string;
    projectName?: string;
    description?: string;
    projectCategory?: string;
    technologies?: string[] | string;
    githubUrl?: string;
    deploymentUrl?: string;
    role?: string;
    projectType?: string;
    outcomes?: string;
    attachmentPath?: string;
  }): Promise<Project | null> {
    const { data: { user } } = await supabase.auth.getUser();
    const projName = project.projectName || project.name || 'Featured Project';

    const techArray = Array.isArray(project.technologies)
      ? project.technologies
      : (typeof project.technologies === 'string' ? project.technologies.split(',').map(s => s.trim()).filter(Boolean) : []);

    if (user) {
      const insertData: ProjectInsert = {
        user_id: user.id,
        project_name: projName,
        description: project.description || null,
        project_category: project.projectCategory || 'Full Stack',
        technologies: techArray,
        github_url: project.githubUrl || null,
        deployment_url: project.deploymentUrl || null,
        role: project.role || 'Lead Developer',
        project_type: project.projectType || 'Individual',
        outcomes: project.outcomes || null,
        attachment_path: project.attachmentPath || null
      };

      const { data, error } = await supabase
        .from('projects')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return data as Project;
    }

    const res = await fetch('/api/skillpath/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...project,
        projectName: projName,
        name: projName
      })
    });
    const json = await res.json();
    return json.data || null;
  },

  async updateProject(id: string, updates: ProjectUpdate): Promise<Project | null> {
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data, error } = await supabase
        .from('projects')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data as Project;
    }

    return null;
  },

  async deleteProject(id: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      return true;
    }

    const res = await fetch(`/api/skillpath/projects?id=${id}`, { method: 'DELETE' });
    const json = await res.json();
    return json.success;
  }
};
