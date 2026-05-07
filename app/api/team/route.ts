import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

async function getOrCreateFounderByEmail(email: string) {
  const existing = await prisma.founder.findUnique({ where: { email } });
  if (existing) return existing;
  return prisma.founder.create({
    data: {
      email,
      name: email.split('@')[0] || 'Founder',
      company: 'N/A',
    },
  });
}

export async function GET(req: NextRequest) {
  const founderEmail = req.nextUrl.searchParams.get('founderEmail');
  if (!founderEmail) {
    return NextResponse.json({ error: 'founderEmail required' }, { status: 400 });
  }

  const founder = await prisma.founder.findUnique({
    where: { email: founderEmail },
    include: { team: { orderBy: { createdAt: 'asc' } } },
  });

  const members = (founder?.team || []).map((m: { id: any; name: any; role: any; walletAddress: any; allocation: any; createdAt: any; }) => ({
    id: m.id,
    name: m.name,
    role: m.role,
    walletAddress: m.walletAddress,
    allocationAmountUSD: m.allocation,
    createdAt: m.createdAt,
  }));

  return NextResponse.json({ members });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { founderEmail, name, role, walletAddress, allocationAmountUSD } = body;
  
  if (!founderEmail || !name || !role || !walletAddress || allocationAmountUSD === undefined) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const founder = await getOrCreateFounderByEmail(founderEmail);

  const member = await prisma.teamMember.create({
    data: {
      founderId: founder.id,
      name,
      role,
      walletAddress,
      allocation: Number(allocationAmountUSD),
    },
  });

  return NextResponse.json({
    member: {
      id: member.id,
      name: member.name,
      role: member.role,
      walletAddress: member.walletAddress,
      allocationAmountUSD: member.allocation,
      createdAt: member.createdAt,
    },
  });
}

