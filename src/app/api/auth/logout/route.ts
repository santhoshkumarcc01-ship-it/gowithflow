import { NextRequest, NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/auth';
import prisma from '@/lib/db';
import * as crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const tokenCookie = req.cookies.get('ai_campus_session');
    
    if (tokenCookie) {
      const tokenHash = crypto.createHash('sha256').update(tokenCookie.value).digest('hex');
      
      // Mark session as revoked in PostgreSQL
      await prisma.session.updateMany({
        where: { tokenHash },
        data: { revokedAt: new Date() }
      }).catch(() => {});
    }

    clearSessionCookie();

    return NextResponse.json({
      success: true,
      message: 'Logged out successfully.'
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Logout failed.' } },
      { status: 500 }
    );
  }
}
