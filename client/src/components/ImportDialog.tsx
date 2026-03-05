// Design: Ledger Craft — Swiss typographic fintech aesthetic
// Import dialog: file picker → parse preview → confirm to replace bill

import { useRef, useState } from "react";
import { parseCsv } from "@/lib/importCsv";
import type { ImportResult } from "@/lib/importCsv";
import type { BillState } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, AlertTriangle, CheckCircle2, FileText, X } from "lucide-react";

interface ImportDialogProps {
  open: boolean;
  onClose: () => void;
  onImport: (bill: BillState) => void;
}

type Step = "pick" | "preview" | "error";

export default function ImportDialog({ open, onClose, onImport }: ImportDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("pick");
  const [fileName, setFileName] = useState("");
  const [parseResult, setParseResult] = useState<ImportResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const reset = () => {
    setStep("pick");
    setFileName("");
    setParseResult(null);
    setErrorMsg("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const processFile = (file: File) => {
    if (!file.name.endsWith(".csv")) {
      setErrorMsg("Please select a .csv file.");
      setStep("error");
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const result = parseCsv(text);
      if (result.ok) {
        setParseResult(result);
        setStep("preview");
      } else {
        setErrorMsg(result.error);
        setStep("error");
      }
    };
    reader.onerror = () => {
      setErrorMsg("Failed to read the file. Please try again.");
      setStep("error");
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleConfirm = () => {
    if (parseResult) {
      onImport(parseResult.bill);
      handleClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">Import from CSV</DialogTitle>
          <DialogDescription>
            Load a previously exported Bill Splitter CSV to restore a bill.
          </DialogDescription>
        </DialogHeader>

        {/* ── Step: Pick file ── */}
        {step === "pick" && (
          <div className="space-y-4">
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center gap-3 p-8 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
                isDragging
                  ? "border-foreground bg-muted/50"
                  : "border-border hover:border-foreground/40 hover:bg-muted/20"
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <Upload className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">Drop a CSV file here</p>
                <p className="text-xs text-muted-foreground mt-1">or click to browse</p>
              </div>
              <p className="text-xs text-muted-foreground font-mono">.csv files only</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button variant="outline" onClick={handleClose} className="w-full">
              Cancel
            </Button>
          </div>
        )}

        {/* ── Step: Preview ── */}
        {step === "preview" && parseResult && (
          <div className="space-y-4">
            {/* File badge */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/40 border border-border">
              <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-sm font-mono truncate flex-1">{fileName}</span>
              <button onClick={reset} className="text-muted-foreground hover:text-foreground">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Parsed summary */}
            <div className="rounded-lg border border-border overflow-hidden divide-y divide-border">
              <div className="px-3 py-2.5 flex justify-between items-center">
                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Title</span>
                <span className="text-sm font-medium">{parseResult.bill.title}</span>
              </div>
              <div className="px-3 py-2.5 flex justify-between items-center">
                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">People</span>
                <span className="text-sm font-mono">{parseResult.bill.people.length}</span>
              </div>
              <div className="px-3 py-2.5 flex justify-between items-center">
                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Expenses</span>
                <span className="text-sm font-mono">{parseResult.bill.expenses.length}</span>
              </div>
              <div className="px-3 py-2.5 flex justify-between items-center">
                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Total</span>
                <span className="text-sm font-mono font-semibold">
                  ${parseResult.bill.expenses.reduce((s, e) => s + e.totalAmount, 0).toFixed(2)}
                </span>
              </div>
              {parseResult.bill.people.length > 0 && (
                <div className="px-3 py-2.5">
                  <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground block mb-1.5">People</span>
                  <div className="flex flex-wrap gap-1.5">
                    {parseResult.bill.people.map((p) => (
                      <span key={p.id} className="px-2 py-0.5 rounded-full bg-muted text-xs font-medium">
                        {p.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Warnings */}
            {parseResult.warnings.length > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-1">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="text-xs font-semibold text-amber-800">
                    {parseResult.warnings.length} warning{parseResult.warnings.length !== 1 ? "s" : ""}
                  </span>
                </div>
                {parseResult.warnings.map((w, i) => (
                  <p key={i} className="text-xs text-amber-700 leading-relaxed">{w}</p>
                ))}
              </div>
            )}

            {/* Overwrite warning */}
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-muted/40 border border-border">
              <AlertTriangle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                This will <strong>replace</strong> your current bill. Your existing data will be lost.
              </p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={reset} className="flex-1">
                Back
              </Button>
              <Button onClick={handleConfirm} className="flex-1 gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Import Bill
              </Button>
            </div>
          </div>
        )}

        {/* ── Step: Error ── */}
        {step === "error" && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 rounded-lg border border-red-200 bg-red-50">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-800">Import failed</p>
                <p className="text-xs text-red-700 mt-1 leading-relaxed">{errorMsg}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={reset} className="flex-1">
                Try Again
              </Button>
              <Button variant="outline" onClick={handleClose} className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
