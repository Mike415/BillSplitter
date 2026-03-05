// Design: Ledger Craft — Swiss typographic fintech aesthetic
// Expense add/edit form with flexible split options

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useBills } from "@/contexts/BillsContext";
import type { Expense, SplitType, PersonSplit } from "@/lib/types";
import { round2 } from "@/lib/calculations";

interface ExpenseFormProps {
  editingExpense?: Expense | null;
  onClose: () => void;
}

export default function ExpenseForm({ editingExpense, onClose }: ExpenseFormProps) {
  const { activeBill: bill, addExpense, updateExpense } = useBills();
  const { people } = bill;

  const [description, setDescription] = useState(editingExpense?.description ?? "");
  const [totalAmount, setTotalAmount] = useState(
    editingExpense ? String(editingExpense.totalAmount) : ""
  );
  const [paidById, setPaidById] = useState(editingExpense?.paidById ?? (people[0]?.id ?? ""));
  const [participantIds, setParticipantIds] = useState<string[]>(
    editingExpense?.participantIds ?? people.map((p) => p.id)
  );
  const [splitType, setSplitType] = useState<SplitType>(editingExpense?.splitType ?? "even");
  const [splitValues, setSplitValues] = useState<Record<string, string>>(() => {
    if (!editingExpense) return {};
    const map: Record<string, string> = {};
    for (const s of editingExpense.splits) {
      if (editingExpense.splitType === "amount" && s.amount !== undefined)
        map[s.personId] = String(s.amount);
      if (editingExpense.splitType === "percent" && s.percent !== undefined)
        map[s.personId] = String(s.percent);
    }
    return map;
  });

  useEffect(() => {
    setSplitValues({});
  }, [splitType]);

  const toggleParticipant = (id: string) => {
    setParticipantIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleSplitValueChange = (personId: string, value: string) => {
    setSplitValues((prev) => ({ ...prev, [personId]: value }));
  };

  const getPreviewShare = (personId: string): string => {
    const total = parseFloat(totalAmount) || 0;
    if (total === 0 || !participantIds.includes(personId)) return "";

    if (splitType === "even") {
      return `$${round2(total / participantIds.length).toFixed(2)}`;
    }

    if (splitType === "amount") {
      const explicit: Record<string, number> = {};
      let explicitTotal = 0;
      for (const [pid, val] of Object.entries(splitValues)) {
        const n = parseFloat(val);
        if (!isNaN(n) && participantIds.includes(pid)) {
          explicit[pid] = n;
          explicitTotal += n;
        }
      }
      const remainder = total - explicitTotal;
      const remainderPeople = participantIds.filter((id) => !(id in explicit));
      if (personId in explicit) return `$${explicit[personId].toFixed(2)}`;
      if (remainderPeople.length > 0)
        return `$${round2(remainder / remainderPeople.length).toFixed(2)} (auto)`;
      return "$0.00";
    }

    if (splitType === "percent") {
      const explicit: Record<string, number> = {};
      let explicitPct = 0;
      for (const [pid, val] of Object.entries(splitValues)) {
        const n = parseFloat(val);
        if (!isNaN(n) && participantIds.includes(pid)) {
          explicit[pid] = n;
          explicitPct += n;
        }
      }
      const remainderPct = 100 - explicitPct;
      const remainderPeople = participantIds.filter((id) => !(id in explicit));
      let pct: number;
      if (personId in explicit) pct = explicit[personId];
      else if (remainderPeople.length > 0) pct = remainderPct / remainderPeople.length;
      else pct = 0;
      const dollarAmt = round2((pct / 100) * total);
      if (personId in explicit) return `$${dollarAmt.toFixed(2)} (${round2(pct)}%)`;
      return `$${dollarAmt.toFixed(2)} (${round2(pct)}% auto)`;
    }

    return "";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(totalAmount);
    if (
      !description.trim() ||
      isNaN(amount) ||
      amount <= 0 ||
      !paidById ||
      participantIds.length === 0
    )
      return;

    const splits: PersonSplit[] = [];
    for (const [personId, val] of Object.entries(splitValues)) {
      if (!participantIds.includes(personId)) continue;
      const n = parseFloat(val);
      if (isNaN(n)) continue;
      if (splitType === "amount") splits.push({ personId, amount: n });
      if (splitType === "percent") splits.push({ personId, percent: n });
    }

    const expenseData = {
      description: description.trim(),
      totalAmount: amount,
      paidById,
      participantIds,
      splitType,
      splits,
    };

    if (editingExpense) {
      updateExpense(editingExpense.id, expenseData);
    } else {
      addExpense(expenseData);
    }
    onClose();
  };

  const isValid =
    description.trim().length > 0 &&
    parseFloat(totalAmount) > 0 &&
    paidById !== "" &&
    participantIds.length > 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Description */}
      <div className="space-y-1.5">
        <Label htmlFor="description" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Description
        </Label>
        <Input
          id="description"
          placeholder="e.g. Dinner at Nobu, Hotel room, Taxi..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="font-medium"
          autoFocus
        />
      </div>

      {/* Amount + Paid By */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="amount" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Total Amount
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-sm select-none">
              $
            </span>
            <Input
              id="amount"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              className="pl-6 font-mono"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Paid By
          </Label>
          <Select value={paidById} onValueChange={setPaidById}>
            <SelectTrigger>
              <SelectValue placeholder="Select person" />
            </SelectTrigger>
            <SelectContent>
              {people.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Split Type */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Split Method
        </Label>
        <div className="grid grid-cols-3 gap-2">
          {(["even", "amount", "percent"] as SplitType[]).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setSplitType(type)}
              className={`py-2.5 px-3 text-sm font-semibold rounded-lg border transition-all ${
                splitType === type
                  ? "bg-foreground text-background border-foreground"
                  : "bg-transparent text-muted-foreground border-border hover:border-foreground/50 hover:text-foreground"
              }`}
            >
              {type === "even" ? "Even" : type === "amount" ? "$ Amount" : "% Percent"}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {splitType === "even" && "Split the total equally among all participants."}
          {splitType === "amount" &&
            "Enter specific dollar amounts. People without a value share the remainder equally."}
          {splitType === "percent" &&
            "Enter specific percentages. People without a value share the remaining % equally."}
        </p>
      </div>

      {/* Participants */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Participants
          </Label>
          <span className="text-xs text-muted-foreground font-mono">
            {participantIds.length} of {people.length}
          </span>
        </div>
        <div className="border border-border rounded-lg overflow-hidden divide-y divide-border">
          {people.map((person) => {
            const included = participantIds.includes(person.id);
            const preview = included ? getPreviewShare(person.id) : null;
            return (
              <div
                key={person.id}
                className={`flex items-center gap-3 px-3 py-2.5 transition-colors ${
                  included ? "bg-background" : "bg-muted/20"
                }`}
              >
                <Checkbox
                  id={`participant-${person.id}`}
                  checked={included}
                  onCheckedChange={() => toggleParticipant(person.id)}
                />
                <label
                  htmlFor={`participant-${person.id}`}
                  className="flex-1 text-sm font-medium cursor-pointer select-none"
                >
                  {person.name}
                </label>

                {/* Split value input for amount/percent */}
                {included && splitType !== "even" && (
                  <div className="relative w-28">
                    {splitType === "percent" && (
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-xs select-none">
                        %
                      </span>
                    )}
                    {splitType === "amount" && (
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-xs select-none">
                        $
                      </span>
                    )}
                    <Input
                      type="number"
                      min="0"
                      step={splitType === "percent" ? "0.1" : "0.01"}
                      placeholder="auto"
                      value={splitValues[person.id] ?? ""}
                      onChange={(e) => handleSplitValueChange(person.id, e.target.value)}
                      className={`h-7 text-xs font-mono ${
                        splitType === "amount" ? "pl-5 pr-2" : "pl-2 pr-6"
                      }`}
                    />
                  </div>
                )}

                {/* Preview share */}
                {preview && (
                  <span className="text-xs font-mono text-muted-foreground min-w-[90px] text-right shrink-0">
                    {preview}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" disabled={!isValid} className="flex-1">
          {editingExpense ? "Save Changes" : "Add Expense"}
        </Button>
      </div>
    </form>
  );
}
