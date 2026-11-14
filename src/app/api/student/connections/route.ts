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

    // Fetch connections where the student is requester OR receiver
    const connections = await prisma.campusConnection.findMany({
      where: {
        OR: [
          { requesterId: student.id },
          { receiverId: student.id }
        ]
      },
      include: {
        requester: { include: { user: true } },
        receiver: { include: { user: true } }
      }
    });

    const formatted = connections.map(c => {
      const isRequester = c.requesterId === student.id;
      const peer = isRequester ? c.receiver : c.requester;
      return {
        id: c.id,
        status: c.status,
        createdAt: c.createdAt,
        peer: {
          id: peer.id,
          name: peer.user.name,
          avatarUrl: peer.user.avatarUrl,
          studentId: peer.studentId
        }
      };
    });

    return NextResponse.json({
      success: true,
      data: formatted
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch connections.' } }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'STUDENT') {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized.' } }, { status: 401 });
    }

    const student = await prisma.student.findUnique({
      where: { userId: session.id }
    });
    if (!student) return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Student profile missing.' } }, { status: 404 });

    const body = await req.json();
    const { peerStudentId } = body; // target student ID

    const targetStudent = await prisma.student.findFirst({
      where: { studentId: peerStudentId }
    });

    if (!targetStudent || targetStudent.id === student.id) {
      return NextResponse.json({ success: false, error: { code: 'INVALID_PEER', message: 'Target student not found or invalid.' } }, { status: 400 });
    }

    // Check if link already exists
    const existing = await prisma.campusConnection.findFirst({
      where: {
        OR: [
          { requesterId: student.id, receiverId: targetStudent.id },
          { requesterId: targetStudent.id, receiverId: student.id }
        ]
      }
    });

    if (existing) {
      return NextResponse.json({ success: false, error: { code: 'CONNECTION_EXISTS', message: 'Connection already requested or exists.' } }, { status: 400 });
    }

    const connection = await prisma.campusConnection.create({
      data: {
        requesterId: student.id,
        receiverId: targetStudent.id,
        status: 'PENDING'
      }
    });

    return NextResponse.json({
      success: true,
      data: connection
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create connection.' } }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'STUDENT') {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized.' } }, { status: 401 });
    }

    const body = await req.json();
    const { connectionId, status } = body; // status: ACCEPTED, REJECTED

    if (!['ACCEPTED', 'REJECTED'].includes(status)) {
      return NextResponse.json({ success: false, error: { code: 'INVALID_STATUS', message: 'Status must be ACCEPTED or REJECTED.' } }, { status: 400 });
    }

    const connection = await prisma.campusConnection.update({
      where: { id: connectionId },
      data: { status }
    });

    return NextResponse.json({
      success: true,
      data: connection
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update connection.' } }, { status: 500 });
  }
}
