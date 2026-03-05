// Design: Ledger Craft — Swiss typographic fintech aesthetic
// Global state management for the Bill Splitter

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { nanoid } from "nanoid";
import type { BillState, Person, Expense } from "@/lib/types";

interface BillContextValue {
  bill: BillState;
  addPerson: (name: string) => Person;
  removePerson: (id: string) => void;
  updatePersonName: (id: string, name: string) => void;
  addExpense: (expense: Omit<Expense, "id" | "createdAt">) => void;
  updateExpense: (id: string, expense: Omit<Expense, "id" | "createdAt">) => void;
  removeExpense: (id: string) => void;
  updateTitle: (title: string) => void;
  resetBill: () => void;
  importBill: (newBill: BillState) => void;
}

const defaultBill: BillState = {
  title: "New Trip",
  people: [],
  expenses: [],
};

const STORAGE_KEY = "bill-splitter-state";

function loadState(): BillState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as BillState;
  } catch {}
  return defaultBill;
}

const BillContext = createContext<BillContextValue | null>(null);

export function BillProvider({ children }: { children: React.ReactNode }) {
  const [bill, setBill] = useState<BillState>(loadState);

  // Persist to localStorage on every change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bill));
  }, [bill]);

  const addPerson = useCallback((name: string): Person => {
    const person: Person = { id: nanoid(), name };
    setBill((prev) => ({ ...prev, people: [...prev.people, person] }));
    return person;
  }, []);

  const removePerson = useCallback((id: string) => {
    setBill((prev) => ({
      ...prev,
      people: prev.people.filter((p) => p.id !== id),
      // Remove from all expenses
      expenses: prev.expenses.map((e) => ({
        ...e,
        participantIds: e.participantIds.filter((pid) => pid !== id),
        splits: e.splits.filter((s) => s.personId !== id),
        paidById: e.paidById === id ? "" : e.paidById,
      })),
    }));
  }, []);

  const updatePersonName = useCallback((id: string, name: string) => {
    setBill((prev) => ({
      ...prev,
      people: prev.people.map((p) => (p.id === id ? { ...p, name } : p)),
    }));
  }, []);

  const addExpense = useCallback((expense: Omit<Expense, "id" | "createdAt">) => {
    const newExpense: Expense = { ...expense, id: nanoid(), createdAt: Date.now() };
    setBill((prev) => ({ ...prev, expenses: [...prev.expenses, newExpense] }));
  }, []);

  const updateExpense = useCallback((id: string, expense: Omit<Expense, "id" | "createdAt">) => {
    setBill((prev) => ({
      ...prev,
      expenses: prev.expenses.map((e) =>
        e.id === id ? { ...expense, id, createdAt: e.createdAt } : e
      ),
    }));
  }, []);

  const removeExpense = useCallback((id: string) => {
    setBill((prev) => ({ ...prev, expenses: prev.expenses.filter((e) => e.id !== id) }));
  }, []);

  const updateTitle = useCallback((title: string) => {
    setBill((prev) => ({ ...prev, title }));
  }, []);

  const resetBill = useCallback(() => {
    setBill(defaultBill);
  }, []);

  const importBill = useCallback((newBill: BillState) => {
    setBill(newBill);
  }, []);

  return (
    <BillContext.Provider
      value={{
        bill,
        addPerson,
        removePerson,
        updatePersonName,
        addExpense,
        updateExpense,
        removeExpense,
        updateTitle,
        resetBill,
        importBill,
      }}
    >
      {children}
    </BillContext.Provider>
  );
}

export function useBill(): BillContextValue {
  const ctx = useContext(BillContext);
  if (!ctx) throw new Error("useBill must be used within BillProvider");
  return ctx;
}
