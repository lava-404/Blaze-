'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle, ExternalLink, ArrowRight, Copy,
  Flame, Loader2, AlertCircle, Wallet, Zap, RefreshCw,
} from 'lucide-react';

interface Disbursement {
  id: string; teamMemberId: string; memberName: string;
  walletAddress: string; amountUSDC: number; txSignature?: string; status: string;
}

type Step = 'verifying' | 'converting' | 'distributing' | 'done';

const STEP_CONFIG: Record<Exclude<Step,'done'>, { label: string; Icon: React.ElementType }> = {
  verifying:    { label: 'Verifying Dodo payment…',         Icon: Zap },
  converting:   { label: 'Converting USD → USDC via Jupiter…', Icon: RefreshCw },
  distributing: { label: 'Distributing to team wallets…',   Icon: Wallet },
};

function SuccessContent() {
  const params   = useSearchParams();
  const paymentId = params.get('payment_id');
  const dodoId    = params.get('dodo_id');

  const [processing, setProcessing] = useState(true);
  const [disbursements, setDisbursements] = useState<Disbursement[]>([]);
  const [txSig,  setTxSig]  = useState('');
  const [error,  setError]  = useState('');
  const [step,   setStep]   = useState<Step>('verifying');
  const [copied, setCopied] = useState(false);

  useEffect(() => { if (paymentId) runDisbursement(); }, [paymentId]);

  async function runDisbursement() {
    try {
      setStep('verifying');    await sleep(1200);
      setStep('converting');   await sleep(1500);
      setStep('distributing');

      const res  = await fetch('/api/payments/disburse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId, dodoPaymentId: dodoId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Disbursement failed');

      setDisbursements(data.disbursements || []);
      setTxSig(data.txSignature || '');
      setStep('done');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally { setProcessing(false); }
  }

  function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

  function copyTx() {
    navigator.clipboard.writeText(txSig);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const stepOrder: Exclude<Step,'done'>[] = ['verifying','converting','distributing'];

  return (
    <div className="grid-bg min-h-screen flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden"
      style={{ background: '#0a0a0a' }}>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(255,77,0,0.12) 0%, transparent 70%)' }} />

      <div className="relative w-full" style={{ maxWidth: '560px' }}>
        <Link href="/" className="flex items-center gap-2 justify-center mb-10">
          <Flame size={22} style={{ color: '#FF4D00' }} />
          <span className="font-display text-3xl tracking-wider" style={{ color: '#FAFAFA' }}>BLAZE</span>
        </Link>

        {/* Processing state */}
        {processing && (
          <div className="card p-10 text-center" style={{ border: '1px solid rgba(255,77,0,0.2)' }}>
            <div className="flex items-center justify-center mb-6">
              <Loader2 size={48} className="animate-spin" style={{ color: '#FF4D00' }} />
            </div>
            <h2 className="font-display text-3xl mb-2" style={{ color: '#FAFAFA' }}>PROCESSING</h2>

            <div className="space-y-3 text-left mt-6">
              {stepOrder.map((s) => {
                const idx     = stepOrder.indexOf(step as Exclude<Step,'done'>);
                const sIdx    = stepOrder.indexOf(s);
                const isDone  = idx > sIdx || step === 'done';
                const isActive = s === step;
                const { label, Icon } = STEP_CONFIG[s];
                return (
                  <div key={s} className="flex items-center gap-3 p-3 rounded-lg transition-colors"
                    style={{ background: isActive ? 'rgba(255,77,0,0.08)' : '#111' }}>
                    {isDone
                      ? <CheckCircle size={16} style={{ color: '#00D278' }} />
                      : isActive
                        ? <Loader2 size={16} className="animate-spin" style={{ color: '#FF4D00' }} />
                        : <Icon size={16} style={{ color: '#333' }} />}
                    <span className="text-sm" style={{ color: isActive ? '#FAFAFA' : isDone ? '#A0A0A0' : '#555' }}>
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Error state */}
        {!processing && error && (
          <div className="card p-10 text-center" style={{ border: '1px solid rgba(255,77,0,0.3)' }}>
            <AlertCircle size={48} className="mx-auto mb-4" style={{ color: '#FF4D00' }} />
            <h2 className="font-display text-3xl mb-2" style={{ color: '#FAFAFA' }}>ERROR</h2>
            <p className="text-sm mb-6" style={{ color: '#A0A0A0' }}>{error}</p>
            <Link href="/dashboard">
              <button className="btn-blaze px-8 py-3 rounded-lg text-sm">Back to Dashboard</button>
            </Link>
          </div>
        )}

        {/* Success state */}
        {!processing && !error && (
          <div className="card p-8" style={{ border: '1px solid rgba(0,210,120,0.25)' }}>
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: 'rgba(0,210,120,0.12)' }}>
                <CheckCircle size={32} style={{ color: '#00D278' }} />
              </div>
              <h2 className="font-display text-4xl mb-1" style={{ color: '#FAFAFA' }}>TEAM PAID!</h2>
              <p className="text-sm" style={{ color: '#A0A0A0' }}>All payments distributed on Solana</p>
            </div>

            {/* TX signature */}
            {txSig && (
              <div className="mb-6 p-4 rounded-lg" style={{ background: '#111', border: '1px solid #2a2a2a' }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono-custom text-xs" style={{ color: '#A0A0A0' }}>SOLANA TX SIGNATURE</span>
                  <button onClick={copyTx} className="flex items-center gap-1 text-xs transition-colors"
                    style={{ color: copied ? '#00D278' : '#555' }}>
                    {copied ? <CheckCircle size={11} /> : <Copy size={11} />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <div className="font-mono-custom text-xs break-all" style={{ color: '#FF8C42' }}>{txSig}</div>
                <a href={`https://explorer.solana.com/tx/${txSig}?cluster=devnet`}
                  target="_blank" rel="noreferrer"
                  className="flex items-center gap-1 text-xs mt-2 transition-colors"
                  style={{ color: '#555' }}
                  onMouseEnter={e=>(e.currentTarget.style.color='#FF4D00')}
                  onMouseLeave={e=>(e.currentTarget.style.color='#555')}>
                  View on Solana Explorer <ExternalLink size={10} />
                </a>
              </div>
            )}

            {/* Disbursements */}
            <div className="mb-8">
              <div className="font-mono-custom text-xs tracking-wider mb-3" style={{ color: '#A0A0A0' }}>DISBURSEMENTS</div>
              <div className="space-y-3">
                {disbursements.map(d => (
                  <div key={d.id} className="flex items-center gap-3 p-3 rounded-lg"
                    style={{ background: '#1a1a1a' }}>
                    <CheckCircle size={16} style={{ color: '#00D278', flexShrink: 0 }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium" style={{ color: '#FAFAFA' }}>{d.memberName}</div>
                      <div className="font-mono-custom text-xs truncate" style={{ color: '#555' }}>
                        {d.walletAddress?.slice(0,8)}…
                      </div>
                    </div>
                    <div className="font-mono-custom text-sm flex-shrink-0" style={{ color: '#FF8C42' }}>
                      {d.amountUSDC?.toFixed(2)} USDC
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Link href="/dashboard">
              <button className="btn-blaze w-full py-3 rounded-xl text-sm gap-2">
                Back to Dashboard <ArrowRight size={14} />
              </button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return <Suspense><SuccessContent /></Suspense>;
}
