import { alive } from '../core/calc';
import { base, findSavingsGroup, goalCategory } from '../core/factory';
import { dayOfPeriod } from '../core/recurring';
import type { Budget, Category, Dataset, Goal, ID, Paise, Recurring, Settings, Transaction } from '../core/types';
import { db, TABLES, type TableName } from './db';

/** Loads everything (live records only) into one plain object. Personal data is small, so this is fast. */
export async function loadAll(): Promise<Dataset | null> {
  const settings = await db.settings.get('main');
  if (!settings) return null;
  const [groups, categories, budgets, transactions, goals, paymentMethods, recurring] = await Promise.all([
    db.groups.toArray(), db.categories.toArray(), db.budgets.toArray(), db.transactions.toArray(), db.goals.toArray(), db.paymentMethods.toArray(), db.recurring.toArray(),
  ]);
  return {
    settings, groups: alive(groups), categories: alive(categories), budgets: alive(budgets), transactions: alive(transactions),
    goals: alive(goals), paymentMethods: alive(paymentMethods), recurring: alive(recurring),
  };
}

let deviceIdCache = '';
export async function getDeviceId(): Promise<string> {
  if (deviceIdCache) return deviceIdCache;
  deviceIdCache = (await db.settings.get('main'))?.deviceId ?? '';
  return deviceIdCache;
}
export const setDeviceIdCache = (id: string) => { deviceIdCache = id; };

export async function updateSettings(patch: Partial<Settings>): Promise<void> {
  await db.settings.update('main', { ...patch, updatedAt: Date.now() });
}

/** Insert or update a record, stamping updatedAt. */
export async function save<T extends { id: ID; createdAt: number; updatedAt: number; deviceId?: string }>(table: TableName, rec: T): Promise<T> {
  const next = { ...rec, updatedAt: Date.now(), deviceId: rec.deviceId ?? deviceIdCache };
  await (db[table] as unknown as { put(r: T): Promise<unknown> }).put(next);
  return next;
}

export async function softDelete(table: TableName, id: ID): Promise<void> {
  await (db[table] as unknown as { update(id: ID, c: object): Promise<unknown> }).update(id, { deletedAt: Date.now(), updatedAt: Date.now() });
}
export async function restore(table: TableName, id: ID): Promise<void> {
  await (db[table] as unknown as { update(id: ID, c: object): Promise<unknown> }).update(id, { deletedAt: null, updatedAt: Date.now() });
}

export const newRecord = () => base(Date.now(), deviceIdCache);

/** Budget applies from `monthKey` onwards; later overrides for that category are removed. */
export async function setBudget(categoryId: ID, monthKey: string, amount: Paise): Promise<void> {
  await db.transaction('rw', db.budgets, async () => {
    const all = await db.budgets.where('categoryId').equals(categoryId).toArray();
    const now = Date.now();
    for (const b of all) if (!b.deletedAt && b.effectiveFrom > monthKey) await db.budgets.update(b.id, { deletedAt: now, updatedAt: now });
    const same = all.find((b) => !b.deletedAt && b.effectiveFrom === monthKey);
    if (same) await db.budgets.put({ ...same, amount, updatedAt: now });
    else await db.budgets.put({ ...base(now, deviceIdCache), categoryId, effectiveFrom: monthKey, amount } as Budget);
  });
}

export async function countTxnsForCategory(id: ID): Promise<number> {
  const subs = await db.categories.where('parentId').equals(id).toArray();
  const ids = [id, ...subs.filter((s) => !s.deletedAt).map((s) => s.id)];
  let n = 0;
  for (const cid of ids) n += (await db.transactions.where('categoryId').equals(cid).toArray()).filter((t) => !t.deletedAt).length;
  return n;
}

/** Delete a category (and its subcategories). Transactions are moved to `moveTo` (or left uncategorised). */
export async function deleteCategory(id: ID, moveTo: ID | null): Promise<void> {
  await db.transaction('rw', db.categories, db.transactions, db.budgets, db.recurring, async () => {
    const now = Date.now();
    const subs = (await db.categories.where('parentId').equals(id).toArray()).filter((s) => !s.deletedAt);
    const ids = [id, ...subs.map((s) => s.id)];
    for (const cid of ids) {
      const txns = await db.transactions.where('categoryId').equals(cid).toArray();
      for (const t of txns) await db.transactions.update(t.id, { categoryId: moveTo, updatedAt: now });
      const recs = (await db.recurring.toArray()).filter((r) => r.categoryId === cid);
      for (const r of recs) await db.recurring.update(r.id, { categoryId: moveTo, updatedAt: now });
      await db.categories.update(cid, { deletedAt: now, updatedAt: now });
    }
    const bs = (await db.budgets.toArray()).filter((b) => ids.includes(b.categoryId));
    for (const b of bs) await db.budgets.update(b.id, { deletedAt: now, updatedAt: now });
  });
}

export async function deleteGroup(id: ID, moveTo: ID | null): Promise<void> {
  await db.transaction('rw', db.groups, db.categories, async () => {
    const now = Date.now();
    const cats = (await db.categories.where('groupId').equals(id).toArray()).filter((c) => !c.deletedAt);
    for (const c of cats) await db.categories.update(c.id, { groupId: moveTo, updatedAt: now });
    await db.groups.update(id, { deletedAt: now, updatedAt: now });
  });
}

/** Creating a goal also creates its linked savings category. */
export async function saveGoal(goal: Goal, isNew: boolean): Promise<void> {
  await db.transaction('rw', db.goals, db.categories, db.groups, async () => {
    await save('goals', goal);
    const cats = (await db.categories.toArray()).filter((c) => !c.deletedAt);
    const linked = cats.find((c) => c.goalId === goal.id);
    if (linked) await save('categories', { ...linked, name: goal.name, icon: goal.icon });
    else if (isNew) {
      const groups = (await db.groups.toArray()).filter((g) => !g.deletedAt);
      const sg = findSavingsGroup(groups);
      const sort = Math.max(0, ...cats.map((c) => c.sort)) + 1;
      await db.categories.put(goalCategory(goal, sg?.id ?? null, sort, Date.now(), deviceIdCache));
    }
  });
}

export async function deleteGoal(id: ID): Promise<void> {
  await db.transaction('rw', db.goals, db.categories, async () => {
    const now = Date.now();
    await db.goals.update(id, { deletedAt: now, updatedAt: now });
    for (const c of (await db.categories.toArray()).filter((x) => x.goalId === id && !x.deletedAt)) await db.categories.update(c.id, { deletedAt: now, updatedAt: now });
  });
}

/** Turn a due recurring item into a real transaction in the given budget month. */
export async function confirmRecurring(r: Recurring, periodKey: string, monthStartDay: number, goalIdForCategory?: ID | null): Promise<void> {
  const date = dayOfPeriod(periodKey, monthStartDay, r.dayOfMonth);
  const t: Transaction = {
    ...base(Date.now(), deviceIdCache), type: r.type, amount: r.amount, date, categoryId: r.categoryId ?? null, paymentMethodId: r.paymentMethodId ?? null,
    need: r.need ?? null, note: r.note ?? '', transferKind: r.transferKind ?? null, goalId: goalIdForCategory ?? null,
  };
  await db.transaction('rw', db.transactions, db.recurring, async () => {
    await db.transactions.put(t);
    await db.recurring.update(r.id, { lastHandledPeriod: periodKey, updatedAt: Date.now() });
  });
}
export async function skipRecurring(r: Recurring, periodKey: string): Promise<void> {
  await db.recurring.update(r.id, { lastHandledPeriod: periodKey, updatedAt: Date.now() });
}

/** Replace ALL local data with a (validated) dataset. Used by restore and first-run seeding. */
export async function replaceAll(d: Dataset): Promise<void> {
  await db.transaction('rw', [db.settings, ...TABLES.map((t) => db[t])], async () => {
    await db.settings.clear();
    for (const t of TABLES) await db[t].clear();
    await db.settings.put(d.settings);
    for (const t of TABLES) await (db[t] as unknown as { bulkPut(r: unknown[]): Promise<unknown> }).bulkPut(d[t] as unknown[]);
  });
  setDeviceIdCache(d.settings.deviceId);
}

export async function resetAll(): Promise<void> {
  await db.transaction('rw', [db.settings, ...TABLES.map((t) => db[t])], async () => {
    await db.settings.clear();
    for (const t of TABLES) await db[t].clear();
  });
  deviceIdCache = '';
}

export async function addTransactions(txns: Transaction[], newCategories: Category[]): Promise<void> {
  await db.transaction('rw', db.transactions, db.categories, async () => {
    if (newCategories.length) await db.categories.bulkPut(newCategories);
    await db.transactions.bulkPut(txns);
  });
}
