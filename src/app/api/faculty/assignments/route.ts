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

    const assignments = await prisma.assignment.findMany({
      where: { facultyId: faculty.id },
      include: {
        subject: true,
        classSection: { include: { course: true } }
      },
      orderBy: { deadline: 'asc' }
    });

    return NextResponse.json({
      success: true,
      data: assignments
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch assignments.' } }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'FACULTY') {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Forbidden.' } }, { status: 403 });
    }

    const faculty = await prisma.faculty.findUnique({
      where: { userId: session.id }
    });
    if (!faculty) return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Faculty profile not found.' } }, { status: 404 });

    const body = await req.json();
    const { subjectId, classSectionId, title, description, instructions, deadline, maxMarks } = body;

    const assignment = await prisma.assignment.create({
      data: {
        subjectId,
        facultyId: faculty.id,
        classSectionId,
        title,
        description,
        instructions,
        deadline,
        maxMarks: Number(maxMarks)
      }
    });

    // Notify enrolled students
    const enrolls = await prisma.enrollment.findMany({
      where: { classSectionId },
      include: { student: true }
    });

    for (const e of enrolls) {
      await prisma.notification.create({
        data: {
          userId: e.student.userId,
          type: 'ASSIGNMENT_CREATED',
          title: 'New Homework Assigned',
          message: `Worksheet for "${title}" has been published. Due date: ${deadline}`
        }
      }).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      data: assignment
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create assignment.' } }, { status: 500 });
  }
}
