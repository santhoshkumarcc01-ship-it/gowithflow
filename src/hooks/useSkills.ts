'use client';

import { useState, useEffect, useCallback } from 'react';
import { skillsService } from '@/services/skills.service';
import type { LearnerSkill, LearnerSkillUpdate } from '@/types/learner.types';

export function useSkills() {
  const [skills, setSkills] = useState<LearnerSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSkills = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await skillsService.getSkills();
      setSkills(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSkills();
  }, [fetchSkills]);

  const addSkill = async (skill: {
    skillName: string;
    proficiency?: string;
    source?: string;
    category?: string;
    selfAssessedScore?: number;
    evidenceDescription?: string;
  }) => {
    try {
      const created = await skillsService.addSkill(skill);
      if (created) {
        setSkills(prev => [created, ...prev]);
      }
      return created;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const updateSkill = async (id: string, updates: LearnerSkillUpdate) => {
    try {
      const updated = await skillsService.updateSkill(id, updates);
      if (updated) {
        setSkills(prev => prev.map(s => s.id === id ? updated : s));
      }
      return updated;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const deleteSkill = async (id: string) => {
    try {
      await skillsService.deleteSkill(id);
      setSkills(prev => prev.filter(s => s.id !== id));
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return {
    skills,
    loading,
    error,
    refetch: fetchSkills,
    addSkill,
    updateSkill,
    deleteSkill
  };
}
