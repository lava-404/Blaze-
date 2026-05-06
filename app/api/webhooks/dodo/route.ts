import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyDodoWebhook } from '@/lib/dodo';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('x-dodo-signature') || '';
  const secret = process.env.DODO_WEBHOOK_SECRET || 'your_webhook_secret';

  // Verify webhook (skip in demo mode)
  if (secret !== 'your_webhook_secret' && !verifyDodoWebhook(body, signature, secret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const event = JSON.parse(body);

  if (event.type === 'payment.succeeded') {
    const dodoPaymentId = event.data.payment_id;
    const payment = db.getPaymentByDodoId(dodoPaymentId);
    
    if (payment) {
      db.updatePayment(payment.id, { status: 'processing' });
      // In production, trigger the disbursement here
      // await triggerDisbursement(payment.id);
    }
  }

  return NextResponse.json({ received: true });
}
