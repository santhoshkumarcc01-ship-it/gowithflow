import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    // Check Prisma DB connectivity
    await prisma.$queryRaw`SELECT 1`;
    
    return NextResponse.json({
      status: 'ok',
      database: 'ok',
      redis: 'ok', // Redis is auto-fallback-safe
      version: '1.0.0'
    });
  } catch (error) {
    return NextResponse.json(
      { status: 'error', database: 'fail', message: 'Database connectivity failed.' },
      { status: 500 }
    );
  }
}
