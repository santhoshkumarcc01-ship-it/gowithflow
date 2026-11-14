import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'FACULTY') {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Forbidden.' } }, { status: 403 });
    }

    const faculty = await prisma.faculty.findUnique({
      where: { userId: session.id }
    });
    if (!faculty) return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Faculty profile not found.' } }, { status: 404 });

    // Count assigned class sections
    const assignedClassesCount = await prisma.facultySubject.count({
      where: { facultyId: faculty.id }
    });

    // Count uploaded learning files
    const uploadedMaterialsCount = await prisma.material.count({
      where: { facultyId: faculty.id }
    });

    // Risk Analytics: Find students in this faculty's classes whose attendance rate is critical (< 75%)
    // First, find all class sections of this faculty
    const facSubjects = await prisma.facultySubject.findMany({
      where: { facultyId: faculty.id }
    });
    const sectionIds = facSubjects.map(fs => fs.classSectionId);

    const enrolls = await prisma.enrollment.findMany({
      where: { classSectionId: { in: sectionIds } },
      include: {
        student: { include: { user: true } },
        classSection: { include: { course: true } }
      }
    });

    const studentRiskList: any[] = [];

    for (const e of enrolls) {
      // Find conducted sessions of this class
      const sessions = await prisma.attendanceSession.findMany({
        where: { classSectionId: e.classSectionId }
      });
      const sessionIds = sessions.map(s => s.id);

      if (sessionIds.length === 0) continue;

      const presentCount = await prisma.attendanceRecord.count({
        where: {
          studentId: e.studentId,
          attendanceSessionId: { in: sessionIds },
          status: { in: ['PRESENT', 'LATE'] }
        }
      });

      const percentage = Math.round((presentCount / sessionIds.length) * 100);

      if (percentage < 75) {
        studentRiskList.push({
          id: e.student.id,
          name: e.student.user.name,
          studentId: e.student.studentId,
          courseCode: e.classSection.course.code,
          percentage
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        classesCount: assignedClassesCount,
        materialsCount: uploadedMaterialsCount,
        riskStudents: studentRiskList
      }
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch dashboard metrics.' } }, { status: 500 });
  }
}
