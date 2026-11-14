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

    if (!student) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Student record not found.' } },
        { status: 404 }
      );
    }

    // Get sections student is enrolled in
    const enrollments = await prisma.enrollment.findMany({
      where: { studentId: student.id }
    });
    const sectionIds = enrollments.map(e => e.classSectionId);

    // Get published materials for these sections
    const materials = await prisma.material.findMany({
      where: {
        classSectionId: { in: sectionIds },
        status: 'PUBLISHED'
      },
      include: {
        subject: true,
        classSection: { include: { course: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      data: materials
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Unable to fetch materials.' } },
      { status: 500 }
    );
  }
}
