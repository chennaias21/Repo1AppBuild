import { useEffect, useRef, type ReactNode } from 'react';
import { Check, X } from 'lucide-react';
import { pushModal } from './modalStack';
import type { Status } from '../core/types';

export const PALETTE = ['#7b7bff', '#3ddc97', '#fbbf24', '#ff9340', '#5aa0ff', '#f472b6', '#a396ff', '#94a3b8', '#2dd4bf', '#f87171'];

/* ----- Sheet (bottom sheet on phones, dialog on desktop). Closes on Back button / Esc / backdrop. ----- */
export function Sheet({ title, onClose, children, footer }: { title: string; onClose: () => void; children: ReactNode; footer?: ReactNode }) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const unregister = pushModal(() => closeRef.current());
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') closeRef.current(); };
    window.addEventListener('keydown', key);
    return () => { window.removeEventListener('keydown', key); unregister(); };
  }, []);
  return (
    <div className="overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title}>
        <div className="sheet-head">
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close"><X size={20} /></button>
        </div>
        <div className="sheet-body">{children}</div>
        {footer && <div className="sheet-foot">{footer}</div>}
      </div>
    </div>
  );
}

export function Field({ label, help, error, children }: { label: string; help?: string; error?: string | null; children: ReactNode }) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
      {error ? <div className="err">{error}</div> : help ? <div className="help">{help}</div> : null}
    </div>
  );
}

export function Segmented<T extends string>({ value, onChange, options, cls }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[]; cls?: string }) {
  return (
    <div className={`seg ${cls ?? ''}`} role="tablist">
      {options.map((o) => (
        <button key={o.value} type="button" className={o.value === value ? 'on' : ''} onClick={() => onChange(o.value)}>{o.label}</button>
      ))}
    </div>
  );
}

export function Switch({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return <button type="button" role="switch" aria-checked={on} aria-label={label} className={`switch ${on ? 'on' : ''}`} onClick={() => onChange(!on)} />;
}

export function CheckRow({ on, onChange, title, sub }: { on: boolean; onChange: (v: boolean) => void; title: string; sub?: string }) {
  return (
    <button type="button" className={`check-row ${on ? 'on' : ''}`} onClick={() => onChange(!on)}>
      <span className="box">{on && <Check size={14} strokeWidth={3} />}</span>
      <span><b style={{ display: 'block' }}>{title}</b>{sub && <span className="muted small">{sub}</span>}</span>
    </button>
  );
}

const tone = (s: Status | 'none') => (s === 'over' ? 'red' : s === 'watch' ? 'amber' : s === 'onTrack' ? 'green' : '');
export function Bar({ pct, status = 'none', thin, marker }: { pct: number; status?: Status | 'none'; thin?: boolean; marker?: number }) {
  return (
    <div className={`bar ${tone(status)} ${thin ? 'thin' : ''}`} role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
      <i style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
      {marker !== undefined && <span className="marker" style={{ left: `${Math.min(100, Math.max(0, marker))}%` }} />}
    </div>
  );
}

export const STATUS_LABEL: Record<Status, string> = { onTrack: 'On Track', watch: 'Watch Out', over: 'Overspending' };
export function StatusPill({ status }: { status: Status }) {
  return <span className={`pill ${status === 'onTrack' ? 'green' : status === 'watch' ? 'amber' : 'red'}`}><span className="dot" />{STATUS_LABEL[status]}</span>;
}

export function Ring({ pct, size = 64, stroke = 8, color = 'var(--primary)', children }: { pct: number; size?: number; stroke?: number; color?: string; children?: ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.min(100, Math.max(0, pct));
  return (
    <div className="score-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--card2)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${(p / 100) * c} ${c}`} style={{ transition: 'stroke-dasharray .5s' }} />
      </svg>
      {children && <div className="c small" style={{ fontWeight: 700 }}>{children}</div>}
    </div>
  );
}

export function Donut({ slices, size = 150, stroke = 22, children }: { slices: { value: number; color: string }[]; size?: number; stroke?: number; children?: ReactNode }) {
  const total = slices.reduce((s, x) => s + x.value, 0);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  let acc = 0;
  return (
    <div className="score-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--card2)" strokeWidth={stroke} />
        {total > 0 && slices.map((s, i) => {
          const len = (s.value / total) * c;
          const gap = slices.length > 1 ? 3 : 0;
          const el = <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={s.color} strokeWidth={stroke} strokeDasharray={`${Math.max(0, len - gap)} ${c}`} strokeDashoffset={-acc} strokeLinecap="butt" />;
          acc += len;
          return el;
        })}
      </svg>
      {children && <div className="c">{children}</div>}
    </div>
  );
}

export function Empty({ emoji, title, text, children }: { emoji: string; title: string; text?: string; children?: ReactNode }) {
  return (
    <div className="empty">
      <div className="em">{emoji}</div>
      <b style={{ color: 'var(--text)' }}>{title}</b>
      {text && <p style={{ marginTop: 4 }}>{text}</p>}
      {children && <div style={{ marginTop: 14 }}>{children}</div>}
    </div>
  );
}

export const EMOJIS = ['🛒', '🍽️', '☕', '🏠', '💡', '📶', '📺', '🚌', '⛽', '🚗', '🛵', '🛍️', '👕', '🎬', '✈️', '🏖️', '🎁', '💇', '💊', '🩺', '🛡️', '🏦', '📈', '🪙', '🐷', '💍', '🎓', '📚', '👪', '🐶', '🧹', '🔥', '💼', '🎯', '🧾', '➕', '🎮', '🏋️', '🛟', '🚨', '📦', '🔧', '📱', '💰'];
export function EmojiPicker({ value, onChange }: { value: string; onChange: (e: string) => void }) {
  return (
    <div className="emoji-grid">
      {EMOJIS.map((e) => <button key={e} type="button" className={e === value ? 'on' : ''} onClick={() => onChange(e)}>{e}</button>)}
    </div>
  );
}

/* ----- Charts (plain SVG/CSS: light, fast, work offline) ----- */
export function StackedBar({ segments, height = 14 }: { segments: { value: number; color: string; label: string }[]; height?: number }) {
  const total = segments.reduce((a, s) => a + Math.max(0, s.value), 0);
  return (
    <div className="split-bar" style={{ height }} role="img" aria-label={segments.map((s) => `${s.label} ${Math.round(total ? (s.value / total) * 100 : 0)}%`).join(', ')}>
      {total > 0 && segments.filter((s) => s.value > 0).map((s, i) => <i key={i} title={s.label} style={{ width: `${(s.value / total) * 100}%`, background: s.color }} />)}
    </div>
  );
}

/** Income / expenses / savings per month. Bars are comparable across months (same scale). */
export function TrendChart({ points }: { points: { label: string; income: number; spent: number; saved: number; current?: boolean }[] }) {
  const W = 340, H = 150, top = 8, bottom = 22;
  const max = Math.max(1, ...points.flatMap((p) => [p.income, p.spent, p.saved]));
  const n = points.length;
  const gw = W / n;
  const bw = Math.max(5, Math.min(14, gw / 4));
  const h = (v: number) => ((H - top - bottom) * v) / max;
  const bar = (x: number, v: number, c: string, name: string) => <rect x={x} y={H - bottom - h(v)} width={bw} height={Math.max(v > 0 ? 2 : 0, h(v))} rx={3} fill={c}><title>{`${name}: ${Math.round(v / 100).toLocaleString('en-IN')}`}</title></rect>;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Income, expenses and savings for the last months" style={{ display: 'block' }}>
      <line x1="0" x2={W} y1={H - bottom} y2={H - bottom} stroke="var(--border)" />
      {points.map((p, i) => {
        const cx = gw * i + gw / 2;
        return (
          <g key={i} opacity={p.current ? 1 : 0.92}>
            {p.current && <rect x={gw * i + 2} y={0} width={gw - 4} height={H - bottom + 2} rx={8} fill="var(--primary-soft)" />}
            {bar(cx - bw * 1.5 - 1, p.income, 'var(--blue)', 'Income')}
            {bar(cx - bw / 2, p.spent, 'var(--orange)', 'Expenses')}
            {bar(cx + bw / 2 + 1, p.saved, 'var(--green)', 'Savings')}
            <text x={cx} y={H - 6} textAnchor="middle" fontSize="10.5" fill="var(--muted)" fontWeight={p.current ? 700 : 500}>{p.label}</text>
          </g>
        );
      })}
    </svg>
  );
}
export const ChartLegend = () => (
  <div className="row wrap small" style={{ gap: 14 }}>
    <span className="row" style={{ gap: 6 }}><i style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--blue)' }} />Income</span>
    <span className="row" style={{ gap: 6 }}><i style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--orange)' }} />Expenses</span>
    <span className="row" style={{ gap: 6 }}><i style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--green)' }} />Savings</span>
  </div>
);

/** Planned (budget) vs actual (spent) as one bar with a marker at the budget when overspent. */
export function PlanBar({ planned, actual }: { planned: number; actual: number }) {
  const over = planned > 0 && actual > planned;
  const scale = Math.max(planned, actual, 1);
  return (
    <div className="bar thin" style={{ overflow: 'visible' }} role="img" aria-label={`${actual} of ${planned}`}>
      <i style={{ width: `${(actual / scale) * 100}%`, background: over ? 'var(--red)' : actual / Math.max(planned, 1) >= 0.8 ? 'var(--amber)' : 'var(--green)' }} />
      {over && <span className="marker" style={{ left: `${(planned / scale) * 100}%` }} />}
    </div>
  );
}
