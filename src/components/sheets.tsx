import { useEffect, useRef, useState } from 'react';
import { Clock3, RefreshCw } from 'lucide-react';
import {
  CREDIT_SCORES,
  LOAN_TYPES,
  LoanType,
  OCCUPANCY,
  PROPERTY_TYPES,
  RateOption,
  Scenario,
  VA_USAGE,
  VaUsage,
  breakEven,
  loanAmount,
  pct,
  usd,
} from '../lib';
import { ApplyLink, Field, MoneyInput, Segmented, Sheet, Toggle } from './ui';

// ── Loan details (always visible, applied with "Update rates") ─
export function ScenarioForm({ value, onApply }: { value: Scenario; onApply: (s: Scenario) => void }) {
  const [s, setS] = useState(value);
  const [pctStr, setPctStr] = useState(() => {
    const dp = value.price ? (value.down / value.price) * 100 : 0;
    return dp.toFixed(1);
  });
  const editingPct = useRef(false);
  useEffect(() => setS(value), [value]);
  const set = <K extends keyof Scenario>(k: K, v: Scenario[K]) => setS((p) => ({ ...p, [k]: v }));
  const downPct = s.price ? (s.down / s.price) * 100 : 0;
  // Keep pctStr in sync when dollar input or external reset changes downPct
  useEffect(() => {
    if (!editingPct.current) setPctStr(downPct.toFixed(1));
  }, [downPct]);
  const isPurchase = s.purpose === 'Purchase';
  const loan = loanAmount(s);
  const valid = s.price > 0 && loan > 0 && s.zip.length === 5;
  const dirty = JSON.stringify(s) !== JSON.stringify(value);

  return (
    <form
      id="details"
      className="details"
      aria-label="Your loan details"
      onSubmit={(e) => {
        e.preventDefault();
        if (valid && dirty) onApply(s);
      }}
    >
      <div className="form form--inline">
        <Field label="Loan purpose" wide>
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

        <Field label="ZIP code" htmlFor="f-zip">
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
            <Field label="Down payment" htmlFor="f-down">
              <div className="down-row">
                <MoneyInput id="f-down" value={s.down} onChange={(n) => set('down', Math.min(n, s.price))} />
                <div className="input-wrap">
                  <input
                    className="input input--pct"
                    inputMode="decimal"
                    aria-label="Down payment percent"
                    value={pctStr}
                    onFocus={() => { editingPct.current = true; }}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^0-9.]/g, '');
                      setPctStr(raw);
                      const p = parseFloat(raw);
                      if (!isNaN(p) && s.price > 0) set('down', Math.min(Math.round((s.price * p) / 100), s.price));
                    }}
                    onBlur={() => { editingPct.current = false; setPctStr(downPct.toFixed(1)); }}
                  />
                  <span className="input-affix input-affix--r" aria-hidden>%</span>
                </div>
              </div>
            </Field>
          ) : (
            <Field label="Current loan balance" htmlFor="f-bal">
              <MoneyInput id="f-bal" value={loan} onChange={(n) => set('down', Math.max(0, s.price - n))} />
            </Field>
          )}
        </div>


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
          <Field label="Monthly income" htmlFor="f-inc">
            <MoneyInput id="f-inc" value={s.income} onChange={(n) => set('income', n)} />
          </Field>
        </div>

        <Field label="Loan type" htmlFor="f-loan">
          <div className="select-wrap">
            <select id="f-loan" className="input" value={s.loanType} onChange={(e) => set('loanType', e.target.value as LoanType)}>
              {LOAN_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
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

        {isPurchase && s.loanType === 'Conventional' && (
          <div className="form-toggle">
            <Toggle id="f-first" checked={s.firstTime} onChange={(b) => set('firstTime', b)} label="I'm a first-time home buyer" />
          </div>
        )}
        {isPurchase && s.loanType === 'VA' && (
          <div className="form-toggle">
            <Field label="VA loan use">
              <Segmented
                label="VA loan use"
                value={s.vaUsage}
                onChange={(v: VaUsage) => set('vaUsage', v)}
                size="sm"
                options={VA_USAGE.map((u) => ({ value: u, label: u }))}
              />
            </Field>
          </div>
        )}

        <div className="details-actions">
          <div className="details-summary">
            <span>Loan amount</span>
            <b>{usd(loan)}</b>
          </div>
          {dirty && <span className="details-pending">Changes not applied yet</span>}
          <button type="submit" className="btn btn--navy" disabled={!valid || !dirty}>
            <RefreshCw size={16} /> Update rates
          </button>
        </div>
      </div>
    </form>
  );
}

// ── Compare ───────────────────────────────────────────────────
export function CompareSheet({
  open,
  onClose,
  options,
  scenario,
}: {
  open: boolean;
  onClose: () => void;
  options: RateOption[];
  scenario: Scenario;
}) {
  if (!options.length) return <Sheet open={open} onClose={onClose} title="Compare rates">{null}</Sheet>;
  const ref = options.reduce((a, b) => (b.fees < a.fees ? b : a));
  const rows: { label: string; vals: string[] }[] = [
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
  ];
  return (
    <Sheet open={open} onClose={onClose} size="lg" title="Compare rates" subtitle="Break-even shows months to recover extra upfront cost vs. the lowest-cost option.">
      <div className="cmp-scroll">
        <table className="cmp-table">
          <thead>
            <tr>
              <th scope="col"><span className="sr">Detail</span></th>
              {options.map((o) => (
                <th scope="col" key={o.id}>
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
                  <td key={i}>{v}</td>
                ))}
              </tr>
            ))}
            <tr className="cmp-cta">
              <th scope="row"><span className="sr">Action</span></th>
              {options.map((o) => (
                <td key={o.id}>
                  <ApplyLink className="btn btn--primary btn--sm btn--block">Apply</ApplyLink>
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
