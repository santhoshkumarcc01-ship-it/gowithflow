import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/db';
import { AIService } from '@/lib/ai';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'STUDENT') {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized.' } }, { status: 401 });
    }

    const student = await prisma.student.findUnique({
      where: { userId: session.id },
      include: { department: true }
    });
    if (!student) return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Profile missing.' } }, { status: 404 });

    const body = await req.json();
    const { targetRole, skills } = body;

    if (!targetRole) {
      return NextResponse.json({ success: false, error: { code: 'VALIDATION_FAILED', message: 'Target role is required.' } }, { status: 400 });
    }

    // Split skills string or array
    const skillsList: string[] = Array.isArray(skills) 
      ? skills 
      : typeof skills === 'string'
      ? skills.split(',').map(s => s.trim()).filter(s => s.length > 0)
      : [];

    // 1. Link skills in DB
    for (const skName of skillsList) {
      const skill = await prisma.skill.upsert({
        where: { name: skName },
        update: {},
        create: { name: skName, category: 'Software' }
      });

      const existingSkill = await prisma.studentSkill.findFirst({
        where: { studentId: student.id, skillId: skill.id }
      });

      if (!existingSkill) {
        await prisma.studentSkill.create({
          data: {
            studentId: student.id,
            skillId: skill.id,
            level: 'INTERMEDIATE'
          }
        });
      }
    }

    // 2. Trigger AI Advisor
    const analysis = await AIService.generateCareerRoadmap(
      targetRole,
      skillsList,
      student.department.name,
      student.year
    );

    // 3. Upsert CareerProfile
    const profile = await prisma.careerProfile.upsert({
      where: { studentId: student.id },
      update: {
        targetRole,
        careerReadinessScore: Math.floor(60 + Math.random() * 30) // mock indexing
      },
      create: {
        studentId: student.id,
        targetRole,
        experienceLevel: 'ENTRY',
        careerReadinessScore: 70
      }
    });

    // 4. Create recommendation entry
    const recs = await prisma.careerRecommendation.create({
      data: {
        studentId: student.id,
        targetRole,
        recommendations: JSON.stringify(analysis.recommendations),
        skillGaps: JSON.stringify(analysis.skillsToLearn),
        roadmap: JSON.stringify(analysis.roadmap),
        projects: JSON.stringify(analysis.projects),
        generatedBy: 'GEMINI',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: session.id,
        action: 'CAREER_ANALYZE',
        resource: 'CareerRecommendation',
        resourceId: recs.id
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        profile,
        recommendations: {
          ...recs,
          recommendations: analysis.recommendations,
          skillGaps: analysis.skillsToLearn,
          roadmap: analysis.roadmap,
          projects: analysis.projects
        }
      }
    });
  } catch (error) {
    console.error('[API career-analyze error]:', error);
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'AI evaluation failed.' } }, { status: 500 });
  }
}
