// Design: Ledger Craft — Swiss typographic fintech aesthetic
// CSV import parser: reconstructs BillState from an exported Bill Splitter CSV

import { nanoid } from "nanoid";
import type { BillState, Person, Expense, SplitType } from "./types";

export interface ImportResult {
  ok: true;
  bill: BillState;
  warnings: string[];
}

export interface ImportError {
  ok: false;
  error: string;
}

/**
 * Parse a single CSV line into cells, respecting RFC 4180 quoting.
 */
function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i += 2;
        } else {
          inQuotes = false;
          i++;
        }
      } else {
        current += ch;
        i++;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
        i++;
      } else if (ch === ",") {
        cells.push(current.trim());
        current = "";
        i++;
      } else {
        current += ch;
        i++;
      }
    }
  }
  cells.push(current.trim());
  return cells;
}

/**
 * Strip currency formatting (e.g. "$1,234.56") and return a number.
 */
function parseMoney(s: string): number {
  const cleaned = s.replace(/[$,\s]/g, "");
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

/**
 * Parse a CSV string exported by Bill Splitter and reconstruct a BillState.
 *
 * The CSV has four sections separated by blank lines:
 *   BILL SUMMARY   → title, people list
 *   EXPENSES       → header row with person names as columns, then data rows
 *   PER-PERSON SUMMARY  → ignored (derived data)
 *   SETTLEMENT PLAN     → ignored (derived data)
 *
 * We reconstruct expenses using the "Even" split type and the per-person
 * dollar columns from the expense section. For "Dollar Amount" and
 * "Percentage" splits we store explicit amounts so the recalculation
 * is faithful to the original.
 */
export function parseCsv(csvText: string): ImportResult | ImportError {
  const warnings: string[] = [];

  // Normalise line endings
  const rawLines = csvText.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");

  // ── Find section boundaries ───────────────────────────────────────────────
  let billInfoStart = -1;
  let expensesStart = -1;

  for (let i = 0; i < rawLines.length; i++) {
    const first = parseCsvLine(rawLines[i])[0]?.toUpperCase().trim();
    if (first === "BILL SUMMARY") billInfoStart = i;
    if (first === "EXPENSES") expensesStart = i;
  }

  if (billInfoStart === -1 || expensesStart === -1) {
    return {
      ok: false,
      error:
        "This doesn't look like a Bill Splitter CSV. Make sure you're importing a file exported from this app.",
    };
  }

  // ── Parse Bill Info ───────────────────────────────────────────────────────
  let title = "Imported Bill";
  let peopleNames: string[] = [];

  for (let i = billInfoStart + 1; i < rawLines.length; i++) {
    const cells = parseCsvLine(rawLines[i]);
    if (!cells[0]) break; // blank line = end of section
    const key = cells[0].toLowerCase();
    if (key === "title" && cells[1]) title = cells[1];
    if (key === "people" && cells[1]) {
      peopleNames = cells[1]
        .split(";")
        .map((n) => n.trim())
        .filter(Boolean);
    }
  }

  if (peopleNames.length === 0) {
    return { ok: false, error: "No people found in the CSV. The file may be malformed." };
  }

  // Build person objects with stable IDs
  const people: Person[] = peopleNames.map((name) => ({ id: nanoid(), name }));
  const nameToId = new Map(people.map((p) => [p.name.toLowerCase(), p.id]));

  const getIdByName = (name: string): string | undefined =>
    nameToId.get(name.toLowerCase().trim());

  // ── Parse Expenses ────────────────────────────────────────────────────────
  const expenses: Expense[] = [];

  // The header row is the line immediately after "EXPENSES"
  const headerRowIdx = expensesStart + 1;
  if (headerRowIdx >= rawLines.length) {
    return { ok: false, error: "EXPENSES section is empty." };
  }

  const headerCells = parseCsvLine(rawLines[headerRowIdx]);
  // Expected: Description, Total Amount, Paid By, Split Method, Participants, [person names...]
  const personColStart = 5; // columns 0-4 are fixed fields; 5+ are per-person amounts

  // Map column index → person name (for per-person amount columns)
  const colToPerson: Map<number, string> = new Map();
  for (let col = personColStart; col < headerCells.length; col++) {
    const name = headerCells[col].trim();
    if (name) colToPerson.set(col, name);
  }

  for (let i = headerRowIdx + 1; i < rawLines.length; i++) {
    const cells = parseCsvLine(rawLines[i]);
    if (!cells[0]) break; // blank line = end of section

    const description = cells[0];
    const totalAmount = parseMoney(cells[1] ?? "");
    const paidByName = cells[2]?.trim() ?? "";
    const splitMethodRaw = cells[3]?.trim() ?? "";
    // cells[4] = participants (semicolon-separated names) — we derive from per-person columns

    // Skip the TOTAL summary row
    if (description.toUpperCase() === "TOTAL") continue;

    if (!description || totalAmount <= 0) {
      warnings.push(`Skipped row ${i + 1}: missing description or invalid amount.`);
      continue;
    }

    const paidById = getIdByName(paidByName);
    if (!paidById) {
      warnings.push(
        `Row ${i + 1} ("${description}"): payer "${paidByName}" not found in people list — skipped.`
      );
      continue;
    }

    // Determine which people are participants (have a non-empty amount column)
    const participantIds: string[] = [];
    const perPersonAmounts: Map<string, number> = new Map();

    for (const [col, personName] of Array.from(colToPerson)) {
      const raw = cells[col]?.trim() ?? "";
      if (raw !== "") {
        const pid = getIdByName(personName);
        if (pid) {
          participantIds.push(pid);
          perPersonAmounts.set(pid, parseMoney(raw));
        }
      }
    }

    if (participantIds.length === 0) {
      // Fall back: include everyone
      warnings.push(
        `Row ${i + 1} ("${description}"): no participant columns found — including all people.`
      );
      people.forEach((p) => participantIds.push(p.id));
    }

    // Determine split type and build splits array
    let splitType: SplitType = "even";
    const splits: Expense["splits"] = [];

    const splitLower = splitMethodRaw.toLowerCase();
    if (splitLower.includes("dollar") || splitLower.includes("amount") || splitLower === "$") {
      splitType = "amount";
      // Store explicit dollar amounts for all participants except those that
      // would be the "remainder" group. Since we can't recover which were
      // explicit vs auto from the CSV, we store all as explicit amounts.
      for (const [pid, amt] of Array.from(perPersonAmounts)) {
        splits.push({ personId: pid, amount: amt });
      }
    } else if (splitLower.includes("percent") || splitLower === "%") {
      splitType = "percent";
      // Convert dollar amounts back to percentages
      for (const [pid, amt] of Array.from(perPersonAmounts)) {
        const pct = totalAmount > 0 ? (amt / totalAmount) * 100 : 0;
        splits.push({ personId: pid, percent: Math.round(pct * 100) / 100 });
      }
    } else {
      // Even split — no explicit splits needed
      splitType = "even";
    }

    expenses.push({
      id: nanoid(),
      description,
      totalAmount,
      paidById,
      participantIds,
      splitType,
      splits,
      createdAt: Date.now(),
    });
  }

  if (expenses.length === 0) {
    warnings.push("No expenses were found in the CSV — the bill will be imported with people only.");
  }

  return {
    ok: true,
    bill: { title, people, expenses },
    warnings,
  };
}
