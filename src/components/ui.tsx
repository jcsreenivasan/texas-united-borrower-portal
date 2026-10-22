import { ReactNode, useEffect, useId, useRef, useState } from 'react';
import { X } from 'lucide-react';

const reduced = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** Smoothly tweens a number when it changes. */
export function useTween(value: number, ms = 450) {
  const [v, setV] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    if (reduced()) {
      setV(value);
      from.current = value;
      return;
    }
    const start = performance.now();
    const a = from.current;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / ms);
      const e = 1 - Math.pow(1 - t, 3);
      const cur = a + (value - a) * e;
      setV(cur);
      from.current = cur;
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, ms]);
  return v;
}

export function Sheet({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'md',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'md' | 'lg';
}) {
  const panel = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const [mounted, setMounted] = useState(open);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)));
    } else {
      setShown(false);
      const t = setTimeout(() => setMounted(false), 260);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const prevFocus = document.activeElement as HTMLElement | null;
    const t = setTimeout(() => panel.current?.focus(), 30);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(t);
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
      prevFocus?.focus?.();
    };
  }, [open, onClose]);

  if (!mounted) return null;
  return (
    <div className={`sheet-root ${shown ? 'is-open' : ''}`}>
      <div className="sheet-scrim" onClick={onClose} />
      <div
        className={`sheet sheet--${size}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        ref={panel}
      >
        <div className="sheet-grab" aria-hidden />
        <header className="sheet-head">
          <div>
            <h2 id={titleId}>{title}</h2>
            {subtitle && <p className="sheet-sub">{subtitle}</p>}
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </header>
        <div className="sheet-body">{children}</div>
        {footer && <footer className="sheet-foot">{footer}</footer>}
      </div>
    </div>
  );
}

export function Segmented<T extends string | number>({
  value,
  onChange,
  options,
  label,
  size = 'md',
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: ReactNode }[];
  label: string;
  size?: 'sm' | 'md';
}) {
  return (
    <div className={`seg seg--${size}`} role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          key={String(o.value)}
          role="radio"
          aria-checked={o.value === value}
          className={o.value === value ? 'is-on' : ''}
          onClick={() => onChange(o.value)}
          type="button"
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Field({ label, hint, children, htmlFor }: { label: string; hint?: ReactNode; children: ReactNode; htmlFor?: string }) {
  return (
    <div className="field">
      <label htmlFor={htmlFor}>{label}</label>
      {children}
      {hint && <span className="field-hint">{hint}</span>}
    </div>
  );
}

export function MoneyInput({ id, value, onChange, prefix = '$' }: { id: string; value: number; onChange: (n: number) => void; prefix?: string }) {
  return (
    <div className="input-wrap">
      <span className="input-affix">{prefix}</span>
      <input
        id={id}
        className="input input--affix"
        inputMode="numeric"
        value={value ? value.toLocaleString('en-US') : ''}
        onChange={(e) => onChange(Number(e.target.value.replace(/[^0-9]/g, '')) || 0)}
      />
    </div>
  );
}

export function Toggle({ id, checked, onChange, label }: { id: string; checked: boolean; onChange: (b: boolean) => void; label: ReactNode }) {
  return (
    <label className="toggle" htmlFor={id}>
      <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="toggle-track" aria-hidden>
        <span className="toggle-thumb" />
      </span>
      <span className="toggle-label">{label}</span>
    </label>
  );
}

export function Stars({ value, size = 14 }: { value: number; size?: number }) {
  const star = 'M10 1.6l2.47 5.3 5.8.68-4.3 3.97 1.15 5.73L10 14.4l-5.12 2.88 1.15-5.73L1.73 7.58l5.8-.68z';
  const row = (cls: string) => (
    <span className={cls}>
      {[0, 1, 2, 3, 4].map((i) => (
        <svg key={i} viewBox="0 0 20 20" width={size} height={size} aria-hidden>
          <path d={star} />
        </svg>
      ))}
    </span>
  );
  return (
    <span className="stars" role="img" aria-label={`${value} out of 5 stars`}>
      {row('stars-bg')}
      <span className="stars-fg" style={{ width: `${(value / 5) * 100}%` }}>
        {row('stars-row')}
      </span>
    </span>
  );
}

export function Toast({ message, onDone }: { message: string | null; onDone: () => void }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onDone, 3200);
    return () => clearTimeout(t);
  }, [message, onDone]);
  return (
    <div className={`toast ${message ? 'is-on' : ''}`} role="status" aria-live="polite">
      {message}
    </div>
  );
}

/** Five-point star from the Texas flag — brand motif. */
export function LoneStar({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" aria-hidden>
      <path d="M50 4l12.9 33.2 35.6 2-27.6 22.6 9.1 34.5L50 77 20 96.3l9.1-34.5L1.5 39.2l35.6-2z" />
    </svg>
  );
}
