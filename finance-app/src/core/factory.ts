import type { Base, Category, Goal, Group, ID } from './types';
import { uid } from './id';

export function base(now = Date.now(), deviceId?: string): Base {
  return { id: uid(), createdAt: now, updatedAt: now, deletedAt: null, deviceId };
}

/** Every goal gets a linked savings category so savings transfers credit it automatically. */
export function goalCategory(goal: Goal, savingsGroupId: ID | null, sort: number, now = Date.now(), deviceId?: string): Category {
  return { ...base(now, deviceId), name: goal.name, kind: 'savings', groupId: savingsGroupId, parentId: null, icon: goal.icon, behavior: 'fixed', defaultNeed: null, goalId: goal.id, sort };
}

export function findSavingsGroup(groups: Group[]): Group | undefined {
  return groups.find((g) => !g.deletedAt && /saving/i.test(g.name)) ?? groups.find((g) => !g.deletedAt);
}
