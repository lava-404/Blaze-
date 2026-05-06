// Dodo Payments integration
// https://docs.dodopayments.com

export interface DodoCheckoutSession {
  id: string;
  url: string;
  status: string;
  amount: number;
  currency: string;
  metadata?: Record<string, string>;
}

export interface DodoWebhookEvent {
  id: string;
  type: string;
  data: {
    payment_id: string;
    status: string;
    amount: number;
    currency: string;
    metadata?: Record<string, string>;
  };
}

const DODO_BASE_URL = 'https://api.dodopayments.com/v1';
const PLATFORM_FEE_PERCENT = 2.5; // Blaze takes 2.5% fee

/**
 * Create a Dodo Payments checkout session
 * This creates a hosted payment page where the founder pays
 */
export async function createDodoCheckout({
  amountUSD,
  founderId,
  founderEmail,
  founderName,
  paymentId,
  successUrl,
  cancelUrl,
}: {
  amountUSD: number;
  founderId: string;
  founderEmail: string;
  founderName: string;
  paymentId: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<DodoCheckoutSession> {
  const apiKey = process.env.DODO_PAYMENTS_API_KEY;

  if (!apiKey || apiKey === 'your_dodo_api_key') {
    // Demo mode: return a simulated checkout session
    return {
      id: `dodo_demo_${Date.now()}`,
      url: `${successUrl}?payment_id=${paymentId}&dodo_id=dodo_demo_${Date.now()}&demo=true`,
      status: 'open',
      amount: amountUSD * 100, // cents
      currency: 'USD',
      metadata: { founderId, paymentId },
    };
  }

  const response = await fetch(`${DODO_BASE_URL}/checkout/sessions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: Math.round(amountUSD * 100), // Convert to cents
      currency: 'USD',
      payment_methods: ['card', 'bank_transfer', 'ach'],
      customer: {
        email: founderEmail,
        name: founderName,
      },
      metadata: {
        founderId,
        paymentId,
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
      line_items: [
        {
          name: 'Blaze Platform - Team Payroll',
          description: `Global USDC payroll distribution for your team`,
          amount: Math.round(amountUSD * 100),
          currency: 'USD',
          quantity: 1,
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Dodo Payments error: ${JSON.stringify(error)}`);
  }

  const data = await response.json();
  return data;
}

/**
 * Retrieve a Dodo Payments session
 */
export async function getDodoPayment(dodoPaymentId: string): Promise<DodoCheckoutSession | null> {
  const apiKey = process.env.DODO_PAYMENTS_API_KEY;

  if (!apiKey || apiKey === 'your_dodo_api_key') {
    // Demo mode
    return {
      id: dodoPaymentId,
      url: '',
      status: 'succeeded',
      amount: 100000, // $1000 in cents
      currency: 'USD',
    };
  }

  const response = await fetch(`${DODO_BASE_URL}/checkout/sessions/${dodoPaymentId}`, {
    headers: { 'Authorization': `Bearer ${apiKey}` },
  });

  if (!response.ok) return null;
  return response.json();
}

/**
 * Verify Dodo webhook signature
 */
export function verifyDodoWebhook(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const crypto = require('crypto');
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return `sha256=${expected}` === signature;
}

/**
 * Calculate net amount after Blaze fee
 */
export function calculateNetAmount(grossUSD: number): {
  gross: number;
  fee: number;
  net: number;
  feePercent: number;
} {
  const fee = (gross: number) => gross * (PLATFORM_FEE_PERCENT / 100);
  const feeAmount = fee(grossUSD);
  return {
    gross: grossUSD,
    fee: feeAmount,
    net: grossUSD - feeAmount,
    feePercent: PLATFORM_FEE_PERCENT,
  };
}
