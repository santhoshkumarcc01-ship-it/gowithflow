'use client';

import { useState, useEffect, useCallback } from 'react';
import { profileService } from '@/services/profile.service';
import type { Profile, ProfileUpdate } from '@/types/learner.types';

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await profileService.getProfile();
      setProfile(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = async (updates: ProfileUpdate) => {
    try {
      const updated = await profileService.updateProfile(updates);
      if (updated) {
        setProfile(updated);
      }
      return updated;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return {
    profile,
    loading,
    error,
    refetch: fetchProfile,
    updateProfile
  };
}
