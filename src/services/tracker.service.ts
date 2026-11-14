export const trackerService = {
  async getMetrics() {
    const res = await fetch('/api/student/tracker');
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to fetch tracker metrics');
    return json.data;
  },

  async logStudyHours(hours: number, topic?: string) {
    const res = await fetch('/api/student/tracker', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'LOG_HOURS', hours, topic: topic || 'Core Study Session' })
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to log study hours');
    return json.data;
  },

  async toggleMilestone(milestoneId: number, statusOrCompleted: string | boolean) {
    const isCompleted = typeof statusOrCompleted === 'boolean' 
      ? statusOrCompleted 
      : statusOrCompleted === 'COMPLETED';

    const res = await fetch('/api/student/tracker', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'TOGGLE_MILESTONE', milestoneId, isCompleted })
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to toggle milestone');
    return json.data;
  }
};
