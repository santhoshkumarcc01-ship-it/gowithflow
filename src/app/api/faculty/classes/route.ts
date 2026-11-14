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

    const classes = await prisma.facultySubject.findMany({
      where: { facultyId: faculty.id },
      include: {
        classSection: { include: { course: true } },
        subject: true
      }
    });

    return NextResponse.json({
      success: true,
      data: classes.map(c => ({
        id: c.classSection.id,
        subjectId: c.subject.id,
        subjectCode: c.subject.code,
        subjectName: c.subject.name,
        courseName: c.classSection.course.name,
        semester: c.classSection.semester,
        section: c.classSection.section,
        room: c.classSection.room
      }))
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch assigned classes.' } }, { status: 500 });
  }
}
