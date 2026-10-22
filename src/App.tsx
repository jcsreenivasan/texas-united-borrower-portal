import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DEFAULT_SCENARIO, Scenario, TERMS, TermId, priceRates, RateOption } from './lib';
import { ActionBar, CompareTray, Footer, Header, Hero, OfficerCard, RateExplorer, Reviews, SortKey } from './components/sections';
import { ApplySheet, CompareSheet, ScenarioSheet, ScheduleSheet } from './components/sheets';
import { Toast } from './components/ui';
import { BORROWER } from './lib';

type SheetKey = 'scenario' | 'schedule' | 'apply' | 'compare' | null;

export default function App() {
  const [scenario, setScenario] = useState<Scenario>(DEFAULT_SCENARIO);
  const [term, setTerm] = useState<TermId>('30');
  const [waive, setWaive] = useState(false);
  const [showTotal, setShowTotal] = useState(false);
  const [horizon, setHorizon] = useState(5);
  const [sort, setSort] = useState<SortKey>('rate');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [compare, setCompare] = useState<string[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [sheet, setSheet] = useState<SheetKey>(null);
  const [applyId, setApplyId] = useState<string | null>(null);
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
  const refOption = options.reduce((x, y) => (Math.abs(y.points) < Math.abs(x.points) ? y : x));
  const applyOption = (applyId && all.get(applyId)) || selected;

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setHeroOut(!e.isIntersecting), { rootMargin: '-80px 0px 0px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const close = useCallback(() => setSheet(null), []);
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
      <Header onSchedule={() => setSheet('schedule')} />

      <main className="wrap">
        <div className="greet">
          <h1>
            {greeting}, {BORROWER.first}.
          </h1>
          <p className="muted">Here's where your home loan stands today. Adjust anything below and your rates update instantly.</p>
        </div>

        <div className="layout">
          <div className="col-main">
            <div ref={heroRef}>
              <Hero
                option={selected}
                refOption={refOption}
                scenario={scenario}
                isPicked={!!selectedId}
                onApply={() => {
                  setApplyId(selected.id);
                  setSheet('apply');
                }}
                onSchedule={() => setSheet('schedule')}
                onEdit={() => setSheet('scenario')}
              />
            </div>

            <RateExplorer
              scenario={scenario}
              options={options}
              term={term}
              setTerm={(t) => flash(() => { setTerm(t); setExpanded(null); })}
              horizon={horizon}
              setHorizon={setHorizon}
              sort={sort}
              setSort={setSort}
              waive={waive}
              setWaive={(b) => flash(() => setWaive(b))}
              showTotal={showTotal}
              setShowTotal={setShowTotal}
              selectedId={selected.id}
              onSelect={(id) => {
                setSelectedId(id);
                setToast('Rate selected. Your summary is updated.');
              }}
              compare={compare}
              toggleCompare={(id) =>
                setCompare((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length >= 3 ? [...p.slice(1), id] : [...p, id]))
              }
              expanded={expanded}
              setExpanded={setExpanded}
              showAll={showAll}
              setShowAll={setShowAll}
              onEdit={() => setSheet('scenario')}
              onApply={(id) => {
                setApplyId(id);
                setSheet('apply');
              }}
              onSchedule={() => setSheet('schedule')}
              updating={updating}
            />

            <div className="only-mobile">
              <OfficerCard
                uid="m"
                onApply={() => {
                  setApplyId(selected.id);
                  setSheet('apply');
                }}
                onSchedule={() => setSheet('schedule')}
              />
            </div>

            <Reviews />
          </div>

          <aside className="col-side">
            <div className="side-sticky">
              <OfficerCard
                uid="d"
                onApply={() => {
                  setApplyId(selected.id);
                  setSheet('apply');
                }}
                onSchedule={() => setSheet('schedule')}
              />
            </div>
          </aside>
        </div>
      </main>

      <Footer />

      <CompareTray
        count={compare.length}
        onOpen={() => setSheet('compare')}
        onClear={() => setCompare([])}
        lifted={heroOut}
      />
      <ActionBar
        visible={heroOut}
        option={selected}
        onApply={() => {
          setApplyId(selected.id);
          setSheet('apply');
        }}
        onSchedule={() => setSheet('schedule')}
      />

      <ScenarioSheet
        open={sheet === 'scenario'}
        onClose={close}
        value={scenario}
        onApply={(s) => {
          close();
          flash(() => {
            setScenario(s);
            setCompare([]);
            setExpanded(null);
          });
          setToast('Rates updated for your new details.');
        }}
      />
      <ScheduleSheet open={sheet === 'schedule'} onClose={close} option={selected} />
      <ApplySheet
        open={sheet === 'apply'}
        onClose={close}
        option={applyOption}
        scenario={scenario}
        onStart={() => {
          close();
          setToast('Prototype: this would open the online application.');
        }}
        onSchedule={() => setSheet('schedule')}
      />
      <CompareSheet
        open={sheet === 'compare'}
        onClose={close}
        options={compare.map((id) => all.get(id)!).filter(Boolean)}
        scenario={scenario}
        horizon={horizon}
        onApply={(id) => {
          setApplyId(id);
          setSheet('apply');
        }}
      />

      <Toast message={toast} onDone={() => setToast(null)} />
    </div>
  );
}
