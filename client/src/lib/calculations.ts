// Design: Ledger Craft — Swiss typographic fintech aesthetic
// Core bill-splitting calculation engine

import type { Expense, Person, PersonBalance, Payment, PersonSplit } from "./types";

/**
 * Given an expense, compute how much each participant owes for that expense.
 * Handles even, amount, and percent split types.
 * For amount/percent: explicit entries are honored; remainder is split evenly among the rest.
 */
export function computeExpenseShares(expense: Expense): Record<string, number> {
  const { totalAmount, participantIds, splitType, splits } = expense;
  const shares: Record<string, number> = {};

  if (participantIds.length === 0) return shares;

  if (splitType === "even") {
    const share = totalAmount / participantIds.length;
    for (const id of participantIds) {
      shares[id] = share;
    }
    return shares;
  }

  if (splitType === "amount") {
    // Explicit amounts
    const explicitMap: Record<string, number> = {};
    let explicitTotal = 0;
    for (const s of splits) {
      if (s.amount !== undefined && participantIds.includes(s.personId)) {
        explicitMap[s.personId] = s.amount;
        explicitTotal += s.amount;
      }
    }
    const remainder = totalAmount - explicitTotal;
    const remainderPeople = participantIds.filter((id) => !(id in explicitMap));
    const remainderShare = remainderPeople.length > 0 ? remainder / remainderPeople.length : 0;

    for (const id of participantIds) {
      shares[id] = id in explicitMap ? explicitMap[id] : remainderShare;
    }
    return shares;
  }

  if (splitType === "percent") {
    // Explicit percentages
    const explicitMap: Record<string, number> = {};
    let explicitPctTotal = 0;
    for (const s of splits) {
      if (s.percent !== undefined && participantIds.includes(s.personId)) {
        explicitMap[s.personId] = s.percent;
        explicitPctTotal += s.percent;
      }
    }
    const remainderPct = 100 - explicitPctTotal;
    const remainderPeople = participantIds.filter((id) => !(id in explicitMap));
    const remainderPctShare = remainderPeople.length > 0 ? remainderPct / remainderPeople.length : 0;

    for (const id of participantIds) {
      const pct = id in explicitMap ? explicitMap[id] : remainderPctShare;
      shares[id] = (pct / 100) * totalAmount;
    }
    return shares;
  }

  return shares;
}

/**
 * Compute per-person balances across all expenses.
 */
export function computeBalances(people: Person[], expenses: Expense[]): PersonBalance[] {
  const paid: Record<string, number> = {};
  const owed: Record<string, number> = {};

  for (const p of people) {
    paid[p.id] = 0;
    owed[p.id] = 0;
  }

  for (const expense of expenses) {
    // Track who paid
    if (paid[expense.paidById] !== undefined) {
      paid[expense.paidById] += expense.totalAmount;
    }

    // Track what each person owes
    const shares = computeExpenseShares(expense);
    for (const [personId, share] of Object.entries(shares)) {
      if (owed[personId] !== undefined) {
        owed[personId] += share;
      }
    }
  }

  return people.map((p) => ({
    personId: p.id,
    name: p.name,
    totalPaid: paid[p.id] ?? 0,
    totalOwed: owed[p.id] ?? 0,
    netBalance: (paid[p.id] ?? 0) - (owed[p.id] ?? 0),
  }));
}

/**
 * Compute the minimum set of payments to settle all debts.
 * Uses a greedy algorithm: repeatedly match the largest debtor with the largest creditor.
 */
export function computeMinimumPayments(balances: PersonBalance[]): Payment[] {
  const payments: Payment[] = [];

  // Build mutable balance map (positive = owed money, negative = owes money)
  const net = balances.map((b) => ({ id: b.personId, name: b.name, balance: b.netBalance }));

  const EPSILON = 0.001;

  for (let iter = 0; iter < 1000; iter++) {
    // Find max creditor and max debtor
    let maxCreditor = net.reduce((best, cur) => (cur.balance > best.balance ? cur : best), net[0]);
    let maxDebtor = net.reduce((best, cur) => (cur.balance < best.balance ? cur : best), net[0]);

    if (maxCreditor.balance < EPSILON || maxDebtor.balance > -EPSILON) break;

    const amount = Math.min(maxCreditor.balance, -maxDebtor.balance);

    payments.push({
      fromId: maxDebtor.id,
      fromName: maxDebtor.name,
      toId: maxCreditor.id,
      toName: maxCreditor.name,
      amount: Math.round(amount * 100) / 100,
    });

    maxCreditor.balance -= amount;
    maxDebtor.balance += amount;
  }

  return payments;
}

/**
 * Format a number as a currency string.
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Round to 2 decimal places.
 */
export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
