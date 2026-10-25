import { useMemo } from 'react';
import {
  ArrowRight,
  CalendarClock,
  Check,
  ChevronDown,
  Clock3,
  Download,
  ExternalLink,
  Mail,
  Pencil,
  Phone,
  ShieldCheck,
} from 'lucide-react';
import logo from '../assets/tum-logo.png';
import officerPhoto from '../assets/richard-haskell.jpg';
import equalHousing from '../assets/equal-housing.png';
import {
  BORROWER,
  OFFICER,
  QUOTE_ID,
  RATES_AS_OF,
  GOOGLE_RATING,
  GOOGLE_REVIEWS_URL,
  LIMESITE_URL,
  REVIEWS,
  RateOption,
  Scenario,
  TERMS,
  TermId,
  breakEven,
  estimates,
  loanAmount,
  num,
  pct,
  usd,
  zipInfo,
} from '../lib';
import { ApplyLink, LoneStar, Segmented, Stars, useTween } from './ui';
import { ScenarioForm } from './sheets';

// ── Header ────────────────────────────────────────────────────
export function Header() {
  return (
    <header className="topbar">
      <div className="topbar-in">
        <a href="#top" className="brand" aria-label="Texas United Mortgage home">
          <img src={logo} alt="Texas United Mortgage" />
        </a>
        <div className="topbar-right">
          <a href="#" className="btn btn--ghost btn--sm hide-sm">
            <CalendarClock size={16} /> Schedule a call
          </a>
          <div className="account">
            <div className="avatar-btn">
              <span className="avatar">{BORROWER.initials}</span>
              <span className="hide-sm">{BORROWER.first}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

// ── Hero: the selected rate ───────────────────────────────────
export function Hero({
  option,
  scenario,
  isPicked,
}: {
  option: RateOption;
  scenario: Scenario;
  isPicked: boolean;
}) {
  const rate = useTween(option.rate);
  const pay = useTween(option.payment);
  const loan = loanAmount(scenario);
  const downPct = scenario.price ? Math.round((scenario.down / scenario.price) * 100) : 0;

  return (
    <section className="hero" aria-labelledby="hero-title">
      <LoneStar className="hero-star" />
      <div className="hero-grid">
        <div className="hero-main">
          <p className="eyebrow eyebrow--light" id="hero-title">
            {isPicked ? 'Your selected rate' : 'Your lowest available rate'}
          </p>
          <div className="hero-rate">
            <span className="hero-rate-num">{rate.toFixed(3)}</span>
            <span className="hero-rate-pct">%</span>
          </div>
          <p className="hero-sub">
            <strong>{pct(option.apr)} APR</strong>
            <span className="dot" />
            {option.termLabel}
            <span className="dot" />
            {scenario.loanType}
          </p>
        </div>

        <div className="hero-pay">
          <p className="eyebrow eyebrow--light">Monthly payment</p>
          <p className="hero-pay-num">{usd(pay)}</p>
          <p className="hero-pay-sub">Principal &amp; interest</p>
          <dl className="hero-pay-list">
            <div>
              <dt>{option.fees >= 0 ? 'Points at closing' : 'Lender credit'}</dt>
              <dd>
                {option.fees >= 0 ? `${usd(option.fees)} · ${option.points.toFixed(3)} pts` : usd(-option.fees)}
              </dd>
            </div>
            <div>
              <dt>Rates as of</dt>
              <dd>{RATES_AS_OF}</dd>
            </div>
          </dl>
        </div>
      </div>

      <dl className="hero-stats">
        <div>
          <dt>Loan amount</dt>
          <dd>{usd(loan)}</dd>
          <span>{scenario.purpose === 'Purchase' ? `${downPct}% down payment` : 'Refinance'}</span>
        </div>
        <div>
          <dt>Credit score</dt>
          <dd>{scenario.credit}</dd>
          <span>Estimated</span>
        </div>
        <div>
          <dt>Loan type</dt>
          <dd>{scenario.loanType}</dd>
          <span>{option.termLabel}</span>
        </div>
        <div>
          <dt>Property</dt>
          <dd>{zipInfo(scenario.zip)?.city ?? scenario.zip}</dd>
          <span>{scenario.propertyType}</span>
        </div>
      </dl>

      <div className="hero-actions">
        <ApplyLink className="btn btn--primary btn--lg">
          Apply now <ArrowRight size={18} />
        </ApplyLink>
        <a href="#" className="btn btn--onDark btn--lg">
          <CalendarClock size={18} /> Schedule a call
        </a>
        <a className="link-light" href="#details">
          <Pencil size={14} /> Edit my details
        </a>
      </div>
    </section>
  );
}

// ── Rate explorer ─────────────────────────────────────────────
export type SortKey = 'rate' | 'apr' | 'payment' | 'upfront';

export function RateExplorer(props: {
  scenario: Scenario;
  options: RateOption[];
  term: TermId;
  setTerm: (t: TermId) => void;
  sort: SortKey;
  setSort: (s: SortKey) => void;
  compare: string[];
  toggleCompare: (id: string) => void;
  expanded: string | null;
  setExpanded: (id: string | null) => void;
  showAll: boolean;
  setShowAll: (b: boolean) => void;
  onScenario: (s: Scenario) => void;
  updating: boolean;
}) {
  const { scenario, options, sort } = props;
  const est = estimates(scenario);
  const extra = est.tax + est.ins + est.mi;

  const meta = useMemo(() => {
    const ref = options.reduce((a, b) => (Math.abs(b.points) < Math.abs(a.points) ? b : a));
    return { ref };
  }, [options]);

  const sorted = useMemo(() => {
    const list = [...options];
    if (sort === 'rate') list.sort((a, b) => a.rate - b.rate);
    if (sort === 'apr') list.sort((a, b) => a.apr - b.apr);
    if (sort === 'payment') list.sort((a, b) => a.payment - b.payment);
    if (sort === 'upfront') list.sort((a, b) => a.fees - b.fees);
    return list;
  }, [options, sort]);

  const visible = props.showAll ? sorted : sorted.slice(0, 5);

  return (
    <section className="panel rates" id="rates" aria-labelledby="rates-title">
      <div className="panel-head">
        <div>
          <h2 id="rates-title" className="h2">Your rates, on demand</h2>
          <p className="muted">
            Live pricing for your scenario. Rates as of {RATES_AS_OF} · Quote #{QUOTE_ID}
          </p>
        </div>
      </div>

      <ScenarioForm value={scenario} onApply={props.onScenario} />

      <div className="term-scroll">
        <Segmented
          label="Loan term"
          value={props.term}
          onChange={props.setTerm}
          options={TERMS.map((t) => ({ value: t.id, label: t.short }))}
        />
      </div>

      <div className="list-tools">
        <label className="sort">
          <span>Sort</span>
          <select id="sort" value={sort} onChange={(e) => props.setSort(e.target.value as SortKey)}>
            <option value="rate">Low Rate</option>
            <option value="apr">Low APR</option>
            <option value="payment">Low Monthly Payment</option>
            <option value="upfront">Low Upfront Costs</option>
          </select>
          <ChevronDown size={14} aria-hidden />
        </label>
      </div>

      <div className={`rate-table ${props.updating ? 'is-updating' : ''}`}>
        <div className="rate-head" aria-hidden>
          <span>Rate / APR</span>
          <span>Upfront</span>
          <span>Monthly P&I</span>
          <span />
        </div>
        <ul className="rate-list">
          {visible.map((o) => {
            const isOpen = props.expanded === o.id;
            const inCompare = props.compare.includes(o.id);
            const be = breakEven(o, meta.ref);
            const monthly = o.payment;
            return (
              <li key={o.id} className={`rate-row ${isOpen ? 'is-open' : ''}`}>
                <div className="rate-main">
                  <button
                    className="rate-hit"
                    aria-expanded={isOpen}
                    aria-controls={`d-${o.id}`}
                    onClick={() => props.setExpanded(isOpen ? null : o.id)}
                  >
                    <span className="rate-cell rate-cell--rate">
                      <span className="badge">{o.badge}</span>
                      <span>
                        <span className="rate-big">{pct(o.rate)}</span>
                        <span className="rate-apr">{pct(o.apr)} APR</span>
                      </span>
                    </span>
                    <span className="rate-cell rate-cell--up">
                      <span className="cell-label">Upfront</span>
                      {o.fees >= 0 ? (
                        <>
                          <span className="v">{usd(o.fees)}</span>
                          <span className="pill pill--amber">{o.points.toFixed(3)} pts</span>
                        </>
                      ) : (
                        <>
                          <span className="v v--green">−{usd(-o.fees)}</span>
                          <span className="pill pill--green">credit</span>
                        </>
                      )}
                    </span>
                    <span className="rate-cell rate-cell--pay">
                      <span className="cell-label">P&I</span>
                      <span className="v">
                        {usd(monthly)}
                        <small>/mo</small>
                      </span>
                    </span>
                  </button>
                  <div className="rate-actions">
                    <button type="button" className="btn btn--soft btn--sm rate-le-btn">
                      <Download size={14} /> Loan Estimate
                    </button>
                    <div className="rate-actions-end">
                      <label className={`cmp ${inCompare ? 'is-on' : ''}`}>
                        <input
                          type="checkbox"
                          checked={inCompare}
                          onChange={() => props.toggleCompare(o.id)}
                          aria-label={`Compare ${pct(o.rate)}`}
                        />
                        <span className="cmp-box" aria-hidden>
                          <Check size={12} />
                        </span>
                        <span className="cmp-txt">Compare</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="rate-detail" id={`d-${o.id}`} hidden={!isOpen}>
                  <div className="detail-grid">
                    <div className="detail-block">
                      <h4>Monthly payment</h4>
                      <dl className="kv">
                        <div><dt>Principal &amp; interest</dt><dd>{usd(o.payment)}</dd></div>
                        <div><dt>Property tax (est.)</dt><dd>{usd(est.tax)}</dd></div>
                        <div><dt>Home insurance (est.)</dt><dd>{usd(est.ins)}</dd></div>
                        {est.mi > 0 && <div><dt>Mortgage insurance (est.)</dt><dd>{usd(est.mi)}</dd></div>}
                        <div className="kv-total"><dt>Total</dt><dd>{usd(o.payment + extra)}</dd></div>
                      </dl>
                    </div>
                    <div className="detail-block">
                      <h4>What this option means</h4>
                      <ul className="explain">
                        <li>
                          {o.fees >= 0
                            ? `You pay ${o.points.toFixed(3)} discount points (${usd(o.fees)}) at closing to lock ${pct(o.rate)}.`
                            : `The lender gives you ${usd(-o.fees)} toward closing costs in exchange for a ${pct(o.rate)} rate.`}
                        </li>
                        {be && o.id !== meta.ref.id && (
                          <li>
                            Compared with {pct(meta.ref.rate)}, you save {usd(meta.ref.payment - o.payment)}/mo and recover the extra upfront cost in{' '}
                            <b>{be} months ({(be / 12).toFixed(1)} yrs)</b>.
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                  <div className="detail-actions">
                    <ApplyLink className="btn btn--primary btn--sm">
                      Apply with this rate <ArrowRight size={15} />
                    </ApplyLink>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {sorted.length > 5 && (
        <button className="show-more" onClick={() => props.setShowAll(!props.showAll)}>
          {props.showAll ? 'Show fewer options' : `Show ${sorted.length - 5} more options`}
          <ChevronDown size={16} className={props.showAll ? 'flip' : ''} />
        </button>
      )}

      <div className="unsure">
        <div className="unsure-ic" aria-hidden>
          <Clock3 size={20} />
        </div>
        <div className="unsure-copy">
          <p className="unsure-t">Not sure which option fits?</p>
          <p className="muted small">
            {OFFICER.name.split(' ')[0]} can walk you through points, credits and timing in a 15-minute call. No obligation.
          </p>
        </div>
        <a href="#" className="btn btn--outline">
          <CalendarClock size={16} /> Schedule a call
        </a>
      </div>
    </section>
  );
}

// ── Loan officer ──────────────────────────────────────────────
export function OfficerCard({ uid }: { uid: string }) {
  return (
    <section className="panel officer" aria-labelledby={`lo-title-${uid}`}>
      <div className="officer-top">
        <div className="officer-photo">
          <img src={officerPhoto} alt={OFFICER.name} width={64} height={64} />
          <span className="officer-online" aria-hidden />
        </div>
        <div className="officer-id">
          <p className="eyebrow">Your loan officer</p>
          <h2 id={`lo-title-${uid}`} className="officer-name">{OFFICER.name}</h2>
          <p className="muted small">
            {OFFICER.title} · NMLS #{OFFICER.nmls}
          </p>
        </div>
      </div>
      <a href="#reviews" className="officer-rating">
        <Stars value={OFFICER.rating} />
        <b>{OFFICER.rating.toFixed(1)}</b>
        <span>({num(OFFICER.reviews)} Google reviews)</span>
      </a>
      <ul className="contact">
        <li>
          <Phone size={16} aria-hidden />
          <span>Phone</span>
          <a href={`tel:${OFFICER.phone.replace(/\D/g, '')}`}>{OFFICER.phone}</a>
        </li>
        <li>
          <Mail size={16} aria-hidden />
          <span>Email</span>
          <a href={`mailto:${OFFICER.email}`}>{OFFICER.email}</a>
        </li>
      </ul>
      <div className="officer-cta">
        <ApplyLink className="btn btn--primary btn--block">
          Apply now <ArrowRight size={17} />
        </ApplyLink>
        <a href="#" className="btn btn--outline btn--block">
          <CalendarClock size={16} /> Schedule a call
        </a>
      </div>
      <p className="officer-trust">
        <ShieldCheck size={15} aria-hidden /> Checking rates never affects your credit score.
      </p>
    </section>
  );
}

// ── Reviews ───────────────────────────────────────────────────
export function Reviews() {
  return (
    <section className="panel reviews" id="reviews" aria-labelledby="rev-title">
      <div className="reviews-grid">
        <div className="reviews-summary">
          <h2 id="rev-title" className="h2">What borrowers say</h2>
          <p className="g-source">
            <span className="g-pill">Google</span> Texas United Mortgage · Spring, TX
          </p>
          <div className="score">
            <span className="score-num">{GOOGLE_RATING.rating.toFixed(1)}</span>
            <div>
              <Stars value={GOOGLE_RATING.rating} size={18} />
              <p className="muted small">{num(GOOGLE_RATING.count)} Google reviews</p>
            </div>
          </div>
          <a className="btn btn--outline btn--sm" href={GOOGLE_REVIEWS_URL} target="_blank" rel="noopener noreferrer">
            Read all reviews on Google <ExternalLink size={14} />
          </a>
        </div>
        <div className="reviews-track" tabIndex={0} aria-label="Recent Google reviews">
          {REVIEWS.map((r) => (
            <figure className="review" key={r.name}>
              <Stars value={5} size={13} />
              <blockquote>{r.text}</blockquote>
              <figcaption>
                <span className="rv-avatar" aria-hidden>
                  {r.name
                    .split(' ')
                    .map((p) => p[0].toUpperCase())
                    .slice(0, 2)
                    .join('')}
                </span>
                <span>
                  <b>{r.name}</b>
                  <span className="muted small">{r.when} · Google</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Footer ────────────────────────────────────────────────────
export function Footer() {
  return (
    <footer className="foot">
      <div className="foot-in">
        <div className="foot-brand">
          <img src={logo} alt="Texas United Mortgage" className="foot-logo" />
          <img src={equalHousing} alt="Equal Housing Opportunity" className="eho" width={49} height={52} />
        </div>
        <p className="foot-legal">
          Additional fees may apply which may impact your APR. Transaction details are based on the information provided and may
          include assumptions about the consumer, product, or pricing. Changes to transaction details may impact price. System results
          and a rate lock does not guarantee eligibility. A loan file Submission is required and will be subject to full diligence
          procedures. Your actual rate, payment, and costs could be higher. Get an official Loan Estimate before choosing a loan.
          Products displayed are based on some assumptions on loan data. Actual eligible products may vary once complete loan
          information is available for pricing. All rates and programs subject to loan underwriting and approval and may be subject to
          change depending on individual credit profile and other qualifications.
        </p>
        <a className="made-with" href={LIMESITE_URL} target="_blank" rel="noopener noreferrer">
          Made with <span className="made-heart" aria-hidden>❤️</span> <b>Limesite.io</b>
        </a>
      </div>
    </footer>
  );
}

// ── Sticky actions (mobile) / floating bar (desktop) ──────────
export function ActionBar({ visible }: { visible: boolean }) {
  return (
    <div className={`actionbar ${visible ? 'is-on' : ''}`} aria-hidden={!visible}>
      <div className="actionbar-in">
        <div className="actionbar-copy">
          <b>Ready to lock in your savings?</b>
          <span>Start your application today and see your potential monthly savings.</span>
        </div>
        <a href="#" className="btn btn--outline btn--sm actionbar-sec" tabIndex={visible ? 0 : -1}>
          <CalendarClock size={16} /> <span>Schedule a call</span>
        </a>
        <ApplyLink className="btn btn--navy btn--sm" tabIndex={visible ? 0 : -1}>
          Apply Now <ArrowRight size={16} />
        </ApplyLink>
      </div>
    </div>
  );
}

export function CompareTray({
  count,
  onOpen,
  onClear,
  lifted,
}: {
  count: number;
  onOpen: () => void;
  onClear: () => void;
  lifted: boolean;
}) {
  return (
    <div className={`tray ${count > 0 ? 'is-on' : ''} ${lifted ? 'is-lifted' : ''}`} aria-hidden={count === 0}>
      <span className="tray-count">{count}</span>
      <span className="tray-txt">{count === 1 ? 'Pick one more to compare' : `${count} rates selected`}</span>
      <button className="tray-clear" onClick={onClear} tabIndex={count ? 0 : -1}>
        Clear
      </button>
      <button className="btn btn--light btn--sm" onClick={onOpen} disabled={count < 2} tabIndex={count ? 0 : -1}>
        Compare
      </button>
    </div>
  );
}
