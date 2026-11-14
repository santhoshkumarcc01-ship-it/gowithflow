export const chatService = {
  async askQuestion(query: string, conversationHistory: Array<{ role: string; text?: string; parts?: string }> = []) {
    const res = await fetch('/api/student/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ 
        message: query, 
        query, 
        history: conversationHistory, 
        conversationHistory 
      })
    });
    const json = await res.json();
    return json;
  },

  async sendMessage(query: string, conversationHistory: Array<{ role: 'user' | 'model'; parts: string }> = []) {
    const res = await this.askQuestion(query, conversationHistory);
    if (!res.success) throw new Error(res.error?.message || res.error || 'Failed to send chat query');
    return res.data;
  }
};
