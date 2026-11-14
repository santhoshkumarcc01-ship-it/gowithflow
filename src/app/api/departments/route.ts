import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const list = await prisma.department.findMany({
      select: { id: true, name: true, code: true }
    });

    return NextResponse.json({ success: true, data: list });
  } catch {
    return NextResponse.json({ success: false, data: [] });
  }
}
