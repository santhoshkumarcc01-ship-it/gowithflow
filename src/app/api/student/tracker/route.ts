import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import prisma from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }
    const userId = authUser.id;

    const [student, learnerProfile] = await Promise.all([
      prisma.student.findUnique({
        where: { userId },
        include: { department: true }
      }).catch(() => null),
      prisma.learnerProfile.findUnique({ where: { userId } }).catch(() => null)
    ]);

    // 1. Enrollments and class sections
    let classIds: string[] = [];
    if (student) {
      const enrolls = await prisma.enrollment.findMany({ where: { studentId: student.id } });
      classIds = enrolls.map(e => e.classSectionId);
    }

    // 2. Attendance stats (strictly from data model)
    const sessions = classIds.length > 0 ? await prisma.attendanceSession.findMany({
      where: { classSectionId: { in: classIds } },
      include: { records: student ? { where: { studentId: student.id } } : false }
    }) : [];
    const totalConductedSessions = sessions.length;
    const attendedSessions = sessions.filter(s => Array.isArray(s.records) && s.records.some((r: any) => r.status === 'PRESENT' || r.status === 'LATE')).length;
    const attendancePercentage = totalConductedSessions > 0 ? Math.round((attendedSessions / totalConductedSessions) * 100) : 0;

    // 3. Assignment stats (strictly from data model)
    const assignments = classIds.length > 0 ? await prisma.assignment.findMany({
      where: { classSectionId: { in: classIds } },
      include: {
        subject: true,
        submissions: student ? { where: { studentId: student.id } } : false
      }
    }) : [];
    const totalAssignments = assignments.length;
    const submittedAssignments = assignments.filter(a => Array.isArray(a.submissions) && a.submissions.length > 0).length;
    const gradedSubmissions = assignments.filter(a => Array.isArray(a.submissions) && a.submissions.some((s: any) => s.marks !== null));
    const totalMarks = gradedSubmissions.reduce((acc, a) => acc + (a.submissions[0]?.marks || 0), 0);
    const averageScore = gradedSubmissions.length > 0 ? Math.round(totalMarks / gradedSubmissions.length) : null;

    // 4. Learning Progress & Preferences
    const [progress, preferences, skills, roadmap] = await Promise.all([
      prisma.learnerProgressItem.findUnique({ where: { userId } }),
      prisma.learnerPreference.findUnique({ where: { userId } }),
      prisma.learnerSkillItem.findMany({ where: { userId } }),
      prisma.learningRoadmap.findFirst({ where: { userId }, orderBy: { createdAt: 'desc' } })
    ]);

    const weeklyHoursTarget = preferences?.weeklyHours || 12;
    const loggedLearningHours = progress?.totalLearningHours || 0;
    const weeklyVelocityPercent = weeklyHoursTarget > 0 ? Math.min(100, Math.round((loggedLearningHours / weeklyHoursTarget) * 100)) : 0;

    let phasesList: Array<{ phaseNumber: number; title: string; status: string; desc?: string }> = [];
    if (roadmap?.phases) {
      try {
        const parsed = JSON.parse(roadmap.phases);
        if (Array.isArray(parsed)) {
          phasesList = parsed.map((p: any, idx: number) => ({
            phaseNumber: p.phaseNumber || idx + 1,
            title: p.title || `Phase ${idx + 1}`,
            status: p.status || (idx === 0 ? 'IN_PROGRESS' : 'NOT_STARTED'),
            desc: p.desc || p.description || ''
          }));
        }
      } catch {
        // Ignored
      }
    }

    const totalMilestones = phasesList.length || (progress?.completedMilestones || 0) + (progress?.pendingMilestones || 0);
    const completedMilestones = phasesList.length > 0
      ? phasesList.filter(p => p.status === 'COMPLETED').length
      : (progress?.completedMilestones || 0);
    const pendingMilestones = phasesList.length > 0
      ? phasesList.filter(p => p.status !== 'COMPLETED').length
      : (progress?.pendingMilestones || 0);

    const skillsCount = skills.length;
    const skillsByProficiency = {
      beginner: skills.filter(s => s.proficiency === 'Beginner').length,
      intermediate: skills.filter(s => s.proficiency === 'Intermediate').length,
      advanced: skills.filter(s => s.proficiency === 'Advanced').length
    };

    return NextResponse.json({
      success: true,
      data: {
        timeRange: {
          semester: 'Fall Semester 2026',
          cycleLabel: 'Weekly Cycle (Mon – Sun)'
        },
        studyHours: {
          logged: loggedLearningHours,
          target: weeklyHoursTarget,
          percentage: weeklyVelocityPercent,
          isEmpty: loggedLearningHours === 0
        },
        milestones: {
          total: totalMilestones,
          completed: completedMilestones,
          pending: pendingMilestones,
          percentage: totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0,
          phases: phasesList,
          isEmpty: totalMilestones === 0
        },
        coursework: {
          total: totalAssignments,
          submitted: submittedAssignments,
          pending: Math.max(0, totalAssignments - submittedAssignments),
          submissionRate: totalAssignments > 0 ? Math.round((submittedAssignments / totalAssignments) * 100) : 0,
          gradedCount: gradedSubmissions.length,
          averageScore,
          assignmentsList: assignments.map(a => ({
            id: a.id,
            title: a.title,
            subject: a.subject.name,
            deadline: a.deadline,
            isSubmitted: a.submissions.length > 0,
            marks: a.submissions[0]?.marks ?? null,
            status: a.submissions[0]?.status || 'PENDING'
          })),
          isEmpty: totalAssignments === 0
        },
        attendance: {
          conducted: totalConductedSessions,
          attended: attendedSessions,
          percentage: attendancePercentage,
          isEmpty: totalConductedSessions === 0
        },
        skills: {
          total: skillsCount,
          byProficiency: skillsByProficiency,
          isEmpty: skillsCount === 0
        }
      }
    });
  } catch (error) {
    console.error('[API student-tracker error]:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch learning tracker metrics.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }
    const userId = authUser.id;

    const body = await req.json();
    const { action, hours, phaseNumber, newStatus } = body;

    if (action === 'log_hours') {
      const additionalHours = Math.max(1, Math.min(24, Number(hours) || 1));
      const current = await prisma.learnerProgressItem.findUnique({ where: { userId } });
      const currentPref = await prisma.learnerPreference.findUnique({ where: { userId } });
      const target = currentPref?.weeklyHours || 12;

      const newHours = (current?.totalLearningHours || 0) + additionalHours;
      const newProgress = Math.min(100, Math.round((newHours / target) * 100));

      const updated = await prisma.learnerProgressItem.upsert({
        where: { userId },
        update: {
          totalLearningHours: newHours,
          weeklyProgress: newProgress,
          lastUpdated: new Date()
        },
        create: {
          userId,
          totalLearningHours: newHours,
          weeklyProgress: newProgress,
          completedMilestones: 2,
          pendingMilestones: 6
        }
      });

      return NextResponse.json({
        success: true,
        data: updated,
        message: `Logged ${additionalHours} hour(s) of focused study.`
      });
    }

    if (action === 'toggle_phase') {
      const roadmap = await prisma.learningRoadmap.findFirst({ where: { userId }, orderBy: { createdAt: 'desc' } });
      if (roadmap && roadmap.phases) {
        let phases = JSON.parse(roadmap.phases);
        if (Array.isArray(phases)) {
          phases = phases.map((p: any, idx: number) => {
            const num = p.phaseNumber || idx + 1;
            if (num === phaseNumber) {
              return { ...p, status: newStatus || (p.status === 'COMPLETED' ? 'IN_PROGRESS' : 'COMPLETED') };
            }
            return p;
          });

          await prisma.learningRoadmap.update({
            where: { id: roadmap.id },
            data: { phases: JSON.stringify(phases) }
          });

          const completedCount = phases.filter((p: any) => p.status === 'COMPLETED').length;
          const pendingCount = phases.length - completedCount;

          await prisma.learnerProgressItem.upsert({
            where: { userId },
            update: {
              completedMilestones: completedCount,
              pendingMilestones: pendingCount
            },
            create: {
              userId,
              completedMilestones: completedCount,
              pendingMilestones: pendingCount
            }
          });

          return NextResponse.json({ success: true, message: 'Milestone updated successfully.' });
        }
      }
    }

    return NextResponse.json({ success: false, error: 'Invalid tracker action.' }, { status: 400 });
  } catch (error) {
    console.error('[API student-tracker POST error]:', error);
    return NextResponse.json({ success: false, error: 'Failed to update tracker.' }, { status: 500 });
  }
}
