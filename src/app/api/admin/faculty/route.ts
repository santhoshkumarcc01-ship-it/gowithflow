import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Forbidden.' } }, { status: 403 });
    }

    const faculty = await prisma.faculty.findMany({
      include: {
        user: true,
        department: true
      },
      orderBy: { facultyId: 'asc' }
    });

    return NextResponse.json({
      success: true,
      data: faculty.map(f => ({
        id: f.id,
        facultyId: f.facultyId,
        name: f.user.name,
        email: f.user.email,
        phone: f.user.phoneNumber,
        department: f.department.name,
        designation: f.designation,
        status: f.status
      }))
    });
  } catch (error) {
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
    const { name, email, phoneNumber, facultyId, departmentId, designation } = body;

    if (!name || !email || !phoneNumber || !facultyId || !departmentId) {
      return NextResponse.json({ success: false, error: { code: 'VALIDATION_FAILED', message: 'Required fields missing.' } }, { status: 400 });
    }

    const college = await prisma.college.findFirst();
    if (!college) return NextResponse.json({ success: false, error: { code: 'NO_COLLEGE', message: 'Setup a college first.' } }, { status: 400 });

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          phoneNumber,
          role: 'FACULTY'
        }
      });

      return await tx.faculty.create({
        data: {
          userId: user.id,
          collegeId: college.id,
          facultyId,
          departmentId,
          designation: designation || 'Assistant Professor'
        }
      });
    });

    // Write audit log
    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: 'FACULTY_CREATED',
        resource: 'Faculty',
        resourceId: result.id
      }
    });

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create faculty profile.' } }, { status: 500 });
  }
}
