import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createDodoCheckout } from '@/lib/dodo';

export async function POST(req: NextRequest) {
  const { founderId = 'demo', amountUSD } = await req.json();

  if (!amountUSD || amountUSD <= 0) {
    return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
  }

  // Create pending payment record
  const payment = db.createPayment({
    founderId,
    amountUSD,
    status: 'pending',
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const successUrl = `${appUrl}/success?payment_id=${payment.id}`;
  const cancelUrl = `${appUrl}/dashboard`;

  // Create Dodo checkout session
  const session = await createDodoCheckout({
    amountUSD,
    founderId,
    founderEmail: 'founder@example.com',
    founderName: 'Founder',
    paymentId: payment.id,
    successUrl,
    cancelUrl,
  });

  // Update payment with Dodo session ID
  db.updatePayment(payment.id, {
    dodoPaymentId: session.id,
    dodoCheckoutUrl: session.url,
  });

  return NextResponse.json({
    paymentId: payment.id,
    checkoutUrl: session.url,
  });
}
