import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, CalendarCheck2, Check, FileText, Phone, Video, Wallet, IdCard, Landmark, Clock3 } from 'lucide-react';
import {
  CREDIT_SCORES,
  DEFAULT_SCENARIO,
  LOAN_TYPES,
  LoanType,
  OCCUPANCY,
  OFFICER,
  PROPERTY_TYPES,
  RateOption,
  Scenario,
  breakEven,
  costOver,
  estimates,
  loanAmount,
  pct,
  usd,
  zipInfo,
} from '../lib';
import { Field, MoneyInput, Segmented, Sheet, Toggle } from './ui';

// ── Edit scenario ─────────────────────────────────────────────
export function ScenarioSheet({
  open,
  onClose,
  value,
  onApply,
}: {
  open: boolean;
  onClose: () => void;
  value: Scenario;
  onApply: (s: Scenario) => void;
}) {
  const [s, setS] = useState(value);
  useEffect(() => {
    if (open) setS(value);
  }, [open, value]);
  const set = <K extends keyof Scenario>(k: K, v: Scenario[K]) => setS((p) => ({ ...p, [k]: v }));
  const downPct = s.price ? (s.down / s.price) * 100 : 0;
  const z = zipInfo(s.zip);
  const isPurchase = s.purpose === 'Purchase';
  const loan = loanAmount(s);
  const valid = s.price > 0 && loan > 0 && s.zip.length === 5;

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Your loan details"
      subtitle="Update anything and we'll re-price instantly. This won't affect your credit."
      footer={
        <>
          <button className="btn btn--ghost" onClick={() => setS(DEFAULT_SCENARIO)}>
            Reset
          </button>
          <button className="btn btn--navy" disabled={!valid} onClick={() => onApply(s)}>
            Update rates
          </button>
        </>
      }
    >
      <div className="form">
        <Field label="Loan purpose">
          <Segmented
            label="Loan purpose"
            value={s.purpose}
            onChange={(v) => set('purpose', v)}
            options={[
              { value: 'Purchase', label: 'Buy a home' },
              { value: 'Refinance', label: 'Refinance' },
            ]}
          />
        </Field>

        <Field label="ZIP code" htmlFor="f-zip" hint={z ? z.city : s.zip.length ? 'Enter a 5-digit ZIP' : 'Where is the property?'}>
          <input
            id="f-zip"
            className="input"
            inputMode="numeric"
            maxLength={5}
            value={s.zip}
            onChange={(e) => set('zip', e.target.value.replace(/\D/g, '').slice(0, 5))}
          />
        </Field>

        <div className="form-row">
          <Field label={isPurchase ? 'Purchase price' : 'Home value'} htmlFor="f-price">
            <MoneyInput id="f-price" value={s.price} onChange={(n) => setS((p) => ({ ...p, price: n, down: Math.min(p.down, n) }))} />
          </Field>
          {isPurchase ? (
            <Field label="Down payment" htmlFor="f-down" hint={`${downPct.toFixed(1)}% of price`}>
              <MoneyInput id="f-down" value={s.down} onChange={(n) => set('down', Math.min(n, s.price))} />
            </Field>
          ) : (
            <Field label="Current loan balance" htmlFor="f-bal">
              <MoneyInput id="f-bal" value={loan} onChange={(n) => set('down', Math.max(0, s.price - n))} />
            </Field>
          )}
        </div>

        {isPurchase && (
          <div className="quick-down" role="group" aria-label="Quick down payment">
            {[3.5, 5, 10, 20, 25].map((p) => (
              <button
                key={p}
                type="button"
                className={Math.abs(downPct - p) < 0.05 ? 'is-on' : ''}
                onClick={() => set('down', Math.round((s.price * p) / 100))}
              >
                {p}%
              </button>
            ))}
          </div>
        )}

        <div className="form-row">
          <Field label="Credit score" htmlFor="f-credit">
            <div className="select-wrap">
              <select id="f-credit" className="input" value={s.credit} onChange={(e) => set('credit', Number(e.target.value))}>
                {CREDIT_SCORES.map((c) => (
                  <option key={c} value={c}>
                    {c === 800 ? '800+' : `${c}–${c + 19}`}
                  </option>
                ))}
              </select>
            </div>
          </Field>
          <Field label="Monthly income" htmlFor="f-inc" hint="Before taxes">
            <MoneyInput id="f-inc" value={s.income} onChange={(n) => set('income', n)} />
          </Field>
        </div>

        <Field label="Loan type">
          <Segmented label="Loan type" value={s.loanType} onChange={(v: LoanType) => set('loanType', v)} options={LOAN_TYPES.map((t) => ({ value: t, label: t }))} />
        </Field>

        <div className="form-row">
          <Field label="Property type" htmlFor="f-prop">
            <div className="select-wrap">
              <select id="f-prop" className="input" value={s.propertyType} onChange={(e) => set('propertyType', e.target.value)}>
                {PROPERTY_TYPES.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </div>
          </Field>
          <Field label="How you'll use it" htmlFor="f-occ">
            <div className="select-wrap">
              <select id="f-occ" className="input" value={s.occupancy} onChange={(e) => set('occupancy', e.target.value)}>
                {OCCUPANCY.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </div>
          </Field>
        </div>

        {isPurchase && (
          <div className="form-toggle">
            <Toggle id="f-first" checked={s.firstTime} onChange={(b) => set('firstTime', b)} label="I'm a first-time home buyer" />
          </div>
        )}

        <div className="form-summary">
          <span>Loan amount</span>
          <b>{usd(loan)}</b>
        </div>
      </div>
    </Sheet>
  );
}

// ── Schedule a call ───────────────────────────────────────────
function nextBusinessDays(n: number) {
  const out: Date[] = [];
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  while (out.length < n) {
    d.setDate(d.getDate() + 1);
    const wd = d.getDay();
    if (wd !== 0 && wd !== 6) out.push(new Date(d));
  }
  return out;
}
const SLOTS = ['9:00 AM', '9:30 AM', '10:30 AM', '11:00 AM', '1:00 PM', '2:30 PM', '3:00 PM', '4:30 PM'];
const BOOKED = new Set(['0-9:30 AM', '0-1:00 PM', '1-10:30 AM', '2-3:00 PM', '3-9:00 AM']);
const TOPICS = ['Which rate is right for me', 'Points vs. lender credits', 'How much I can afford', 'Next steps to apply'];

export function ScheduleSheet({ open, onClose, option }: { open: boolean; onClose: () => void; option: RateOption }) {
  const days = useMemo(() => nextBusinessDays(5), []);
  const [day, setDay] = useState(0);
  const [slot, setSlot] = useState<string | null>(null);
  const [mode, setMode] = useState<'phone' | 'video'>('phone');
  const [topics, setTopics] = useState<string[]>(['Which rate is right for me']);
  const [phone, setPhone] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (open) {
      setDone(false);
      setSlot(null);
    }
  }, [open]);

  const digits = phone.replace(/\D/g, '');
  const fmtPhone = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 10);
    if (d.length < 4) return d;
    if (d.length < 7) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
    return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  };
  const ok = slot && digits.length === 10;
  const dayLabel = (d: Date) => d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const first = OFFICER.name.split(' ')[0];

  if (done) {
    return (
      <Sheet open={open} onClose={onClose} title="You're booked" subtitle={`${first} will ${mode === 'phone' ? 'call you' : 'send a video link'} at the time below.`}>
        <div className="booked">
          <div className="booked-ic" aria-hidden>
            <CalendarCheck2 size={28} />
          </div>
          <p className="booked-when">
            {dayLabel(days[day])}
            <br />
            <b>{slot} CT</b> · 15 minutes
          </p>
          <ul className="booked-list">
            <li><span>With</span><b>{OFFICER.name}, NMLS #{OFFICER.nmls}</b></li>
            <li><span>{mode === 'phone' ? 'Calling' : 'Link sent to'}</span><b>{phone}</b></li>
            <li><span>Discussing</span><b>{topics.join(', ') || 'General questions'}</b></li>
            <li><span>Your quote</span><b>{pct(option.rate)} · {option.termLabel} · {usd(option.payment)}/mo</b></li>
          </ul>
          <button className="btn btn--navy btn--block" onClick={onClose}>
            Done
          </button>
        </div>
      </Sheet>
    );
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={`Schedule a call with ${first}`}
      subtitle="15 minutes, no obligation. Get a clear answer on which option fits you."
      footer={
        <button className="btn btn--primary btn--block" disabled={!ok} onClick={() => setDone(true)}>
          {slot ? `Book ${days[day].toLocaleDateString('en-US', { weekday: 'short' })} at ${slot}` : 'Choose a time'}
        </button>
      }
    >
      <div className="form">
        <Field label="Call type">
          <Segmented
            label="Call type"
            value={mode}
            onChange={setMode}
            options={[
              { value: 'phone', label: <><Phone size={15} /> Phone</> },
              { value: 'video', label: <><Video size={15} /> Video</> },
            ]}
          />
        </Field>

        <div className="field">
          <span className="label">Day</span>
          <div className="days" role="radiogroup" aria-label="Day">
            {days.map((d, i) => (
              <button
                key={i}
                role="radio"
                aria-checked={day === i}
                className={day === i ? 'is-on' : ''}
                onClick={() => {
                  setDay(i);
                  setSlot(null);
                }}
              >
                <span>{d.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                <b>{d.getDate()}</b>
                <span>{d.toLocaleDateString('en-US', { month: 'short' })}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <span className="label">
            Time <span className="muted">· Central Time</span>
          </span>
          <div className="slots" role="radiogroup" aria-label="Time">
            {SLOTS.map((t) => {
              const taken = BOOKED.has(`${day}-${t}`);
              return (
                <button
                  key={t}
                  role="radio"
                  aria-checked={slot === t}
                  disabled={taken}
                  className={slot === t ? 'is-on' : ''}
                  onClick={() => setSlot(t)}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>

        <div className="field">
          <span className="label">What would you like to cover?</span>
          <div className="topics">
            {TOPICS.map((t) => {
              const on = topics.includes(t);
              return (
                <button
                  key={t}
                  type="button"
                  aria-pressed={on}
                  className={on ? 'is-on' : ''}
                  onClick={() => setTopics((p) => (on ? p.filter((x) => x !== t) : [...p, t]))}
                >
                  {on && <Check size={14} />} {t}
                </button>
              );
            })}
          </div>
        </div>

        <Field label="Best number to reach you" htmlFor="f-phone">
          <input
            id="f-phone"
            className="input"
            inputMode="tel"
            autoComplete="tel"
            placeholder="(555) 555-5555"
            value={phone}
            onChange={(e) => setPhone(fmtPhone(e.target.value))}
          />
        </Field>
      </div>
    </Sheet>
  );
}

// ── Apply ─────────────────────────────────────────────────────
export function ApplySheet({
  open,
  onClose,
  option,
  scenario,
  onStart,
  onSchedule,
}: {
  open: boolean;
  onClose: () => void;
  option: RateOption;
  scenario: Scenario;
  onStart: () => void;
  onSchedule: () => void;
}) {
  const est = estimates(scenario);
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Start your application"
      subtitle="Most borrowers finish in about 15 minutes. You can save and come back anytime."
      footer={
        <div className="apply-foot">
          <button className="btn btn--primary btn--block btn--lg" onClick={onStart}>
            Start application <ArrowRight size={18} />
          </button>
          <button className="link" onClick={onSchedule}>
            Not ready yet? Schedule a call with {OFFICER.name.split(' ')[0]}
          </button>
        </div>
      }
    >
      <div className="apply-quote">
        <div>
          <span className="eyebrow">Your quote</span>
          <p className="apply-rate">{pct(option.rate)}</p>
          <p className="muted small">{pct(option.apr)} APR · {option.termLabel}</p>
        </div>
        <div className="apply-quote-r">
          <span className="eyebrow">Est. monthly</span>
          <p className="apply-pay">{usd(option.payment + est.tax + est.ins + est.mi)}</p>
          <p className="muted small">incl. taxes &amp; insurance</p>
        </div>
      </div>
      <p className="apply-loan">
        {usd(loanAmount(scenario))} {scenario.loanType.toLowerCase()} loan · {scenario.purpose.toLowerCase()} in {zipInfo(scenario.zip)?.city ?? scenario.zip}
      </p>

      <h3 className="h4">Have these handy</h3>
      <ul className="needs">
        <li><IdCard size={18} aria-hidden /><span><b>Photo ID</b><small>Driver's license or passport</small></span></li>
        <li><Wallet size={18} aria-hidden /><span><b>Income</b><small>Last 2 pay stubs and 2 years of W-2s</small></span></li>
        <li><Landmark size={18} aria-hidden /><span><b>Assets</b><small>2 months of bank statements</small></span></li>
        <li><FileText size={18} aria-hidden /><span><b>Property</b><small>Purchase contract, if you have one</small></span></li>
      </ul>

      <ol className="steps">
        <li><b>Apply online</b><span>Takes about 15 minutes</span></li>
        <li><b>Get pre-approved</b><span>Usually within 1 business day</span></li>
        <li><b>Lock your rate</b><span>{OFFICER.name.split(' ')[0]} confirms pricing and locks it in</span></li>
      </ol>
    </Sheet>
  );
}

// ── Compare ───────────────────────────────────────────────────
export function CompareSheet({
  open,
  onClose,
  options,
  scenario,
  horizon,
  onApply,
}: {
  open: boolean;
  onClose: () => void;
  options: RateOption[];
  scenario: Scenario;
  horizon: number;
  onApply: (id: string) => void;
}) {
  const loan = loanAmount(scenario);
  if (!options.length) return <Sheet open={open} onClose={onClose} title="Compare rates">{null}</Sheet>;
  const costs = options.map((o) => costOver(o, loan, horizon));
  const best = costs.indexOf(Math.min(...costs));
  const ref = options.reduce((a, b) => (b.fees < a.fees ? b : a));
  const rows: { label: string; vals: string[]; hi?: number }[] = [
    { label: 'APR', vals: options.map((o) => pct(o.apr)) },
    { label: 'Term', vals: options.map((o) => o.termLabel) },
    { label: 'Monthly P&I', vals: options.map((o) => usd(o.payment)) },
    { label: 'Upfront', vals: options.map((o) => (o.fees >= 0 ? `${usd(o.fees)} (${o.points.toFixed(3)} pts)` : `${usd(-o.fees)} credit`)) },
    {
      label: 'Break-even',
      vals: options.map((o) => {
        const b = breakEven(o, ref);
        return o.id === ref.id ? '—' : b ? `${b} months` : '—';
      }),
    },
    { label: `Cost over ${horizon} yrs`, vals: costs.map((c) => usd(c)), hi: best },
  ];
  return (
    <Sheet open={open} onClose={onClose} size="lg" title="Compare rates" subtitle={`Cost over ${horizon} years counts interest paid plus upfront points or credits.`}>
      <div className="cmp-scroll">
        <table className="cmp-table">
          <thead>
            <tr>
              <th scope="col"><span className="sr">Detail</span></th>
              {options.map((o, i) => (
                <th scope="col" key={o.id} className={i === best ? 'is-best' : ''}>
                  {i === best && <span className="tag tag--green">Best value</span>}
                  <span className="cmp-rate">{pct(o.rate)}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label}>
                <th scope="row">{r.label}</th>
                {r.vals.map((v, i) => (
                  <td key={i} className={r.hi === i ? 'is-hi' : ''}>
                    {v}
                  </td>
                ))}
              </tr>
            ))}
            <tr className="cmp-cta">
              <th scope="row"><span className="sr">Action</span></th>
              {options.map((o) => (
                <td key={o.id}>
                  <button className="btn btn--primary btn--sm btn--block" onClick={() => onApply(o.id)}>
                    Apply
                  </button>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <p className="muted small cmp-note">
        <Clock3 size={14} aria-hidden /> Break-even shows how long it takes monthly savings to repay extra upfront cost vs. the lowest-cost option.
      </p>
    </Sheet>
  );
}
