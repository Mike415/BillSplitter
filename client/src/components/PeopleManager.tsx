// Design: Ledger Craft — Swiss typographic fintech aesthetic
// People manager: add, rename, remove participants

import { useState } from "react";
import { useBills } from "@/contexts/BillsContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, UserPlus, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function PeopleManager() {
  const { activeBill: bill, addPerson, removePerson, updatePersonName } = useBills();
  const { people, expenses } = bill;
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const handleAdd = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    addPerson(trimmed);
    setNewName("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleAdd();
  };

  const startEdit = (id: string, name: string) => {
    setEditingId(id);
    setEditingName(name);
  };

  const commitEdit = () => {
    if (editingId && editingName.trim()) {
      updatePersonName(editingId, editingName.trim());
    }
    setEditingId(null);
    setEditingName("");
  };

  const getExpenseCount = (personId: string) => {
    return expenses.filter(
      (e) => e.paidById === personId || e.participantIds.includes(personId)
    ).length;
  };

  return (
    <div className="space-y-3">
      {/* Add person input */}
      <div className="flex gap-2">
        <Input
          placeholder="Add a person..."
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1"
        />
        <Button
          onClick={handleAdd}
          disabled={!newName.trim()}
          size="sm"
          className="gap-1.5 shrink-0"
        >
          <UserPlus className="w-3.5 h-3.5" />
          Add
        </Button>
      </div>

      {/* People list */}
      <AnimatePresence initial={false}>
        {people.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-3">
            No people added yet. Add at least 2 people to split bills.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {people.map((person) => {
              const count = getExpenseCount(person.id);
              const isEditing = editingId === person.id;
              return (
                <motion.div
                  key={person.id}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  transition={{ duration: 0.15 }}
                  className="flex items-center gap-1.5 pl-2.5 pr-1.5 py-1.5 rounded-full border border-border bg-background hover:border-foreground/30 transition-colors group"
                >
                  <div className="w-5 h-5 rounded-full bg-foreground flex items-center justify-center text-[10px] font-bold text-background shrink-0">
                    {person.name.charAt(0).toUpperCase()}
                  </div>
                  {isEditing ? (
                    <>
                      <input
                        autoFocus
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") commitEdit();
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        onBlur={commitEdit}
                        className="text-sm font-medium bg-transparent outline-none border-b border-foreground w-24"
                      />
                      <button onClick={commitEdit} className="p-0.5 text-emerald-600">
                        <Check className="w-3 h-3" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => startEdit(person.id, person.name)}
                        className="text-sm font-medium hover:text-muted-foreground transition-colors"
                        title="Click to rename"
                      >
                        {person.name}
                      </button>
                      {count > 0 && (
                        <span className="text-[10px] text-muted-foreground font-mono">
                          ({count})
                        </span>
                      )}
                    </>
                  )}
                  <button
                    onClick={() => removePerson(person.id)}
                    className="p-0.5 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
                    title="Remove person"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
