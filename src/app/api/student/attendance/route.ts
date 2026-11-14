import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'STUDENT') {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Forbidden. Access restricted to Students.' } },
        { status: 403 }
      );
    }

    const student = await prisma.student.findUnique({
      where: { userId: session.id }
    });

    if (!student) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Student record not found.' } },
        { status: 404 }
      );
    }

    // Get all enrollments
    const enrollments = await prisma.enrollment.findMany({
      where: { studentId: student.id },
      include: {
        classSection: {
          include: {
            course: true,
            faculty: { include: { user: true } }
          }
        }
      }
    });

    const subjectsSummary: any[] = [];
    let totalConducted = 0;
    let totalPresent = 0;

    for (const enroll of enrollments) {
      const classSec = enroll.classSection;
      
      // Get all conducted sessions for this class
      const sessions = await prisma.attendanceSession.findMany({
        where: { classSectionId: classSec.id },
        include: {
          records: {
            where: { studentId: student.id }
          }
        }
      });

      const conducted = sessions.length;
      const present = sessions.filter(s => s.records.some(r => r.status === 'PRESENT' || r.status === 'LATE')).length;
      const absent = sessions.filter(s => s.records.some(r => r.status === 'ABSENT')).length;
      const leave = sessions.filter(s => s.records.some(r => r.status === 'LEAVE')).length;
      const late = sessions.filter(s => s.records.some(r => r.status === 'LATE')).length;

      const percentage = conducted > 0 ? Math.round((present / conducted) * 100) : 100;
      
      let status = 'GOOD';
      if (percentage < 75) status = 'CRITICAL';
      else if (percentage < 85) status = 'WARNING';

      // Find subject name via course association or simple fallback
      const subject = await prisma.facultySubject.findFirst({
        where: { classSectionId: classSec.id },
        include: { subject: true }
      });

      subjectsSummary.push({
        subjectCode: subject?.subject.code || classSec.course.code,
        subjectName: subject?.subject.name || classSec.course.name,
        facultyName: classSec.faculty?.user.name || 'Coordinator',
        classesHeld: conducted,
        present,
        absent,
        late,
        leave,
        percentage,
        status
      });

      totalConducted += conducted;
      totalPresent += present;
    }

    const overallPercentage = totalConducted > 0 ? Math.round((totalPresent / totalConducted) * 100) : 100;

    return NextResponse.json({
      success: true,
      data: {
        overallPercentage,
        totalClasses: totalConducted,
        totalPresent,
        subjects: subjectsSummary
      }
    });
  } catch (error) {
    console.error('[API student attendance error]:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Unable to load attendance ledger.' } },
      { status: 500 }
    );
  }
}
