export const mentorService = {
  async getRecommendations() {
    const res = await fetch('/api/student/mentor');
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to fetch mentor recommendations');
    return json.data;
  },

  async dismissRecommendation(id: string) {
    const res = await fetch('/api/student/mentor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'DISMISS', recommendationId: id })
    });
    return res.json();
  },

  async adjustRecommendation(id: string, timeframeOrOptions: string | { timeframe: string; notes?: string }, notes?: string) {
    const timeframe = typeof timeframeOrOptions === 'object' ? timeframeOrOptions.timeframe : timeframeOrOptions;
    const finalNotes = typeof timeframeOrOptions === 'object' ? timeframeOrOptions.notes : notes;

    const res = await fetch('/api/student/mentor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'ADJUST', recommendationId: id, timeframe, notes: finalNotes })
    });
    return res.json();
  }
};
