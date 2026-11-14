import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'STUDENT') {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized access.' } },
        { status: 401 }
      );
    }

    const student = await prisma.student.findUnique({
      where: { userId: session.id }
    });

    if (!student) return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Student profile missing.' } }, { status: 404 });

    const enrolls = await prisma.enrollment.findMany({ where: { studentId: student.id } });
    const classIds = enrolls.map(e => e.classSectionId);

    const assignments = await prisma.assignment.findMany({
      where: { classSectionId: { in: classIds } },
      include: {
        subject: true,
        submissions: {
          where: { studentId: student.id }
        }
      },
      orderBy: { deadline: 'asc' }
    });

    return NextResponse.json({
      success: true,
      data: assignments
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Server error.' } }, { status: 500 });
  }
}
