import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized.' } }, { status: 401 });
    }

    const departments = await prisma.department.findMany({
      orderBy: { code: 'asc' }
    });

    return NextResponse.json({
      success: true,
      data: departments
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to query departments.' } }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Forbidden.' } }, { status: 403 });
    }

    const body = await req.json();
    const { name, code, description } = body;

    if (!name || !code) {
      return NextResponse.json({ success: false, error: { code: 'VALIDATION_FAILED', message: 'Name and code are required.' } }, { status: 400 });
    }

    const college = await prisma.college.findFirst();
    if (!college) return NextResponse.json({ success: false, error: { code: 'NO_COLLEGE', message: 'Setup a college first.' } }, { status: 400 });

    const department = await prisma.department.create({
      data: {
        collegeId: college.id,
        name,
        code,
        description
      }
    });

    return NextResponse.json({
      success: true,
      data: department
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create department.' } }, { status: 500 });
  }
}
