// Simple in-memory/file-based store for demo
// In production, replace with a real database (Postgres, etc.)
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');

interface Founder {
  id: string;
  email: string;
  name: string;
  company: string;
  createdAt: string;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  walletAddress: string;
  allocationPercent: number;
  founderId: string;
  createdAt: string;
}

interface Payment {
  id: string;
  founderId: string;
  amountUSD: number;
  dodoPaymentId?: string;
  dodoCheckoutUrl?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
}

interface Disbursement {
  id: string;
  paymentId: string;
  teamMemberId: string;
  amountUSDC: number;
  txSignature?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
}

interface DB {
  founders: Founder[];
  teamMembers: TeamMember[];
  payments: Payment[];
  disbursements: Disbursement[];
}

function ensureDbDir() {
  const dir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function readDB(): DB {
  ensureDbDir();
  if (!fs.existsSync(DB_PATH)) {
    const empty: DB = { founders: [], teamMembers: [], payments: [], disbursements: [] };
    fs.writeFileSync(DB_PATH, JSON.stringify(empty, null, 2));
    return empty;
  }
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
}

function writeDB(db: DB) {
  ensureDbDir();
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

export const db = {
  // Founders
  createFounder(data: Omit<Founder, 'id' | 'createdAt'>): Founder {
    const store = readDB();
    const founder: Founder = { ...data, id: uuidv4(), createdAt: new Date().toISOString() };
    store.founders.push(founder);
    writeDB(store);
    return founder;
  },
  getFounder(id: string): Founder | null {
    return readDB().founders.find(f => f.id === id) || null;
  },
  getFounderByEmail(email: string): Founder | null {
    return readDB().founders.find(f => f.email === email) || null;
  },
  getAllFounders(): Founder[] {
    return readDB().founders;
  },

  // Team Members
  createTeamMember(data: Omit<TeamMember, 'id' | 'createdAt'>): TeamMember {
    const store = readDB();
    const member: TeamMember = { ...data, id: uuidv4(), createdAt: new Date().toISOString() };
    store.teamMembers.push(member);
    writeDB(store);
    return member;
  },
  getTeamMembersByFounder(founderId: string): TeamMember[] {
    return readDB().teamMembers.filter(m => m.founderId === founderId);
  },
  deleteTeamMember(id: string): void {
    const store = readDB();
    store.teamMembers = store.teamMembers.filter(m => m.id !== id);
    writeDB(store);
  },

  // Payments
  createPayment(data: Omit<Payment, 'id' | 'createdAt'>): Payment {
    const store = readDB();
    const payment: Payment = { ...data, id: uuidv4(), createdAt: new Date().toISOString() };
    store.payments.push(payment);
    writeDB(store);
    return payment;
  },
  updatePayment(id: string, updates: Partial<Payment>): Payment | null {
    const store = readDB();
    const idx = store.payments.findIndex(p => p.id === id);
    if (idx === -1) return null;
    store.payments[idx] = { ...store.payments[idx], ...updates };
    writeDB(store);
    return store.payments[idx];
  },
  getPayment(id: string): Payment | null {
    return readDB().payments.find(p => p.id === id) || null;
  },
  getPaymentsByFounder(founderId: string): Payment[] {
    return readDB().payments.filter(p => p.founderId === founderId).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },
  getPaymentByDodoId(dodoId: string): Payment | null {
    return readDB().payments.find(p => p.dodoPaymentId === dodoId) || null;
  },

  // Disbursements
  createDisbursement(data: Omit<Disbursement, 'id' | 'createdAt'>): Disbursement {
    const store = readDB();
    const d: Disbursement = { ...data, id: uuidv4(), createdAt: new Date().toISOString() };
    store.disbursements.push(d);
    writeDB(store);
    return d;
  },
  updateDisbursement(id: string, updates: Partial<Disbursement>): Disbursement | null {
    const store = readDB();
    const idx = store.disbursements.findIndex(d => d.id === id);
    if (idx === -1) return null;
    store.disbursements[idx] = { ...store.disbursements[idx], ...updates };
    writeDB(store);
    return store.disbursements[idx];
  },
  getDisbursementsByPayment(paymentId: string): Disbursement[] {
    return readDB().disbursements.filter(d => d.paymentId === paymentId);
  },
  getDisbursementsByMember(teamMemberId: string): Disbursement[] {
    return readDB().disbursements.filter(d => d.teamMemberId === teamMemberId);
  },
};

export type { Founder, TeamMember, Payment, Disbursement };
