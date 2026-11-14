'use client';

import { useState, useEffect, useCallback } from 'react';
import { progressService } from '@/services/progress.service';
import type { LearnerProgress } from '@/types/learner.types';

export function useProgress() {
  const [progress, setProgress] = useState<LearnerProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProgress = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await progressService.getProgress();
      setProgress(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  const updateProgress = async (newProgress: {
    roadmapId?: string;
    resourceId?: string;
    progressPercentage: number;
    completionStatus?: string;
  }) => {
    try {
      const updated = await progressService.updateProgress(newProgress);
      if (updated) {
        setProgress(updated);
      }
      return updated;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return {
    progress,
    loading,
    error,
    refetch: fetchProgress,
    updateProgress
  };
}
