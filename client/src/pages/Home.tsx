// Design: Ledger Craft — Swiss typographic fintech aesthetic
// Two-panel layout: left = expense ledger, right = settlement summary
// Colors: warm off-white bg (#F7F4EF), deep charcoal text, forest green positive, burnt sienna debt
// Typography: DM Serif Display headings + IBM Plex Mono numbers + DM Sans body

import { useState } from "react";
import { useBill } from "@/contexts/BillContext";
import PeopleManager from "@/components/PeopleManager";
import ExpenseList from "@/components/ExpenseList";
import BalanceSummary from "@/components/BalanceSummary";
import ExpenseForm from "@/components/ExpenseForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Plus, RotateCcw, Pencil, Check, Users, ReceiptText, Calculator, Download } from "lucide-react";
import { downloadCsv } from "@/lib/exportCsv";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/calculations";

export default function Home() {
  const { bill, updateTitle, resetBill } = useBill();
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(bill.title);
  const [activeTab, setActiveTab] = useState<"ledger" | "summary">("ledger");

  const commitTitle = () => {
    if (titleDraft.trim()) updateTitle(titleDraft.trim());
    else setTitleDraft(bill.title);
    setEditingTitle(false);
  };

  const totalExpenses = bill.expenses.reduce((s, e) => s + e.totalAmount, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Top header bar */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="container flex items-center justify-between h-14 gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-7 h-7 rounded bg-foreground flex items-center justify-center">
              <ReceiptText className="w-4 h-4 text-background" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground hidden sm:block">
              Bill Splitter
            </span>
          </div>

          {/* Editable title */}
          <div className="flex-1 flex justify-center">
            {editingTitle ? (
              <div className="flex items-center gap-2">
                <Input
                  autoFocus
                  value={titleDraft}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitTitle();
                    if (e.key === "Escape") {
                      setTitleDraft(bill.title);
                      setEditingTitle(false);
                    }
                  }}
                  onBlur={commitTitle}
                  className="text-center font-serif text-lg font-semibold h-8 max-w-52 border-foreground"
                />
                <button onClick={commitTitle} className="text-emerald-600 hover:text-emerald-700">
                  <Check className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setTitleDraft(bill.title);
                  setEditingTitle(true);
                }}
                className="flex items-center gap-2 group hover:opacity-80 transition-opacity"
                title="Click to rename"
              >
                <h1 className="font-serif text-xl font-semibold">{bill.title}</h1>
                <Pencil className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            )}
          </div>

          {/* Export CSV */}
          {bill.expenses.length > 0 && (
            <button
              onClick={() => {
                downloadCsv(bill);
                toast.success("CSV exported", {
                  description: `${bill.title} — ${bill.expenses.length} expense${bill.expenses.length !== 1 ? "s" : ""}`,
                });
              }}
              className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors shrink-0 px-2 py-1 rounded hover:bg-muted"
              title="Export to CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          )}

          {/* Reset */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-destructive shrink-0">
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-xs">Reset</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset bill?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will remove all people and expenses. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={resetBill}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Reset Everything
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </header>

      <div className="container py-6 space-y-5">
        {/* Stats bar — shown when there are expenses */}
        {bill.expenses.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-border bg-card px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Total</p>
              <p className="font-mono font-bold text-lg">{formatCurrency(totalExpenses)}</p>
            </div>
            <div className="rounded-lg border border-border bg-card px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Expenses</p>
              <p className="font-mono font-bold text-lg">{bill.expenses.length}</p>
            </div>
            <div className="rounded-lg border border-border bg-card px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">People</p>
              <p className="font-mono font-bold text-lg">{bill.people.length}</p>
            </div>
          </div>
        )}

        {/* People section */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                People
              </h2>
            </div>
            <span className="text-xs font-mono text-muted-foreground">
              {bill.people.length} {bill.people.length === 1 ? "person" : "people"}
            </span>
          </div>
          <div className="p-4">
            <PeopleManager />
          </div>
        </div>

        {/* Mobile tab switcher */}
        <div className="flex gap-1 p-1 rounded-lg bg-muted lg:hidden">
          <button
            onClick={() => setActiveTab("ledger")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === "ledger"
                ? "bg-card shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ReceiptText className="w-3.5 h-3.5" />
            Expenses
            {bill.expenses.length > 0 && (
              <span className="text-xs font-mono opacity-70">({bill.expenses.length})</span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("summary")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === "summary"
                ? "bg-card shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            Summary
          </button>
        </div>

        {/* Two-panel layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-5 items-start">
          {/* Left panel: Expense Ledger */}
          <div className={`${activeTab !== "ledger" ? "hidden lg:block" : ""}`}>
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <ReceiptText className="w-4 h-4 text-muted-foreground" />
                  <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    Expenses
                  </h2>
                </div>
                <Button
                  size="sm"
                  onClick={() => setShowAddExpense(true)}
                  disabled={bill.people.length < 1}
                  className="gap-1.5 h-7 text-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Expense
                </Button>
              </div>
              <ExpenseList />
            </div>
            {bill.people.length < 1 && (
              <p className="text-xs text-muted-foreground text-center mt-2">
                Add at least one person before adding expenses.
              </p>
            )}
          </div>

          {/* Right panel: Balance Summary */}
          <div className={`${activeTab !== "summary" ? "hidden lg:block" : ""}`}>
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
                <Calculator className="w-4 h-4 text-muted-foreground" />
                <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Summary & Settlement
                </h2>
              </div>
              <div className="p-4">
                <BalanceSummary />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Expense Dialog */}
      <Dialog open={showAddExpense} onOpenChange={setShowAddExpense}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Add Expense</DialogTitle>
          </DialogHeader>
          <ExpenseForm onClose={() => setShowAddExpense(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
