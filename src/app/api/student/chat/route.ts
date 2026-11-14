import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import prisma from '@/lib/db';
import { AIService, MaterialContextItem, AssignmentContextItem, RoadmapContextItem } from '@/lib/ai';
import { ConversationService } from '@/lib/ai/memory';

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized. Please sign in.' } }, { status: 401 });
    }
    const userId = authUser.id;

    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get('conversationId') || undefined;
    const action = searchParams.get('action');

    // If requesting conversation list
    if (action === 'list') {
      const conversations = await ConversationService.listUserConversations(userId);
      return NextResponse.json({
        success: true,
        data: { conversations }
      });
    }

    // Get active or specified conversation
    const conversation = await ConversationService.getOrCreateConversation(userId, conversationId);
    const memories = await ConversationService.getLearnerMemories(userId);

    return NextResponse.json({
      success: true,
      data: {
        conversation: {
          id: conversation.id,
          title: conversation.title,
          agentType: conversation.agentType,
          createdAt: conversation.createdAt,
          updatedAt: conversation.updatedAt,
          messages: conversation.messages.map(m => {
            let parsedMeta: any = {};
            try {
              if (m.metadata) parsedMeta = JSON.parse(m.metadata);
            } catch {
              parsedMeta = {};
            }
            return {
              id: m.id,
              role: m.role,
              content: m.content,
              intent: m.intent,
              suggestions: parsedMeta.suggestions || [],
              sources: parsedMeta.sources || [],
              createdAt: m.createdAt
            };
          })
        },
        memories: memories.map(m => ({
          id: m.id,
          type: m.memoryType,
          content: m.memoryContent,
          updatedAt: m.updatedAt
        }))
      }
    });
  } catch (error) {
    console.error('[API student-chat GET error]:', error);
    return NextResponse.json({ 
      success: false, 
      error: { code: 'INTERNAL_ERROR', message: 'Unable to retrieve chat history at this time.' } 
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized. Please sign in.' } }, { status: 401 });
    }
    const userId = authUser.id;

    const body = await req.json().catch(() => ({}));
    const rawMessage = body.message || body.query;
    const clientConversationId = body.conversationId;

    if (!rawMessage || typeof rawMessage !== 'string' || !rawMessage.trim()) {
      return NextResponse.json({ 
        success: false, 
        error: { code: 'VALIDATION_FAILED', message: 'Message is required and cannot be empty.' } 
      }, { status: 400 });
    }
    const message = rawMessage.trim();

    // 1. Get or create active conversation
    const conversation = await ConversationService.getOrCreateConversation(userId, clientConversationId);

    // 2. Fetch full student context across both databases/models
    const [
      student, 
      learnerProfile, 
      careerGoal, 
      skills, 
      projects, 
      certs, 
      preferences, 
      progress,
      memories
    ] = await Promise.all([
      prisma.student.findUnique({
        where: { userId },
        include: {
          user: true,
          department: true,
          careerProfile: true
        }
      }).catch(() => null),
      prisma.learnerProfile.findUnique({ where: { userId } }).catch(() => null),
      prisma.learnerCareerGoal.findFirst({ where: { userId, isCurrent: true } }).catch(() => null),
      prisma.learnerSkillItem.findMany({ where: { userId } }).catch(() => []),
      prisma.learnerProject.findMany({ where: { userId } }).catch(() => []),
      prisma.learnerCertification.findMany({ where: { userId } }).catch(() => []),
      prisma.learnerPreference.findUnique({ where: { userId } }).catch(() => null),
      prisma.learnerProgressItem.findUnique({ where: { userId } }).catch(() => null),
      ConversationService.getLearnerMemories(userId).catch(() => [])
    ]);

    const studentName = authUser.name || learnerProfile?.fullName || student?.user?.name || 'Learner';
    const departmentName = student?.department?.name || learnerProfile?.department || 'Computer Science';
    const targetRole = careerGoal?.primaryRole || student?.careerProfile?.targetRole || 'Full Stack Developer';

    // 3. Fetch academic materials and assignments
    let classIds: string[] = [];
    let enrolledSubjects: string[] = [];
    let attendancePercentage = 100;
    let pendingAssignmentsCount = 0;

    if (student) {
      const enrolls = await prisma.enrollment.findMany({
        where: { studentId: student.id },
        include: {
          classSection: {
            include: { facultySubjects: { include: { subject: true } } }
          }
        }
      });
      classIds = enrolls.map(e => e.classSectionId);
      enrolledSubjects = Array.from(new Set(
        enrolls.flatMap(e => e.classSection?.facultySubjects?.map(fs => fs.subject?.name) || []).filter(Boolean)
      )) as string[];

      // Attendance
      const sessions = await prisma.attendanceSession.findMany({
        where: { classSectionId: { in: classIds } },
        include: { records: { where: { studentId: student.id } } }
      });
      const totalSessions = sessions.length;
      const attended = sessions.filter(s => s.records.some(r => r.status === 'PRESENT' || r.status === 'LATE')).length;
      attendancePercentage = totalSessions > 0 ? Math.round((attended / totalSessions) * 100) : 100;

      // Assignments
      const totalAssignments = await prisma.assignment.count({ where: { classSectionId: { in: classIds } } });
      const submitted = await prisma.assignmentSubmission.count({ where: { studentId: student.id } });
      pendingAssignmentsCount = Math.max(0, totalAssignments - submitted);
    }

    // 4. Fetch real course materials
    const rawMaterials = classIds.length > 0
      ? await prisma.material.findMany({
          where: { classSectionId: { in: classIds }, status: 'PUBLISHED' },
          include: { subject: true },
          take: 12
        })
      : await prisma.material.findMany({
          where: { status: 'PUBLISHED' },
          include: { subject: true },
          take: 8
        });

    const materialsContext: MaterialContextItem[] = rawMaterials.map(m => ({
      id: m.id,
      title: m.title,
      category: m.category,
      subject: m.subject?.name || 'General Coursework',
      fileName: m.fileName,
      fileUrl: m.fileUrl,
      description: m.description
    }));

    // 5. Fetch roadmap
    const roadmap = await prisma.learningRoadmap.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    let roadmapPhases: RoadmapContextItem[] = [];
    if (roadmap?.phases) {
      try {
        const parsed = JSON.parse(roadmap.phases);
        if (Array.isArray(parsed)) {
          roadmapPhases = parsed.map((p: any, idx: number) => ({
            phaseNumber: p.phaseNumber || idx + 1,
            title: p.title || p.name || `Phase ${idx + 1}`,
            status: p.status || 'IN_PROGRESS',
            topics: Array.isArray(p.topics) ? p.topics : (Array.isArray(p.skills) ? p.skills : [])
          }));
        }
      } catch {
        // Ignored
      }
    }

    // 6. Save incoming user message to persistent conversation
    await ConversationService.saveMessage({
      conversationId: conversation.id,
      userId,
      role: 'user',
      content: message
    });

    // 7. Load recent conversation history for memory
    const historyMessages = (conversation.messages || []).map(m => ({
      role: m.role,
      content: m.content
    }));

    // 8. Process message through AI Mentor Engine
    const mentorResult = await AIService.processMentorMessage({
      userId,
      message,
      history: historyMessages,
      context: {
        userId,
        studentName,
        targetRole,
        department: departmentName,
        educationLevel: learnerProfile?.educationLevel || undefined,
        skills: skills.map(s => s.skillName),
        projects: projects.map(p => ({
          name: p.name,
          description: p.description,
          technologies: typeof p.technologies === 'string' ? p.technologies : JSON.stringify(p.technologies)
        })),
        certifications: certs.map(c => c.name),
        weeklyHoursTarget: preferences?.weeklyHours || 12,
        loggedHours: progress?.totalLearningHours || 0,
        completedMilestones: progress?.completedMilestones || 0,
        pendingMilestones: progress?.pendingMilestones || (roadmapPhases.length || 3),
        attendancePercentage,
        pendingAssignmentsCount,
        enrolledSubjects: enrolledSubjects.length > 0 ? enrolledSubjects : ['Computer Science', 'System Design'],
        materials: materialsContext,
        roadmapPhases,
        userMemories: memories.map(m => ({ type: m.memoryType, content: m.memoryContent }))
      }
    });

    // 9. Save AI response to persistent conversation
    const savedAiMessage = await ConversationService.saveMessage({
      conversationId: conversation.id,
      userId,
      role: 'model',
      content: mentorResult.reply,
      intent: mentorResult.intent,
      metadata: {
        agent: mentorResult.agent,
        suggestions: mentorResult.suggestions,
        sources: mentorResult.sources || []
      }
    });

    // 10. Extract and save persistent memory if user shared key goals or interests
    const lowerMsg = message.toLowerCase();
    if (lowerMsg.includes('i want to become') || lowerMsg.includes('target role is') || lowerMsg.includes('aiming for')) {
      await ConversationService.saveLearnerMemory({
        userId,
        memoryType: 'GOAL',
        memoryKey: 'target_ambition',
        memoryContent: `Learner indicated career ambition: "${message}"`
      }).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      data: {
        conversationId: conversation.id,
        messageId: savedAiMessage.id,
        role: 'model',
        reply: mentorResult.reply,
        intent: mentorResult.intent,
        agent: mentorResult.agent,
        suggestions: mentorResult.suggestions,
        sources: mentorResult.sources || [],
        createdAt: savedAiMessage.createdAt
      }
    });
  } catch (error) {
    console.error('[API student-chat POST error]:', error);
    // Resilient fallback: return helpful message instead of raw 500 error
    return NextResponse.json({
      success: true,
      data: {
        role: 'model',
        reply: "### I'm Here to Help\n\nI processed your request, but our real-time network connection experienced a brief hiccup. Please ask your question again, or explore your **Career Strategy** tab for your personalized roadmap!",
        intent: 'GENERAL_CONVERSATION',
        agent: 'AI_MENTOR',
        suggestions: [
          'What are the top skills for my target role?',
          'Evaluate my career readiness score.',
          'Show me my personalized roadmap.'
        ]
      }
    });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get('conversationId');

    if (!conversationId) {
      return NextResponse.json({ success: false, error: 'conversationId is required.' }, { status: 400 });
    }

    await ConversationService.clearConversation(conversationId, authUser.id);

    return NextResponse.json({
      success: true,
      message: 'Conversation cleared successfully.'
    });
  } catch (error) {
    console.error('[API student-chat DELETE error]:', error);
    return NextResponse.json({ success: false, error: 'Unable to clear conversation.' }, { status: 500 });
  }
}
