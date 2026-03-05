// Design: Ledger Craft — Swiss typographic fintech aesthetic
// Balance summary: per-person totals, net balances, and minimum payment plan

import { useBill } from "@/contexts/BillContext";
import { computeBalances, computeMinimumPayments, formatCurrency } from "@/lib/calculations";
import { ArrowRight, TrendingUp, TrendingDown, Minus, CheckCircle2, Users } from "lucide-react";
import { motion } from "framer-motion";

export default function BalanceSummary() {
  const { bill } = useBill();
  const { people, expenses } = bill;

  if (people.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
          <Users className="w-4 h-4 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">Add people to see balances</p>
      </div>
    );
  }

  const balances = computeBalances(people, expenses);
  const payments = computeMinimumPayments(balances);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.totalAmount, 0);
  const isSettled = payments.length === 0 && expenses.length > 0;

  return (
    <div className="space-y-6">
      {/* Per-person summary table */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          Per Person Summary
        </h3>

        {/* Table header */}
        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground border-b border-border">
          <span>Person</span>
          <span className="text-right w-[72px]">Paid</span>
          <span className="text-right w-[72px]">Share</span>
          <span className="text-right w-[80px]">Balance</span>
        </div>

        {balances.map((b, idx) => {
          const isPositive = b.netBalance > 0.005;
          const isNegative = b.netBalance < -0.005;
          return (
            <motion.div
              key={b.personId}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.18, delay: idx * 0.04 }}
              className="grid grid-cols-[1fr_auto_auto_auto] gap-2 px-3 py-3 border-b border-border last:border-0 items-center hover:bg-muted/20 transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6 h-6 rounded-full bg-foreground flex items-center justify-center text-[10px] font-bold text-background shrink-0">
                  {b.name.charAt(0).toUpperCase()}
                </div>
                <span className="font-medium text-sm truncate">{b.name}</span>
              </div>
              <span className="font-mono text-sm text-right w-[72px]">{formatCurrency(b.totalPaid)}</span>
              <span className="font-mono text-sm text-right w-[72px] text-muted-foreground">{formatCurrency(b.totalOwed)}</span>
              <div className="flex items-center gap-1 justify-end w-[80px]">
                {isPositive && <TrendingUp className="w-3 h-3 text-emerald-600 shrink-0" />}
                {isNegative && <TrendingDown className="w-3 h-3 text-red-600 shrink-0" />}
                {!isPositive && !isNegative && <Minus className="w-3 h-3 text-muted-foreground shrink-0" />}
                <span
                  className={`font-mono font-semibold text-sm ${
                    isPositive
                      ? "text-emerald-600"
                      : isNegative
                      ? "text-red-600"
                      : "text-muted-foreground"
                  }`}
                >
                  {isPositive ? "+" : ""}
                  {formatCurrency(b.netBalance)}
                </span>
              </div>
            </motion.div>
          );
        })}

        {/* Total row */}
        {totalExpenses > 0 && (
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 px-3 py-2.5 border-t-2 border-foreground bg-muted/30">
            <span className="text-xs font-bold uppercase tracking-wide">Total</span>
            <span className="font-mono font-bold text-sm text-right w-[72px]">{formatCurrency(totalExpenses)}</span>
            <span className="font-mono font-bold text-sm text-right w-[72px] text-muted-foreground">{formatCurrency(totalExpenses)}</span>
            <span className="w-[80px]" />
          </div>
        )}
      </div>

      {/* Legend */}
      {expenses.length > 0 && (
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <TrendingUp className="w-3 h-3 text-emerald-600" />
            Gets money back
          </span>
          <span className="flex items-center gap-1.5">
            <TrendingDown className="w-3 h-3 text-red-600" />
            Owes money
          </span>
        </div>
      )}

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Settlement plan */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          How to Settle Up
        </h3>

        {expenses.length === 0 ? (
          <p className="text-sm text-muted-foreground">Add expenses to see the settlement plan.</p>
        ) : isSettled ? (
          <div className="flex items-center gap-3 p-4 rounded-lg border border-emerald-200 bg-emerald-50">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-emerald-800">All settled up!</p>
              <p className="text-xs text-emerald-700 mt-0.5">Everyone has paid their fair share.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground mb-3">
              Minimum {payments.length} payment{payments.length !== 1 ? "s" : ""} needed:
            </p>
            {payments.map((payment, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18, delay: idx * 0.07 }}
                className="flex items-center gap-2 p-3 rounded-lg border border-border bg-background hover:bg-muted/20 transition-colors"
              >
                {/* From avatar */}
                <div className="w-7 h-7 rounded-full bg-red-100 border border-red-200 flex items-center justify-center text-xs font-bold text-red-700 shrink-0">
                  {payment.fromName.charAt(0).toUpperCase()}
                </div>
                {/* Names + arrow */}
                <div className="flex-1 min-w-0 flex items-center gap-1.5">
                  <span className="font-semibold text-sm truncate">{payment.fromName}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span className="font-semibold text-sm truncate">{payment.toName}</span>
                </div>
                {/* To avatar */}
                <div className="w-7 h-7 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-xs font-bold text-emerald-700 shrink-0">
                  {payment.toName.charAt(0).toUpperCase()}
                </div>
                {/* Amount */}
                <span className="font-mono font-bold text-sm text-red-600 w-20 text-right shrink-0">
                  {formatCurrency(payment.amount)}
                </span>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
