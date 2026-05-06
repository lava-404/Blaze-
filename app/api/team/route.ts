import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const founderId = req.nextUrl.searchParams.get('founderId') || 'demo';
  const members = db.getTeamMembersByFounder(founderId);
  return NextResponse.json({ members });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { founderId = 'demo', name, role, walletAddress, allocationPercent } = body;
  
  if (!name || !role || !walletAddress || allocationPercent === undefined) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const member = db.createTeamMember({ founderId, name, role, walletAddress, allocationPercent });
  return NextResponse.json({ member });
}
