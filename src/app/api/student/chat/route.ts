import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import prisma from '@/lib/db';
import { AIService, MaterialContextItem, AssignmentContextItem, RoadmapContextItem } from '@/lib/ai';

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized. Please sign in.' } }, { status: 401 });
    }
    const userId = authUser.id;

    const [student, learnerProfile, careerGoal] = await Promise.all([
      prisma.student.findUnique({
        where: { userId },
        include: {
          user: true,
          department: true,
          careerProfile: true
        }
      }).catch(() => null),
      prisma.learnerProfile.findUnique({ where: { userId } }).catch(() => null),
      prisma.learnerCareerGoal.findFirst({ where: { userId, isCurrent: true } }).catch(() => null)
    ]);

    const studentName = authUser.name || learnerProfile?.fullName || student?.user?.name || 'Learner';
    const departmentName = student?.department?.name || learnerProfile?.department || 'Computer Science';
    const targetRole = careerGoal?.primaryRole || student?.careerProfile?.targetRole || 'Full Stack Developer';

    const body = await req.json();
    const rawMessage = body.message || body.query;
    const history = body.history || body.conversationHistory || [];

    if (!rawMessage || typeof rawMessage !== 'string' || !rawMessage.trim()) {
      return NextResponse.json({ success: false, error: { code: 'VALIDATION_FAILED', message: 'Message is required.' } }, { status: 400 });
    }
    const message = rawMessage.trim();

    // 1. Fetch student enrollments and class sections if student record exists
    let classIds: string[] = [];
    if (student) {
      const enrolls = await prisma.enrollment.findMany({ where: { studentId: student.id } });
      classIds = enrolls.map(e => e.classSectionId);
    }

    // 2. Fetch real materials from prisma.material
    const rawMaterials = classIds.length > 0
      ? await prisma.material.findMany({
          where: { 
            classSectionId: { in: classIds },
            status: 'PUBLISHED'
          },
          include: {
            subject: true
          },
          take: 15
        })
      : await prisma.material.findMany({
          where: { status: 'PUBLISHED' },
          include: { subject: true },
          take: 10
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

    // 3. Fetch real assignments & submissions
    const rawAssignments = classIds.length > 0
      ? await prisma.assignment.findMany({
          where: { classSectionId: { in: classIds } },
          include: {
            subject: true,
            submissions: student ? {
              where: { studentId: student.id }
            } : false
          },
          take: 10
        })
      : [];

    const assignmentsContext: AssignmentContextItem[] = rawAssignments.map(a => ({
      id: a.id,
      title: a.title,
      subject: a.subject?.name || 'Course Assignment',
      deadline: a.deadline,
      submitted: Array.isArray(a.submissions) && a.submissions.length > 0,
      marks: Array.isArray(a.submissions) ? a.submissions[0]?.marks ?? null : null
    }));

    // 4. Fetch roadmap & preferences
    const [preferences, roadmap] = await Promise.all([
      prisma.learnerPreference.findUnique({ where: { userId } }),
      prisma.learningRoadmap.findFirst({ where: { userId }, orderBy: { createdAt: 'desc' } })
    ]);

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

    // 5. Query Course & Study Assistant in real time via Gemini
    const result = await AIService.answerCourseAndStudyQuestion(
      message,
      Array.isArray(history) ? history : [],
      {
        studentName,
        department: departmentName,
        targetRole,
        materials: materialsContext,
        assignments: assignmentsContext,
        roadmapPhases,
        weeklyHoursTarget: preferences?.weeklyHours || 12
      }
    );

    return NextResponse.json({
      success: true,
      data: {
        reply: result.reply,
        sources: result.sources
      }
    });
  } catch (error) {
    console.error('[API student-chat error]:', error);
    return NextResponse.json({ 
      success: false, 
      error: { code: 'INTERNAL_ERROR', message: 'Unable to process question at this time. Please try again.' } 
    }, { status: 500 });
  }
}
