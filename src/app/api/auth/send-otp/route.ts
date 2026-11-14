import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { SmsService } from '@/lib/sms';
import { EmailService } from '@/lib/email';
import { RedisService } from '@/lib/redis';
import * as crypto from 'crypto';

function normalizePhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 10) return phone;
  return `+91${digits.slice(-10)}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, name, phoneNumber, role = 'STUDENT' } = body;

    // --- STUDENT EMAIL-ONLY FLOW ---
    if (email) {
      const normalizedEmail = email.trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(normalizedEmail)) {
        return NextResponse.json(
          { success: false, error: { code: 'INVALID_EMAIL', message: 'Please enter a valid email address.' } },
          { status: 400 }
        );
      }

      // Rate limit per email (5 requests per 10 minutes)
      const rateLimitKey = `rate:otp:email:${normalizedEmail}`;
      const requestCount = await RedisService.get(rateLimitKey);
      if (requestCount && parseInt(requestCount) >= 5) {
        return NextResponse.json(
          { success: false, error: { code: 'RATE_LIMITED', message: 'Too many OTP requests. Please wait a few minutes before trying again.' } },
          { status: 429 }
        );
      }

      // Find user by email
      let user = await prisma.user.findFirst({
        where: { email: normalizedEmail }
      });

      // If user does not exist, ask for full name to auto-register
      if (!user) {
        if (!name || !name.trim()) {
          return NextResponse.json({
            success: false,
            error: {
              code: 'USER_NOT_REGISTERED',
              message: 'No learner account found with this email. Please enter your name to register.'
            }
          }, { status: 200 });
        }

        // Auto-register student
        const college = await prisma.college.findFirst();
        const department = await prisma.department.findFirst();
        const academicYear = await prisma.academicYear.findFirst();

        if (!college || !department || !academicYear) {
          return NextResponse.json(
            { success: false, error: { code: 'CONFIG_MISSING', message: 'System setup incomplete: College or department records missing.' } },
            { status: 500 }
          );
        }

        user = await prisma.$transaction(async (tx) => {
          const newUser = await tx.user.create({
            data: {
              name: name.trim(),
              email: normalizedEmail,
              phoneNumber: null,
              role: 'STUDENT',
              avatarUrl: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150`
            }
          });

          const rollNo = `STU${Math.floor(1000 + Math.random() * 9000)}`;
          await tx.student.create({
            data: {
              userId: newUser.id,
              collegeId: college.id,
              studentId: rollNo,
              departmentId: department.id,
              academicYearId: academicYear.id,
              year: 1,
              semester: 1,
              section: 'A',
              admissionYear: new Date().getFullYear()
            }
          });

          return newUser;
        });
      }

      if (user.status !== 'ACTIVE') {
        return NextResponse.json(
          { success: false, error: { code: 'ACCOUNT_SUSPENDED', message: 'Your student account is inactive or suspended.' } },
          { status: 403 }
        );
      }

      // Generate 6-digit cryptographic OTP
      const otp = crypto.randomInt(100000, 999999).toString();
      const codeHash = crypto.createHash('sha256').update(otp).digest('hex');
      const challengeId = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

      // Invalidate existing challenges for this email
      await prisma.otpVerification.deleteMany({
        where: { email: normalizedEmail }
      }).catch(() => {});

      // Record challenge in DB
      await prisma.otpVerification.create({
        data: {
          email: normalizedEmail,
          purpose: 'LOGIN',
          codeHash,
          challengeId,
          expiresAt
        }
      });

      // Increment rate limit counter
      const nextCount = requestCount ? parseInt(requestCount) + 1 : 1;
      await RedisService.setEx(rateLimitKey, 600, nextCount.toString()).catch(() => {});

      // Send OTP via SMTP
      try {
        await EmailService.sendOtpEmail(normalizedEmail, otp);
      } catch (mailError: any) {
        console.error('[SMTP Send Error]:', mailError);
        return NextResponse.json(
          { success: false, error: { code: 'SMTP_ERROR', message: 'Failed to send OTP via SMTP. Please try again in a moment.' } },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          challengeId,
          email: normalizedEmail,
          devOtp: process.env.NODE_ENV !== 'production' ? otp : undefined
        }
      });
    }

    // --- FALLBACK PHONE NUMBER FLOW ---
    if (!phoneNumber) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_FAILED', message: 'Email address is required.' } },
        { status: 400 }
      );
    }

    const normalizedPhone = normalizePhoneNumber(phoneNumber);
    const rateLimitKey = `rate:otp:${normalizedPhone}`;
    const requestCount = await RedisService.get(rateLimitKey);
    
    if (requestCount && parseInt(requestCount) >= 5) {
      return NextResponse.json(
        { success: false, error: { code: 'RATE_LIMITED', message: 'Too many OTP requests. Please wait before requesting another OTP.' } },
        { status: 429 }
      );
    }

    let user = await prisma.user.findFirst({
      where: { phoneNumber: normalizedPhone, role }
    });

    if (!user) {
      if (!name) {
        return NextResponse.json({
          success: false,
          error: {
            code: 'USER_NOT_REGISTERED',
            message: 'This user is not registered. Please enter your name to register.'
          }
        }, { status: 200 });
      }

      const college = await prisma.college.findFirst();
      const department = await prisma.department.findFirst();
      const academicYear = await prisma.academicYear.findFirst();

      if (!college || !department || !academicYear) {
        return NextResponse.json(
          { success: false, error: { code: 'CONFIG_MISSING', message: 'System setup incomplete.' } },
          { status: 500 }
        );
      }

      user = await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            name,
            email: email || `${Date.now()}@campus.local`,
            phoneNumber: normalizedPhone,
            role,
            avatarUrl: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150`
          }
        });

        const rollNo = `STU${Math.floor(1000 + Math.random() * 9000)}`;
        await tx.student.create({
          data: {
            userId: newUser.id,
            collegeId: college.id,
            studentId: rollNo,
            departmentId: department.id,
            academicYearId: academicYear.id,
            year: 1,
            semester: 1,
            section: 'A',
            admissionYear: new Date().getFullYear()
          }
        });

        return newUser;
      });
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const codeHash = crypto.createHash('sha256').update(otp).digest('hex');
    const challengeId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await prisma.otpVerification.deleteMany({
      where: { phoneNumber: normalizedPhone }
    }).catch(() => {});

    await prisma.otpVerification.create({
      data: {
        phoneNumber: normalizedPhone,
        purpose: 'LOGIN',
        codeHash,
        challengeId,
        expiresAt
      }
    });

    const nextCount = requestCount ? parseInt(requestCount) + 1 : 1;
    await RedisService.setEx(rateLimitKey, 600, nextCount.toString()).catch(() => {});

    await SmsService.sendOtp(normalizedPhone, otp).catch(() => {});
    if (user.email) {
      await EmailService.sendOtpEmail(user.email, otp).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      data: {
        challengeId,
        devOtp: process.env.NODE_ENV !== 'production' ? otp : undefined
      }
    });
  } catch (error: any) {
    console.error('[API send-otp error]:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: error.message || 'An unexpected server error occurred.' } },
      { status: 500 }
    );
  }
}
