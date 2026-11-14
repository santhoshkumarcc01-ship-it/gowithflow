import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { signToken, setSessionCookie } from '@/lib/auth';
import * as crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { challengeId, facultyId } = body;

    if (!challengeId || !facultyId) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_FAILED', message: 'Challenge ID and Faculty ID are required.' } },
        { status: 400 }
      );
    }

    // Find verified OTP record
    const record = await prisma.otpVerification.findUnique({
      where: { challengeId }
    });

    if (!record || !record.verifiedAt) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED_CHALLENGE', message: 'OTP challenge verification incomplete or expired.' } },
        { status: 401 }
      );
    }

    // Lookup user and faculty details
    const user = record.phoneNumber
      ? await prisma.user.findFirst({
          where: { phoneNumber: record.phoneNumber },
          include: { faculty: true }
        })
      : record.email
      ? await prisma.user.findFirst({
          where: { email: record.email },
          include: { faculty: true }
        })
      : null;

    if (!user || user.role !== 'FACULTY' || !user.faculty) {
      return NextResponse.json(
        { success: false, error: { code: 'ACCOUNT_NOT_FOUND', message: 'No registered faculty account matches.' } },
        { status: 404 }
      );
    }

    // Verify Faculty ID matches
    if (user.faculty.facultyId !== facultyId) {
      return NextResponse.json(
        { success: false, error: { code: 'FACULTY_ID_INVALID', message: 'Faculty ID verification failed.' } },
        { status: 401 }
      );
    }

    if (user.faculty.status !== 'ACTIVE') {
      return NextResponse.json(
        { success: false, error: { code: 'ACCOUNT_SUSPENDED', message: 'Faculty account is suspended or inactive.' } },
        { status: 403 }
      );
    }

    // Log in faculty member! Sign session JWT
    const payload = {
      id: user.id,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: 'FACULTY' as const,
      name: user.name,
      facultyId: user.faculty.id
    };

    const token = signToken(payload);
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Create session in DB
    await prisma.session.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    // Set secure HTTP cookie
    setSessionCookie(token);

    // Delete verification record
    await prisma.otpVerification.delete({ where: { id: record.id } }).catch(() => {});

    // Write audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN_SUCCESS',
        resource: 'Faculty',
        resourceId: user.faculty.id
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        status: 'AUTHENTICATED',
        user: {
          id: user.id,
          name: user.name,
          role: user.role,
          avatarUrl: user.avatarUrl
        }
      }
    });
  } catch (error) {
    console.error('[API faculty-verify error]:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'An unexpected server error occurred.' } },
      { status: 500 }
    );
  }
}
