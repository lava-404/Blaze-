// Solana USDC distribution service
// Uses @solana/web3.js and @solana/spl-token

import {
  Connection,
  PublicKey,
  Keypair,
  Transaction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import {
  getOrCreateAssociatedTokenAccount,
  createTransferInstruction,
  getMint,
} from '@solana/spl-token';
import bs58 from 'bs58';

// USDC mint address (devnet for testing, mainnet for prod)
const USDC_MINT_DEVNET = new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU');
const USDC_MINT_MAINNET = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');

function getUSDCMint() {
  return process.env.SOLANA_NETWORK === 'mainnet' ? USDC_MINT_MAINNET : USDC_MINT_DEVNET;
}

function getConnection() {
  return new Connection(
    process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
    'confirmed'
  );
}

function getPlatformKeypair(): Keypair {
  const privateKeyBase58 = process.env.PLATFORM_WALLET_PRIVATE_KEY;
  if (!privateKeyBase58 || privateKeyBase58 === 'your_base58_encoded_private_key') {
    // Demo keypair for development
    return Keypair.generate();
  }
  const secretKey = bs58.decode(privateKeyBase58);
  return Keypair.fromSecretKey(secretKey);
}

export interface DistributionRecipient {
  walletAddress: string;
  amountUSDC: number; // in USDC units (not lamports)
  teamMemberId: string;
}

export interface DistributionResult {
  teamMemberId: string;
  walletAddress: string;
  amountUSDC: number;
  txSignature?: string;
  status: 'completed' | 'failed';
  error?: string;
}

/**
 * Distribute USDC to multiple recipients
 * In a real implementation, this batches all transfers in a single transaction
 * using versioned transactions for efficiency
 */
export async function distributeUSDC(
  recipients: DistributionRecipient[]
): Promise<DistributionResult[]> {
  const connection = getConnection();
  const platformKeypair = getPlatformKeypair();
  const usdcMint = getUSDCMint();

  const results: DistributionResult[] = [];

  try {
    // Get mint info to know decimals (USDC has 6 decimals)
    const mintInfo = await getMint(connection, usdcMint);
    const decimals = mintInfo.decimals; // 6 for USDC

    // Get platform's USDC token account
    const platformTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      platformKeypair,
      usdcMint,
      platformKeypair.publicKey
    );

    // Build transaction with all transfers
    const transaction = new Transaction();

    const recipientTokenAccounts = [];

    for (const recipient of recipients) {
      const recipientPubkey = new PublicKey(recipient.walletAddress);
      
      // Get or create recipient's USDC token account
      const recipientTokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        platformKeypair, // payer for account creation
        usdcMint,
        recipientPubkey
      );

      recipientTokenAccounts.push(recipientTokenAccount);

      // Add transfer instruction
      const amountInSmallestUnit = Math.floor(recipient.amountUSDC * Math.pow(10, decimals));
      
      transaction.add(
        createTransferInstruction(
          platformTokenAccount.address,
          recipientTokenAccount.address,
          platformKeypair.publicKey,
          amountInSmallestUnit
        )
      );
    }

    // Send single transaction with all transfers
    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [platformKeypair]
    );

    // All succeeded
    recipients.forEach((r) => {
      results.push({
        teamMemberId: r.teamMemberId,
        walletAddress: r.walletAddress,
        amountUSDC: r.amountUSDC,
        txSignature: signature,
        status: 'completed',
      });
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    // Mark all as failed
    recipients.forEach((r) => {
      results.push({
        teamMemberId: r.teamMemberId,
        walletAddress: r.walletAddress,
        amountUSDC: r.amountUSDC,
        status: 'failed',
        error: errorMessage,
      });
    });
  }

  return results;
}

/**
 * Simulate distribution for demo/testing (no real blockchain call)
 */
export async function simulateDistribution(
  recipients: DistributionRecipient[]
): Promise<DistributionResult[]> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  const fakeSig = `${Array.from({ length: 88 }, () => 
    'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz123456789'[
      Math.floor(Math.random() * 58)
    ]
  ).join('')}`;

  return recipients.map(r => ({
    teamMemberId: r.teamMemberId,
    walletAddress: r.walletAddress,
    amountUSDC: r.amountUSDC,
    txSignature: fakeSig,
    status: 'completed' as const,
  }));
}

export function isValidSolanaAddress(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

export function shortenAddress(address: string): string {
  if (address.length < 12) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}
