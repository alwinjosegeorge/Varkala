import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, DollarSign, Users, RefreshCw, Landmark, Camera } from "lucide-react";
import { useStore, fmtINR } from "../lib/store";
import { useNavigate } from "@tanstack/react-router";

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AddType = "none" | "expense" | "place" | "fund" | "borrow" | "settlement";

export function QuickAddModal({ isOpen, onClose }: QuickAddModalProps) {
  const { state, setState } = useStore();
  const navigate = useNavigate();
  const [activeType, setActiveType] = useState<AddType>("none");

  // Places fields
  const [placeName, setPlaceName] = useState("");
  const [placeDesc, setPlaceDesc] = useState("");
  const [placeTime, setPlaceTime] = useState("");
  const [placeLink, setPlaceLink] = useState("");
  const [placePhoto, setPlacePhoto] = useState("");

  // Fund Contribution fields
  const [fundMember, setFundMember] = useState(state.members[0]?.id || "");
  const [fundAmount, setFundAmount] = useState("");

  // Borrow fields
  const [borrowFrom, setBorrowFrom] = useState(state.members[0]?.id || "");
  const [borrowTo, setBorrowTo] = useState(state.members[1]?.id || "");
  const [borrowAmount, setBorrowAmount] = useState("");
  const [borrowNote, setBorrowNote] = useState("");

  // Settlement fields
  const [settleFrom, setSettleFrom] = useState(state.members[0]?.id || "");
  const [settleTo, setSettleTo] = useState(state.members[1]?.id || "");
  const [settleAmount, setSettleAmount] = useState("");

  // Handle cover photo base64 convert
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPlacePhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddPlace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!placeName.trim()) return;

    setState((s) => ({
      ...s,
      locations: [
        ...s.locations,
        {
          id: crypto.randomUUID(),
          name: placeName.trim(),
          description: placeDesc.trim(),
          visited: false,
          emoji: "📍",
          coverPhoto: placePhoto || undefined,
          expectedTime: placeTime.trim() || undefined,
          locationLink: placeLink.trim() || undefined,
        },
      ],
    }));

    // Reset
    setPlaceName("");
    setPlaceDesc("");
    setPlaceTime("");
    setPlaceLink("");
    setPlacePhoto("");
    setActiveType("none");
    onClose();
    navigate({ to: "/trip" });
  };

  const handleAddFund = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(fundAmount);
    if (!fundMember || isNaN(amt) || amt <= 0) return;

    setState((s) => ({
      ...s,
      fund: [
        ...s.fund,
        {
          id: crypto.randomUUID(),
          memberId: fundMember,
          amount: amt,
          date: new Date().toISOString(),
        },
      ],
    }));

    setFundAmount("");
    setActiveType("none");
    onClose();
    navigate({ to: "/" });
  };

  const handleAddBorrow = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(borrowAmount);
    if (!borrowFrom || !borrowTo || borrowFrom === borrowTo || isNaN(amt) || amt <= 0) return;

    setState((s) => ({
      ...s,
      borrowings: [
        ...s.borrowings,
        {
          id: crypto.randomUUID(),
          from: borrowFrom,
          to: borrowTo,
          amount: amt,
          note: borrowNote.trim() || undefined,
          date: new Date().toISOString(),
          settled: false,
        },
      ],
    }));

    setBorrowAmount("");
    setBorrowNote("");
    setActiveType("none");
    onClose();
    navigate({ to: "/members/$id", params: { id: borrowFrom } });
  };

  const handleAddSettlement = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(settleAmount);
    if (!settleFrom || !settleTo || settleFrom === settleTo || isNaN(amt) || amt <= 0) return;

    setState((st) => ({
      ...st,
      settlements: [
        ...st.settlements,
        {
          id: crypto.randomUUID(),
          from: settleFrom,
          to: settleTo,
          amount: amt,
          date: new Date().toISOString(),
        },
      ],
      expenses: [
        ...st.expenses,
        {
          id: crypto.randomUUID(),
          name: `Settlement: ${state.members.find(m => m.id === settleFrom)?.name} → ${state.members.find(m => m.id === settleTo)?.name}`,
          amount: amt,
          paidBy: settleFrom,
          category: "misc",
          date: new Date().toISOString(),
          splitMode: "selected",
          splits: [{ memberId: settleTo, amount: amt }],
        },
      ],
    }));

    setSettleAmount("");
    setActiveType("none");
    onClose();
    navigate({ to: "/summary" });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Drawer container */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className="relative w-full max-w-md bg-white rounded-t-[2.5rem] p-6 shadow-floating z-10 max-h-[85vh] overflow-y-auto no-scrollbar"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-muted pb-4 mb-4">
              <h2 className="text-xl font-black text-secondary">
                {activeType === "none" && "Quick Add"}
                {activeType === "place" && "➕ Add New Place"}
                {activeType === "fund" && "💰 Add Fund Contribution"}
                {activeType === "borrow" && "🤝 Add Borrowed Money"}
                {activeType === "settlement" && "💸 Add Settlement"}
              </h2>
              <button onClick={onClose} className="p-2 rounded-full bg-muted/60 text-secondary">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Menu options */}
            {activeType === "none" && (
              <div className="grid grid-cols-2 gap-4 py-4">
                <button
                  onClick={() => {
                    onClose();
                    navigate({ to: "/expenses/new" });
                  }}
                  className="flex flex-col items-center justify-center p-4 rounded-3xl bg-muted/50 hover:bg-primary/20 text-secondary transition-all active:scale-[0.97]"
                >
                  <div className="h-12 w-12 rounded-2xl bg-secondary/10 grid place-items-center mb-2">
                    <Landmark className="h-6 w-6 text-secondary" />
                  </div>
                  <span className="text-sm font-bold">Add Expense</span>
                </button>

                <button
                  onClick={() => setActiveType("place")}
                  className="flex flex-col items-center justify-center p-4 rounded-3xl bg-muted/50 hover:bg-primary/20 text-secondary transition-all active:scale-[0.97]"
                >
                  <div className="h-12 w-12 rounded-2xl bg-sky-500/10 grid place-items-center mb-2">
                    <MapPin className="h-6 w-6 text-sky-500" />
                  </div>
                  <span className="text-sm font-bold">Add Place</span>
                </button>

                <button
                  onClick={() => setActiveType("fund")}
                  className="flex flex-col items-center justify-center p-4 rounded-3xl bg-muted/50 hover:bg-primary/20 text-secondary transition-all active:scale-[0.97]"
                >
                  <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 grid place-items-center mb-2">
                    <DollarSign className="h-6 w-6 text-emerald-500" />
                  </div>
                  <span className="text-sm font-bold">Fund Contribution</span>
                </button>

                <button
                  onClick={() => setActiveType("borrow")}
                  className="flex flex-col items-center justify-center p-4 rounded-3xl bg-muted/50 hover:bg-primary/20 text-secondary transition-all active:scale-[0.97]"
                >
                  <div className="h-12 w-12 rounded-2xl bg-amber-500/10 grid place-items-center mb-2">
                    <Users className="h-6 w-6 text-amber-500" />
                  </div>
                  <span className="text-sm font-bold">Borrowed Money</span>
                </button>

                <button
                  onClick={() => setActiveType("settlement")}
                  className="col-span-2 flex items-center gap-4 p-4 rounded-3xl bg-muted/50 hover:bg-primary/20 text-secondary transition-all active:scale-[0.97]"
                >
                  <div className="h-12 w-12 rounded-2xl bg-rose-500/10 grid place-items-center">
                    <RefreshCw className="h-5 w-5 text-rose-500" />
                  </div>
                  <div className="text-left">
                    <span className="block text-sm font-bold">Add Settlement</span>
                    <span className="text-xs text-muted-foreground">Clear debt between members</span>
                  </div>
                </button>
              </div>
            )}

            {/* Form: Add Place */}
            {activeType === "place" && (
              <form onSubmit={handleAddPlace} className="space-y-4 py-2">
                <div>
                  <label className="block text-xs uppercase tracking-wider font-bold text-muted-foreground mb-1">Place Name</label>
                  <input
                    type="text"
                    required
                    value={placeName}
                    onChange={(e) => setPlaceName(e.target.value)}
                    placeholder="e.g. Anjengo Lighthouse"
                    className="w-full card-soft bg-muted/40 border border-border px-4 py-3 text-sm font-semibold outline-none focus:border-secondary"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider font-bold text-muted-foreground mb-1">Description (Optional)</label>
                  <input
                    type="text"
                    value={placeDesc}
                    onChange={(e) => setPlaceDesc(e.target.value)}
                    placeholder="e.g. Historic lighthouse with sunset views"
                    className="w-full card-soft bg-muted/40 border border-border px-4 py-3 text-sm font-semibold outline-none focus:border-secondary"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider font-bold text-muted-foreground mb-1">Expected Time (Optional)</label>
                    <input
                      type="text"
                      value={placeTime}
                      onChange={(e) => setPlaceTime(e.target.value)}
                      placeholder="e.g. 5:30 PM"
                      className="w-full card-soft bg-muted/40 border border-border px-4 py-3 text-sm font-semibold outline-none focus:border-secondary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider font-bold text-muted-foreground mb-1">Location Link (Optional)</label>
                    <input
                      type="text"
                      value={placeLink}
                      onChange={(e) => setPlaceLink(e.target.value)}
                      placeholder="Google Maps URL"
                      className="w-full card-soft bg-muted/40 border border-border px-4 py-3 text-sm font-semibold outline-none focus:border-secondary"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider font-bold text-muted-foreground mb-1">Cover Photo</label>
                  <div className="flex items-center gap-3">
                    <label className="cursor-pointer flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-secondary text-primary font-bold text-xs shadow-soft active:scale-[0.98]">
                      <Camera className="h-4 w-4" />
                      Choose Photo
                      <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                    </label>
                    {placePhoto && (
                      <div className="relative h-12 w-12 rounded-xl overflow-hidden border border-border">
                        <img src={placePhoto} alt="Preview" className="h-full w-full object-cover" />
                        <button type="button" onClick={() => setPlacePhoto("")} className="absolute inset-0 bg-black/40 text-white grid place-items-center text-[10px] font-bold">Remove</button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setActiveType("none")} className="flex-1 rounded-2xl py-3 text-xs font-bold uppercase tracking-wider border border-border text-secondary">Back</button>
                  <button type="submit" className="flex-1 rounded-2xl py-3 text-xs font-bold uppercase tracking-wider bg-secondary text-primary shadow-glow-lime">Save Place</button>
                </div>
              </form>
            )}

            {/* Form: Fund Contribution */}
            {activeType === "fund" && (
              <form onSubmit={handleAddFund} className="space-y-4 py-2">
                <div>
                  <label className="block text-xs uppercase tracking-wider font-bold text-muted-foreground mb-1">Member</label>
                  <select
                    value={fundMember}
                    onChange={(e) => setFundMember(e.target.value)}
                    className="w-full card-soft bg-muted/40 border border-border px-4 py-3 text-sm font-bold outline-none text-secondary"
                  >
                    {state.members.map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider font-bold text-muted-foreground mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    required
                    value={fundAmount}
                    onChange={(e) => setFundAmount(e.target.value)}
                    placeholder="1000"
                    className="w-full card-soft bg-muted/40 border border-border px-4 py-3 text-sm font-semibold outline-none focus:border-secondary"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setActiveType("none")} className="flex-1 rounded-2xl py-3 text-xs font-bold uppercase tracking-wider border border-border text-secondary">Back</button>
                  <button type="submit" className="flex-1 rounded-2xl py-3 text-xs font-bold uppercase tracking-wider bg-secondary text-primary shadow-glow-lime">Add Fund</button>
                </div>
              </form>
            )}

            {/* Form: Borrowed Money */}
            {activeType === "borrow" && (
              <form onSubmit={handleAddBorrow} className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider font-bold text-muted-foreground mb-1">Who Lent (From)</label>
                    <select
                      value={borrowFrom}
                      onChange={(e) => setBorrowFrom(e.target.value)}
                      className="w-full card-soft bg-muted/40 border border-border px-4 py-3 text-sm font-bold outline-none text-secondary"
                    >
                      {state.members.map((m) => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider font-bold text-muted-foreground mb-1">Who Borrowed (To)</label>
                    <select
                      value={borrowTo}
                      onChange={(e) => setBorrowTo(e.target.value)}
                      className="w-full card-soft bg-muted/40 border border-border px-4 py-3 text-sm font-bold outline-none text-secondary"
                    >
                      {state.members.map((m) => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider font-bold text-muted-foreground mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    required
                    value={borrowAmount}
                    onChange={(e) => setBorrowAmount(e.target.value)}
                    placeholder="500"
                    className="w-full card-soft bg-muted/40 border border-border px-4 py-3 text-sm font-semibold outline-none focus:border-secondary"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider font-bold text-muted-foreground mb-1">Note (Optional)</label>
                  <input
                    type="text"
                    value={borrowNote}
                    onChange={(e) => setBorrowNote(e.target.value)}
                    placeholder="e.g. Cash at ATM"
                    className="w-full card-soft bg-muted/40 border border-border px-4 py-3 text-sm font-semibold outline-none focus:border-secondary"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setActiveType("none")} className="flex-1 rounded-2xl py-3 text-xs font-bold uppercase tracking-wider border border-border text-secondary">Back</button>
                  <button type="submit" className="flex-1 rounded-2xl py-3 text-xs font-bold uppercase tracking-wider bg-secondary text-primary shadow-glow-lime">Borrow</button>
                </div>
              </form>
            )}

            {/* Form: Settlement */}
            {activeType === "settlement" && (
              <form onSubmit={handleAddSettlement} className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider font-bold text-muted-foreground mb-1">Payer (From)</label>
                    <select
                      value={settleFrom}
                      onChange={(e) => setSettleFrom(e.target.value)}
                      className="w-full card-soft bg-muted/40 border border-border px-4 py-3 text-sm font-bold outline-none text-secondary"
                    >
                      {state.members.map((m) => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider font-bold text-muted-foreground mb-1">Receiver (To)</label>
                    <select
                      value={settleTo}
                      onChange={(e) => setSettleTo(e.target.value)}
                      className="w-full card-soft bg-muted/40 border border-border px-4 py-3 text-sm font-bold outline-none text-secondary"
                    >
                      {state.members.map((m) => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider font-bold text-muted-foreground mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    required
                    value={settleAmount}
                    onChange={(e) => setSettleAmount(e.target.value)}
                    placeholder="1500"
                    className="w-full card-soft bg-muted/40 border border-border px-4 py-3 text-sm font-semibold outline-none focus:border-secondary"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setActiveType("none")} className="flex-1 rounded-2xl py-3 text-xs font-bold uppercase tracking-wider border border-border text-secondary">Back</button>
                  <button type="submit" className="flex-1 rounded-2xl py-3 text-xs font-bold uppercase tracking-wider bg-secondary text-primary shadow-glow-lime">Record Settle</button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
