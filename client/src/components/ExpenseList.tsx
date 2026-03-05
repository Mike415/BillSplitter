// Design: Ledger Craft — Swiss typographic fintech aesthetic
// Expense ledger list with edit/delete actions

import { useState } from "react";
import { useBill } from "@/contexts/BillContext";
import { formatCurrency, computeExpenseShares } from "@/lib/calculations";
import type { Expense } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ExpenseForm from "./ExpenseForm";
import { Pencil, Trash2, ChevronDown, ChevronUp, Receipt } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ExpenseList() {
  const { bill, removeExpense } = useBill();
  const { expenses, people } = bill;
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const getPersonName = (id: string) => people.find((p) => p.id === id)?.name ?? "Unknown";

  const splitLabel = (type: string) => {
    if (type === "even") return "Even";
    if (type === "amount") return "$ Split";
    return "% Split";
  };

  if (expenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
          <Receipt className="w-5 h-5 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">No expenses yet</p>
        <p className="text-xs text-muted-foreground mt-1">Add your first expense to get started</p>
      </div>
    );
  }

  const total = expenses.reduce((sum, e) => sum + e.totalAmount, 0);

  return (
    <div className="space-y-0">
      {/* Header row */}
      <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 px-3 py-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground border-b border-border">
        <span>Expense</span>
        <span className="text-right w-20">Amount</span>
        <span className="text-right w-16 hidden sm:block">Split</span>
        <span className="w-16"></span>
      </div>

      <AnimatePresence initial={false}>
        {expenses.map((expense, idx) => {
          const isExpanded = expandedId === expense.id;
          const shares = computeExpenseShares(expense);

          return (
            <motion.div
              key={expense.id}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.18, delay: idx * 0.03 }}
              className="border-b border-border last:border-0"
            >
              {/* Main row */}
              <div
                className="grid grid-cols-[1fr_auto_auto_auto] gap-3 px-3 py-3 items-center hover:bg-muted/30 transition-colors cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : expense.id)}
              >
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{expense.description}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Paid by <span className="font-medium text-foreground">{getPersonName(expense.paidById)}</span>
                  </p>
                </div>
                <span className="font-mono font-semibold text-sm w-20 text-right">
                  {formatCurrency(expense.totalAmount)}
                </span>
                <span className="text-xs text-muted-foreground w-16 text-right hidden sm:block">
                  {splitLabel(expense.splitType)}
                </span>
                <div className="flex items-center gap-1 w-16 justify-end">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingExpense(expense);
                    }}
                    className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                    title="Edit"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeExpense(expense.id);
                    }}
                    className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  {isExpanded ? (
                    <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                  )}
                </div>
              </div>

              {/* Expanded breakdown */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-3 pb-3 pt-0 bg-muted/20">
                      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                        Breakdown
                      </p>
                      <div className="space-y-1">
                        {expense.participantIds.map((pid) => (
                          <div key={pid} className="flex justify-between text-xs">
                            <span className="text-muted-foreground">{getPersonName(pid)}</span>
                            <span className="font-mono font-medium">{formatCurrency(shares[pid] ?? 0)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Total row */}
      <div className="grid grid-cols-[1fr_auto] gap-3 px-3 py-3 border-t-2 border-foreground mt-0">
        <span className="text-sm font-bold uppercase tracking-wide">Total</span>
        <span className="font-mono font-bold text-sm w-20 text-right">{formatCurrency(total)}</span>
      </div>

      {/* Edit dialog */}
      <Dialog open={!!editingExpense} onOpenChange={(open) => !open && setEditingExpense(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Expense</DialogTitle>
          </DialogHeader>
          {editingExpense && (
            <ExpenseForm
              editingExpense={editingExpense}
              onClose={() => setEditingExpense(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
