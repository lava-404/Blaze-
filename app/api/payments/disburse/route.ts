import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { simulateDistribution, DistributionRecipient } from '@/lib/solana';
import { calculateNetAmount } from '@/lib/dodo';

export async function POST(req: NextRequest) {
  const { paymentId, dodoPaymentId } = await req.json();

  if (!paymentId) {
    return NextResponse.json({ error: 'Payment ID required' }, { status: 400 });
  }

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
  });
  if (!payment) {
    return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
  }

  // Mark as processing
  await prisma.payment.update({
    where: { id: paymentId },
    data: { status: 'processing', dodoPaymentId },
  });

  // Get team members for this founder
  const teamMembers = await prisma.teamMember.findMany({
    where: { founderId: payment.founderId },
  });

  if (teamMembers.length === 0) {
    await prisma.payment.update({
      where: { id: paymentId },
      data: { status: 'failed' },
    });
    return NextResponse.json({ error: 'No team members configured' }, { status: 400 });
  }

  // Calculate net amount after Blaze fee
  const { net: netUSDC } = calculateNetAmount(payment.amountUSD);
  const totalAlloc = teamMembers.reduce((s, m) => s + m.allocation, 0);

  // Build recipients
  const recipients: DistributionRecipient[] = teamMembers.map(m => ({
    teamMemberId: m.id,
    walletAddress: m.walletAddress,
    amountUSDC: (netUSDC * m.allocation) / Math.max(totalAlloc, 100),
  }));

  // Create pending disbursements
  const disbursementRecords = await Promise.all(
    recipients.map(r =>
      prisma.disbursement.create({
        data: {
          paymentId,
          teamMemberId: r.teamMemberId,
          amountUSDC: r.amountUSDC,
          status: 'pending',
        },
      })
    )
  );

  // Execute distribution (simulated for demo, real Solana call in production)
  const USE_SIMULATION = !process.env.PLATFORM_WALLET_PRIVATE_KEY ||
    process.env.PLATFORM_WALLET_PRIVATE_KEY === 'your_base58_encoded_private_key';

  const results = await simulateDistribution(recipients);

  // Update disbursement records
  const enrichedResults = await Promise.all(
    results.map(async (result, i) => {
      const dbRecord = disbursementRecords[i];
      await prisma.disbursement.update({
        where: { id: dbRecord.id },
        data: {
          txSignature: result.txSignature,
          status: result.status,
        },
      });
      const member = teamMembers.find(m => m.id === result.teamMemberId);
      return {
        ...result,
        memberName: member?.name || 'Unknown',
      };
    })
  );

  const allCompleted = results.every(r => r.status === 'completed');
  await prisma.payment.update({
    where: { id: paymentId },
    data: { status: allCompleted ? 'completed' : 'failed' },
  });

  const txSignature = results[0]?.txSignature || '';

  return NextResponse.json({
    success: allCompleted,
    disbursements: enrichedResults,
    txSignature,
    isSimulated: USE_SIMULATION,
  });
}