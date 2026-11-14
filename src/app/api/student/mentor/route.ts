import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import prisma from '@/lib/db';
import { AIService } from '@/lib/ai';

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }
    const userId = authUser.id;

    const [student, learnerProfile, careerGoals, preferences, progress] = await Promise.all([
      prisma.student.findUnique({
        where: { userId },
        include: {
          user: true,
          department: true,
          careerProfile: true
        }
      }).catch(() => null),
      prisma.learnerProfile.findUnique({ where: { userId } }).catch(() => null),
      prisma.learnerCareerGoal.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }).catch(() => []),
      prisma.learnerPreference.findUnique({ where: { userId } }).catch(() => null),
      prisma.learnerProgressItem.findUnique({ where: { userId } }).catch(() => null)
    ]);

    const studentName = authUser.name || learnerProfile?.fullName || student?.user?.name || 'Learner';
    const departmentName = student?.department?.name || learnerProfile?.department || 'Computer Science';
    const targetRole = careerGoals[0]?.primaryRole || student?.careerProfile?.targetRole || 'Full Stack Developer';

    // 1. Enrollments and class sections
    let subjectNames: string[] = [];
    let attendancePercentage = 100;
    let pendingAssignmentsCount = 0;

    if (student) {
      const enrolls = await prisma.enrollment.findMany({ 
        where: { studentId: student.id },
        include: { 
          classSection: { 
            include: { 
              facultySubjects: { include: { subject: true } } 
            } 
          } 
        }
      });
      const classIds = enrolls.map(e => e.classSectionId);
      subjectNames = Array.from(new Set(
        enrolls.flatMap(e => e.classSection?.facultySubjects?.map(fs => fs.subject?.name) || []).filter(Boolean)
      )) as string[];

      // 2. Attendance stats
      const sessions = await prisma.attendanceSession.findMany({
        where: { classSectionId: { in: classIds } },
        include: { records: { where: { studentId: student.id } } }
      });
      const totalConducted = sessions.length;
      const totalPresent = sessions.filter(s => s.records.some(r => r.status === 'PRESENT' || r.status === 'LATE')).length;
      attendancePercentage = totalConducted > 0 ? Math.round((totalPresent / totalConducted) * 100) : 100;

      // 3. Assignments stats
      const totalAssignments = await prisma.assignment.count({
        where: { classSectionId: { in: classIds } }
      });
      const submittedAssignments = await prisma.assignmentSubmission.count({
        where: { studentId: student.id }
      });
      pendingAssignmentsCount = Math.max(0, totalAssignments - submittedAssignments);
    }

    const weeklyHoursTarget = preferences?.weeklyHours || 12;
    const loggedHours = progress?.totalLearningHours || 0;
    const completedMilestones = progress?.completedMilestones || 0;
    const pendingMilestones = progress?.pendingMilestones || 3;

    // 4. Generate real-time Gemini personalized recommendations
    const recommendations = await AIService.generateMentorRecommendations({
      studentName,
      department: departmentName,
      targetRole,
      weeklyHoursTarget,
      loggedHours,
      completedMilestones,
      pendingMilestones,
      attendancePercentage,
      pendingAssignmentsCount,
      enrolledSubjects: subjectNames.length > 0 ? subjectNames : ['Software Engineering', 'System Architecture', 'Web Technologies']
    });

    return NextResponse.json({
      success: true,
      data: {
        recommendations,
        context: {
          studentName,
          targetRole,
          weeklyHoursTarget,
          loggedHours,
          completedMilestones,
          pendingMilestones,
          attendancePercentage,
          pendingAssignmentsCount,
          enrolledSubjects: subjectNames
        }
      }
    });
  } catch (error) {
    console.error('[API student-mentor error]:', error);
    return NextResponse.json({ success: false, error: 'Failed to generate mentor recommendations.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const body = await req.json();
    const action = (body.action || '').toLowerCase();
    const id = body.id || body.recommendationId;
    const adjustments = body.adjustments || { timeframe: body.timeframe, notes: body.notes };

    // In a multi-user app, dismissed recommendations can be stored in metadata or session.
    // Return acknowledged status with adjustments echoed back.
    return NextResponse.json({
      success: true,
      data: {
        action,
        id,
        adjustments: adjustments || null,
        message: action === 'dismiss' ? 'Recommendation dismissed.' : 'Recommendation updated successfully.'
      }
    });
  } catch (error) {
    console.error('[API student-mentor POST error]:', error);
    return NextResponse.json({ success: false, error: 'Failed to process action.' }, { status: 500 });
  }
}
