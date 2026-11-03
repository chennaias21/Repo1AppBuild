import { useMemo } from 'react';
import { CreditCard, Info, Plus } from 'lucide-react';
import { cardSummaries, cardTotals, CARD_STATUS_LABEL, type CardStatus, type CardSummary } from '../../core/cards';
import { dayLabel, monthLabel } from '../../core/dates';
import { formatINR } from '../../core/money';
import { Bar, Empty } from '../components';
import { PageHeader } from '../page';
import { useApp } from '../app';

export const cardTone = (s: CardStatus) => (s === 'overdue' ? 'red' : s === 'dueSoon' ? 'amber' : s === 'upcoming' ? 'blue' : s === 'paid' ? 'green' : 'gray');

export function dueText(c: CardSummary, today?: string): string {
  void today;
  if (c.status === 'clear') return 'Nothing to pay';
  if (c.status === 'paid') return 'Statement paid';
  if (!c.dueDate || c.daysToDue === null) return 'Set a due date to track this';
  if (c.daysToDue < 0) return `Was due ${dayLabel(c.dueDate)} (${-c.daysToDue} day${c.daysToDue === -1 ? '' : 's'} ago)`;
  if (c.daysToDue === 0) return `Due today (${dayLabel(c.dueDate)})`;
  return `Due ${dayLabel(c.dueDate)} (in ${c.daysToDue} day${c.daysToDue === 1 ? '' : 's'})`;
}

export function Cards() {
  const { data, today, cur, openSheet } = useApp();
  const cards = useMemo(() => cardSummaries(data, today), [data, today]);
  const totals = useMemo(() => cardTotals(cards), [cards]);
  const catMap = new Map(data.categories.map((c) => [c.id, c]));

  return (
    <>
      <PageHeader title="Credit cards" backButton right={<button className="btn sm primary" onClick={() => openSheet({ kind: 'payment', type: 'credit' })}><Plus size={16} /> Add card</button>} />
      <div className="stack">
        <div className="notice ok small" style={{ display: 'flex', gap: 10 }}>
          <Info size={18} style={{ flex: 'none', marginTop: 1 }} />
          <span>Card purchases are counted as <b>expenses</b> on the day you swipe, in their category. Paying the card bill only <b>settles what you owe</b>. It is not counted as spending again.</span>
        </div>

        {cards.length === 0 ? (
          <div className="card"><Empty emoji="💳" title="No credit cards yet" text="Add a card to track what you owe, due dates and payment status.">
            <button className="btn primary" onClick={() => openSheet({ kind: 'payment', type: 'credit' })}><Plus size={18} /> Add a credit card</button></Empty></div>
        ) : (
          <>
            <div className="tiles">
              <div className="tile"><div className="lbl">Total you owe</div><div className="val num" style={totals.outstanding > 0 ? { color: 'var(--amber)' } : undefined}>{formatINR(totals.outstanding)}</div></div>
              <div className="tile"><div className="lbl">Bills to pay</div><div className="val num">{formatINR(totals.dueRemaining)}</div></div>
              <div className="tile"><div className="lbl">Not yet billed</div><div className="val num">{formatINR(totals.unbilled)}</div></div>
              <div className="tile"><div className="lbl">Spent on cards in {monthLabel(cur.period.key, false)}</div><div className="val num">{formatINR(cur.cardSpend)}</div></div>
            </div>
            {cards.map((c) => {
              const recent = data.transactions.filter((t) => t.paymentMethodId === c.method.id).sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt).slice(0, 5);
              return (
                <div className="card" key={c.method.id}>
                  <div className="row between" style={{ alignItems: 'flex-start' }}>
                    <div className="row"><div className="emoji"><CreditCard size={20} /></div>
                      <div><h2>{c.method.name}</h2><span className={`pill ${cardTone(c.status)}`} style={{ marginTop: 4 }}>{CARD_STATUS_LABEL[c.status]}</span></div></div>
                    <button className="btn sm" onClick={() => openSheet({ kind: 'payment', edit: c.method })}>Edit</button>
                  </div>
                  <div style={{ marginTop: 14 }}>
                    <div className="muted small">{c.outstanding < 0 ? 'Credit balance' : 'You owe'}</div>
                    <div className="big num">{formatINR(Math.abs(c.outstanding))}</div>
                    <div className="small" style={{ marginTop: 4, color: c.status === 'overdue' ? 'var(--red)' : c.status === 'dueSoon' ? 'var(--amber)' : 'var(--muted)', fontWeight: c.status === 'overdue' || c.status === 'dueSoon' ? 700 : 400 }}>{dueText(c)}</div>
                  </div>
                  {c.utilisation !== null && c.limit && (
                    <div style={{ marginTop: 12 }}>
                      <div className="row between small"><span className="muted">Limit used</span><span className="num">{Math.round(c.utilisation)}% of {formatINR(c.limit)}</span></div>
                      <div style={{ marginTop: 5 }}><Bar pct={c.utilisation} status={c.utilisation >= 90 ? 'over' : c.utilisation >= 30 ? 'watch' : 'onTrack'} thin /></div>
                      {c.utilisation >= 30 && <p className="help" style={{ marginTop: 4 }}>Using over 30% of your limit can lower your credit score. Try to keep it below.</p>}
                    </div>
                  )}
                  <div className="divider" />
                  <div className="stack" style={{ gap: 0 }}>
                    <div className="kv"><span className="muted">Last bill{c.statementDate ? ` (${dayLabel(c.statementDate)})` : ''}</span><b className="num">{c.hasSchedule ? formatINR(c.statementBalance) : '–'}</b></div>
                    <div className="kv"><span className="muted">Still to pay on it</span><b className="num">{formatINR(c.dueRemaining)}</b></div>
                    <div className="kv"><span className="muted">New purchases (not billed yet)</span><b className="num">{c.hasSchedule ? formatINR(c.unbilled) : '–'}</b></div>
                  </div>
                  {!c.hasSchedule && <p className="help" style={{ marginTop: 8 }}>Add the statement day and due day to see due dates and status.</p>}
                  <div className="row wrap" style={{ marginTop: 12 }}>
                    <button className="btn primary grow" disabled={c.outstanding <= 0} onClick={() => openSheet({ kind: 'txn', init: { type: 'cardBill', amount: c.dueRemaining > 0 ? c.dueRemaining : c.outstanding, paymentMethodId: c.method.id } })}>Record a payment</button>
                    <button className="btn grow" onClick={() => openSheet({ kind: 'txn', init: { type: 'expense', paymentMethodId: c.method.id } })}>Add purchase</button>
                  </div>
                  {recent.length > 0 && (
                    <>
                      <div className="divider" />
                      <div className="lbl-s" style={{ marginBottom: 4 }}>Recent activity</div>
                      <div className="list">
                        {recent.map((t) => {
                          const cat = t.categoryId ? catMap.get(t.categoryId) : undefined;
                          const isPay = t.type === 'transfer';
                          return (
                            <button key={t.id} className="item" onClick={() => openSheet({ kind: 'txn', edit: t })}>
                              <div className="emoji">{isPay ? '🧾' : cat?.icon ?? '❔'}</div>
                              <div className="grow"><div className="title truncate">{isPay ? 'Bill payment' : cat?.name ?? 'Uncategorised'}</div><div className="sub truncate">{dayLabel(t.date)}{t.note ? ` · ${t.note}` : ''}{isPay ? ' · settles dues, not an expense' : ''}</div></div>
                              <div className={`amt ${isPay ? 'in' : ''}`}>{isPay ? '-' : '+'}{formatINR(t.amount)}</div>
                            </button>
                          );
                        })}
                      </div>
                      <p className="help">+ adds to what you owe, − reduces it.</p>
                    </>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>
    </>
  );
}
