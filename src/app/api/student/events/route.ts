import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'STUDENT') {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized.' } }, { status: 401 });
    }

    const student = await prisma.student.findUnique({
      where: { userId: session.id }
    });
    if (!student) return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Student profile missing.' } }, { status: 404 });

    const events = await prisma.event.findMany({
      where: { status: 'ACTIVE' },
      include: {
        registrations: {
          where: { studentId: student.id }
        }
      },
      orderBy: { startDateTime: 'asc' }
    });

    const parsedEvents = events.map(e => ({
      id: e.id,
      title: e.title,
      slug: e.slug,
      description: e.description,
      bannerUrl: e.bannerUrl,
      category: e.category,
      venue: e.venue,
      startDateTime: e.startDateTime,
      endDateTime: e.endDateTime,
      registrationDeadline: e.registrationDeadline,
      capacity: e.capacity,
      registeredCount: e.registrations.length, // we can count total regs separately if needed, but for details:
      isRegistered: e.registrations.length > 0
    }));

    return NextResponse.json({
      success: true,
      data: parsedEvents
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Server error.' } }, { status: 500 });
  }
}
