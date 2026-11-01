import { useState } from 'react';
import { ShieldCheck, WifiOff, Smartphone } from 'lucide-react';
import { buildSeed } from '../core/seed';
import { formatINR, paiseToInput, parseINR } from '../core/money';
import { todayStr } from '../core/dates';
import { replaceAll } from '../data/repo';
import { CheckRow, Field } from './components';

export const BRAND = { name: 'Rupee Routine', tagline: 'Money Made Simple', sub: 'Track your money. Plan your budget. Build your savings.' };

export function Onboarding() {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [salaryStr, setSalaryStr] = useState(paiseToInput(86000 * 100));
  const [startDay, setStartDay] = useState('1');
  const [useDefaults, setUseDefaults] = useState(true);
  const [emergency, setEmergency] = useState(true);
  const [marriage, setMarriage] = useState(true);
  const [busy, setBusy] = useState(false);
  const salary = parseINR(salaryStr);
  const sd = parseInt(startDay, 10);
  const step1ok = salary !== null && salary > 0 && sd >= 1 && sd <= 28;

  const finish = async () => {
    if (!step1ok || salary === null) return;
    setBusy(true);
    const seed = buildSeed({ salary, userName: name.trim(), monthStartDay: sd, useDefaultCategories: useDefaults, emergencyGoal: emergency, marriageGoal: marriage, today: todayStr() });
    await replaceAll(seed);
  };

  return (
    <div className="onb">
      <div className="onb-card">
        <div className="dots">{[0, 1, 2].map((i) => <i key={i} className={i === step ? 'on' : ''} />)}</div>
        {step === 0 && (
          <div className="card stack" style={{ textAlign: 'center', justifyItems: 'center', padding: 28 }}>
            <div className="logo xl">₹</div>
            <div><h1 style={{ fontSize: 30, letterSpacing: '-0.03em' }}>{BRAND.name}</h1><div style={{ color: 'var(--primary)', fontWeight: 700, marginTop: 4 }}>{BRAND.tagline}</div></div>
            <p className="muted">{BRAND.sub}</p>
            <div className="stack" style={{ gap: 10, textAlign: 'left', width: '100%' }}>
              <div className="row"><ShieldCheck size={20} color="var(--green)" /><span className="small">No login. Your data stays on this device.</span></div>
              <div className="row"><WifiOff size={20} color="var(--green)" /><span className="small">Works fully offline.</span></div>
              <div className="row"><Smartphone size={20} color="var(--green)" /><span className="small">Same app on web and Android.</span></div>
            </div>
            <button className="btn primary block" onClick={() => setStep(1)}>Get started</button>
          </div>
        )}
        {step === 1 && (
          <div className="card stack">
            <div><h2 style={{ fontSize: 20 }}>Your salary</h2><p className="muted small" style={{ marginTop: 4 }}>You can change this any time in Settings.</p></div>
            <Field label="What should we call you? (optional)"><input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" /></Field>
            <Field label="Monthly in-hand salary (₹)" error={salary === null || salary <= 0 ? 'Enter your monthly salary' : null} help={salary ? formatINR(salary) : undefined}>
              <input className="input" inputMode="decimal" value={salaryStr} onChange={(e) => setSalaryStr(e.target.value.replace(/[^\d.]/g, ''))} aria-label="Monthly salary" />
            </Field>
            <Field label="Budget month starts on day" error={!(sd >= 1 && sd <= 28) ? 'Use 1 to 28' : null} help="1 means the normal calendar month. Pick e.g. 25 if your salary arrives on the 25th.">
              <input className="input" inputMode="numeric" value={startDay} onChange={(e) => setStartDay(e.target.value.replace(/\D/g, '').slice(0, 2))} />
            </Field>
            <div className="row"><button className="btn" onClick={() => setStep(0)}>Back</button><button className="btn primary grow" disabled={!step1ok} onClick={() => setStep(2)}>Next</button></div>
          </div>
        )}
        {step === 2 && (
          <div className="card stack">
            <div><h2 style={{ fontSize: 20 }}>Choose a starting point</h2><p className="muted small" style={{ marginTop: 4 }}>Everything here is sample data. You can rename, change or delete all of it later.</p></div>
            <CheckRow on={useDefaults} onChange={setUseDefaults} title="Recommended categories & budgets" sub="7 groups (Savings, Fixed, Household, Lifestyle, Commitments, Health, Other) with budgets split from your salary." />
            <CheckRow on={emergency} onChange={setEmergency} title="Emergency Fund goal" sub={`Target ${formatINR(150000 * 100)}`} />
            <CheckRow on={marriage} onChange={setMarriage} title="Marriage Fund goal" sub={`Target ${formatINR(2000000 * 100)} · ${formatINR(400000 * 100)} saved · Oct 2028`} />
            <p className="help">Principle: <b>Save first, spend later.</b> Savings are planned before spending.</p>
            <div className="row"><button className="btn" onClick={() => setStep(1)}>Back</button><button className="btn primary grow" disabled={busy} onClick={finish}>{busy ? 'Setting up…' : 'Start using the app'}</button></div>
          </div>
        )}
      </div>
    </div>
  );
}
