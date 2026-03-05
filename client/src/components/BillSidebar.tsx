// Design: Ledger Craft — Swiss typographic fintech aesthetic
// BillSidebar: collapsible left panel listing all bills

import { useState } from "react";
import { useBills } from "@/contexts/BillsContext";
import { formatCurrency } from "@/lib/calculations";
import {
  Plus,
  ReceiptText,
  Trash2,
  Copy,
  ChevronLeft,
  ChevronRight,
  LayoutList,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function BillSidebar() {
  const { bills, activeId, switchBill, createBill, deleteBill, duplicateBill } = useBills();
  const [collapsed, setCollapsed] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  return (
    <div className={`relative flex flex-col transition-all duration-300 ${collapsed ? "w-10" : "w-56 shrink-0"}`}>
      {/* Toggle button */}
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="absolute -right-3 top-4 z-10 w-6 h-6 rounded-full bg-background border border-border shadow-sm flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        title={collapsed ? "Expand bill list" : "Collapse bill list"}
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>

      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "100%" }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col h-full overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-3 border-b border-border">
              <div className="flex items-center gap-1.5">
                <LayoutList className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Bills
                </span>
              </div>
              <button
                onClick={() => createBill()}
                className="w-5 h-5 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title="New bill"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Bill list */}
            <div className="flex-1 overflow-y-auto py-1">
              {bills.map((record) => {
                const isActive = record.id === activeId;
                const total = record.bill.expenses.reduce((s, e) => s + e.totalAmount, 0);
                const expCount = record.bill.expenses.length;

                return (
                  <div
                    key={record.id}
                    className={`group relative px-3 py-2.5 cursor-pointer transition-colors ${
                      isActive
                        ? "bg-foreground/5 border-l-2 border-foreground"
                        : "border-l-2 border-transparent hover:bg-muted/40"
                    }`}
                    onClick={() => switchBill(record.id)}
                  >
                    {/* Bill name */}
                    <div className="flex items-start gap-1.5">
                      <ReceiptText className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${isActive ? "text-foreground" : "text-muted-foreground"}`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-medium truncate leading-tight ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                          {record.bill.title}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                          {expCount === 0
                            ? "No expenses"
                            : `${expCount} exp · ${formatCurrency(total)}`}
                        </p>
                        {record.gistId && (
                          <p className="text-[10px] text-emerald-600 mt-0.5">● Gist synced</p>
                        )}
                      </div>
                    </div>

                    {/* Action buttons (show on hover) */}
                    <div className="absolute right-1.5 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-0.5">
                      <button
                        onClick={(e) => { e.stopPropagation(); duplicateBill(record.id); }}
                        className="w-5 h-5 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        title="Duplicate"
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
                            className="w-5 h-5 flex items-center justify-center rounded bg-destructive text-destructive-foreground hover:opacity-80 transition-colors text-[9px] font-bold"
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
                {bills.length} bill{bills.length !== 1 ? "s" : ""}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapsed: icon-only */}
      {collapsed && (
        <div className="flex flex-col items-center pt-4 gap-3">
          <LayoutList className="w-4 h-4 text-muted-foreground" />
          <div className="flex flex-col gap-1">
            {bills.map((r) => (
              <button
                key={r.id}
                onClick={() => switchBill(r.id)}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  r.id === activeId ? "bg-foreground" : "bg-border hover:bg-muted-foreground"
                }`}
                title={r.bill.title}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
