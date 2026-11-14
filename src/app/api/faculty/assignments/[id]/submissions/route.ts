import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'FACULTY') {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Forbidden.' } }, { status: 403 });
    }

    const submissions = await prisma.assignmentSubmission.findMany({
      where: { assignmentId: params.id },
      include: {
        student: { include: { user: true } }
      }
    });

    return NextResponse.json({
      success: true,
      data: submissions.map(s => ({
        id: s.id,
        studentName: s.student.user.name,
        studentRollCode: s.student.studentId,
        submittedAt: s.submittedAt,
        fileUrl: s.fileUrl,
        marks: s.marks,
        feedback: s.feedback,
        status: s.status
      }))
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to query submissions.' } }, { status: 500 });
  }
}
