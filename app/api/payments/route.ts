import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const founderId = req.nextUrl.searchParams.get('founderId') || 'demo';
  const payments = db.getPaymentsByFounder(founderId);
  return NextResponse.json({ payments });
}
