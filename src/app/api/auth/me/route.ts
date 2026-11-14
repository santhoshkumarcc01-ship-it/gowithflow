import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'No active session found.' } },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.id },
      include: {
        student: { include: { department: true } },
        faculty: { include: { department: true } }
      }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'USER_NOT_FOUND', message: 'User record no longer exists.' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
        avatarUrl: user.avatarUrl,
        studentId: user.student?.id,
        facultyId: user.faculty?.id,
        studentDetails: user.student ? {
          studentId: user.student.studentId,
          academicYear: user.student.year,
          classSection: user.student.section,
          department: user.student.department.name,
          departmentId: user.student.departmentId,
          dateOfBirth: user.student.dateOfBirth
        } : null,
        facultyDetails: user.faculty ? {
          facultyId: user.faculty.facultyId,
          designation: user.faculty.designation,
          department: user.faculty.department.name
        } : null
      }
    });
  } catch (error) {
    console.error('[API me error]:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An error occurred fetching session.' } },
      { status: 500 }
    );
  }
}
