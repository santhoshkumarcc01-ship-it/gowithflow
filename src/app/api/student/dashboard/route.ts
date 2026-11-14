import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'STUDENT') {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Forbidden.' } }, { status: 403 });
    }

    const student = await prisma.student.findUnique({
      where: { userId: session.id },
      include: { department: true }
    });
    if (!student) return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Student profile missing.' } }, { status: 404 });

    const enrolls = await prisma.enrollment.findMany({ where: { studentId: student.id } });
    const classIds = enrolls.map(e => e.classSectionId);

    // Calculate live attendance percentage
    const sessions = await prisma.attendanceSession.findMany({
      where: { classSectionId: { in: classIds } },
      include: { records: { where: { studentId: student.id } } }
    });
    const totalConducted = sessions.length;
    const totalPresent = sessions.filter(s => s.records.some(r => r.status === 'PRESENT' || r.status === 'LATE')).length;
    const attendancePercentage = totalConducted > 0 ? Math.round((totalPresent / totalConducted) * 100) : 100;

    // Calculate pending assignments
    const totalAssignments = await prisma.assignment.count({
      where: { classSectionId: { in: classIds } }
    });
    const submittedAssignments = await prisma.assignmentSubmission.count({
      where: { studentId: student.id }
    });
    const pendingAssignments = Math.max(0, totalAssignments - submittedAssignments);

    // Fetch registered events
    const registeredEvents = await prisma.eventRegistration.count({
      where: { studentId: student.id, status: 'REGISTERED' }
    });

    // Fetch latest announcements targeted for this student
    const announcements = await prisma.announcement.findMany({
      where: {
        OR: [
          { collegeId: student.collegeId }, // general announcements
          { targets: { some: { departmentId: student.departmentId } } },
          { targets: { some: { classSectionId: { in: classIds } } } },
          { targets: { some: { userId: session.id } } }
        ]
      },
      include: { author: true },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    return NextResponse.json({
      success: true,
      data: {
        attendancePercentage,
        pendingAssignments,
        registeredEvents,
        announcements: announcements.map(a => ({
          id: a.id,
          title: a.title,
          content: a.content,
          category: a.category,
          priority: a.priority,
          createdAt: a.createdAt,
          authorName: a.author.name
        }))
      }
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to compile dashboard.' } }, { status: 500 });
  }
}
