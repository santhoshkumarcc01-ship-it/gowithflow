import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { AdminLoginSchema } from '@/lib/validation';
import { signToken, setSessionCookie } from '@/lib/auth';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parse = AdminLoginSchema.safeParse(body);

    if (!parse.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_FAILED', message: 'Email and password are required.' } },
        { status: 400 }
      );
    }

    const { email, password } = parse.data;

    // Retrieve Admin User
    const user = await prisma.user.findUnique({
      where: { email },
      include: { admin: true }
    });

    if (!user || user.role !== 'ADMIN' || !user.passwordHash) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid administrator credentials.' } },
        { status: 401 }
      );
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid administrator credentials.' } },
        { status: 401 }
      );
    }

    // Sign session JWT
    const payload = {
      id: user.id,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: 'ADMIN' as const,
      name: user.name
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

    // Write HTTP-only cookie
    setSessionCookie(token);

    // Audit Log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'ADMIN_LOGIN',
        resource: 'Admin',
        resourceId: user.admin?.id
      }
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
        avatarUrl: user.avatarUrl
      }
    });
  } catch (error) {
    console.error('[API admin-login error]:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected server error occurred.' } },
      { status: 500 }
    );
  }
}
