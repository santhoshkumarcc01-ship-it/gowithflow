import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { signToken, setSessionCookie } from '@/lib/auth';
import * as crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { challengeId, otp } = body;

    if (!challengeId || !otp || otp.length !== 6) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_FAILED', message: 'Challenge ID and 6-digit OTP code are required.' } },
        { status: 400 }
      );
    }

    // Find OTP record by challengeId
    const record = await prisma.otpVerification.findUnique({
      where: { challengeId }
    });

    if (!record) {
      return NextResponse.json(
        { success: false, error: { code: 'OTP_EXPIRED', message: 'Verification session expired. Please request a new code.' } },
        { status: 400 }
      );
    }

    // Check attempts limit (Max 5 attempts)
    if (record.attemptCount >= 5) {
      await prisma.otpVerification.delete({ where: { id: record.id } }).catch(() => {});
      return NextResponse.json(
        { success: false, error: { code: 'OTP_TOO_MANY_ATTEMPTS', message: 'Too many attempts. Please request a new OTP code.' } },
        { status: 429 }
      );
    }

    // Check expiration
    if (record.expiresAt < new Date()) {
      await prisma.otpVerification.delete({ where: { id: record.id } }).catch(() => {});
      return NextResponse.json(
        { success: false, error: { code: 'OTP_EXPIRED', message: 'This OTP has expired. Please request a new code.' } },
        { status: 400 }
      );
    }

    // Hash submitted OTP and compare
    const submittedHash = crypto.createHash('sha256').update(otp).digest('hex');

    if (record.codeHash !== submittedHash) {
      const updated = await prisma.otpVerification.update({
        where: { id: record.id },
        data: { attemptCount: { increment: 1 } }
      });

      return NextResponse.json(
        { success: false, error: { code: 'OTP_INVALID', message: `Incorrect verification code. ${5 - updated.attemptCount} attempts remaining.` } },
        { status: 400 }
      );
    }

    // Find user profile by email or phone number
    const user = record.email
      ? await prisma.user.findFirst({
          where: { email: record.email },
          include: {
            student: { include: { department: true } },
            faculty: { include: { department: true } }
          }
        })
      : record.phoneNumber
      ? await prisma.user.findFirst({
          where: { phoneNumber: record.phoneNumber },
          include: {
            student: { include: { department: true } },
            faculty: { include: { department: true } }
          }
        })
      : null;

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'ACCOUNT_NOT_FOUND', message: 'User profile not found.' } },
        { status: 404 }
      );
    }

    // Sign session token for student
    const payload = {
      id: user.id,
      email: user.email,
      phoneNumber: user.phoneNumber || '',
      role: 'STUDENT' as const,
      name: user.name,
      studentId: user.student?.id
    };

    const token = signToken(payload);
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Store Session hash in DB
    await prisma.session.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    // Set secure HTTP session cookie
    setSessionCookie(token);

    // Clean up OTP challenge
    await prisma.otpVerification.delete({ where: { id: record.id } }).catch(() => {});

    // Write audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN_SUCCESS',
        resource: 'User',
        resourceId: user.id
      }
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      data: {
        status: 'AUTHENTICATED',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatarUrl: user.avatarUrl
        }
      }
    });
  } catch (error: any) {
    console.error('[API verify-otp error]:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'An unexpected server error occurred.' } },
      { status: 500 }
    );
  }
}
