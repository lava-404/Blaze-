'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, Check, Flame, Wallet, Users } from 'lucide-react';

interface TeamMember { id: string; name: string; role: string; walletAddress: string; allocationPercent: number; }

function isValidSolana(addr: string) { return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(addr); }

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg,#FF4D00,#FF8C42)',
  'linear-gradient(135deg,#FF6B1A,#FFB400)',
  'linear-gradient(135deg,#FF4D00,#FF6B1A)',
  'linear-gradient(135deg,#FF8C42,#FFB400)',
  'linear-gradient(135deg,#CC3D00,#FF6B1A)',
];

export default function Onboarding() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [form, setForm] = useState({ name: '', role: '', walletAddress: '', allocationPercent: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving,  setSaving]  = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);

  const totalAlloc = members.reduce((s, m) => s + m.allocationPercent, 0);


  function validate() {
    const e: Record<string,string> = {};
    if (!form.name.trim())          e.name           = 'Name required';
    if (!form.role.trim())          e.role           = 'Role required';
    if (!form.walletAddress.trim()) e.walletAddress  = 'Wallet required';
    else if (!isValidSolana(form.walletAddress)) e.walletAddress = 'Invalid Solana address';
    const a = parseFloat(form.allocationPercent);
    if (!form.allocationPercent || isNaN(a) || a <= 0) e.allocationPercent = 'Must be > 0';
    else if (a + totalAlloc > 100) e.allocationPercent = `Total would exceed 100% (currently ${totalAlloc}%)`;
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function addMember() {
    if (!validate()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ founderId: 'demo', ...form, allocationPercent: parseFloat(form.allocationPercent) }),
      });
      const data = await res.json();
      setMembers(p => [...p, data.member]);
      setForm({ name: '', role: '', walletAddress: '', allocationPercent: '' });
      setSavedId(data.member.id);
      setTimeout(() => setSavedId(null), 2000);
    } finally { setSaving(false); }
  }

  async function removeMember(id: string) {
    await fetch(`/api/team/${id}`, { method: 'DELETE' });
    setMembers(p => p.filter(m => m.id !== id));
  }

  const allocColor = totalAlloc > 100 ? '#FF4D00' : totalAlloc === 100 ? '#00D278' : '#FFB400';

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a' }}>

      <header className="flex items-center gap-4 px-6 md:px-8 py-4" style={{ borderBottom: '1px solid #1a1a1a' }}>
        <Link href="/dashboard" style={{ color: '#A0A0A0' }}>
          <ArrowLeft size={20} />
        </Link>
        <Flame size={18} style={{ color: '#FF4D00' }} />
        <span className="font-display text-2xl tracking-wider" style={{ color: '#FAFAFA' }}>BLAZE</span>
        <span style={{ color: '#333' }}>/</span>
        <span className="text-sm" style={{ color: '#A0A0A0' }}>Team Setup</span>
      </header>

      <div className="mx-auto px-6 md:px-8 py-10" style={{ maxWidth: '896px' }}>
        <div className="mb-8">
          <div className="font-mono-custom text-xs tracking-widest mb-2" style={{ color: '#FF4D00' }}>TEAM MANAGEMENT</div>
          <h1 className="font-display text-5xl mb-2" style={{ color: '#FAFAFA' }}>YOUR TEAM</h1>
          <p className="text-sm leading-relaxed" style={{ color: '#A0A0A0' }}>
            Add team members and their Solana wallet addresses. Allocation percentages determine USDC split.
          </p>
        </div>

        {/* Allocation meter */}
        <div className="card p-5 mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm" style={{ color: '#A0A0A0' }}>Total Allocation</span>
            <span className="font-mono-custom text-sm" style={{ color: allocColor }}>
              {totalAlloc.toFixed(1)}% / 100%
            </span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: '#1a1a1a' }}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(totalAlloc, 100)}%`, background: `linear-gradient(90deg, #FF4D00, ${allocColor})` }} />
          </div>
          {totalAlloc < 100 && members.length > 0 && (
            <div className="text-xs mt-2" style={{ color: '#FFB400' }}>
              {(100 - totalAlloc).toFixed(1)}% unallocated — remaining goes to platform reserve
            </div>
          )}
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
              <label className="text-xs mb-1.5 block" style={{ color: '#A0A0A0' }}>Allocation %</label>
              <input type="number" className="input-blaze" placeholder="20" min="0" max="100"
                value={form.allocationPercent}
                onChange={e => { setForm(p => ({ ...p, allocationPercent: e.target.value })); setErrors(p => ({ ...p, allocationPercent: '' })); }} />
              {errors.allocationPercent && <p className="text-xs mt-1" style={{ color: '#FF4D00' }}>{errors.allocationPercent}</p>}
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
              <div className="space-y-3 overflow-y-auto pr-1" style={{ maxHeight: '384px' }}>
                
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
