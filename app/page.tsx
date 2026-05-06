'use client';
import { usePrivy } from "@privy-io/react-auth";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import {
  ArrowRight, Zap, Globe, ShieldCheck, Clock, ChevronDown,
  CreditCard, RefreshCw, Flame, Users, DollarSign, CheckCircle,
  TrendingDown, Timer, Wallet, BarChart3,
} from 'lucide-react';

const STEPS = [
  {
    step: '01',
    title: 'Subscribe via Card / Bank',
    desc: 'Founder pays on Blaze using any payment method — Dodo Payments handles secure fiat collection.',
    icon: CreditCard,
    color: '#FF4D00',
  },
  {
    step: '02',
    title: 'Auto-Convert to USDC',
    desc: 'Blaze instantly converts USD to USDC via Jupiter DEX on Solana. Best rate, always.',
    icon: RefreshCw,
    color: '#FF6B1A',
  },
  {
    step: '03',
    title: 'Single-Tx Distribution',
    desc: 'All team members receive USDC in one atomic Solana transaction. ~$0.001 total fee.',
    icon: Globe,
    color: '#FF8C42',
  },
];

const STATS = [
  { label: 'Avg Transaction Cost', value: '$0.001', sub: 'vs $25 per wire',        icon: TrendingDown },
  { label: 'Settlement Time',      value: '< 2s',   sub: 'vs 3–5 business days',  icon: Timer },
  { label: 'Countries Supported',  value: '195+',   sub: 'anywhere with a wallet', icon: Globe },
  { label: 'Platform Fee',         value: '2.5%',   sub: 'all-inclusive',          icon: BarChart3 },
];

const FLOW_NODES = [
  { label: 'Founder',        sub: 'Pays $1,000 USD',    Icon: Users },
  { label: 'Dodo Payments',  sub: 'Fiat → Platform',    Icon: CreditCard },
  { label: 'Jupiter DEX',    sub: 'USD → USDC',         Icon: RefreshCw },
  { label: 'Solana',         sub: '1 transaction',      Icon: Zap },
  { label: 'Team (×5)',      sub: 'Receives USDC',      Icon: Wallet },
];

const FEATURES = [
  { Icon: Zap,        title: 'Lightning Fast',             desc: 'Solana processes transactions in under 400 ms. Your team gets paid before you finish your coffee.',                    tag: '~400 ms finality' },
  { Icon: Globe,      title: 'Truly Global',               desc: 'Any developer, designer, or contractor with a Solana wallet can receive USDC — regardless of location.',             tag: '195+ countries' },
  { Icon: ShieldCheck,title: 'Battle-Tested Rails',        desc: 'Dodo Payments handles compliant fiat collection. Solana handles immutable, transparent disbursement.',               tag: 'Fully auditable' },
  { Icon: Clock,      title: 'One Subscription = All Paid',desc: 'No more 5 separate wire transfers. One Dodo checkout, one Solana tx, everyone paid instantly.',                     tag: '$0.001 total gas' },
];

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);
  const { login, logout, authenticated, user } = usePrivy();
  const router = useRouter();
  useEffect(() => setMounted(true), []);

  // Auth-gated navigation: if already authenticated go to dashboard,
  // otherwise trigger Privy login modal (on success Privy will re-render
  // the component with authenticated=true; you can optionally redirect in
  // an onSuccess callback configured in your PrivyProvider).
  const handleLaunchApp = useCallback(() => {
    if (authenticated) {
      router.push('/dashboard');
    } else {
      login();
    }
  }, [authenticated, login, router]);

  return (
    <main className="min-h-screen" style={{ background: '#0a0a0a' }}>

      {/* ── Navbar ───────────────────────────────────────── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-10 py-4"
        style={{ background: 'rgba(10,10,10,0.92)', backdropFilter: 'blur(20px)', borderBottom: '1px solid #1a1a1a' }}
      >
        <Link href="/" className="flex items-center gap-2">
          <Flame size={22} style={{ color: '#FF4D00' }} />
          <span className="font-display text-3xl tracking-wider" style={{ color: '#FAFAFA' }}>BLAZE</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {[['#how','How it works'],['#why','Why Blaze'],['#pricing','Pricing']].map(([href, label]) => (
            <a key={href} href={href} className="text-sm transition-colors" style={{ color: '#A0A0A0' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#FAFAFA')}
              onMouseLeave={e => (e.currentTarget.style.color = '#A0A0A0')}>
              {label}
            </a>
          ))}
        </div>

        {/* "Launch App" — auth-gated */}
        <button onClick={handleLaunchApp} className="btn-blaze px-5 py-2.5 rounded-lg text-sm gap-2">
          Launch App <ArrowRight size={14} />
        </button>
      </nav>

      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="grid-bg relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-20 overflow-hidden">
        {/* glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(255,77,0,0.18) 0%, transparent 70%)' }} />

        {/* live badge */}
        <div className="relative flex items-center gap-2 px-4 py-2 rounded-full mb-8"
          style={{ background: '#111', border: '1px solid #2a2a2a' }}>
          <div className="w-2 h-2 rounded-full pulse-orange" style={{ background: '#FF4D00' }} />
          <span className="font-mono-custom text-xs tracking-wider" style={{ color: '#A0A0A0' }}>LIVE ON SOLANA DEVNET</span>
        </div>

        <h1
          className={`relative font-display leading-none tracking-wider mb-6 transition-all duration-700 ${mounted ? 'opacity-100' : 'opacity-0'}`}
          style={{ fontSize: 'clamp(56px, 10vw, 128px)' }}
        >
          <span style={{ color: '#FAFAFA' }}>PAY YOUR</span><br />
          <span className="text-gradient">GLOBAL TEAM</span><br />
          <span style={{ color: '#FAFAFA' }}>IN SECONDS</span>
        </h1>

        <p className={`relative max-w-xl text-lg md:text-xl mb-10 leading-relaxed transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
          style={{ color: '#A0A0A0' }}>
          One subscription payment. Instant USDC distribution to your entire global team
          via Solana. No wire fees. No delays. No borders.
        </p>

        <div className={`relative flex flex-col sm:flex-row items-center gap-4 transition-all duration-700 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {/* "Start Paying Your Team" — auth-gated */}
          <button onClick={handleLaunchApp} className="btn-blaze px-8 py-4 rounded-xl text-base gap-2">
            Start Paying Your Team <ArrowRight size={18} />
          </button>
          <a href="#how" className="flex items-center gap-2 text-sm transition-colors"
            style={{ color: '#A0A0A0' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#FAFAFA')}
            onMouseLeave={e => (e.currentTarget.style.color = '#A0A0A0')}>
            See how it works <ChevronDown size={16} />
          </a>
        </div>

        {/* stats strip */}
        <div className={`relative mt-20 grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl transition-all duration-700 delay-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {STATS.map(({ label, value, sub, icon: Icon }) => (
            <div key={label} className="card p-5 text-center">
              <Icon size={18} className="mx-auto mb-2" style={{ color: '#FF4D00' }} />
              <div className="font-display text-3xl" style={{ color: '#FF4D00' }}>{value}</div>
              <div className="text-xs mt-1" style={{ color: '#A0A0A0' }}>{label}</div>
              <div className="font-mono-custom text-[10px] mt-0.5" style={{ color: '#555' }}>{sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────── */}
      <section id="how" className="py-24 px-6 mx-auto" style={{ maxWidth: '1152px' }}>
        <div className="text-center mb-16">
          <div className="font-mono-custom text-xs tracking-widest mb-4" style={{ color: '#FF4D00' }}>THE FLOW</div>
          <h2 className="font-display text-5xl md:text-7xl" style={{ color: '#FAFAFA' }}>HOW IT WORKS</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {STEPS.map(({ step, title, desc, icon: Icon, color }) => (
            <div key={step} className="card p-8">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                style={{ background: `${color}22` }}>
                <Icon size={22} style={{ color }} />
              </div>
              <div className="font-mono-custom text-xs mb-2" style={{ color }}>{step}</div>
              <h3 className="font-semibold text-xl mb-3" style={{ color: '#FAFAFA' }}>{title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: '#A0A0A0' }}>{desc}</p>
            </div>
          ))}
        </div>

        {/* flow diagram */}
        <div className="card p-8" style={{ border: '1px solid rgba(255,77,0,0.2)' }}>
          <div className="font-mono-custom text-xs tracking-wider mb-6" style={{ color: '#A0A0A0' }}>TRANSACTION FLOW</div>
          <div className="flex flex-wrap items-center justify-between gap-6">
            {FLOW_NODES.map(({ label, sub, Icon }, i) => (
              <div key={label} className="flex items-center gap-4">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-2"
                    style={{ background: 'rgba(255,77,0,0.1)' }}>
                    <Icon size={20} style={{ color: '#FF6B1A' }} />
                  </div>
                  <div className="text-sm font-semibold" style={{ color: '#FAFAFA' }}>{label}</div>
                  <div className="text-xs" style={{ color: '#A0A0A0' }}>{sub}</div>
                </div>
                {i < FLOW_NODES.length - 1 && <ArrowRight size={18} style={{ color: '#FF4D00', flexShrink: 0 }} />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why Blaze ────────────────────────────────────── */}
      <section id="why" className="py-24 px-6 mx-auto" style={{ maxWidth: '1152px' }}>
        <div className="text-center mb-16">
          <div className="font-mono-custom text-xs tracking-widest mb-4" style={{ color: '#FF4D00' }}>VALUE PROPOSITION</div>
          <h2 className="font-display text-5xl md:text-7xl" style={{ color: '#FAFAFA' }}>WHY BLAZE?</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {FEATURES.map(({ Icon, title, desc, tag }) => (
            <div key={title} className="card p-8 flex gap-5">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(255,77,0,0.12)', color: '#FF4D00' }}>
                <Icon size={20} />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h3 className="font-semibold text-lg" style={{ color: '#FAFAFA' }}>{title}</h3>
                  <span className="font-mono-custom text-[10px] px-2 py-0.5 rounded"
                    style={{ background: 'rgba(255,77,0,0.1)', color: '#FF6B1A', border: '1px solid rgba(255,77,0,0.25)' }}>
                    {tag}
                  </span>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: '#A0A0A0' }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Comparison ───────────────────────────────────── */}
      <section className="py-24 px-6 mx-auto" style={{ maxWidth: '1152px' }}>
        <div className="text-center mb-16">
          <h2 className="font-display text-5xl md:text-6xl" style={{ color: '#FAFAFA' }}>BLAZE VS THE OLD WAY</h2>
        </div>
        <div className="card overflow-hidden" style={{ border: '1px solid rgba(255,77,0,0.2)' }}>
          <table className="w-full">
            <thead>
              <tr style={{ background: '#111', borderBottom: '1px solid #2a2a2a' }}>
                <th className="text-left p-5 text-sm font-medium" style={{ color: '#A0A0A0' }}>Feature</th>
                <th className="text-center p-5 text-sm font-semibold" style={{ color: '#FAFAFA' }}>Blaze</th>
                <th className="text-center p-5 text-sm font-medium" style={{ color: '#555' }}>Wire Transfers</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Settlement time',      '< 2 seconds',       '3–5 business days'],
                ['Fee per team member',  '~$0.0002',          '$15–50'],
                ['Works globally',       '195+ countries',    'Limited corridors'],
                ['Batch payments',       '1 transaction',     'N transactions'],
                ['Compliance overhead',  'Built-in',          'Manual'],
                ['Weekend / holiday',    'Always on',         'Bank hours only'],
              ].map(([feat, blaze, old], i) => (
                <tr key={feat} style={{ borderBottom: i < 5 ? '1px solid #1a1a1a' : 'none' }}>
                  <td className="p-5 text-sm" style={{ color: '#A0A0A0' }}>{feat}</td>
                  <td className="p-5 text-center text-sm font-medium" style={{ color: '#FF6B1A' }}>
                    <span className="inline-flex items-center gap-1.5">
                      <CheckCircle size={13} style={{ color: '#00D278' }} />{blaze}
                    </span>
                  </td>
                  <td className="p-5 text-center text-sm" style={{ color: '#555' }}>{old}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Pricing CTA ──────────────────────────────────── */}
      <section id="pricing" className="py-24 px-6 text-center">
        <div className="mx-auto" style={{ maxWidth: '640px' }}>
          <div className="font-mono-custom text-xs tracking-widest mb-4" style={{ color: '#FF4D00' }}>SIMPLE PRICING</div>
          <h2 className="font-display text-7xl mb-4" style={{ color: '#FAFAFA' }}>JUST 2.5%</h2>
          <p className="text-lg mb-10 leading-relaxed" style={{ color: '#A0A0A0' }}>
            No monthly SaaS fee. No per-seat charges. Blaze takes 2.5% of each payroll run —
            the rest goes directly to your team as USDC.
          </p>
          {/* "Start Paying Globally" — auth-gated */}
          <button onClick={handleLaunchApp} className="btn-blaze px-10 py-5 rounded-xl text-lg gap-3 mx-auto">
            <Flame size={20} /> Start Paying Globally <ArrowRight size={20} />
          </button>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────── */}
      <footer className="flex flex-col md:flex-row items-center justify-between gap-4 px-8 py-8"
        style={{ borderTop: '1px solid #1a1a1a' }}>
        <div className="flex items-center gap-2">
          <Flame size={18} style={{ color: '#FF4D00' }} />
          <span className="font-display text-2xl tracking-wider" style={{ color: '#FAFAFA' }}>BLAZE</span>
        </div>
        <p className="font-mono-custom text-xs" style={{ color: '#555' }}>GLOBAL PAYROLL ON SOLANA · POWERED BY DODO PAYMENTS</p>
        <p className="text-xs" style={{ color: '#333' }}>Demo app — not financial advice</p>
      </footer>
    </main>
  );
}