import prisma from '@/lib/db';

export interface ChatHistoryMessage {
  id?: string;
  role: 'user' | 'model' | 'assistant' | 'system';
  content: string;
  intent?: string | null;
  metadata?: any;
  createdAt?: string | Date;
}

export class ConversationService {
  /**
   * Get an existing conversation or create a new one for the user
   */
  static async getOrCreateConversation(userId: string, conversationId?: string, initialTitle?: string) {
    if (conversationId) {
      const existing = await prisma.conversation.findFirst({
        where: { id: conversationId, userId },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
            take: 50
          }
        }
      });
      if (existing) return existing;
    }

    // Look for the most recent conversation from the last 24 hours
    const recent = await prisma.conversation.findFirst({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 50
        }
      }
    });

    if (recent && (!conversationId || conversationId === 'latest')) {
      return recent;
    }

    // Create a new conversation
    return prisma.conversation.create({
      data: {
        ...(conversationId && conversationId !== 'latest' ? { id: conversationId } : {}),
        userId,
        title: initialTitle || 'Career & Learning Chat',
        agentType: 'AI_MENTOR'
      },
      include: {
        messages: true
      }
    });
  }

  /**
   * List all conversations for a user
   */
  static async listUserConversations(userId: string, limit: number = 20) {
    return prisma.conversation.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });
  }

  /**
   * Save a message into the conversation
   */
  static async saveMessage(params: {
    conversationId: string;
    userId: string;
    role: 'user' | 'model' | 'assistant' | 'system';
    content: string;
    intent?: string;
    metadata?: Record<string, any>;
  }) {
    const metaString = params.metadata ? JSON.stringify(params.metadata) : '{}';

    const message = await prisma.conversationMessage.create({
      data: {
        conversationId: params.conversationId,
        userId: params.userId,
        role: params.role,
        content: params.content,
        intent: params.intent || null,
        metadata: metaString
      }
    });

    // Update conversation updatedAt timestamp and title if it's the first user message
    const conv = await prisma.conversation.findUnique({
      where: { id: params.conversationId },
      select: { title: true }
    });

    let newTitle: string | undefined = undefined;
    if (params.role === 'user' && conv?.title === 'New Conversation' || conv?.title === 'Career & Learning Chat') {
      newTitle = params.content.slice(0, 40) + (params.content.length > 40 ? '...' : '');
    }

    await prisma.conversation.update({
      where: { id: params.conversationId },
      data: {
        updatedAt: new Date(),
        ...(newTitle ? { title: newTitle } : {})
      }
    });

    return message;
  }

  /**
   * Clear all messages in a conversation or delete the conversation
   */
  static async clearConversation(conversationId: string, userId: string) {
    await prisma.conversationMessage.deleteMany({
      where: { conversationId, userId }
    });
    return prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date(), title: 'New Conversation' }
    });
  }

  /**
   * Delete conversation permanently
   */
  static async deleteConversation(conversationId: string, userId: string) {
    return prisma.conversation.deleteMany({
      where: { id: conversationId, userId }
    });
  }

  /**
   * Save a persistent memory about the learner
   */
  static async saveLearnerMemory(params: {
    userId: string;
    memoryType: 'GOAL' | 'PROJECT' | 'PREFERENCE' | 'CHALLENGE' | 'FACT';
    memoryContent: string;
    memoryKey?: string;
    source?: string;
  }) {
    if (params.memoryKey) {
      const existing = await prisma.learnerAiMemory.findFirst({
        where: { userId: params.userId, memoryKey: params.memoryKey }
      });
      if (existing) {
        return prisma.learnerAiMemory.update({
          where: { id: existing.id },
          data: {
            memoryContent: params.memoryContent,
            memoryType: params.memoryType,
            updatedAt: new Date()
          }
        });
      }
    }

    return prisma.learnerAiMemory.create({
      data: {
        userId: params.userId,
        memoryType: params.memoryType,
        memoryKey: params.memoryKey || null,
        memoryContent: params.memoryContent,
        source: params.source || 'CHAT'
      }
    });
  }

  /**
   * Get all active memories for learner
   */
  static async getLearnerMemories(userId: string) {
    return prisma.learnerAiMemory.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: 15
    });
  }
}
