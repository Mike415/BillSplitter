// Design: Ledger Craft — Swiss typographic fintech aesthetic
// BillSidebar: always-visible left panel for managing multiple bills

import { useState } from "react";
import { useBills } from "@/contexts/BillsContext";
import { formatCurrency } from "@/lib/calculations";
import {
  Plus,
  ReceiptText,
  Trash2,
  Copy,
  LayoutList,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BillSidebar() {
  const { bills, activeId, switchBill, createBill, deleteBill, duplicateBill } = useBills();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  return (
    <div className="w-56 shrink-0 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-border">
        <div className="flex items-center gap-1.5">
          <LayoutList className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            My Bills
          </span>
        </div>
      </div>

      {/* New Bill button — prominent */}
      <div className="px-3 py-2.5 border-b border-border">
        <Button
          size="sm"
          variant="outline"
          className="w-full gap-2 text-xs justify-start"
          onClick={() => createBill()}
        >
          <Plus className="w-3.5 h-3.5" />
          New Bill
        </Button>
      </div>

      {/* Bill list */}
      <div className="flex-1 overflow-y-auto py-1">
        {bills.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-6 px-3">
            No bills yet. Create one above.
          </p>
        )}
        {bills.map((record) => {
          const isActive = record.id === activeId;
          const total = record.bill.expenses.reduce((s, e) => s + e.totalAmount, 0);
          const expCount = record.bill.expenses.length;
          const peopleCount = record.bill.people.length;

          return (
            <div
              key={record.id}
              onClick={() => switchBill(record.id)}
              className={`group relative px-3 py-3 cursor-pointer transition-all border-l-2 ${
                isActive
                  ? "bg-foreground/[0.06] border-foreground"
                  : "border-transparent hover:bg-muted/40 hover:border-border"
              }`}
            >
              {/* Bill icon + name */}
              <div className="flex items-start gap-2">
                <div className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center shrink-0 ${
                  isActive ? "bg-foreground text-background" : "bg-muted text-muted-foreground"
                }`}>
                  <ReceiptText className="w-3 h-3" />
                </div>
                <div className="flex-1 min-w-0 pr-8">
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
                  {record.gistId && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />
                      <span className="text-[10px] text-emerald-600">Gist synced</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Hover actions */}
              <div className="absolute right-1.5 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-0.5">
                <button
                  onClick={(e) => { e.stopPropagation(); duplicateBill(record.id); }}
                  className="w-5 h-5 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  title="Duplicate bill"
                >
                  <Copy className="w-3 h-3" />
                </button>
                {bills.length > 1 && (
                  confirmDelete === record.id ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteBill(record.id);
                        setConfirmDelete(null);
                      }}
                      className="w-5 h-5 flex items-center justify-center rounded bg-destructive text-destructive-foreground text-[9px] font-bold hover:opacity-80"
                      title="Confirm delete"
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
                      className="w-5 h-5 flex items-center justify-center rounded text-muted-foreground hover:text-destructive hover:bg-muted transition-colors"
                      title="Delete bill"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-border">
        <p className="text-[10px] text-muted-foreground">
          {bills.length} bill{bills.length !== 1 ? "s" : ""} · click to switch
        </p>
      </div>
    </div>
  );
}
