import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Admin access restricted.' } }, { status: 403 });
    }

    const studentsCount = await prisma.student.count();
    const facultyCount = await prisma.faculty.count();
    const classesCount = await prisma.classSection.count();
    
    // Fetch latest 10 audit logs
    const auditLogs = await prisma.auditLog.findMany({
      include: { user: true },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    return NextResponse.json({
      success: true,
      data: {
        studentsCount,
        facultyCount,
        classesCount,
        auditLogs: auditLogs.map(log => ({
          id: log.id,
          userName: log.user.name,
          userRole: log.user.role,
          action: log.action,
          resource: log.resource,
          createdAt: log.createdAt
        }))
      }
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to compile dashboard analytics.' } }, { status: 500 });
  }
}
