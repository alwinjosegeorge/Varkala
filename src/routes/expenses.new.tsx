import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Check, Plus, Tag, Paperclip, Camera, Trash2 } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { AppShell } from "../components/AppShell";
import { MemberAvatar } from "../components/Avatar";
import { fmtINR, useStore } from "../lib/store";
import type { SplitMode, Attachment, CategoryItem } from "../lib/types";
import { computeSplits } from "../lib/settlement";
import { toast } from "sonner";

export const Route = createFileRoute("/expenses/new")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      editId: (search.editId as string) || undefined,
    };
  },
  head: () => ({ meta: [{ title: "Expense Editor" }] }),
  component: NewExpense,
});

function NewExpense() {
  const { editId } = Route.useSearch();
  const { state, setState } = useStore();
  const navigate = useNavigate();
  const members = state.members;

  // Find expense if editing
  const existingExpense = useMemo(() => {
    if (!editId) return null;
    return state.expenses.find((e) => e.id === editId) || null;
  }, [editId, state.expenses]);

  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState(members[0]?.id || "");
  const [category, setCategory] = useState("");
  const [notes, setNotes] = useState("");
  const [splitMode, setSplitMode] = useState<SplitMode>("equal");
  const [selected, setSelected] = useState<string[]>(members.map((m) => m.id));
  const [custom, setCustom] = useState<Record<string, string>>({});
  const [locationId, setLocationId] = useState("");

  // Tags state
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  // Attachments state
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  // Inline Category Creator state
  const [showAddCat, setShowAddCat] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatEmoji, setNewCatEmoji] = useState("✨");
  const [newCatColor, setNewCatColor] = useState("#94A3B8");

  // Load existing expense if editId is provided
  useEffect(() => {
    if (existingExpense) {
      setName(existingExpense.name);
      setAmount(existingExpense.amount.toString());
      setPaidBy(existingExpense.paidBy);
      setCategory(existingExpense.category);
      setNotes(existingExpense.notes || "");
      setSplitMode(existingExpense.splitMode);
      setSelected(existingExpense.splits.map((s) => s.memberId));
      setLocationId(existingExpense.locationId || "");
      setTags(existingExpense.tags || []);
      setAttachments(existingExpense.attachments || []);

      const customVals: Record<string, string> = {};
      if (existingExpense.splitMode === "custom" || existingExpense.splitMode === "percentage") {
        existingExpense.splits.forEach((s) => {
          // In edit mode we can load custom value. For percentage it is dynamic, let's store directly
          customVals[s.memberId] = s.amount.toString();
        });
      }
      setCustom(customVals);
    } else {
      if (state.categories.length > 0) {
        setCategory(state.categories[0].id);
      }
    }
  }, [existingExpense, state.categories]);

  const amt = parseFloat(amount) || 0;

  const customMap = useMemo(() => {
    const r: Record<string, number> = {};
    for (const id of selected) r[id] = parseFloat(custom[id] ?? "") || 0;
    return r;
  }, [custom, selected]);

  const totalCustom = Object.values(customMap).reduce((a, b) => a + b, 0);

  const canSubmit =
    name.trim().length > 0 &&
    amt > 0 &&
    selected.length > 0 &&
    category !== "" &&
    (splitMode !== "custom" || Math.abs(totalCustom - amt) < 0.5) &&
    (splitMode !== "percentage" || Math.abs(totalCustom - 100) < 0.5);

  function toggle(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput("");
    }
  };

  const removeTag = (t: string) => {
    setTags(tags.filter((x) => x !== t));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const newAttachment: Attachment = {
            id: crypto.randomUUID(),
            name: file.name,
            url: reader.result as string,
            type: file.type,
          };
          setAttachments((prev) => [...prev, newAttachment]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const newId = newCatName.trim().toLowerCase().replace(/\s+/g, "-");
    const newCat: CategoryItem = {
      id: newId,
      name: newCatName.trim(),
      emoji: newCatEmoji,
      color: newCatColor,
    };

    setState((s) => ({
      ...s,
      categories: [...s.categories, newCat],
    }));

    setCategory(newId);
    setNewCatName("");
    setNewCatEmoji("✨");
    setShowAddCat(false);
  };

  const deleteAttachment = (id: string) => {
    setAttachments(attachments.filter((a) => a.id !== id));
  };

  function submit() {
    if (name.trim().length === 0) {
      toast.error("Please enter what the expense was for!");
      return;
    }
    if (amt <= 0) {
      toast.error("Please enter a valid amount!");
      return;
    }
    if (!category) {
      toast.error("Please select a category!");
      return;
    }
    if (selected.length === 0) {
      toast.error("Please select at least one member to split with!");
      return;
    }
    if (splitMode === "custom" && Math.abs(totalCustom - amt) > 0.5) {
      toast.error(`Custom split total (${fmtINR(totalCustom)}) must match amount (${fmtINR(amt)})`);
      return;
    }
    if (splitMode === "percentage" && Math.abs(totalCustom - 100) > 0.5) {
      toast.error(`Percentage split total (${totalCustom}%) must equal 100%`);
      return;
    }

    const splits = computeSplits(splitMode, amt, selected, customMap);

    const expenseData = {
      id: existingExpense ? existingExpense.id : crypto.randomUUID(),
      name: name.trim(),
      amount: amt,
      paidBy,
      category,
      date: existingExpense ? existingExpense.date : new Date().toISOString(),
      notes: notes.trim() || undefined,
      splitMode,
      splits,
      locationId: locationId || undefined,
      tags: tags.length > 0 ? tags : undefined,
      attachments: attachments.length > 0 ? attachments : undefined,
    };

    setState((s) => ({
      ...s,
      expenses: existingExpense
        ? s.expenses.map((e) => (e.id === existingExpense.id ? expenseData : e))
        : [...s.expenses, expenseData],
    }));

    navigate({ to: "/expenses" });
  }

  // Predefined Category Colors
  const COLORS = ["#38BDF8", "#F59E0B", "#F472B6", "#D6FF3F", "#A78BFA", "#94A3B8", "#34D399"];

  return (
    <AppShell>
      <header className="px-5 pt-8 pb-4 flex items-center justify-between">
        <button
          onClick={() => navigate({ to: "/expenses" })}
          className="h-11 w-11 grid place-items-center rounded-2xl glass shadow-soft"
        >
          <ArrowLeft className="h-5 w-5 text-secondary" />
        </button>
        <p className="text-[11px] uppercase tracking-[0.22em] font-bold text-muted-foreground">
          {existingExpense ? "Edit Expense" : "New Expense"}
        </p>
        <div className="h-11 w-11" />
      </header>

      <div className="px-5 space-y-5 text-left pb-40">
        {/* Amount hero */}
        <div className="card-soft p-6 gradient-night text-white relative">
          {existingExpense && (
            <button
              onClick={() => {
                if (confirm("Are you sure you want to delete this expense?")) {
                  setState((s) => ({ ...s, expenses: s.expenses.filter((e) => e.id !== existingExpense.id) }));
                  navigate({ to: "/expenses" });
                }
              }}
              className="absolute top-4 right-4 p-2 rounded-lg bg-rose-500/20 text-rose-400 hover:bg-rose-500/30"
              title="Delete Expense"
            >
              <Trash2 className="h-4.5 w-4.5" />
            </button>
          )}
          <p className="text-[10px] uppercase tracking-widest font-bold text-white/60">Amount (₹)</p>
          <input
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
            placeholder="0"
            className="mt-1 w-full bg-transparent outline-none text-5xl font-black tabular text-primary placeholder:text-white/20"
          />
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="What was it for?"
            className="mt-2 w-full bg-transparent outline-none text-base font-medium text-white/90 placeholder:text-white/40"
          />
        </div>

        {/* Category Selector */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <SectionLabel>Category</SectionLabel>
            <button
              onClick={() => setShowAddCat(!showAddCat)}
              className="text-[10px] uppercase tracking-widest font-bold text-accent hover:underline flex items-center gap-1"
            >
              <Plus className="h-3 w-3" /> Add Custom
            </button>
          </div>

          {/* Add Category Form Inline */}
          <AnimatePresence>
            {showAddCat && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mb-3"
              >
                <form onSubmit={handleCreateCategory} className="p-4 rounded-3xl bg-muted/30 border border-border space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      required
                      placeholder="Category Name"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      className="col-span-2 card-soft bg-white border border-border px-3 py-2 text-xs font-semibold outline-none focus:border-secondary"
                    />
                    <input
                      type="text"
                      required
                      maxLength={2}
                      placeholder="Emoji"
                      value={newCatEmoji}
                      onChange={(e) => setNewCatEmoji(e.target.value)}
                      className="card-soft bg-white border border-border px-3 py-2 text-xs text-center font-semibold outline-none focus:border-secondary"
                    />
                  </div>
                  <div className="flex gap-2">
                    {COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setNewCatColor(c)}
                        className={`h-5 w-5 rounded-full border transition-all ${
                          newCatColor === c ? "border-secondary scale-110" : "border-transparent"
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setShowAddCat(false)} className="flex-1 text-[10px] font-bold py-1.5 rounded-lg border border-border">Cancel</button>
                    <button type="submit" className="flex-1 text-[10px] font-bold py-1.5 rounded-lg bg-secondary text-primary">Save</button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-5 px-5 pb-1">
            {state.categories.map((c) => {
              const active = category === c.id || category === c.name;
              return (
                <button
                  key={c.id}
                  onClick={() => setCategory(c.id)}
                  className={`shrink-0 rounded-2xl px-4 py-2.5 text-sm font-bold transition-all ${
                    active ? "bg-secondary text-primary shadow-glow-lime" : "bg-white text-secondary border border-border"
                  }`}
                >
                  <span className="mr-1.5">{c.emoji}</span>
                  {c.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Paid by */}
        <div>
          <SectionLabel>Paid by</SectionLabel>
          <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-5 px-5 pb-1">
            {members.map((m) => {
              const active = paidBy === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setPaidBy(m.id)}
                  className={`shrink-0 rounded-2xl p-2 pr-3 flex items-center gap-2 transition-all ${
                    active ? "bg-secondary text-white" : "bg-white text-secondary border border-border"
                  }`}
                >
                  <MemberAvatar member={m} size={28} />
                  <span className="text-sm font-bold pr-1">{m.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Location Association */}
        {state.locations.length > 0 && (
          <div>
            <SectionLabel>Spent At Location (Optional)</SectionLabel>
            <select
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              className="w-full card-soft bg-white border border-border px-4 py-3 text-sm font-bold outline-none text-secondary"
            >
              <option value="">No Location Link</option>
              {state.locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.emoji} {loc.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Custom Tags */}
        <div>
          <SectionLabel>Custom Tags</SectionLabel>
          <div className="flex flex-wrap gap-1.5 items-center card-soft bg-white border border-border p-3">
            {tags.map((t) => (
              <span key={t} className="inline-flex items-center gap-1 bg-secondary/10 text-secondary text-xs font-bold px-2.5 py-1 rounded-full">
                <Tag className="h-3 w-3" />
                {t}
                <button type="button" onClick={() => removeTag(t)} className="text-rose-500 font-bold ml-1">×</button>
              </span>
            ))}
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              placeholder={tags.length === 0 ? "Type tag and press Enter..." : "Add tag..."}
              className="flex-1 bg-transparent border-none outline-none text-xs font-semibold py-0.5 min-w-[120px] text-secondary"
            />
          </div>
        </div>

        {/* Expense Attachments */}
        <div>
          <SectionLabel>Attachments (Receipts / Bills)</SectionLabel>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <label className="cursor-pointer flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-secondary text-primary font-bold text-xs shadow-soft active:scale-[0.98]">
                <Paperclip className="h-4 w-4" />
                Upload Document/Photo
                <input type="file" multiple accept="image/*,application/pdf" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
            {attachments.length > 0 && (
              <div className="grid grid-cols-2 gap-3 mt-2">
                {attachments.map((a) => (
                  <div key={a.id} className="relative rounded-2xl overflow-hidden border border-border bg-muted/40 aspect-square group">
                    <img src={a.url} alt={a.name} className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <button
                        type="button"
                        onClick={() => deleteAttachment(a.id)}
                        className="p-2 rounded-full bg-rose-500 text-white"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Split */}
        <div>
          <SectionLabel>Split</SectionLabel>
          <div className="grid grid-cols-4 gap-2">
            {(["equal", "selected", "custom", "percentage"] as SplitMode[]).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setSplitMode(m);
                  if (m === "equal") setSelected(members.map((x) => x.id));
                }}
                className={`rounded-2xl py-2.5 text-[11px] font-bold uppercase tracking-wider transition-all ${
                  splitMode === m
                    ? "gradient-lime text-secondary"
                    : "bg-white text-muted-foreground border border-border"
                }`}
              >
                {m === "percentage" ? "%" : m}
              </button>
            ))}
          </div>

          <div className="mt-3 card-soft p-3 space-y-1.5">
            {members.map((m) => {
              const isSel = selected.includes(m.id);
              const showInput = splitMode === "custom" || splitMode === "percentage";
              const owedDisplay =
                splitMode === "equal" || splitMode === "selected"
                  ? isSel && amt > 0
                    ? fmtINR(amt / selected.length)
                    : "—"
                  : splitMode === "percentage"
                    ? fmtINR((amt * (customMap[m.id] || 0)) / 100)
                    : fmtINR(customMap[m.id] || 0);
              return (
                <div
                  key={m.id}
                  className={`flex items-center gap-3 p-2 rounded-2xl ${
                    isSel ? "bg-muted/60" : "opacity-40"
                  }`}
                >
                  <button
                    onClick={() => splitMode !== "equal" && toggle(m.id)}
                    disabled={splitMode === "equal"}
                    className={`h-9 w-9 rounded-xl grid place-items-center shrink-0 ${
                      isSel ? "bg-secondary" : "bg-white border border-border"
                    }`}
                  >
                    {isSel ? <Check className="h-4 w-4 text-primary" /> : null}
                  </button>
                  <MemberAvatar member={m} size={32} />
                  <span className="flex-1 text-sm font-bold text-secondary">{m.name}</span>
                  {showInput && isSel ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        inputMode="decimal"
                        value={custom[m.id] ?? ""}
                        onChange={(e) =>
                          setCustom((c) => ({ ...c, [m.id]: e.target.value.replace(/[^\d.]/g, "") }))
                        }
                        placeholder="0"
                        className="w-16 text-right bg-white rounded-lg px-2 py-1.5 text-sm font-bold tabular outline-none border border-border text-secondary"
                      />
                      <span className="text-xs font-bold text-muted-foreground w-3 text-secondary">
                        {splitMode === "percentage" ? "%" : "₹"}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm font-bold text-secondary tabular">{owedDisplay}</span>
                  )}
                </div>
              );
            })}
          </div>

          {(splitMode === "custom" || splitMode === "percentage") && (
            <p
              className={`mt-2 text-xs font-semibold text-center ${
                Math.abs(totalCustom - (splitMode === "percentage" ? 100 : amt)) < 0.5
                  ? "text-emerald-600"
                  : "text-rose-500"
              }`}
            >
              {splitMode === "percentage"
                ? `${totalCustom.toFixed(0)}% of 100%`
                : `${fmtINR(totalCustom)} of ${fmtINR(amt)}`}
            </p>
          )}
        </div>

        {/* Notes */}
        <div>
          <SectionLabel>Notes</SectionLabel>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Optional notes..."
            className="w-full card-soft p-4 text-sm outline-none resize-none"
          />
        </div>
      </div>

      {/* Submit */}
      <div className="fixed bottom-24 inset-x-0 z-50 px-4">
        <div className="mx-auto max-w-md">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={submit}
            className={`w-full rounded-3xl py-4 text-base font-black uppercase tracking-wider transition-all ${
              canSubmit
                ? "bg-secondary text-primary shadow-glow-lime"
                : "bg-muted/70 text-muted-foreground/60 border border-border"
            }`}
          >
            {existingExpense ? "Save Changes" : `Add ${amt > 0 ? fmtINR(amt) : "Expense"}`}
          </motion.button>
        </div>
      </div>
    </AppShell>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] uppercase tracking-[0.18em] font-bold text-muted-foreground mb-2 px-1">
      {children}
    </p>
  );
}
