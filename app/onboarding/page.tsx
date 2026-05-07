'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import { ArrowLeft, Plus, Trash2, Check, Flame, Wallet, Users } from 'lucide-react';

interface TeamMember { id: string; name: string; role: string; walletAddress: string; allocationAmountUSD: number; }

function isValidSolana(addr: string) { return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(addr); }

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg,#FF4D00,#FF8C42)',
  'linear-gradient(135deg,#FF6B1A,#FFB400)',
  'linear-gradient(135deg,#FF4D00,#FF6B1A)',
  'linear-gradient(135deg,#FF8C42,#FFB400)',
  'linear-gradient(135deg,#CC3D00,#FF6B1A)',
];

export default function Onboarding() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { authenticated, user } = usePrivy();
  const founderEmail = getPrivyEmail(user);

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [form, setForm] = useState({ name: '', role: '', walletAddress: '', allocationAmountUSD: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving,  setSaving]  = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);

  useEffect(() => {
    if (!authenticated) {
      router.replace('/');
      return;
    }
    if (!founderEmail || typeof founderEmail !== 'string') return;

    fetch(`/api/team?founderEmail=${encodeURIComponent(founderEmail)}`)
      .then(r => r.json())
      .then(data => setMembers(data.members || []))
      .catch(() => {});
  }, [authenticated, founderEmail, router]);

  const totalAlloc = members.reduce(
    (s, m) => s + (m?.allocationAmountUSD || 0),
    0
  );


  function validate() {
    const e: Record<string,string> = {};
    if (!form.name.trim())          e.name           = 'Name required';
    if (!form.role.trim())          e.role           = 'Role required';
    if (!form.walletAddress.trim()) e.walletAddress  = 'Wallet required';
    else if (!isValidSolana(form.walletAddress)) e.walletAddress = 'Invalid Solana address';
    const a = parseFloat(form.allocationAmountUSD);
    if (!form.allocationAmountUSD || isNaN(a) || a <= 0) e.allocationAmountUSD = 'Must be > 0';
    setErrors(e);
    return Object.keys(e).length === 0;
  }
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

  async function addMember() {
    if (!validate()) return;
    
    const email = getPrivyEmail(user)
    console.log(email)
    if (!email || typeof email !== 'string') return;
    setSaving(true);
   
    try {
      const res = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          founderEmail: email,
          name: form.name,
          role: form.role,
          walletAddress: form.walletAddress,
          allocationAmountUSD: parseFloat(form.allocationAmountUSD),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        console.error(data);
        alert(data.error || 'Failed to add member');
        return;
      }
      
      if (!data?.member) {
        console.error('No member returned');
        return;
      }
      
      setMembers(p => [...p, data.member]);
      
      setForm({
        name: '',
        role: '',
        walletAddress: '',
        allocationAmountUSD: '',
      });
      
      setSavedId(data.member.id);
      setTimeout(() => setSavedId(null), 2000);
    } finally { setSaving(false); }
  }

  async function removeMember(id: string) {
    await fetch(`/api/team/${id}`, { method: 'DELETE' });
    setMembers(p => p.filter(m => m.id !== id));
  }

  const allocColor = totalAlloc === 0 ? '#555' : '#FFB400';
  const reason = searchParams.get('reason');

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a' }}>

      <header className="flex items-center gap-4 px-6 md:px-8 py-4" style={{ borderBottom: '1px solid #1a1a1a' }}>
        <Link href="/dashboard" style={{ color: '#A0A0A0' }}>
          <ArrowLeft size={20} />
        </Link>
        <Flame size={18} style={{ color: '#FF4D00' }} />
        <span className="font-display text-2xl tracking-tight italic" style={{ color: '#FAFAFA' }}>blaze</span>
      </header>

      <div className="mx-auto px-6 md:px-8 py-10" style={{ maxWidth: '896px' }}>
        <div className="mb-8">
          <div className="font-mono-custom text-xs tracking-widest mb-2" style={{ color: '#FF4D00' }}>TEAM MANAGEMENT</div>
          <h1 className="font-display text-5xl mb-2" style={{ color: '#FAFAFA' }}>Your Team</h1>
          <p className="text-sm leading-relaxed" style={{ color: '#A0A0A0' }}>
            Add team members and their Solana wallet addresses. Enter a fixed USD amount per member — Blaze uses it to calculate the USDC split.
          </p>
        </div>

        {reason === 'team_required' && (
          <div className="card p-5 mb-6" style={{ border: '1px solid rgba(255,77,0,0.35)' }}>
            <div className="text-sm font-medium" style={{ color: '#FAFAFA' }}>Add team details before paying</div>
            <div className="text-xs mt-1" style={{ color: '#A0A0A0' }}>
              You tried to start a payment without a team. Add at least one team member below, then go back to the dashboard.
            </div>
          </div>
        )}

        {/* Allocation summary */}
        <div className="card p-5 mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm" style={{ color: '#A0A0A0' }}>Total Team Allocation</span>
            <span className="font-mono-custom text-sm" style={{ color: '#FFB400' }}>
              ${totalAlloc.toFixed(2)}
            </span>
          </div>
          <div className="text-xs" style={{ color: allocColor }}>
            This is the sum of member USD amounts you’ve entered. When you run payroll, Blaze distributes USDC proportionally to these amounts.
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">

          {/* Form */}
          <div className="card p-6">
            <div className="font-mono-custom text-xs tracking-wider mb-5" style={{ color: '#FF4D00' }}>ADD MEMBER</div>

            {([
              { key: 'name', label: 'Full Name',    placeholder: 'Alice Johnson' },
              { key: 'role', label: 'Role',          placeholder: 'Senior Developer' },
            ] as const).map(f => (
              <div key={f.key} className="mb-4">
                <label className="text-xs mb-1.5 block" style={{ color: '#A0A0A0' }}>{f.label}</label>
                <input className="input-blaze" placeholder={f.placeholder}
                  value={form[f.key]}
                  onChange={e => { setForm(p => ({ ...p, [f.key]: e.target.value })); setErrors(p => ({ ...p, [f.key]: '' })); }} />
                {errors[f.key] && <p className="text-xs mt-1" style={{ color: '#FF4D00' }}>{errors[f.key]}</p>}
              </div>
            ))}

            <div className="mb-4">
              <label className="text-xs mb-1.5 block" style={{ color: '#A0A0A0' }}>Solana Wallet Address</label>
              <input className="input-blaze" style={{ fontFamily: "'DM Mono', monospace", fontSize: '12px' }}
                placeholder="7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU"
                value={form.walletAddress}
                onChange={e => { setForm(p => ({ ...p, walletAddress: e.target.value })); setErrors(p => ({ ...p, walletAddress: '' })); }} />
              {errors.walletAddress
                ? <p className="text-xs mt-1" style={{ color: '#FF4D00' }}>{errors.walletAddress}</p>
                : <p className="text-xs mt-1" style={{ color: '#555' }}>Must be a valid Solana public key</p>}
            </div>

            <div className="mb-6">
              <label className="text-xs mb-1.5 block" style={{ color: '#A0A0A0' }}>Amount (USD)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm" style={{ color: '#555' }}>$</span>
                <input type="number" className="input-blaze pl-8" placeholder="2000" min="0" step="0.01"
                  value={form.allocationAmountUSD}
                  onChange={e => { setForm(p => ({ ...p, allocationAmountUSD: e.target.value })); setErrors(p => ({ ...p, allocationAmountUSD: '' })); }} />
              </div>
              {errors.allocationAmountUSD && <p className="text-xs mt-1" style={{ color: '#FF4D00' }}>{errors.allocationAmountUSD}</p>}
            </div>

            <button onClick={addMember} disabled={saving}
              className="btn-blaze w-full py-3 rounded-lg text-sm gap-2">
              {savedId ? (
                <><Check size={14} /> Added!</>
              ) : saving ? (
                <><div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor:'#fff',borderTopColor:'transparent' }} /> Adding…</>
              ) : (
                <><Plus size={14} /> Add Team Member</>
              )}
            </button>
          </div>

          {/* Members */}
          <div className="card p-6">
            <div className="font-mono-custom text-xs tracking-wider mb-5" style={{ color: '#FF4D00' }}>
              TEAM
            </div>

            {members.length === 0 ? (
              <div className="text-center py-12">
                <Users size={40} className="mx-auto mb-3" style={{ color: '#2a2a2a' }} />
                <div className="text-sm" style={{ color: '#555' }}>Add your first team member</div>
              </div>
            ) : (
              <div
              className="space-y-3 overflow-y-auto pr-1"
              style={{ maxHeight: '384px' }}
            >
              {members.map((member, index) => (
                <div
                  key={member.id}
                  className="p-4 rounded-xl"
                  style={{
                    background: '#111',
                    border: '1px solid #1f1f1f',
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                        style={{
                          background:
                            AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length],
                          color: '#fff',
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
                          className="text-xs mt-1 break-all"
                          style={{
                            color: '#555',
                            fontFamily: "'DM Mono', monospace",
                          }}
                        >
                          {member.walletAddress}
                        </div>
            
                        <div
                          className="text-xs mt-2"
                          style={{ color: '#FFB400' }}
                        >
                          ${member.allocationAmountUSD.toFixed(2)}
                        </div>
                      </div>
                    </div>
            
                    <button
                      onClick={() => removeMember(member.id)}
                      className="p-2 rounded-lg transition"
                      style={{ background: '#181818' }}
                    >
                      <Trash2
                        size={14}
                        style={{ color: '#FF4D00' }}
                      />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            )}

            {members.length > 0 && (
              <div className="mt-4 pt-4" style={{ borderTop: '1px solid #1a1a1a' }}>
                <Link href="/dashboard">
                  <button className="btn-blaze w-full py-3 rounded-lg text-sm gap-2">
                    Back to Dashboard <ArrowLeft size={14} style={{ transform: 'rotate(180deg)' }} />
                  </button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

