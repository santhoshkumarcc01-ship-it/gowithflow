import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }
    const userId = user.id;
    const { primaryRole, secondaryRole, targetIndustry, targetDate, reason, confidenceLevel } = await req.json();

    // Mark previous career goals as not current
    await prisma.learnerCareerGoal.updateMany({
      where: { userId },
      data: { isCurrent: false }
    });

    // Create new career goal
    const newGoal = await prisma.learnerCareerGoal.create({
      data: {
        userId,
        primaryRole,
        secondaryRole: secondaryRole || '',
        targetIndustry: targetIndustry || 'Software / Tech',
        targetDate: targetDate || '6 Months',
        reason: reason || '',
        confidenceLevel: confidenceLevel || 'High',
        isCurrent: true
      }
    });

    // Mark existing roadmap as outdated and generate new roadmap
    await prisma.learningRoadmap.updateMany({
      where: { userId, status: 'ACTIVE' },
      data: { status: 'OUTDATED' }
    });

    const newPhases = [
      {
        phase: 1,
        name: `${primaryRole} Fundamentals`,
        duration: '3 Weeks',
        skills: ['Core Concepts', 'Tooling & Best Practices'],
        status: 'IN_PROGRESS'
      },
      {
        phase: 2,
        name: 'Advanced System Workflows',
        duration: '5 Weeks',
        skills: ['Scalable Architecture', 'Integration Testing', 'Automated Deployment'],
        status: 'PENDING'
      },
      {
        phase: 3,
        name: 'Portfolio Capstone',
        duration: '4 Weeks',
        skills: ['Production Deployment', 'Interview Presentation'],
        status: 'PENDING'
      }
    ];

    const newRoadmap = await prisma.learningRoadmap.create({
      data: {
        userId,
        targetRole: primaryRole,
        title: `${primaryRole} Accelerated Roadmap`,
        description: `Targeted learning track generated for ${primaryRole}.`,
        status: 'ACTIVE',
        phases: JSON.stringify(newPhases)
      }
    });

    return NextResponse.json({ success: true, data: { goal: newGoal, roadmap: newRoadmap } });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
