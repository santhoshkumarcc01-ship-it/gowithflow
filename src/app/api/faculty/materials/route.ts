import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/db';
import { CreateMaterialSchema } from '@/lib/validation';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'FACULTY') {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Forbidden.' } }, { status: 403 });
    }

    const faculty = await prisma.faculty.findUnique({
      where: { userId: session.id }
    });
    if (!faculty) return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Faculty profile not found.' } }, { status: 404 });

    const body = await req.json();
    const parse = CreateMaterialSchema.safeParse(body);

    if (!parse.success) {
      return NextResponse.json({ success: false, error: { code: 'VALIDATION_FAILED', message: 'Invalid material payload parameters.' } }, { status: 400 });
    }

    const { subjectId, classSectionId, title, description, category, fileUrl, fileName, fileSize, mimeType } = parse.data;

    // Create Material record
    const material = await prisma.material.create({
      data: {
        collegeId: faculty.collegeId,
        subjectId,
        facultyId: faculty.id,
        classSectionId,
        title,
        description,
        category,
        fileUrl,
        fileName,
        fileSize,
        mimeType,
        status: 'PUBLISHED',
        publishedAt: new Date()
      }
    });

    // Notify enrolled students in this section
    const enrolls = await prisma.enrollment.findMany({
      where: { classSectionId },
      include: { student: true }
    });

    for (const e of enrolls) {
      await prisma.notification.create({
        data: {
          userId: e.student.userId,
          type: 'MATERIAL_UPLOADED',
          title: 'New Study Material Published',
          message: `Notes for "${title}" are now available for download.`
        }
      }).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      data: material
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to publish material.' } }, { status: 500 });
  }
}
