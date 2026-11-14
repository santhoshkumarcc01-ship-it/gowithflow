import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Forbidden.' } }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';

    const skip = (page - 1) * limit;

    const whereClause: any = {};
    if (search) {
      whereClause.OR = [
        { studentId: { contains: search } },
        { user: { name: { contains: search } } },
        { user: { email: { contains: search } } }
      ];
    }

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where: whereClause,
        include: {
          user: true,
          department: true
        },
        skip,
        take: limit,
        orderBy: { studentId: 'asc' }
      }),
      prisma.student.count({ where: whereClause })
    ]);

    return NextResponse.json({
      success: true,
      data: students.map(s => ({
        id: s.id,
        studentId: s.studentId,
        name: s.user.name,
        email: s.user.email,
        phone: s.user.phoneNumber,
        department: s.department.name,
        year: s.year,
        section: s.section,
        status: s.status
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Query failed.' } }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Forbidden.' } }, { status: 403 });
    }

    const body = await req.json();
    const { name, email, phoneNumber, studentId, departmentId, academicYearId, year, semester, section } = body;

    if (!name || !email || !phoneNumber || !studentId || !departmentId || !academicYearId) {
      return NextResponse.json({ success: false, error: { code: 'VALIDATION_FAILED', message: 'Required fields missing.' } }, { status: 400 });
    }

    const college = await prisma.college.findFirst();
    if (!college) return NextResponse.json({ success: false, error: { code: 'NO_COLLEGE', message: 'Setup a college record first.' } }, { status: 400 });

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          phoneNumber,
          role: 'STUDENT'
        }
      });

      return await tx.student.create({
        data: {
          userId: user.id,
          collegeId: college.id,
          studentId,
          departmentId,
          academicYearId,
          year: Number(year || 1),
          semester: Number(semester || 1),
          section: section || 'A',
          admissionYear: new Date().getFullYear()
        }
      });
    });

    // Write audit log
    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: 'STUDENT_CREATED',
        resource: 'Student',
        resourceId: result.id
      }
    });

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Insertion failed.' } }, { status: 500 });
  }
}
