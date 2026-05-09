// Dodo Payments integration
// https://docs.dodopayments.com

import DodoPayments from 'dodopayments';

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
    console.log(apiKey)
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
  console.log(apiKey)
  const client = new DodoPayments({ bearerToken: apiKey, environment: 'test_mode',});

  const product = await client.products.create({
    name: 'Blaze',
    price: {
      currency: 'USD', 
      discount: 0,
      price: amountUSD,
      purchasing_power_parity: true,
      type: 'one_time_price',
    },
    tax_category: 'saas',
  });
  console.log("creating a product id")
  console.log(product.product_id)

  const PRODUCT_ID = product.product_id;

  const checkoutSessionResponse = await client.checkoutSessions.create({
    product_cart: [{ product_id: PRODUCT_ID, quantity: 1 }],
    customer: {
      email: founderEmail,
      name: founderName,
    },
    metadata: {
      founderId,
      paymentId,
    },
    cancel_url: cancelUrl,
    return_url: 'http://localhost:3000/dashboard'
  });
  console.log(checkoutSessionResponse);

  return {
    id: checkoutSessionResponse.session_id,
    url: checkoutSessionResponse.checkout_url ?? '',
    status: 'open',
    amount: amountUSD * 100, // cents
    currency: 'USD',
    metadata: { founderId, paymentId },
  };
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

  try {
    const client = new DodoPayments({ bearerToken: apiKey });

    const checkoutSessionStatus = await client.checkoutSessions.retrieve(dodoPaymentId);

    return {
      id: checkoutSessionStatus.id,
      url: '',
      status: checkoutSessionStatus.payment_status ?? 'pending',
      amount: 0, // not returned by retrieve endpoint
      currency: 'USD',
      metadata: {
        customer_email: checkoutSessionStatus.customer_email ?? '',
        customer_name: checkoutSessionStatus.customer_name ?? '',
        payment_id: checkoutSessionStatus.payment_id ?? '',
      },
    };
  } catch {
    return null;
  }
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
