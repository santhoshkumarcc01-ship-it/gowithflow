'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { authService } from '@/services/auth.service';
import type { User, Session } from '@supabase/supabase-js';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function initAuth() {
      try {
        const currentSession = await authService.getSession();
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    initAuth();

    const subscription = authService.onAuthStateChange((newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setError(null);
    try {
      const data = await authService.signInWithPassword(email, password);
      setUser(data.user);
      setSession(data.session);
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    setError(null);
    try {
      const data = await authService.signUp(email, password, fullName);
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const signOut = async () => {
    setError(null);
    try {
      await authService.signOut();
      setUser(null);
      setSession(null);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const resetPassword = async (email: string) => {
    setError(null);
    try {
      return await authService.resetPasswordForEmail(email);
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return {
    user,
    session,
    loading,
    error,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signOut,
    resetPassword
  };
}
