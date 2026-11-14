import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/db';

// POST: Register for Event
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'STUDENT') {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized.' } }, { status: 401 });
    }

    const student = await prisma.student.findUnique({
      where: { userId: session.id }
    });
    if (!student) return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Student profile missing.' } }, { status: 404 });

    const eventId = params.id;

    // Execute Concurrency-Safe Transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch event details and apply write-lock where supported
      const event = await tx.event.findUnique({
        where: { id: eventId }
      });

      if (!event) {
        throw new Error('EVENT_NOT_FOUND');
      }

      if (event.status !== 'ACTIVE') {
        throw new Error('EVENT_INACTIVE');
      }

      if (event.registrationDeadline < new Date()) {
        throw new Error('DEADLINE_PASSED');
      }

      // 2. Count current bookings
      const bookingCount = await tx.eventRegistration.count({
        where: { eventId, status: 'REGISTERED' }
      });

      if (bookingCount >= event.capacity) {
        throw new Error('EVENT_FULL');
      }

      // 3. Check duplicate registration
      const existing = await tx.eventRegistration.findUnique({
        where: {
          eventId_studentId: { eventId, studentId: student.id }
        }
      });

      if (existing) {
        if (existing.status === 'REGISTERED') {
          throw new Error('ALREADY_REGISTERED');
        } else {
          // Re-activate registration
          return await tx.eventRegistration.update({
            where: { id: existing.id },
            data: { status: 'REGISTERED', registeredAt: new Date(), cancelledAt: null }
          });
        }
      }

      // 4. Create new registration record
      return await tx.eventRegistration.create({
        data: {
          eventId,
          studentId: student.id,
          status: 'REGISTERED'
        }
      });
    });

    // Notify user
    await prisma.notification.create({
      data: {
        userId: session.id,
        type: 'EVENT_REGISTERED',
        title: 'Event Registered',
        message: `Your booking for the campus event has been confirmed.`
      }
    });

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('[Event Register Transaction Error]:', error.message);
    const msg = error.message;

    if (msg === 'EVENT_NOT_FOUND') return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Event not found.' } }, { status: 404 });
    if (msg === 'EVENT_INACTIVE') return NextResponse.json({ success: false, error: { code: 'INACTIVE', message: 'Registration is not open.' } }, { status: 400 });
    if (msg === 'DEADLINE_PASSED') return NextResponse.json({ success: false, error: { code: 'DEADLINE_PASSED', message: 'Event registration deadline has passed.' } }, { status: 400 });
    if (msg === 'EVENT_FULL') return NextResponse.json({ success: false, error: { code: 'EVENT_FULL', message: 'This event is fully booked.' } }, { status: 400 });
    if (msg === 'ALREADY_REGISTERED') return NextResponse.json({ success: false, error: { code: 'DUPLICATE', message: 'You have already registered for this event.' } }, { status: 400 });

    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Database transaction aborted.' } }, { status: 500 });
  }
}

// DELETE: Cancel Event Registration
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'STUDENT') {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized.' } }, { status: 401 });
    }

    const student = await prisma.student.findUnique({
      where: { userId: session.id }
    });
    if (!student) return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Student profile missing.' } }, { status: 404 });

    const eventId = params.id;

    // Update registration status to CANCELLED
    await prisma.eventRegistration.updateMany({
      where: { eventId, studentId: student.id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Registration cancelled.'
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to cancel registration.' } }, { status: 500 });
  }
}
