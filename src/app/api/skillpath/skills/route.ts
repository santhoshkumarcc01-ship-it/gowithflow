import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }
    const skills = await prisma.learnerSkillItem.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json({ success: true, data: skills });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }
    const { skillName, proficiency = 'Intermediate', source = 'Self-learning', category = 'Technical' } = await req.json();
    if (!skillName) {
      return NextResponse.json({ success: false, error: 'Skill name is required.' }, { status: 400 });
    }

    const newSkill = await prisma.learnerSkillItem.create({
      data: {
        userId: user.id,
        skillName,
        proficiency,
        source,
        category,
        assessmentScore: Math.floor(65 + Math.random() * 30)
      }
    });

    return NextResponse.json({ success: true, data: newSkill });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'ID required' }, { status: 400 });

    await prisma.learnerSkillItem.deleteMany({ where: { id, userId: user.id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
