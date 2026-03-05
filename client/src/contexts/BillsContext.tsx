// Design: Ledger Craft — Swiss typographic fintech aesthetic
// BillsContext: manages the list of bills, active bill, and Gist settings

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { nanoid } from "nanoid";
import type { BillRecord, BillState, GistSettings } from "@/lib/types";

const DEFAULT_BILL: BillState = { title: "New Trip", people: [], expenses: [] };
const BILLS_KEY = "bill-splitter-bills";
const ACTIVE_KEY = "bill-splitter-active";
const GIST_KEY = "bill-splitter-gist";

function newRecord(bill: BillState): BillRecord {
  const now = Date.now();
  return { id: nanoid(), bill, createdAt: now, updatedAt: now };
}

function loadBills(): BillRecord[] {
  try {
    const raw = localStorage.getItem(BILLS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as BillRecord[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  // Migrate from old single-bill storage
  try {
    const oldRaw = localStorage.getItem("bill-splitter-state");
    if (oldRaw) {
      const old = JSON.parse(oldRaw) as BillState;
      if (old.title || old.people?.length || old.expenses?.length) {
        return [newRecord(old)];
      }
    }
  } catch {}
  return [newRecord({ ...DEFAULT_BILL })];
}

function loadActiveId(bills: BillRecord[]): string {
  try {
    const raw = localStorage.getItem(ACTIVE_KEY);
    if (raw && bills.find((b) => b.id === raw)) return raw;
  } catch {}
  return bills[0].id;
}

function loadGistSettings(): GistSettings {
  try {
    const raw = localStorage.getItem(GIST_KEY);
    if (raw) return JSON.parse(raw) as GistSettings;
  } catch {}
  return { token: "" };
}

interface BillsContextValue {
  bills: BillRecord[];
  activeId: string;
  activeBill: BillState;
  gistSettings: GistSettings;

  // Bill list management
  createBill: () => string;
  deleteBill: (id: string) => void;
  switchBill: (id: string) => void;
  duplicateBill: (id: string) => string;

  // Active bill mutations (mirrors old BillContext API)
  updateTitle: (title: string) => void;
  addPerson: (name: string) => import("@/lib/types").Person;
  removePerson: (id: string) => void;
  updatePersonName: (id: string, name: string) => void;
  addExpense: (expense: Omit<import("@/lib/types").Expense, "id" | "createdAt">) => void;
  updateExpense: (id: string, expense: Omit<import("@/lib/types").Expense, "id" | "createdAt">) => void;
  removeExpense: (id: string) => void;
  resetBill: () => void;
  importBill: (bill: BillState) => void;

  // Gist
  saveGistSettings: (settings: GistSettings) => void;
  setGistId: (billId: string, gistId: string) => void;
}

const BillsContext = createContext<BillsContextValue | null>(null);

export function BillsProvider({ children }: { children: React.ReactNode }) {
  const [bills, setBills] = useState<BillRecord[]>(loadBills);
  const [activeId, setActiveId] = useState<string>(() => loadActiveId(loadBills()));
  const [gistSettings, setGistSettings] = useState<GistSettings>(loadGistSettings);

  // Persist bills
  useEffect(() => {
    localStorage.setItem(BILLS_KEY, JSON.stringify(bills));
  }, [bills]);

  // Persist active id
  useEffect(() => {
    localStorage.setItem(ACTIVE_KEY, activeId);
  }, [activeId]);

  // Persist gist settings
  useEffect(() => {
    localStorage.setItem(GIST_KEY, JSON.stringify(gistSettings));
  }, [gistSettings]);

  const activeBill = bills.find((b) => b.id === activeId)?.bill ?? DEFAULT_BILL;

  // ── Mutate active bill ────────────────────────────────────────────────────
  const mutateBill = useCallback((fn: (bill: BillState) => BillState) => {
    setBills((prev) =>
      prev.map((r) =>
        r.id === activeId
          ? { ...r, bill: fn(r.bill), updatedAt: Date.now() }
          : r
      )
    );
  }, [activeId]);

  const updateTitle = useCallback((title: string) => {
    mutateBill((b) => ({ ...b, title }));
  }, [mutateBill]);

  const addPerson = useCallback((name: string) => {
    const person = { id: nanoid(), name };
    mutateBill((b) => ({ ...b, people: [...b.people, person] }));
    return person;
  }, [mutateBill]);

  const removePerson = useCallback((id: string) => {
    mutateBill((b) => ({
      ...b,
      people: b.people.filter((p) => p.id !== id),
      expenses: b.expenses.map((e) => ({
        ...e,
        participantIds: e.participantIds.filter((pid) => pid !== id),
        splits: e.splits.filter((s) => s.personId !== id),
        paidById: e.paidById === id ? "" : e.paidById,
      })),
    }));
  }, [mutateBill]);

  const updatePersonName = useCallback((id: string, name: string) => {
    mutateBill((b) => ({
      ...b,
      people: b.people.map((p) => (p.id === id ? { ...p, name } : p)),
    }));
  }, [mutateBill]);

  const addExpense = useCallback(
    (expense: Omit<import("@/lib/types").Expense, "id" | "createdAt">) => {
      const newExpense = { ...expense, id: nanoid(), createdAt: Date.now() };
      mutateBill((b) => ({ ...b, expenses: [...b.expenses, newExpense] }));
    },
    [mutateBill]
  );

  const updateExpense = useCallback(
    (id: string, expense: Omit<import("@/lib/types").Expense, "id" | "createdAt">) => {
      mutateBill((b) => ({
        ...b,
        expenses: b.expenses.map((e) =>
          e.id === id ? { ...expense, id, createdAt: e.createdAt } : e
        ),
      }));
    },
    [mutateBill]
  );

  const removeExpense = useCallback((id: string) => {
    mutateBill((b) => ({ ...b, expenses: b.expenses.filter((e) => e.id !== id) }));
  }, [mutateBill]);

  const resetBill = useCallback(() => {
    mutateBill(() => ({ ...DEFAULT_BILL, title: activeBill.title }));
  }, [mutateBill, activeBill.title]);

  const importBill = useCallback((bill: BillState) => {
    mutateBill(() => bill);
  }, [mutateBill]);

  // ── Bill list management ──────────────────────────────────────────────────
  const createBill = useCallback((): string => {
    const record = newRecord({ ...DEFAULT_BILL });
    setBills((prev) => [...prev, record]);
    setActiveId(record.id);
    return record.id;
  }, []);

  const deleteBill = useCallback((id: string) => {
    setBills((prev) => {
      const next = prev.filter((b) => b.id !== id);
      if (next.length === 0) {
        const fresh = newRecord({ ...DEFAULT_BILL });
        setActiveId(fresh.id);
        return [fresh];
      }
      return next;
    });
    setActiveId((prev) => {
      if (prev === id) {
        const remaining = bills.filter((b) => b.id !== id);
        return remaining[0]?.id ?? "";
      }
      return prev;
    });
  }, [bills]);

  const switchBill = useCallback((id: string) => {
    setActiveId(id);
  }, []);

  const duplicateBill = useCallback((id: string): string => {
    const source = bills.find((b) => b.id === id);
    if (!source) return id;
    const record = newRecord({
      ...source.bill,
      title: `${source.bill.title} (copy)`,
    });
    setBills((prev) => [...prev, record]);
    setActiveId(record.id);
    return record.id;
  }, [bills]);

  // ── Gist ─────────────────────────────────────────────────────────────────
  const saveGistSettings = useCallback((settings: GistSettings) => {
    setGistSettings(settings);
  }, []);

  const setGistId = useCallback((billId: string, gistId: string) => {
    setBills((prev) =>
      prev.map((r) => (r.id === billId ? { ...r, gistId } : r))
    );
  }, []);

  return (
    <BillsContext.Provider
      value={{
        bills,
        activeId,
        activeBill,
        gistSettings,
        createBill,
        deleteBill,
        switchBill,
        duplicateBill,
        updateTitle,
        addPerson,
        removePerson,
        updatePersonName,
        addExpense,
        updateExpense,
        removeExpense,
        resetBill,
        importBill,
        saveGistSettings,
        setGistId,
      }}
    >
      {children}
    </BillsContext.Provider>
  );
}

export function useBills(): BillsContextValue {
  const ctx = useContext(BillsContext);
  if (!ctx) throw new Error("useBills must be used within BillsProvider");
  return ctx;
}
