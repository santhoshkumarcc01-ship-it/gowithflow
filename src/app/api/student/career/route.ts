import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'STUDENT') {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized.' } }, { status: 401 });
    }

    const student = await prisma.student.findUnique({
      where: { userId: session.id },
      include: {
        skills: { include: { skill: true } }
      }
    });

    if (!student) return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Profile missing.' } }, { status: 404 });

    const profile = await prisma.careerProfile.findUnique({
      where: { studentId: student.id }
    });

    const recommendations = await prisma.careerRecommendation.findFirst({
      where: { studentId: student.id },
      orderBy: { createdAt: 'desc' }
    });

    // Parse JSON blobs safely
    const parsedRecommendations = recommendations ? {
      ...recommendations,
      recommendations: JSON.parse(recommendations.recommendations),
      skillGaps: JSON.parse(recommendations.skillGaps),
      roadmap: JSON.parse(recommendations.roadmap),
      projects: JSON.parse(recommendations.projects)
    } : null;

    return NextResponse.json({
      success: true,
      data: {
        profile,
        skills: student.skills.map(s => ({ name: s.skill.name, level: s.level, verified: s.verified })),
        recommendations: parsedRecommendations
      }
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Server error.' } }, { status: 500 });
  }
}
