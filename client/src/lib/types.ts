// Design: Ledger Craft — Swiss typographic fintech aesthetic
// Types for the Bill Splitter application

export type SplitType = "even" | "amount" | "percent";

export interface PersonSplit {
  personId: string;
  /** For 'amount': explicit dollar amount (others share remainder evenly) */
  amount?: number;
  /** For 'percent': explicit percentage (others share remainder evenly) */
  percent?: number;
}

export interface Expense {
  id: string;
  description: string;
  totalAmount: number;
  paidById: string;
  participantIds: string[]; // all people included on this expense
  splitType: SplitType;
  splits: PersonSplit[]; // only entries with explicit overrides
  createdAt: number;
}

export interface Person {
  id: string;
  name: string;
}

export interface BillState {
  title: string;
  people: Person[];
  expenses: Expense[];
}

/** A saved bill entry in the multi-bill list */
export interface BillRecord {
  id: string;          // nanoid
  bill: BillState;
  createdAt: number;
  updatedAt: number;
  /** If saved to a Gist, the Gist ID */
  gistId?: string;
}

/** GitHub Gist settings stored in localStorage */
export interface GistSettings {
  token: string;       // GitHub personal access token
  gistId?: string;     // ID of the persistent auto-sync Gist
}

export interface PersonBalance {
  personId: string;
  name: string;
  totalPaid: number;      // how much they paid out of pocket
  totalOwed: number;      // how much they owe across all expenses
  netBalance: number;     // totalPaid - totalOwed (positive = owed money back, negative = owes money)
}

export interface Payment {
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
  amount: number;
}
