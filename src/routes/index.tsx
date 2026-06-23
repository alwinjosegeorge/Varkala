import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, Plus, Sparkles, TrendingUp, Wallet, Settings, Calendar, Edit3, Image, Palette, Users } from "lucide-react";
import { useState } from "react";
import { AppShell } from "../components/AppShell";
import { MemberAvatar } from "../components/Avatar";
import { fmtINR, useStore } from "../lib/store";
import { computeBalances } from "../lib/settlement";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ERROR_404 — Trip Expense Tracker" },
      { name: "description", content: "Premium expense tracker for friend groups." },
    ],
  }),
  component: Home,
});

function Home() {
  const { state, generalState, setGeneralState, setState, reset } = useStore();
  const { members, expenses, fund, fundSpends, locations } = state;

  const totalExpenses = expenses.reduce((a, e) => a + e.amount, 0);
  const totalFund = fund.reduce((a, f) => a + f.amount, 0);
  const fundSpent = fundSpends.reduce((a, e) => a + e.amount, 0);
  const remainingFund = totalFund - fundSpent;
  const balances = computeBalances(members, expenses);

  const visited = locations.filter((l) => l.visited).length;
  const progress = locations.length > 0 ? Math.round((visited / locations.length) * 100) : 0;

  // Modals visibility
  const [isTripModalOpen, setIsTripModalOpen] = useState(false);
  const [isNewTripModalOpen, setIsNewTripModalOpen] = useState(false);
  const [isEditTripModalOpen, setIsEditTripModalOpen] = useState(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);

  // New Trip form state
  const [newTripName, setNewTripName] = useState("");
  const [newTripDesc, setNewTripDesc] = useState("");
  const [newTripColor, setNewTripColor] = useState("#D6FF3F");
  const [newTripStart, setNewTripStart] = useState("");
  const [newTripEnd, setNewTripEnd] = useState("");
  const [newTripCover, setNewTripCover] = useState("");

  // Edit Trip form state
  const [editTripName, setEditTripName] = useState(state.name);
  const [editTripDesc, setEditTripDesc] = useState(state.description || "");
  const [editTripColor, setEditTripColor] = useState(state.themeColor || "#D6FF3F");
  const [editTripStart, setEditTripStart] = useState(state.startDate || "");
  const [editTripEnd, setEditTripEnd] = useState(state.endDate || "");
  const [editTripCover, setEditTripCover] = useState(state.coverImage || "");

  // Member form state
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberEmoji, setNewMemberEmoji] = useState("⚡");
  const [newMemberColor, setNewMemberColor] = useState("#D6FF3F");
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);

  const handleCreateTrip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTripName.trim()) return;

    const newTripId = crypto.randomUUID();
    const newTrip = {
      id: newTripId,
      name: newTripName.trim(),
      description: newTripDesc.trim() || undefined,
      themeColor: newTripColor,
      startDate: newTripStart || undefined,
      endDate: newTripEnd || undefined,
      coverImage: newTripCover || undefined,
      members: [
        { id: "admin", name: "You", emoji: "🏄", color: "#38BDF8" }
      ],
      expenses: [],
      borrowings: [],
      fund: [],
      fundSpends: [],
      settlements: [],
      locations: [],
      categories: state.categories || [],
    };

    setGeneralState((prev) => ({
      ...prev,
      trips: [...prev.trips, newTrip],
      activeTripId: newTripId,
    }));

    // Reset
    setNewTripName("");
    setNewTripDesc("");
    setNewTripColor("#D6FF3F");
    setNewTripStart("");
    setNewTripEnd("");
    setNewTripCover("");
    setIsNewTripModalOpen(false);
  };

  const handleSaveTripDetails = (e: React.FormEvent) => {
    e.preventDefault();
    setState((s) => ({
      ...s,
      name: editTripName,
      description: editTripDesc,
      themeColor: editTripColor,
      startDate: editTripStart,
      endDate: editTripEnd,
      coverImage: editTripCover,
    }));
    setIsEditTripModalOpen(false);
  };

  const handleAddOrEditMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;

    if (editingMemberId) {
      // Edit
      setState((s) => ({
        ...s,
        members: s.members.map((m) =>
          m.id === editingMemberId
            ? { ...m, name: newMemberName.trim(), emoji: newMemberEmoji, color: newMemberColor }
            : m
        ),
      }));
    } else {
      // Add
      const newId = crypto.randomUUID();
      setState((s) => ({
        ...s,
        members: [
          ...s.members,
          { id: newId, name: newMemberName.trim(), emoji: newMemberEmoji, color: newMemberColor },
        ],
      }));
    }

    setNewMemberName("");
    setNewMemberEmoji("⚡");
    setNewMemberColor("#D6FF3F");
    setEditingMemberId(null);
  };

  const deleteMember = (id: string) => {
    setState((s) => ({
      ...s,
      members: s.members.filter((m) => m.id !== id),
    }));
  };

  // Preset Colors
  const COLORS = ["#D6FF3F", "#38BDF8", "#F59E0B", "#F472B6", "#34D399", "#A78BFA", "#F97316"];

  return (
    <AppShell>
      {/* HEADER WITH TRIP SWITCHER */}
      <div className="px-5 pt-8 pb-3 flex items-center justify-between">
        <div>
          <button
            onClick={() => {
              setEditTripName(state.name);
              setEditTripDesc(state.description || "");
              setEditTripColor(state.themeColor || "#D6FF3F");
              setEditTripStart(state.startDate || "");
              setEditTripEnd(state.endDate || "");
              setEditTripCover(state.coverImage || "");
              setIsTripModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary text-primary font-bold text-xs shadow-soft active:scale-[0.98]"
          >
            <span>✈️ Switch Trip</span>
          </button>
        </div>
        <button
          onClick={() => setIsEditTripModalOpen(true)}
          className="p-2 rounded-full glass text-secondary hover:bg-muted/40"
          title="Trip Settings"
        >
          <Settings className="h-4.5 w-4.5" />
        </button>
      </div>

      {/* HERO */}
      <section className="px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.2, 0.65, 0.3, 1] }}
          className="relative overflow-hidden rounded-[2.25rem] shadow-floating"
        >
          <img
            src={state.coverImage || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1280"}
            alt={state.name}
            width={1280}
            height={1600}
            className="h-[360px] w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/30 to-black/90" />

          {/* top chip */}
          <div className="absolute top-5 left-5 right-5 flex items-center justify-between">
            <div className="glass-dark rounded-full px-3 py-1.5 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ backgroundColor: state.themeColor || "#D6FF3F" }} />
              <span className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/90">
                ACTIVE
              </span>
            </div>
            {state.startDate && (
              <div className="glass-dark rounded-full px-3 py-1.5 text-[10px] font-semibold tracking-wider text-white/85 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {state.startDate} {state.endDate ? `· ${state.endDate}` : ""}
              </div>
            )}
          </div>

          {/* bottom content */}
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <p className="text-xs uppercase tracking-[0.22em] text-white/70 font-bold">
              Trip Itinerary
            </p>
            <h1 className="mt-2 font-display text-[2.2rem] leading-[1.1] font-black">
              {state.name}
            </h1>
            {state.description && (
              <p className="mt-2 text-xs text-white/85 line-clamp-2 font-medium">
                {state.description}
              </p>
            )}

            <div className="mt-5 flex items-center justify-between">
              <div className="flex -space-x-2">
                {members.slice(0, 5).map((m) => (
                  <MemberAvatar key={m.id} member={m} size={34} ring />
                ))}
                {members.length > 5 && (
                  <div className="grid place-items-center h-[34px] w-[34px] rounded-full bg-white text-secondary text-[11px] font-bold ring-2 ring-white">
                    +{members.length - 5}
                  </div>
                )}
              </div>
              <button
                onClick={() => setIsMemberModalOpen(true)}
                className="text-xs text-primary font-bold hover:underline"
              >
                {members.length} members (Manage)
              </button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* PROGRESS */}
      {locations.length > 0 && (
        <section className="px-4 mt-5">
          <div className="card-soft p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">
                  Trip Progress
                </p>
                <p className="mt-1 text-base font-bold text-secondary">
                  {visited} of {locations.length} spots explored
                </p>
              </div>
              <div className="text-2xl font-black text-secondary tabular">{progress}%</div>
            </div>
            <div className="mt-4 h-2 rounded-full bg-muted overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.9, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{ backgroundColor: state.themeColor || "#D6FF3F" }}
              />
            </div>
          </div>
        </section>
      )}

      {/* STAT GRID */}
      <section className="px-4 mt-4 grid grid-cols-2 gap-3">
        <StatCard
          tone="dark"
          label="Total Expenses"
          value={fmtINR(totalExpenses)}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <StatCard
          tone="lime"
          themeColor={state.themeColor || "#D6FF3F"}
          label="Group Fund Left"
          value={fmtINR(remainingFund)}
          icon={<Wallet className="h-4 w-4" />}
        />
      </section>

      {/* Quick Actions */}
      <section className="px-4 mt-5">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-lg font-bold text-secondary">Quick Actions</h2>
          <Sparkles className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <QuickAction to="/expenses/new" label="Add Expense" emoji="🧾" tone="primary" themeColor={state.themeColor || "#D6FF3F"} />
          <QuickAction to="/summary" label="Settle Up" emoji="🤝" tone="ocean" />
          <QuickAction to="/trip" label="Trip Map" emoji="🗺️" tone="ink" />
          <QuickAction to="/members" label="Members" emoji="👥" tone="sand" />
        </div>
      </section>

      {/* Balance Strip */}
      <section className="px-4 mt-6">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-lg font-bold text-secondary">Current Balance</h2>
          <Link to="/summary" className="text-xs font-semibold text-accent inline-flex items-center gap-1">
            View all <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 pb-2">
          {members.map((m) => {
            const net = balances.net[m.id] ?? 0;
            return (
              <Link
                to="/members/$id"
                params={{ id: m.id }}
                key={m.id}
                className="shrink-0 w-[140px] card-soft p-4"
              >
                <MemberAvatar member={m} size={44} />
                <p className="mt-3 text-sm font-semibold text-secondary">{m.name}</p>
                <p
                  className={`mt-1 text-base font-black tabular ${
                    net > 0 ? "text-emerald-600" : net < 0 ? "text-rose-500" : "text-muted-foreground"
                  }`}
                >
                  {net > 0 ? "+" : ""}
                  {fmtINR(net)}
                </p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">
                  {net > 0 ? "Receives" : net < 0 ? "Owes" : "Settled"}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* DIALOG MODAL: SWITCH TRIP */}
      <AnimatePresence>
        {isTripModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsTripModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="relative w-full max-w-md bg-white rounded-t-[2.5rem] p-6 shadow-floating z-10 max-h-[80vh] overflow-y-auto"
            >
              <h2 className="text-xl font-black text-secondary mb-4 flex items-center justify-between">
                <span>Select Trip</span>
                <button
                  onClick={() => {
                    setIsTripModalOpen(false);
                    setIsNewTripModalOpen(true);
                  }}
                  className="text-xs px-3 py-1.5 rounded-full bg-muted font-bold text-secondary flex items-center gap-1 active:scale-95"
                >
                  <Plus className="h-3.5 w-3.5" /> New Trip
                </button>
              </h2>
              <div className="space-y-2">
                {generalState.trips.map((t) => {
                  const isActive = t.id === generalState.activeTripId;
                  return (
                    <button
                      key={t.id}
                      onClick={() => {
                        setGeneralState((prev) => ({ ...prev, activeTripId: t.id }));
                        setIsTripModalOpen(false);
                      }}
                      className={`w-full text-left p-4 rounded-3xl border transition-all ${
                        isActive
                          ? "bg-secondary text-white border-secondary"
                          : "bg-muted/40 border-border text-secondary hover:bg-muted/80"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold">{t.name}</span>
                        {isActive && <span className="text-[10px] uppercase font-mono tracking-widest text-primary font-bold">Active</span>}
                      </div>
                      {t.description && <p className="text-xs opacity-80 mt-1 line-clamp-1">{t.description}</p>}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DIALOG MODAL: CREATE TRIP */}
      <AnimatePresence>
        {isNewTripModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNewTripModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="relative w-full max-w-md bg-white rounded-t-[2.5rem] p-6 shadow-floating z-10 max-h-[85vh] overflow-y-auto"
            >
              <h2 className="text-xl font-black text-secondary mb-4">➕ Add New Trip</h2>
              <form onSubmit={handleCreateTrip} className="space-y-4 text-left">
                <div>
                  <label className="block text-xs uppercase tracking-wider font-bold text-muted-foreground mb-1">Trip Name</label>
                  <input
                    type="text"
                    required
                    value={newTripName}
                    onChange={(e) => setNewTripName(e.target.value)}
                    placeholder="e.g. Goa Trip"
                    className="w-full card-soft bg-muted/40 border border-border px-4 py-3 text-sm font-semibold outline-none focus:border-secondary"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider font-bold text-muted-foreground mb-1">Description (Optional)</label>
                  <textarea
                    value={newTripDesc}
                    onChange={(e) => setNewTripDesc(e.target.value)}
                    placeholder="Beach shacks, sun-kissed sands..."
                    rows={2}
                    className="w-full card-soft bg-muted/40 border border-border px-4 py-3 text-sm font-semibold outline-none focus:border-secondary resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider font-bold text-muted-foreground mb-1">Start Date</label>
                    <input
                      type="date"
                      value={newTripStart}
                      onChange={(e) => setNewTripStart(e.target.value)}
                      className="w-full card-soft bg-muted/40 border border-border px-4 py-3 text-sm font-semibold outline-none text-secondary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider font-bold text-muted-foreground mb-1">End Date</label>
                    <input
                      type="date"
                      value={newTripEnd}
                      onChange={(e) => setNewTripEnd(e.target.value)}
                      className="w-full card-soft bg-muted/40 border border-border px-4 py-3 text-sm font-semibold outline-none text-secondary"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider font-bold text-muted-foreground mb-1">Cover Image URL</label>
                  <input
                    type="text"
                    value={newTripCover}
                    onChange={(e) => setNewTripCover(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full card-soft bg-muted/40 border border-border px-4 py-3 text-sm font-semibold outline-none focus:border-secondary"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider font-bold text-muted-foreground mb-1">Theme Color</label>
                  <div className="flex gap-2">
                    {COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setNewTripColor(c)}
                        className={`h-8 w-8 rounded-full border-2 transition-all ${
                          newTripColor === c ? "border-secondary scale-110" : "border-transparent"
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsNewTripModalOpen(false);
                      setIsTripModalOpen(true);
                    }}
                    className="flex-1 rounded-2xl py-3.5 text-xs font-bold uppercase tracking-wider border border-border text-secondary"
                  >
                    Back
                  </button>
                  <button type="submit" className="flex-1 rounded-2xl py-3.5 text-xs font-bold uppercase tracking-wider bg-secondary text-primary shadow-glow-lime">Create</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DIALOG MODAL: EDIT TRIP DETAILS */}
      <AnimatePresence>
        {isEditTripModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditTripModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="relative w-full max-w-md bg-white rounded-t-[2.5rem] p-6 shadow-floating z-10 max-h-[85vh] overflow-y-auto"
            >
              <h2 className="text-xl font-black text-secondary mb-4">⚙️ Trip Customization</h2>
              <form onSubmit={handleSaveTripDetails} className="space-y-4 text-left">
                <div>
                  <label className="block text-xs uppercase tracking-wider font-bold text-muted-foreground mb-1">Trip Name</label>
                  <input
                    type="text"
                    required
                    value={editTripName}
                    onChange={(e) => setEditTripName(e.target.value)}
                    className="w-full card-soft bg-muted/40 border border-border px-4 py-3 text-sm font-semibold outline-none focus:border-secondary"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider font-bold text-muted-foreground mb-1">Description</label>
                  <textarea
                    value={editTripDesc}
                    onChange={(e) => setEditTripDesc(e.target.value)}
                    rows={2}
                    className="w-full card-soft bg-muted/40 border border-border px-4 py-3 text-sm font-semibold outline-none focus:border-secondary resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider font-bold text-muted-foreground mb-1">Start Date</label>
                    <input
                      type="date"
                      value={editTripStart}
                      onChange={(e) => setEditTripStart(e.target.value)}
                      className="w-full card-soft bg-muted/40 border border-border px-4 py-3 text-sm font-semibold outline-none text-secondary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider font-bold text-muted-foreground mb-1">End Date</label>
                    <input
                      type="date"
                      value={editTripEnd}
                      onChange={(e) => setEditTripEnd(e.target.value)}
                      className="w-full card-soft bg-muted/40 border border-border px-4 py-3 text-sm font-semibold outline-none text-secondary"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider font-bold text-muted-foreground mb-1">Cover Image URL</label>
                  <input
                    type="text"
                    value={editTripCover}
                    onChange={(e) => setEditTripCover(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full card-soft bg-muted/40 border border-border px-4 py-3 text-sm font-semibold outline-none focus:border-secondary"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider font-bold text-muted-foreground mb-1">Theme Color</label>
                  <div className="flex gap-2 flex-wrap">
                    {COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setEditTripColor(c)}
                        className={`h-8 w-8 rounded-full border-2 transition-all ${
                          editTripColor === c ? "border-secondary scale-110" : "border-transparent"
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setIsEditTripModalOpen(false)} className="flex-1 rounded-2xl py-3.5 text-xs font-bold uppercase tracking-wider border border-border text-secondary">Cancel</button>
                  <button type="submit" className="flex-1 rounded-2xl py-3.5 text-xs font-bold uppercase tracking-wider bg-secondary text-primary shadow-glow-lime">Save Changes</button>
                </div>
                <div className="pt-3 border-t border-border">
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm("Warning: This will delete ALL expenses, settlements, borrowings, and fund records. This action cannot be undone. Are you sure?")) {
                        reset();
                        setIsEditTripModalOpen(false);
                      }
                    }}
                    className="w-full rounded-2xl py-3 text-xs font-bold uppercase tracking-wider bg-rose-500 text-white shadow-soft active:scale-[0.98] transition-transform"
                  >
                    🚨 Reset All App Data
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DIALOG MODAL: MANAGE CREW (MEMBERS) */}
      <AnimatePresence>
        {isMemberModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMemberModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="relative w-full max-w-md bg-white rounded-t-[2.5rem] p-6 shadow-floating z-10 max-h-[85vh] overflow-y-auto text-left"
            >
              <h2 className="text-xl font-black text-secondary mb-4 flex items-center justify-between">
                <span>Manage Crew</span>
                <button onClick={() => setIsMemberModalOpen(false)} className="text-xs px-3 py-1 bg-muted rounded-full">Close</button>
              </h2>

              {/* Members List */}
              <div className="space-y-2 mb-6">
                {members.map((m) => (
                  <div key={m.id} className="flex items-center justify-between p-3 rounded-2xl bg-muted/30 border border-border">
                    <div className="flex items-center gap-3">
                      <MemberAvatar member={m} size={36} />
                      <div>
                        <span className="font-bold text-secondary text-sm">{m.name}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditingMemberId(m.id);
                          setNewMemberName(m.name);
                          setNewMemberEmoji(m.emoji);
                          setNewMemberColor(m.color);
                        }}
                        className="text-xs font-bold text-sky-600 px-2 py-1 rounded bg-sky-50"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteMember(m.id)}
                        className="text-xs font-bold text-rose-600 px-2 py-1 rounded bg-rose-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Form Add/Edit */}
              <form onSubmit={handleAddOrEditMember} className="space-y-4 border-t border-border pt-4">
                <h3 className="font-bold text-secondary text-sm">
                  {editingMemberId ? "Edit Member" : "➕ Add New Member"}
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="block text-[10px] uppercase font-bold text-muted-foreground mb-1">Name</label>
                    <input
                      type="text"
                      required
                      value={newMemberName}
                      onChange={(e) => setNewMemberName(e.target.value)}
                      placeholder="e.g. Sachin"
                      className="w-full card-soft bg-muted/40 border border-border px-3 py-2 text-sm font-semibold outline-none focus:border-secondary"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-muted-foreground mb-1">Emoji</label>
                    <input
                      type="text"
                      required
                      maxLength={2}
                      value={newMemberEmoji}
                      onChange={(e) => setNewMemberEmoji(e.target.value)}
                      className="w-full card-soft bg-muted/40 border border-border px-3 py-2 text-sm text-center font-semibold outline-none focus:border-secondary"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-muted-foreground mb-1">Avatar Color</label>
                  <div className="flex gap-2">
                    {COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setNewMemberColor(c)}
                        className={`h-6 w-6 rounded-full border transition-all ${
                          newMemberColor === c ? "border-secondary scale-110" : "border-transparent"
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  {editingMemberId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingMemberId(null);
                        setNewMemberName("");
                        setNewMemberEmoji("⚡");
                        setNewMemberColor("#D6FF3F");
                      }}
                      className="flex-1 rounded-xl py-2.5 text-xs font-bold uppercase tracking-wider border border-border text-secondary"
                    >
                      Cancel
                    </button>
                  )}
                  <button type="submit" className="flex-1 rounded-xl py-2.5 text-xs font-bold uppercase tracking-wider bg-secondary text-primary shadow-glow-lime">
                    {editingMemberId ? "Save Member" : "Add to Crew"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AppShell>
  );
}

function StatCard({
  label, value, icon, tone, themeColor,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  tone: "dark" | "lime";
  themeColor?: string;
}) {
  const cls =
    tone === "dark"
      ? "bg-secondary text-white"
      : "text-secondary";

  const style = tone === "lime" && themeColor ? {
    background: `linear-gradient(135deg, ${themeColor} 0%, ${themeColor}dd 100%)`
  } : undefined;

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      className={`rounded-3xl p-5 ${cls} ${tone === "lime" && !themeColor ? "gradient-lime" : ""} shadow-card-soft relative overflow-hidden`}
      style={style}
    >
      <div className="flex items-center justify-between opacity-80">
        <span className="text-[10px] uppercase tracking-[0.18em] font-bold">{label}</span>
        {icon}
      </div>
      <p className="mt-3 text-2xl font-black tabular">{value}</p>
    </motion.div>
  );
}

function QuickAction({
  to, label, emoji, tone, themeColor,
}: {
  to: string;
  label: string;
  emoji: string;
  tone: "primary" | "ocean" | "ink" | "sand";
  themeColor?: string;
}) {
  const cls: Record<typeof tone, string> = {
    primary: "text-secondary",
    ocean: "gradient-ocean text-white",
    ink: "bg-secondary text-white",
    sand: "bg-white text-secondary border border-border",
  };

  const style = tone === "primary" && themeColor ? {
    background: `linear-gradient(135deg, ${themeColor} 0%, ${themeColor}dd 100%)`
  } : undefined;

  return (
    <Link
      to={to as any}
      className={`rounded-3xl p-4 ${cls[tone]} ${tone === "primary" && !themeColor ? "gradient-lime" : ""} shadow-card-soft flex items-center gap-3 active:scale-[0.98] transition-transform`}
      style={style}
    >
      <span className="text-2xl">{emoji}</span>
      <span className="text-sm font-bold">{label}</span>
    </Link>
  );
}
