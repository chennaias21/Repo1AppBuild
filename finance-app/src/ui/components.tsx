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
