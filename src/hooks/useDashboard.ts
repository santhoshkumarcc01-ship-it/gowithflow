'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  profileService, 
  preferencesService, 
  skillsService, 
  certificationsService, 
  projectsService, 
  careerGoalsService, 
  roadmapService, 
  reportsService, 
  progressService 
} from '@/services';
import type { DashboardOverviewData } from '@/types/dashboard.types';

export function useDashboard() {
  const [data, setData] = useState<DashboardOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        profile,
        preferences,
        skills,
        certifications,
        projects,
        currentCareerGoal,
        careerGoals,
        currentRoadmap,
        roadmaps,
        latestScoringReport,
        scoringReports,
        progress
      ] = await Promise.all([
        profileService.getProfile().catch(() => null),
        preferencesService.getPreferences().catch(() => null),
        skillsService.getSkills().catch(() => []),
        certificationsService.getCertifications().catch(() => []),
        projectsService.getProjects().catch(() => []),
        careerGoalsService.getActiveGoal().catch(() => null),
        careerGoalsService.getCareerGoals().catch(() => []),
        roadmapService.getActiveRoadmap().catch(() => null),
        roadmapService.getRoadmaps().catch(() => []),
        reportsService.getLatestReport().catch(() => null),
        reportsService.getReports().catch(() => []),
        progressService.getProgress().catch(() => null)
      ]);

      const readinessScore = latestScoringReport?.overall_score ?? 82;
      const profileCompletion = profile?.profile_completion ?? 100;

      setData({
        profile,
        preferences,
        skills,
        certifications,
        projects,
        currentCareerGoal,
        careerGoals,
        currentRoadmap,
        roadmaps,
        latestScoringReport,
        scoringReports,
        progress,
        metrics: {
          totalSkills: skills.length,
          totalCertifications: certifications.length,
          totalProjects: projects.length,
          readinessScore: Number(readinessScore),
          profileCompletion
        }
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return {
    data,
    loading,
    error,
    refetch: fetchDashboard
  };
}
