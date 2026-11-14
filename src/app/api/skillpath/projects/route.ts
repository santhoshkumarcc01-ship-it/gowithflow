import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }
    const projects = await prisma.learnerProject.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json({
      success: true,
      data: projects.map(p => ({
        ...p,
        technologies: typeof p.technologies === 'string' ? JSON.parse(p.technologies || '[]') : p.technologies
      }))
    });
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
    const body = await req.json();
    const { name, description, technologies, category, role, githubUrl, liveUrl, outcomes, projectType } = body;

    const newProject = await prisma.learnerProject.create({
      data: {
        userId: user.id,
        name,
        description: description || '',
        technologies: typeof technologies === 'string' ? technologies : JSON.stringify(technologies || []),
        category: category || 'Full Stack',
        role: role || 'Contributor',
        githubUrl: githubUrl || '',
        liveUrl: liveUrl || '',
        outcomes: outcomes || '',
        projectType: projectType || 'Individual'
      }
    });

    return NextResponse.json({ success: true, data: newProject });
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

    await prisma.learnerProject.deleteMany({ where: { id, userId: user.id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
