import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Forbidden.' } }, { status: 403 });
    }

    const body = await req.json();
    const { csvData } = body;

    if (!csvData) {
      return NextResponse.json({ success: false, error: { code: 'VALIDATION_FAILED', message: 'CSV data is required.' } }, { status: 400 });
    }

    // Simple CSV parser
    const lines = csvData.split('\n').filter((l: string) => l.trim().length > 0);
    const headers = lines[0].split(',').map((h: string) => h.trim().toLowerCase());
    
    const studentsAdded: any[] = [];
    const college = await prisma.college.findFirst();
    const dept = await prisma.department.findFirst();
    const academicYear = await prisma.academicYear.findFirst();

    if (!college || !dept || !academicYear) {
      return NextResponse.json({ success: false, error: { code: 'CONFIG_MISSING', message: 'Setup College, Department and Academic Year first.' } }, { status: 400 });
    }

    for (let i = 1; i < lines.length; i++) {
      const columns = lines[i].split(',').map((c: string) => c.trim());
      if (columns.length < headers.length) continue;

      const name = columns[0];
      const email = columns[1];
      const phoneNumber = columns[2];
      const studentId = columns[3];

      // Create student transactional record
      const result = await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            name,
            email,
            phoneNumber,
            role: 'STUDENT'
          }
        });

        return await tx.student.create({
          data: {
            userId: user.id,
            collegeId: college.id,
            studentId,
            departmentId: dept.id,
            academicYearId: academicYear.id,
            year: 1,
            semester: 1,
            section: 'A',
            admissionYear: new Date().getFullYear()
          }
        });
      });

      studentsAdded.push(result);
    }

    // Write audit log
    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: 'STUDENTS_IMPORT',
        resource: 'Student',
        metadata: JSON.stringify({ count: studentsAdded.length })
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        count: studentsAdded.length
      }
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Bulk import failed.' } }, { status: 500 });
  }
}
