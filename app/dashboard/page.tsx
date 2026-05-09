'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import {
  Users, DollarSign, Zap, ArrowRight, Plus, Clock,
  CheckCircle, AlertCircle, ExternalLink, Flame, BarChart3,
  Wallet, CreditCard, ChevronRight,
} from 'lucide-react';

interface TeamMember { id: string; name: string; role: string; walletAddress: string; allocationAmountUSD: number; }
interface Payment    { id: string; amountUSD: number; status: string; createdAt: string; }

const STATUS_ICON: Record<string, React.ReactNode> = {
  completed:  <CheckCircle size={13} style={{ color: '#00D278' }} />,
  pending:    <Clock       size={13} style={{ color: '#FFB400' }} />,
  processing: <div className="w-3 h-3 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#FF4D00', borderTopColor: 'transparent' }} />,
  failed:     <AlertCircle size={13} style={{ color: '#FF4D00' }} />,
};

const STATUS_CLASS: Record<string, string> = {
  completed: 'status-completed', pending: 'status-pending',
  processing: 'status-pending',  failed:  'status-failed',
};

function shortenAddr(a: string) { return a.length > 12 ? `${a.slice(0,4)}...${a.slice(-4)}` : a; }

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg,#FF4D00,#FF8C42)',
  'linear-gradient(135deg,#FF6B1A,#FFB400)',
  'linear-gradient(135deg,#FF4D00,#FF6B1A)',
  'linear-gradient(135deg,#FF8C42,#FFB400)',
  'linear-gradient(135deg,#CC3D00,#FF6B1A)',
];

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

function getPrivyDisplayName(user: any): string {
  const name =
    user?.name ??
    user?.google?.name ??
    user?.twitter?.name ??
    user?.discord?.name ??
    null;
  if (typeof name === 'string' && name.trim()) return name.trim();

  const email = getPrivyEmail(user);
  if (email) return email.split('@')[0] || 'User';
  return 'User';
}

export default function Dashboard() {
  const router = useRouter();
  const { authenticated, user } = usePrivy();
  const { getAccessToken } = usePrivy();
  
  const founderEmail = getPrivyEmail(user);
  const founderName = getPrivyDisplayName(user);

  const [team,     setTeam]     = useState<TeamMember[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [payAmount, setPayAmount] = useState('1000');
  const [paying,   setPaying]   = useState(false);

  useEffect(() => {
    if (!authenticated) {
      router.replace('/');
      return;
    }
    if (!founderEmail) return;

    setLoading(true);
    Promise.all([
      fetch(`/api/team?founderEmail=${encodeURIComponent(founderEmail)}`).then(r => r.json()),
      fetch(`/api/payments?founderEmail=${encodeURIComponent(founderEmail)}`).then(r => r.json()),
    ]).then(([t, p]) => {
      setTeam(t.members || []);
      setPayments(p.payments || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [authenticated, founderEmail, router]);

  async function handlePay() {
    if (!payAmount || parseFloat(payAmount) <= 0) return;
    if (!founderEmail) return;
    setPaying(true);
    const accessToken = await getAccessToken();
    try {
      const res = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json', },
        body: JSON.stringify({ founderEmail, founderName, amountUSD: parseFloat(payAmount) }),
      });
      const data = await res.json();
      console.log(data);
      if (!res.ok) {
        if (data?.code === 'TEAM_REQUIRED') {
          router.push('/onboarding?reason=team_required');
          return;
        }
        alert(data?.error || 'Error creating payment');
        return;
      }
      if (data.checkoutUrl) window.location.href = data.checkoutUrl;
    } catch { alert('Error creating payment'); }
    finally { setPaying(false); }
  }

  const totalPaid = payments.filter(p => p.status === 'completed').reduce((s, p) => s + p.amountUSD, 0);
  const netAmount = parseFloat(payAmount) * 0.975;
  const totalAlloc = team.reduce((s, m) => s + m.allocationAmountUSD, 0);

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a' }}>

      {/* Header */}
      <header className="flex items-center justify-between px-6 md:px-8 py-4"
        style={{ borderBottom: '1px solid #1a1a1a' }}>
        <Link href="/" className="flex items-center gap-2">
          <Flame size={20} style={{ color: '#FF4D00' }} />
          <span className="font-display text-2xl tracking-wider" style={{ color: '#FAFAFA' }}>BLAZE</span>
        </Link>
        <div className="flex items-center gap-3">
          <div className="hidden md:block text-right">
            <div className="text-sm font-medium" style={{ color: '#FAFAFA' }}>{founderName}</div>
            {founderEmail && <div className="text-xs" style={{ color: '#A0A0A0' }}>{founderEmail}</div>}
          </div>
          <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-white"
            style={{ background: 'linear-gradient(135deg,#FF4D00,#FF8C42)' }}>
            {founderName[0]}
          </div>
        </div>
      </header>

      <div className="mx-auto px-6 md:px-8 py-8" style={{ maxWidth: '1280px' }}>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Team Members',    value: team.length,                                              Icon: Users },
            { label: 'Total Disbursed', value: `$${totalPaid.toLocaleString()}`,                        Icon: DollarSign },
            { label: 'Payments Sent',   value: payments.filter(p => p.status === 'completed').length,   Icon: Zap },
            { label: 'Avg Cost',        value: '$0.001',                                                 Icon: BarChart3 },
          ].map(({ label, value, Icon }) => (
            <div key={label} className="card p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs" style={{ color: '#A0A0A0' }}>{label}</span>
                <Icon size={16} style={{ color: '#FF4D00' }} />
              </div>
              <div className="font-display text-3xl" style={{ color: '#FAFAFA' }}>{value}</div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">

          {/* Pay panel */}
          <div className="space-y-4">
            <div className="card p-6" style={{ border: '1px solid rgba(255,77,0,0.2)' }}>
              <div className="font-mono-custom text-xs tracking-wider mb-4" style={{ color: '#FF4D00' }}>RUN PAYROLL</div>
              <h3 className="font-semibold text-lg mb-1" style={{ color: '#FAFAFA' }}>Pay your team now</h3>
              <p className="text-xs leading-relaxed mb-5" style={{ color: '#A0A0A0' }}>
                Enter amount → pay via Dodo → USDC auto-distributes to all wallets on Solana
              </p>

              <label className="text-xs mb-1.5 block" style={{ color: '#A0A0A0' }}>Amount (USD)</label>
              <div className="relative mb-4">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm" style={{ color: '#555' }}>$</span>
                <input
                  type="number"
                  value={payAmount}
                  onChange={e => setPayAmount(e.target.value)}
                  className="input-blaze pl-8"
                  placeholder="1000"
                />
              </div>

              {/* Preview */}
              {parseFloat(payAmount) > 0 && team.length > 0 && (
                <div className="mb-5 p-4 rounded-lg" style={{ background: '#1a1a1a' }}>
                  <div className="text-xs font-mono-custom mb-3" style={{ color: '#A0A0A0' }}>PREVIEW</div>
                  <div className="space-y-2">
                    
                  </div>
                  <div className="mt-3 pt-3 flex justify-between text-xs" style={{ borderTop: '1px solid #2a2a2a' }}>
                    <span style={{ color: '#555' }}>Blaze fee (2.5%)</span>
                    <span className="font-mono-custom" style={{ color: '#555' }}>
                      {(parseFloat(payAmount) * 0.025).toFixed(2)} USD
                    </span>
                  </div>
                </div>
              )}

              {team.length === 0 ? (
                <Link href="/onboarding">
                  <button className="btn-blaze w-full py-3 rounded-lg text-sm gap-2">
                    <Plus size={14} /> Add Team Members First
                  </button>
                </Link>
              ) : (
                <button onClick={handlePay} disabled={paying}
                  className="btn-blaze w-full py-3 rounded-lg text-sm gap-2">
                  {paying ? (
                    <><div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#fff', borderTopColor: 'transparent' }} /> Processing…</>
                  ) : (
                    <><CreditCard size={14} /> Pay & Distribute USDC <ArrowRight size={14} /></>
                  )}
                </button>
              )}
            </div>

            {/* Manage team */}
            <Link href="/onboarding">
              <div className="card p-5 flex items-center justify-between cursor-pointer group">
                <div>
                  <div className="text-sm font-medium" style={{ color: '#FAFAFA' }}>Manage Team</div>
                  <div className="text-xs mt-0.5" style={{ color: '#A0A0A0' }}>Add / edit members & wallets</div>
                </div>
                <ChevronRight size={18} style={{ color: '#555' }} />
              </div>
            </Link>
          </div>

          {/* Right column */}
          <div className="lg:col-span-2 space-y-6">

            {/* Team list */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="font-mono-custom text-xs tracking-wider" style={{ color: '#FF4D00' }}>YOUR TEAM</div>
                <Link href="/onboarding"
                  className="flex items-center gap-1 text-xs transition-colors"
                  style={{ color: '#A0A0A0' }}
                  onMouseEnter={e=>(e.currentTarget.style.color='#FF4D00')}
                  onMouseLeave={e=>(e.currentTarget.style.color='#A0A0A0')}>
                  <Plus size={12} /> Add member
                </Link>
                
              </div>
              {loading ? (
    <div
      className="text-sm py-8 text-center"
      style={{ color: '#555' }}
    >
      Loading team...
    </div>
  ) : team.length === 0 ? (
    <div
      className="text-sm py-8 text-center"
      style={{ color: '#555' }}
    >
      No team members yet
    </div>
  ) : (
    <div className="space-y-3">
      {team.map((member, index) => (
        <div
          key={member.id}
          className="p-4 rounded-xl flex items-start justify-between"
          style={{
            background: '#111',
            border: '1px solid #1f1f1f',
          }}
        >
          <div className="flex gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
              style={{
                background:
                  AVATAR_GRADIENTS[
                    index % AVATAR_GRADIENTS.length
                  ],
              }}
            >
              {member.name.charAt(0).toUpperCase()}
            </div>

            <div>
              <div
                className="text-sm font-medium"
                style={{ color: '#FAFAFA' }}
              >
                {member.name}
              </div>

              <div
                className="text-xs"
                style={{ color: '#888' }}
              >
                {member.role}
              </div>

              <div
                className="text-xs mt-1"
                style={{
                  color: '#555',
                  fontFamily: "'DM Mono', monospace",
                }}
              >
                {shortenAddr(member.walletAddress)}
              </div>
            </div>
          </div>

          <div
            className="text-sm font-mono-custom"
            style={{ color: '#FFB400' }}
          >
            ${member.allocationAmountUSD.toFixed(2)}
          </div>
        </div>
      ))}
    </div>
  )}
              </div>

            {/* Payment history */}
            <div className="card p-6">
              <div className="font-mono-custom text-xs tracking-wider mb-5" style={{ color: '#FF4D00' }}>PAYMENT HISTORY</div>
              {payments.length === 0 ? (
                <div className="text-center py-8 text-sm" style={{ color: '#555' }}>
                  No payments yet. Run your first payroll above.
                </div>
              ) : (
                <div className="space-y-3">
                  {payments.slice(0, 8).map(p => (
                    <div key={p.id} className="flex items-center justify-between p-3 rounded-lg"
                      style={{ background: '#1a1a1a' }}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ background: 'rgba(255,77,0,0.1)' }}>
                          <Zap size={14} style={{ color: '#FF4D00' }} />
                        </div>
                        <div>
                          <div className="text-sm font-medium" style={{ color: '#FAFAFA' }}>
                            ${p.amountUSD.toLocaleString()}
                          </div>
                          <div className="text-xs" style={{ color: '#555' }}>
                            {new Date(p.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`tag ${STATUS_CLASS[p.status] || 'status-pending'}`}>
                          {STATUS_ICON[p.status]} {p.status}
                        </span>
                        {p.status === 'completed' && (
                          <Link href={`/payment/${p.id}`}>
                            <ExternalLink size={14} style={{ color: '#555' }} />
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
