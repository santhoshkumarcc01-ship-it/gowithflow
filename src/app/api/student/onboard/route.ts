import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/db';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();

    if (!session || session.role !== 'STUDENT') {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized session.' } },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { name, departmentId, dateOfBirth, skills, avatarBase64 } = body;

    if (!name || !departmentId || !dateOfBirth) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_FAILED', message: 'Name, Department, and Date of Birth are required.' } },
        { status: 400 }
      );
    }

    let avatarUrl: string | undefined = undefined;

    // Handle Local Image Upload via Base64 conversion
    if (avatarBase64 && avatarBase64.startsWith('data:image/')) {
      const matches = avatarBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const fileType = matches[1];
        const base64Data = matches[2];
        const buffer = Buffer.from(base64Data, 'base64');
        
        const ext = fileType.split('/')[1] || 'png';
        const fileName = `${crypto.randomUUID()}.${ext}`;
        
        const uploadDir = path.join(process.cwd(), 'public', 'uploads');
        // Ensure folder directory exists
        await fs.mkdir(uploadDir, { recursive: true });
        
        await fs.writeFile(path.join(uploadDir, fileName), buffer);
        avatarUrl = `/uploads/${fileName}`;
      }
    }

    // Execute updates inside database transaction
    await prisma.$transaction(async (tx) => {
      // 1. Update User Profile details
      await tx.user.update({
        where: { id: session.id },
        data: { 
          name,
          ...(avatarUrl ? { avatarUrl } : {})
        }
      });

      // 2. Update Student DOB and Department
      const student = await tx.student.update({
        where: { userId: session.id },
        data: {
          departmentId,
          dateOfBirth: new Date(dateOfBirth)
        }
      });

      // 3. Update Skillset Association
      if (Array.isArray(skills)) {
        // Clear existing skills for student
        await tx.studentSkill.deleteMany({
          where: { studentId: student.id }
        });

        // Resolve and link new skills
        for (const skillName of skills) {
          let skillRecord = await tx.skill.findUnique({
            where: { name: skillName }
          });

          if (!skillRecord) {
            skillRecord = await tx.skill.create({
              data: { name: skillName, category: 'General' }
            });
          }

          await tx.studentSkill.create({
            data: {
              studentId: student.id,
              skillId: skillRecord.id,
              level: 'BEGINNER'
            }
          });
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Profile details completed and saved successfully!'
    });
  } catch (error: any) {
    console.error('[API onboard error]:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: error.message || 'Failed to update student details.' } },
      { status: 500 }
    );
  }
}
