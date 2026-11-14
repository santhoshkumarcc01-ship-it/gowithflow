import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'FACULTY') {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Forbidden.' } }, { status: 403 });
    }

    const classSectionId = params.id;

    // Fetch enrolled students
    const enrollments = await prisma.enrollment.findMany({
      where: { classSectionId },
      include: {
        student: {
          include: { user: true }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: enrollments.map(e => ({
        id: e.student.id,
        name: e.student.user.name,
        studentId: e.student.studentId,
        phoneNumber: e.student.user.phoneNumber,
        email: e.student.user.email
      }))
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch class roster.' } }, { status: 500 });
  }
}
