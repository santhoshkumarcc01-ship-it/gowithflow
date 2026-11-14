export const chatService = {
  async getConversation(conversationId?: string) {
    const url = conversationId ? `/api/student/chat?conversationId=${conversationId}` : '/api/student/chat';
    const res = await fetch(url, {
      method: 'GET',
      credentials: 'same-origin'
    });
    return res.json();
  },

  async listConversations() {
    const res = await fetch('/api/student/chat?action=list', {
      method: 'GET',
      credentials: 'same-origin'
    });
    return res.json();
  },

  async askQuestion(
    query: string, 
    conversationHistory: Array<{ role: string; text?: string; parts?: string }> = [],
    conversationId?: string
  ) {
    const res = await fetch('/api/student/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ 
        message: query, 
        query, 
        conversationId,
        history: conversationHistory, 
        conversationHistory 
      })
    });
    return res.json();
  },

  async sendMessage(
    query: string, 
    conversationHistory: Array<{ role: 'user' | 'model'; parts?: string; text?: string }> = [],
    conversationId?: string
  ) {
    const res = await this.askQuestion(query, conversationHistory, conversationId);
    if (!res.success) throw new Error(res.error?.message || res.error || 'Failed to send chat query');
    return res.data;
  },

  async clearConversation(conversationId: string) {
    const res = await fetch(`/api/student/chat?conversationId=${encodeURIComponent(conversationId)}`, {
      method: 'DELETE',
      credentials: 'same-origin'
    });
    return res.json();
  }
};
