import { supabase } from '@/lib/supabase';

export const agentService = {
  async runWorkflow(agentType: 'WF-01_SUGGESTION' | 'WF-02_SCORING', payload: Record<string, unknown> = {}) {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    const res = await fetch('/api/skillpath/agents', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      credentials: 'same-origin',
      body: JSON.stringify({
        agentType,
        payload
      })
    });

    const json = await res.json();
    if (!json.success) {
      throw new Error(json.error || `Agent workflow ${agentType} failed.`);
    }

    return json.data;
  },

  async runSuggestionAgent(targetRole?: string) {
    return this.runWorkflow('WF-01_SUGGESTION', { targetRole });
  },

  async runScoringAgent(targetRole?: string) {
    return this.runWorkflow('WF-02_SCORING', { targetRole });
  }
};
