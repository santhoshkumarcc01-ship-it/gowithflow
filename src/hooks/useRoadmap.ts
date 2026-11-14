'use client';

import { useState, useEffect, useCallback } from 'react';
import { roadmapService } from '@/services/roadmap.service';
import type { LearningRoadmap } from '@/types/learner.types';

export function useRoadmap() {
  const [activeRoadmap, setActiveRoadmap] = useState<LearningRoadmap | null>(null);
  const [roadmaps, setRoadmaps] = useState<LearningRoadmap[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRoadmap = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [active, all] = await Promise.all([
        roadmapService.getActiveRoadmap(),
        roadmapService.getRoadmaps()
      ]);
      setActiveRoadmap(active);
      setRoadmaps(all);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoadmap();
  }, [fetchRoadmap]);

  return {
    activeRoadmap,
    roadmaps,
    loading,
    error,
    refetch: fetchRoadmap
  };
}
