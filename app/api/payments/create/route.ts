import { NextRequest, NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";
import { createDodoCheckout } from '@/lib/dodo';
import { PrivyClient } from '@privy-io/server-auth';

const privy = new PrivyClient(
  process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
  process.env.PRIVY_APP_SECRET!,
);

function getPrivyEmail(user: any): string | null {
  if (!user?.linkedAccounts) return null;
  
  const account = user.linkedAccounts.find(
    (acc: any) =>
      acc.type === 'email' ||
      acc.type === 'google_oauth' ||
      acc.type === 'twitter_oauth' ||
      acc.type === 'discord_oauth'
  );

  const email =
    account?.address ??
    account?.email ??
    null;

  return typeof email === 'string' && email.includes('@')
    ? email
    : null;
}

export async function POST(req: NextRequest) {
  // Verify Privy token and extract user
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.slice(7);
  let privyUser: any;
  try {
    const { userId } = await privy.verifyAuthToken(token);
    privyUser = await privy.getUser(userId);
  } catch {
    return NextResponse.json({ error: 'Invalid auth token' }, { status: 401 });
  }

  const email = getPrivyEmail(privyUser);
  if (!email) {
    return NextResponse.json({ error: 'No email found on Privy account' }, { status: 400 });
  }

  // Look up founder by email
  const founder = await prisma.founder.findUnique({
    where: { email },
  });
  if (!founder) {
    return NextResponse.json({ error: 'Founder not found' }, { status: 404 });
  }

  const { amountUSD } = await req.json();
  if (!amountUSD || amountUSD <= 0) {
    return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
  }

  // Create pending payment record
  const payment = await prisma.payment.create({
    data: {
      founderId: founder.id,
      amountUSD,
      status: 'pending',
    },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const successUrl = `${appUrl}/success?payment_id=${payment.id}`;
  const cancelUrl = `${appUrl}/dashboard`;

  // Create Dodo checkout session
  const session = await createDodoCheckout({
    amountUSD,
    founderId: founder.id,
    founderEmail: founder.email,
    founderName: founder.name,
    paymentId: payment.id,
    successUrl,
    cancelUrl,
  });

  // Update payment with Dodo session ID
  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      dodoPaymentId: session.id,
    },
  });

  return NextResponse.json({
    paymentId: payment.id,
    checkoutUrl: session.url,
  });
}