// Design: Ledger Craft — Swiss typographic fintech aesthetic
// Two-panel layout: left sidebar = bill list, center = expense ledger, right = settlement summary
// Mobile: header bill-switcher button opens a bottom sheet with the full bill list
// Colors: warm off-white bg (#F7F4EF), deep charcoal text, forest green positive, burnt sienna debt
// Typography: DM Serif Display headings + IBM Plex Mono numbers + DM Sans body

import { useState } from "react";
import { useBills } from "@/contexts/BillsContext";
import PeopleManager from "@/components/PeopleManager";
import ExpenseList from "@/components/ExpenseList";
import BalanceSummary from "@/components/BalanceSummary";
import ExpenseForm from "@/components/ExpenseForm";
import BillSidebar from "@/components/BillSidebar";
import GistDialog from "@/components/GistDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import {
  Plus, RotateCcw, Pencil, Check, Users, ReceiptText,
  Calculator, Download, Upload, Cloud, CloudOff, Loader2,
  LayoutList, ChevronDown,
} from "lucide-react";
import { downloadCsv } from "@/lib/exportCsv";
import ImportDialog from "@/components/ImportDialog";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/calculations";

export default function Home() {
  const {
    activeBill: bill, updateTitle, resetBill, importBill,
    gistSettings, gistSyncing, bills, activeId,
  } = useBills();
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(bill.title);
  const [activeTab, setActiveTab] = useState<"ledger" | "summary">("ledger");
  const [showImport, setShowImport] = useState(false);
  const [showGist, setShowGist] = useState(false);
  const [showBillSheet, setShowBillSheet] = useState(false);

  const commitTitle = () => {
    if (titleDraft.trim()) updateTitle(titleDraft.trim());
    else setTitleDraft(bill.title);
    setEditingTitle(false);
  };

  const totalExpenses = bill.expenses.reduce((s, e) => s + e.totalAmount, 0);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top header bar */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="container flex items-center justify-between h-14 gap-2">
          {/* Logo + mobile bill switcher */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="w-7 h-7 rounded bg-foreground flex items-center justify-center">
              <ReceiptText className="w-4 h-4 text-background" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground hidden sm:block">
              Bill Splitter
            </span>
            {/* Mobile: bill switcher button */}
            <button
              onClick={() => setShowBillSheet(true)}
              className="md:hidden flex items-center gap-1 ml-1 px-2 py-1 rounded-md border border-border bg-muted/50 hover:bg-muted transition-colors"
              title="Switch bills"
            >
              <LayoutList className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground max-w-[80px] truncate">
                {bills.length} bill{bills.length !== 1 ? "s" : ""}
              </span>
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            </button>
          </div>

          {/* Editable title */}
          <div className="flex-1 flex justify-center min-w-0">
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
                className="flex items-center gap-2 group hover:opacity-80 transition-opacity min-w-0"
                title="Click to rename"
              >
                <h1 className="font-serif text-xl font-semibold truncate">{bill.title}</h1>
                <Pencil className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </button>
            )}
          </div>

          {/* Header actions */}
          <div className="flex items-center gap-0.5 shrink-0">
            {/* GitHub Gist — shows sync status */}
            <button
              onClick={() => setShowGist(true)}
              className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-muted"
              title={gistSettings.token ? (gistSyncing ? "Syncing to Gist…" : "Synced to Gist · click to configure") : "Configure GitHub Gist auto-sync"}
            >
              {gistSyncing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-500" />
              ) : gistSettings.token ? (
                <Cloud className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <CloudOff className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">
                {gistSettings.token ? (gistSyncing ? "Syncing…" : "Synced") : "Gist"}
              </span>
            </button>

            {/* Import CSV */}
            <button
              onClick={() => setShowImport(true)}
              className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-muted"
              title="Import from CSV"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Import</span>
            </button>

            {/* Export CSV */}
            {bill.expenses.length > 0 && (
              <button
                onClick={() => {
                  downloadCsv(bill);
                  toast.success("CSV exported", {
                    description: `${bill.title} — ${bill.expenses.length} expense${bill.expenses.length !== 1 ? "s" : ""}`,
                  });
                }}
                className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-muted"
                title="Export to CSV"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Export</span>
              </button>
            )}

            {/* Reset */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-destructive px-2">
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline text-xs">Reset</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset bill?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will remove all expenses from this bill. People will be kept. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={resetBill}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Reset Bill
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </header>

      {/* Main layout: sidebar + content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop bill sidebar */}
        <aside className="hidden md:flex border-r border-border bg-card/50 pt-4 pl-3 pr-4">
          <BillSidebar />
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="container py-6 space-y-5">
            {/* Stats bar */}
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
        </main>
      </div>

      {/* Mobile bill switcher sheet */}
      <Sheet open={showBillSheet} onOpenChange={setShowBillSheet}>
        <SheetContent side="left" className="w-72 p-0 flex flex-col">
          <SheetHeader className="px-4 py-3 border-b border-border">
            <SheetTitle className="text-sm font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <LayoutList className="w-4 h-4" />
              My Bills
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto flex flex-col">
            {/* Embed the full sidebar content inline */}
            <BillSidebarMobile onSelect={() => setShowBillSheet(false)} />
          </div>
        </SheetContent>
      </Sheet>

      {/* Gist Dialog */}
      <GistDialog open={showGist} onClose={() => setShowGist(false)} />

      {/* Import Dialog */}
      <ImportDialog
        open={showImport}
        onClose={() => setShowImport(false)}
        onImport={(newBill) => {
          importBill(newBill);
          toast.success("Bill imported", {
            description: `${newBill.title} — ${newBill.expenses.length} expense${newBill.expenses.length !== 1 ? "s" : ""}`,
          });
        }}
      />

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

// Inline mobile bill list — same logic as BillSidebar but inside the sheet
function BillSidebarMobile({ onSelect }: { onSelect: () => void }) {
  const { bills, activeId, switchBill, createBill, deleteBill, duplicateBill } = useBills();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  return (
    <div className="flex flex-col flex-1">
      {/* New Bill */}
      <div className="px-3 py-2.5 border-b border-border">
        <Button
          size="sm"
          variant="outline"
          className="w-full gap-2 text-xs justify-start"
          onClick={() => { createBill(); onSelect(); }}
        >
          <Plus className="w-3.5 h-3.5" />
          New Bill
        </Button>
      </div>

      {/* Bill list */}
      <div className="flex-1 overflow-y-auto py-1">
        {bills.map((record) => {
          const isActive = record.id === activeId;
          const total = record.bill.expenses.reduce((s, e) => s + e.totalAmount, 0);
          const expCount = record.bill.expenses.length;
          const peopleCount = record.bill.people.length;

          return (
            <div
              key={record.id}
              onClick={() => { switchBill(record.id); onSelect(); }}
              className={`group relative px-3 py-3 cursor-pointer transition-all border-l-2 ${
                isActive
                  ? "bg-foreground/[0.06] border-foreground"
                  : "border-transparent hover:bg-muted/40 hover:border-border"
              }`}
            >
              <div className="flex items-start gap-2">
                <div className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center shrink-0 ${
                  isActive ? "bg-foreground text-background" : "bg-muted text-muted-foreground"
                }`}>
                  <ReceiptText className="w-3 h-3" />
                </div>
                <div className="flex-1 min-w-0 pr-10">
                  <p className={`text-xs font-semibold truncate leading-tight ${
                    isActive ? "text-foreground" : "text-muted-foreground"
                  }`}>
                    {record.bill.title}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                    {expCount === 0
                      ? `${peopleCount} people · no expenses`
                      : `${peopleCount} people · ${formatCurrency(total)}`}
                  </p>
                </div>
              </div>

              {/* Hover actions */}
              <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => { e.stopPropagation(); duplicateBill(record.id); onSelect(); }}
                  className="w-6 h-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  title="Duplicate"
                >
                  <Download className="w-3 h-3 rotate-180" />
                </button>
                {bills.length > 1 && (
                  confirmDelete === record.id ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteBill(record.id);
                        setConfirmDelete(null);
                      }}
                      className="w-6 h-6 flex items-center justify-center rounded bg-destructive text-destructive-foreground text-[9px] font-bold"
                    >
                      ✕
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDelete(record.id);
                        setTimeout(() => setConfirmDelete(null), 3000);
                      }}
                      className="w-6 h-6 flex items-center justify-center rounded text-muted-foreground hover:text-destructive hover:bg-muted transition-colors"
                      title="Delete"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </button>
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="px-3 py-2 border-t border-border">
        <p className="text-[10px] text-muted-foreground">
          {bills.length} bill{bills.length !== 1 ? "s" : ""} · tap to switch
        </p>
      </div>
    </div>
  );
}
