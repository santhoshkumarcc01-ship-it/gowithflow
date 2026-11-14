import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized.' }, { status: 401 });
    }
    const certs = await prisma.learnerCertification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json({ success: true, data: certs });
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
    const { name, issuingOrg, credentialId, credentialUrl, issueDate, expiryDate, documentUrl } = body;

    const newCert = await prisma.learnerCertification.create({
      data: {
        userId: user.id,
        name,
        issuingOrg: issuingOrg || 'Official Issuer',
        credentialId: credentialId || '',
        credentialUrl: credentialUrl || '',
        issueDate: issueDate || '',
        expiryDate: expiryDate || '',
        documentUrl: documentUrl || '',
        verificationStatus: 'VERIFIED'
      }
    });

    return NextResponse.json({ success: true, data: newCert });
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

    await prisma.learnerCertification.deleteMany({ where: { id, userId: user.id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
