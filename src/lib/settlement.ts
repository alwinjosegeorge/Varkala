import type { Expense, Member } from "./types";

export interface Balances {
  paid: Record<string, number>;
  owes: Record<string, number>;
  net: Record<string, number>; // positive => receives, negative => pays
}

export function computeBalances(members: Member[], expenses: Expense[]): Balances {
  const paid: Record<string, number> = {};
  const owes: Record<string, number> = {};
  members.forEach((m) => {
    paid[m.id] = 0;
    owes[m.id] = 0;
  });
  for (const e of expenses) {
    if (e.fromFund) continue;
    paid[e.paidBy] = (paid[e.paidBy] ?? 0) + e.amount;
    for (const s of e.splits) {
      owes[s.memberId] = (owes[s.memberId] ?? 0) + s.amount;
    }
  }
  const net: Record<string, number> = {};
  members.forEach((m) => {
    net[m.id] = (paid[m.id] ?? 0) - (owes[m.id] ?? 0);
  });
  return { paid, owes, net };
}

export interface Settlement {
  from: string;
  to: string;
  amount: number;
}

// Greedy minimization of transactions
export function minimizeSettlements(net: Record<string, number>): Settlement[] {
  const debtors: { id: string; amt: number }[] = [];
  const creditors: { id: string; amt: number }[] = [];
  for (const [id, v] of Object.entries(net)) {
    const r = Math.round(v * 100) / 100;
    if (r < -0.5) debtors.push({ id, amt: -r });
    else if (r > 0.5) creditors.push({ id, amt: r });
  }
  debtors.sort((a, b) => b.amt - a.amt);
  creditors.sort((a, b) => b.amt - a.amt);
  const res: Settlement[] = [];
  let i = 0, j = 0;
  while (i < debtors.length && j < creditors.length) {
    const pay = Math.min(debtors[i].amt, creditors[j].amt);
    res.push({ from: debtors[i].id, to: creditors[j].id, amount: Math.round(pay) });
    debtors[i].amt -= pay;
    creditors[j].amt -= pay;
    if (debtors[i].amt < 0.5) i++;
    if (creditors[j].amt < 0.5) j++;
  }
  return res;
}

export function computeSplits(
  mode: "equal" | "selected" | "custom" | "percentage",
  amount: number,
  selected: string[],
  customMap: Record<string, number>,
): { memberId: string; amount: number }[] {
  if (mode === "equal" || mode === "selected") {
    const per = amount / selected.length;
    return selected.map((id) => ({ memberId: id, amount: Math.round(per * 100) / 100 }));
  }
  if (mode === "custom") {
    return selected.map((id) => ({ memberId: id, amount: customMap[id] ?? 0 }));
  }
  // percentage
  return selected.map((id) => ({
    memberId: id,
    amount: Math.round((amount * (customMap[id] ?? 0)) / 100 * 100) / 100,
  }));
}
