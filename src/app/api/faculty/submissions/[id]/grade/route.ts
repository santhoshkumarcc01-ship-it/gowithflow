import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/db';
import { GradeSubmissionSchema } from '@/lib/validation';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
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
    const parse = GradeSubmissionSchema.safeParse(body);

    if (!parse.success) {
      return NextResponse.json({ success: false, error: { code: 'VALIDATION_FAILED', message: 'Marks must be a non-negative number.' } }, { status: 400 });
    }

    const { marks, feedback } = parse.data;

    // Update assignment submission
    const submission = await prisma.assignmentSubmission.update({
      where: { id: params.id },
      data: {
        marks,
        feedback,
        status: 'GRADED',
        gradedAt: new Date(),
        gradedBy: faculty.id
      },
      include: {
        assignment: true,
        student: true
      }
    });

    // Notify student
    await prisma.notification.create({
      data: {
        userId: submission.student.userId,
        type: 'ASSIGNMENT_DUE',
        title: 'Assignment Graded',
        message: `Your submission for "${submission.assignment.title}" has been graded: ${marks}/${submission.assignment.maxMarks}`
      }
    });

    return NextResponse.json({
      success: true,
      data: submission
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to save grade.' } }, { status: 500 });
  }
}
