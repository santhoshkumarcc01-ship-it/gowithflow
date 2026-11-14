import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/db';
import { SubmitAssignmentSchema } from '@/lib/validation';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'STUDENT') {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized.' } }, { status: 401 });
    }

    const student = await prisma.student.findUnique({
      where: { userId: session.id }
    });
    if (!student) return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Profile missing.' } }, { status: 404 });

    const body = await req.json();
    const parse = SubmitAssignmentSchema.safeParse(body);
    if (!parse.success) {
      return NextResponse.json({ success: false, error: { code: 'VALIDATION_FAILED', message: 'Invalid file URL.' } }, { status: 400 });
    }

    const { fileUrl } = parse.data;

    // Verify assignment exists and student is enrolled in that class
    const assignment = await prisma.assignment.findUnique({
      where: { id: params.id },
      include: { classSection: true }
    });

    if (!assignment) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Assignment not found.' } }, { status: 404 });
    }

    // Upsert submission
    const submission = await prisma.assignmentSubmission.upsert({
      where: {
        assignmentId_studentId: {
          assignmentId: params.id,
          studentId: student.id
        }
      },
      update: {
        fileUrl,
        submittedAt: new Date(),
        status: 'SUBMITTED'
      },
      create: {
        assignmentId: params.id,
        studentId: student.id,
        fileUrl,
        status: 'SUBMITTED'
      }
    });

    // Notify user
    await prisma.notification.create({
      data: {
        userId: session.id,
        type: 'ASSIGNMENT_CREATED',
        title: 'Assignment Submitted',
        message: `Your work for "${assignment.title}" was submitted successfully.`
      }
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: 'ASSIGNMENT_SUBMITTED',
        resource: 'AssignmentSubmission',
        resourceId: submission.id
      }
    });

    return NextResponse.json({
      success: true,
      data: submission
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Submission failed.' } }, { status: 500 });
  }
}
