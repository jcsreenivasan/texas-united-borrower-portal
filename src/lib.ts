// ─────────────────────────────────────────────────────────────
// Sample data + a lightweight pricing engine for the prototype.
// Base pricing mirrors the source dashboard (30-yr fixed, $360k, 780 FICO).
// Everything else is derived so the UI responds realistically.
// ─────────────────────────────────────────────────────────────

export const BORROWER = { first: 'Reef', initials: 'R' };

export const OFFICER = {
  name: 'Richard Haskell',
  title: 'Loan Officer',
  nmls: '347720',
  email: 'team@texasunitedmortgage.com',
  phone: '346-229-1950',
  rating: 4.9, // Google rating for Texas United Mortgage
  reviews: 151,
};

export const QUOTE_ID = '59383788';

export type TermId = '30' | '20' | '15' | 'arm10' | 'arm7' | 'arm5';
export const TERMS: { id: TermId; label: string; short: string; years: number; delta: number; arm?: boolean }[] = [
  { id: '30', label: '30-yr fixed', short: '30 yr', years: 30, delta: 0 },
  { id: '20', label: '20-yr fixed', short: '20 yr', years: 20, delta: -0.125 },
  { id: '15', label: '15-yr fixed', short: '15 yr', years: 15, delta: -0.625 },
  { id: 'arm10', label: '10/6 ARM', short: '10/6 ARM', years: 30, delta: -0.25, arm: true },
  { id: 'arm7', label: '7/6 ARM', short: '7/6 ARM', years: 30, delta: -0.375, arm: true },
  { id: 'arm5', label: '5/6 ARM', short: '5/6 ARM', years: 30, delta: -0.5, arm: true },
];

// [rate, points, APR] — straight from the source dashboard
const BASE: [number, number, number][] = [
  [6.875, 1.875, 7.062],
  [6.99, 1.375, 7.128],
  [7.125, 0.875, 7.213],
  [7.25, 0.625, 7.313],
  [7.375, 0.125, 7.388],
  [7.5, -0.375, 7.5],
  [7.625, -0.875, 7.625],
  [7.875, -1.5, 7.875],
  [8.0, -2.0, 8.0],
];

export type LoanType = 'Conventional' | 'FHA' | 'VA' | 'USDA' | 'ARM';
export type Purpose = 'Purchase' | 'Refinance';

export interface Scenario {
  purpose: Purpose;
  zip: string;
  price: number; // purchase price or home value
  down: number; // down payment (purchase) — for refi, price - balance
  credit: number;
  propertyType: string;
  occupancy: string;
  loanType: LoanType;
  income: number;
  firstTime: boolean;
}

export const DEFAULT_SCENARIO: Scenario = {
  purpose: 'Purchase',
  zip: '33130',
  price: 450000,
  down: 90000,
  credit: 780,
  propertyType: 'Single Family Home',
  occupancy: 'Primary Home',
  loanType: 'Conventional',
  income: 12000,
  firstTime: true,
};

export const PROPERTY_TYPES = ['Single Family Home', 'Townhome', 'Condo', '2–4 Unit'];
export const OCCUPANCY = ['Primary Home', 'Second Home', 'Investment'];
export const LOAN_TYPES: LoanType[] = ['Conventional', 'VA', 'FHA', 'USDA', 'ARM'];
export const CREDIT_SCORES = [800, 780, 760, 740, 720, 700, 680, 660, 640, 620];

export const ZIPS: Record<string, { city: string; tax: number; ins: number }> = {
  '33130': { city: 'Miami, FL', tax: 0.0185, ins: 3600 },
  '77002': { city: 'Houston, TX', tax: 0.022, ins: 2400 },
  '77494': { city: 'Katy, TX', tax: 0.024, ins: 2300 },
  '78701': { city: 'Austin, TX', tax: 0.019, ins: 2100 },
  '75201': { city: 'Dallas, TX', tax: 0.021, ins: 2200 },
  '78205': { city: 'San Antonio, TX', tax: 0.022, ins: 2200 },
};
export const zipInfo = (zip: string) => ZIPS[zip] ?? (zip.length === 5 ? { city: 'Texas', tax: 0.02, ins: 2400 } : null);

// ── math ──────────────────────────────────────────────────────
export const pmt = (ratePct: number, years: number, principal: number) => {
  const r = ratePct / 100 / 12;
  const n = years * 12;
  return r === 0 ? principal / n : (principal * r) / (1 - Math.pow(1 + r, -n));
};

const balanceAfter = (ratePct: number, years: number, principal: number, months: number) => {
  const r = ratePct / 100 / 12;
  const p = pmt(ratePct, years, principal);
  return principal * Math.pow(1 + r, months) - p * ((Math.pow(1 + r, months) - 1) / r);
};

const solveApr = (ratePct: number, years: number, loan: number, financeCharges: number) => {
  if (financeCharges <= 0) return ratePct;
  const payment = pmt(ratePct, years, loan);
  const financed = loan - financeCharges;
  let lo = ratePct;
  let hi = ratePct + 5;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (pmt(mid, years, financed) > payment) hi = mid;
    else lo = mid;
  }
  return (lo + hi) / 2;
};

// Calibrate so the default scenario reproduces the source APRs exactly.
const APR_ADJ = BASE.map(([rate, pts, apr]) =>
  pts > 0 ? apr - solveApr(rate, 30, 360000, (pts / 100) * 360000) : 0,
);

const roundEighth = (n: number) => Math.round(n * 8) / 8;

export const loanAmount = (s: Scenario) => Math.max(0, s.price - s.down);
export const ltv = (s: Scenario) => (s.price > 0 ? loanAmount(s) / s.price : 0);

export interface RateOption {
  id: string;
  rate: number;
  apr: number;
  points: number;
  fees: number; // + you pay, − lender credit
  payment: number; // P&I
  years: number;
  termLabel: string;
  badge: string;
}

function llpa(s: Scenario, waiveEscrow: boolean) {
  let pts = 0;
  const c = s.credit;
  if (c < 780) pts += c >= 760 ? 0.125 : c >= 740 ? 0.25 : c >= 720 ? 0.375 : c >= 700 ? 0.625 : c >= 680 ? 0.875 : c >= 660 ? 1.25 : c >= 640 ? 1.625 : 2.0;
  const l = ltv(s);
  if (s.loanType === 'Conventional') {
    if (l > 0.95) pts += 0.75;
    else if (l > 0.9) pts += 0.5;
    else if (l > 0.8) pts += 0.25;
  }
  if (s.propertyType === 'Condo') pts += 0.125;
  if (s.propertyType === '2–4 Unit') pts += 0.5;
  if (s.occupancy === 'Second Home') pts += 0.5;
  if (s.occupancy === 'Investment') pts += 1.125;
  if (s.purpose === 'Refinance') pts += 0.125;
  if (waiveEscrow) pts += 0.25;
  return pts;
}

export function priceRates(s: Scenario, term: TermId, waiveEscrow: boolean): RateOption[] {
  const t = TERMS.find((x) => x.id === term)!;
  const loan = loanAmount(s);
  const typeDelta = s.loanType === 'FHA' ? -0.375 : s.loanType === 'VA' ? -0.5 : 0;
  const adj = llpa(s, waiveEscrow);
  const badge = s.loanType === 'Conventional' ? 'CONV' : s.loanType;
  return BASE.map(([baseRate, basePts], i) => {
    const rate = Math.round((baseRate + t.delta + typeDelta) * 1000) / 1000;
    const points = roundEighth(basePts + adj);
    const fees = Math.round((points / 100) * loan);
    const payment = pmt(rate, t.years, loan);
    const apr = points > 0 ? solveApr(rate, t.years, loan, fees) + APR_ADJ[i] : rate;
    return { id: `${term}-${i}`, rate, apr, points, fees, payment, years: t.years, termLabel: t.label, badge };
  });
}

/** Interest paid + upfront cost over a holding period. */
export function costOver(o: RateOption, loan: number, years: number) {
  const months = Math.min(years * 12, o.years * 12);
  const paid = o.payment * months;
  const principalPaid = loan - balanceAfter(o.rate, o.years, loan, months);
  return paid - principalPaid + o.fees;
}

/** Months to recover extra upfront cost vs a reference option. */
export function breakEven(o: RateOption, ref: RateOption) {
  const extra = o.fees - ref.fees;
  const saved = ref.payment - o.payment;
  if (extra <= 0 || saved <= 0) return null;
  return Math.ceil(extra / saved);
}

export function estimates(s: Scenario) {
  const z = zipInfo(s.zip) ?? { tax: 0.02, ins: 2400, city: '' };
  const tax = (s.price * z.tax) / 12;
  const ins = z.ins / 12;
  const pmi = s.loanType === 'Conventional' && ltv(s) > 0.8 ? (loanAmount(s) * 0.0045) / 12 : 0;
  const mip = s.loanType === 'FHA' ? (loanAmount(s) * 0.0055) / 12 : 0;
  return { tax, ins, mi: pmi + mip };
}

// ── formatting ────────────────────────────────────────────────
export const usd = (n: number, digits = 0) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: digits, minimumFractionDigits: digits });
export const pct = (n: number, digits = 3) => `${n.toFixed(digits)}%`;
export const num = (n: number) => n.toLocaleString('en-US');

// Real Google reviews for Texas United Mortgage (Google Maps listing, pulled Oct 22, 2026).
// Google only shows a short excerpt to signed-out visitors, so longer reviews end in "…".
export const GOOGLE_REVIEWS_URL = 'https://maps.app.goo.gl/4YiicHBNwjBKKsMPA';
export const GOOGLE_RATING = { rating: 4.9, count: 151 };

export const REVIEWS = [
  {
    name: 'Nelson Vargas',
    when: '3 months ago',
    text: 'Richard Haskell was an amazing loan officer. He took the time to explain every step of the home-buying process, making sure I understood everything along the way.',
  },
  {
    name: 'Richie milano',
    when: '4 months ago',
    text: 'I had an excellent experience working with Reef throughout the home-buying process. He is knowledgeable, professional, and always available to answer my questions. He guided me through every step, explained everything clearly…',
  },
  {
    name: 'Ishu Sahni',
    when: '5 months ago',
    text: 'Reef was incredible to work with. He was extremely prompt, responsive at all hours (day or night), and consistently offered some of the best rates I found in Texas.',
  },
  {
    name: 'Coy Stephenson',
    when: '5 months ago',
    text: 'Working with Texas United Mortgage was an absolutely fantastic experience from start to finish. As a first time home buyer, I had a lot of questions throughout…',
  },
];

/** Every "Apply now" opens the loan application in a new tab. */
export const APPLY_URL = 'https://richard.my1003app.com/register';
export const LIMESITE_URL = 'https://www.limesite.io/';

export const RATES_AS_OF = 'Oct 22, 2026 · 6:02 PM';
