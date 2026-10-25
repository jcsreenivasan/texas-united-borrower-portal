import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BORROWER, DEFAULT_SCENARIO, RateOption, Scenario, TERMS, TermId, priceRates } from './lib';
import { ActionBar, CompareTray, Footer, Header, Hero, OfficerCard, RateExplorer, Reviews, SortKey } from './components/sections';
import { CompareSheet } from './components/sheets';
import { Toast } from './components/ui';

export default function App() {
  const [scenario, setScenario] = useState<Scenario>(DEFAULT_SCENARIO);
  const [term, setTerm] = useState<TermId>('30');
  const [waive, setWaive] = useState(false);
  const [showTotal, setShowTotal] = useState(false);
  const [sort, setSort] = useState<SortKey>('rate');
  const [selectedId] = useState<string | null>(null);
  const [compare, setCompare] = useState<string[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [heroOut, setHeroOut] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  // price every term so comparisons can span terms
  const all = useMemo(() => {
    const m = new Map<string, RateOption>();
    TERMS.forEach((t) => priceRates(scenario, t.id, waive).forEach((o) => m.set(o.id, o)));
    return m;
  }, [scenario, waive]);
  const options = useMemo(() => [...all.values()].filter((o) => o.id.startsWith(`${term}-`)), [all, term]);

  const lowest = options.reduce((a, b) => (b.rate < a.rate ? b : a));
  const selected = (selectedId && all.get(selectedId)) || lowest;

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setHeroOut(!e.isIntersecting), { rootMargin: '-80px 0px 0px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const closeCompare = useCallback(() => setCompareOpen(false), []);
  const clearToast = useCallback(() => setToast(null), []);

  const flash = (fn: () => void) => {
    setUpdating(true);
    fn();
    setTimeout(() => setUpdating(false), 380);
  };

  const greeting = (() => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  })();

  return (
    <div id="top">
      <Header onLogout={() => setToast('Prototype: this would sign you out.')} />

      <main className="wrap">
        <div className="greet">
          <h1>
            {greeting}, {BORROWER.first}.
          </h1>
          <p className="muted">Your personalized quote is ready. Compare your options, then apply or talk it through with Richard.</p>
        </div>

        <div className="layout">
          <div className="col-main">
            <div ref={heroRef}>
              <Hero option={selected} scenario={scenario} isPicked={!!selectedId} />
            </div>

            <RateExplorer
              scenario={scenario}
              options={options}
              term={term}
              setTerm={(t) =>
                flash(() => {
                  setTerm(t);
                  setExpanded(null);
                })
              }
              sort={sort}
              setSort={setSort}
              waive={waive}
              setWaive={(b) => flash(() => setWaive(b))}
              showTotal={showTotal}
              setShowTotal={setShowTotal}
              compare={compare}
              toggleCompare={(id) =>
                setCompare((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length >= 3 ? [...p.slice(1), id] : [...p, id]))
              }
              expanded={expanded}
              setExpanded={setExpanded}
              showAll={showAll}
              setShowAll={setShowAll}
              onScenario={(s) => {
                flash(() => {
                  setScenario(s);
                  setCompare([]);
                  setExpanded(null);
                });
                setToast('Rates updated for your new details.');
              }}
              updating={updating}
            />

            <div className="only-mobile">
              <OfficerCard uid="m" />
            </div>
          </div>

          <aside className="col-side">
            <div className="side-sticky">
              <OfficerCard uid="d" />
            </div>
          </aside>
        </div>

        <Reviews />
      </main>

      <Footer />

      <CompareTray count={compare.length} onOpen={() => setCompareOpen(true)} onClear={() => setCompare([])} lifted={heroOut} />
      <ActionBar visible={heroOut} />

      <CompareSheet
        open={compareOpen}
        onClose={closeCompare}
        options={compare.map((id) => all.get(id)!).filter(Boolean)}
        scenario={scenario}
      />

      <Toast message={toast} onDone={clearToast} />
    </div>
  );
}
