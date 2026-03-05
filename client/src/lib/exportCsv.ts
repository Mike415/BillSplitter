// Design: Ledger Craft — Swiss typographic fintech aesthetic
// CSV export utility: generates a multi-section CSV of the full bill

import type { BillState } from "./types";
import { computeBalances, computeMinimumPayments, computeExpenseShares, formatCurrency } from "./calculations";

/**
 * Escape a cell value for CSV: wrap in quotes if it contains commas, quotes, or newlines.
 */
function cell(value: string | number): string {
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function row(...cells: (string | number)[]): string {
  return cells.map(cell).join(",");
}

/**
 * Build a complete CSV string from the current bill state.
 * Sections:
 *   1. Bill info
 *   2. Expenses (with per-person breakdown)
 *   3. Per-person summary
 *   4. Settlement plan
 */
export function buildCsv(bill: BillState): string {
  const { title, people, expenses } = bill;
  const lines: string[] = [];

  const getPersonName = (id: string) => people.find((p) => p.id === id)?.name ?? "Unknown";
  const totalExpenses = expenses.reduce((s, e) => s + e.totalAmount, 0);

  // ── Section 1: Bill Info ──────────────────────────────────────────────────
  lines.push(row("BILL SUMMARY"));
  lines.push(row("Title", title));
  lines.push(row("Exported", new Date().toLocaleString()));
  lines.push(row("Total Expenses", formatCurrency(totalExpenses)));
  lines.push(row("People", people.map((p) => p.name).join("; ")));
  lines.push("");

  // ── Section 2: Expenses ───────────────────────────────────────────────────
  lines.push(row("EXPENSES"));
  lines.push(row("Description", "Total Amount", "Paid By", "Split Method", "Participants", ...people.map((p) => p.name)));

  for (const expense of expenses) {
    const shares = computeExpenseShares(expense);
    const splitLabel =
      expense.splitType === "even"
        ? "Even"
        : expense.splitType === "amount"
        ? "Dollar Amount"
        : "Percentage";

    const participantNames = expense.participantIds.map(getPersonName).join("; ");
    const perPersonAmounts = people.map((p) =>
      expense.participantIds.includes(p.id) ? formatCurrency(shares[p.id] ?? 0) : ""
    );

    lines.push(
      row(
        expense.description,
        formatCurrency(expense.totalAmount),
        getPersonName(expense.paidById),
        splitLabel,
        participantNames,
        ...perPersonAmounts
      )
    );
  }

  // Totals row
  const paidPerPerson = people.map((p) => {
    const paid = expenses
      .filter((e) => e.paidById === p.id)
      .reduce((s, e) => s + e.totalAmount, 0);
    return formatCurrency(paid);
  });
  lines.push(row("TOTAL", formatCurrency(totalExpenses), "", "", "", ...paidPerPerson));
  lines.push("");

  // ── Section 3: Per-Person Summary ─────────────────────────────────────────
  lines.push(row("PER-PERSON SUMMARY"));
  lines.push(row("Person", "Total Paid", "Fair Share", "Net Balance", "Status"));

  const balances = computeBalances(people, expenses);
  for (const b of balances) {
    const status =
      b.netBalance > 0.005
        ? "Gets money back"
        : b.netBalance < -0.005
        ? "Owes money"
        : "Settled";
    lines.push(
      row(
        b.name,
        formatCurrency(b.totalPaid),
        formatCurrency(b.totalOwed),
        (b.netBalance >= 0 ? "+" : "") + formatCurrency(b.netBalance),
        status
      )
    );
  }
  lines.push("");

  // ── Section 4: Settlement Plan ────────────────────────────────────────────
  lines.push(row("SETTLEMENT PLAN"));
  const payments = computeMinimumPayments(balances);

  if (payments.length === 0 && expenses.length > 0) {
    lines.push(row("All settled up — no payments needed."));
  } else if (payments.length === 0) {
    lines.push(row("No expenses recorded."));
  } else {
    lines.push(row("From", "To", "Amount"));
    for (const p of payments) {
      lines.push(row(p.fromName, p.toName, formatCurrency(p.amount)));
    }
  }

  return lines.join("\n");
}

/**
 * Trigger a browser download of the CSV file.
 */
export function downloadCsv(bill: BillState): void {
  const csv = buildCsv(bill);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const safeName = bill.title.replace(/[^a-z0-9]/gi, "_").toLowerCase();
  link.href = url;
  link.download = `${safeName}_bill_summary.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
