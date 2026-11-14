import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export async function completeOnboarding(data: {
  profile: Record<string, unknown>;
  preferences: Record<string, unknown>;
  interests: unknown[];
  skills: unknown[];
  certifications: unknown[];
  projects: unknown[];
  careerGoal: Record<string, unknown>;
}) {
  const { data: { user } } = await supabase.auth.getUser();

  // If Supabase user session exists and Supabase is configured, invoke RPC
  if (isSupabaseConfigured && user) {
    const { data: result, error } = await supabase.rpc(
      "complete_learner_onboarding" as any,
      {
        p_profile: data.profile as any,
        p_preferences: data.preferences as any,
        p_interests: data.interests as any,
        p_skills: data.skills as any,
        p_certifications: data.certifications as any,
        p_projects: data.projects as any,
        p_career_goal: data.careerGoal as any,
      } as any
    );

    if (error) {
      console.warn("[Supabase RPC Warning]:", error.message);
    } else {
      // Also persist to local database for seamless offline/dev parity
      await fetch('/api/skillpath/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).catch(() => {});
      return result;
    }
  }

  // Local Next.js API persistence fallback
  const res = await fetch('/api/skillpath/onboarding', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

  const json = await res.json();
  if (!json.success) {
    throw new Error(json.error || 'Failed to complete onboarding');
  }

  return json.data;
}

export const onboardingService = {
  completeOnboarding
};
