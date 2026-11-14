import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/db';
import { SubmitAttendanceSchema } from '@/lib/validation';

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
    const parse = SubmitAttendanceSchema.safeParse(body);

    if (!parse.success) {
      return NextResponse.json({ success: false, error: { code: 'VALIDATION_FAILED', message: 'Invalid payload parameters.' } }, { status: 400 });
    }

    const { classSectionId, subjectId, date, startTime, endTime, records } = parse.data;

    // Verify faculty assignment to this subject and class section
    const assignment = await prisma.facultySubject.findFirst({
      where: { facultyId: faculty.id, classSectionId, subjectId }
    });

    if (!assignment) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED_CLASS', message: 'You are not authorized to mark attendance for this class subject.' } }, { status: 403 });
    }

    // Execute atomic transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create AttendanceSession
      const attendanceSession = await tx.attendanceSession.create({
        data: {
          classSectionId,
          subjectId,
          facultyId: faculty.id,
          date,
          startTime,
          endTime,
          status: 'COMPLETED'
        }
      });

      // 2. Bulk create records
      const recordPromises = records.map(rec => {
        return tx.attendanceRecord.create({
          data: {
            attendanceSessionId: attendanceSession.id,
            studentId: rec.studentId,
            status: rec.status,
            markedBy: faculty.id
          }
        });
      });

      const savedRecords = await Promise.all(recordPromises);

      return {
        session: attendanceSession,
        recordsCount: savedRecords.length
      };
    });

    // Generate notifications for absent students in the background
    for (const rec of records) {
      if (rec.status === 'ABSENT') {
        const studentUser = await prisma.student.findUnique({
          where: { id: rec.studentId },
          select: { userId: true }
        });
        if (studentUser) {
          await prisma.notification.create({
            data: {
              userId: studentUser.userId,
              type: 'ATTENDANCE_UPDATED',
              title: 'Attendance Marked: ABSENT',
              message: `You were marked absent on ${date} for subject class.`
            }
          }).catch(() => {});
        }
      }
    }

    // Write audit log
    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: 'ATTENDANCE_MARKED',
        resource: 'AttendanceSession',
        resourceId: result.session.id,
        metadata: JSON.stringify({ count: result.recordsCount })
      }
    });

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('[API submit-attendance error]:', error);
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Transaction aborted. Failed to submit attendance.' } }, { status: 500 });
  }
}
