import { createFileRoute } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Check, MapPin, Trash2, ArrowUp, ArrowDown, Edit3, Save, Plus, ExternalLink, Clock, DollarSign, Camera } from "lucide-react";
import { useState } from "react";
import { AppShell, ScreenHeader } from "../components/AppShell";
import { useStore, fmtINR } from "../lib/store";
import type { TripLocation } from "../lib/types";

export const Route = createFileRoute("/trip")({
  head: () => ({
    meta: [
      { title: "Trip Map & Itinerary" },
      { name: "description", content: "Interactive itinerary, spots, and expense allocation." },
    ],
  }),
  component: TripPage,
});

function TripPage() {
  const { state, setState } = useStore();
  const visited = state.locations.filter((l) => l.visited).length;

  // Edit details of a place
  const [editingPlaceId, setEditingPlaceId] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState("");
  const [editTimeSpent, setEditTimeSpent] = useState("");
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editExpectedTime, setEditExpectedTime] = useState("");
  const [editLocationLink, setEditLocationLink] = useState("");
  const [editPhoto, setEditPhoto] = useState("");

  // Quick Add Place Form Inline
  const [showAddForm, setShowAddForm] = useState(false);
  const [placeName, setPlaceName] = useState("");
  const [placeDesc, setPlaceDesc] = useState("");
  const [placeTime, setPlaceTime] = useState("");
  const [placeLink, setPlaceLink] = useState("");
  const [placePhoto, setPlacePhoto] = useState("");

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (isEdit) {
          setEditPhoto(reader.result as string);
        } else {
          setPlacePhoto(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  function toggleVisited(id: string) {
    setState((s) => ({
      ...s,
      locations: s.locations.map((l) => (l.id === id ? { ...l, visited: !l.visited } : l)),
    }));
  }

  function removePlace(id: string) {
    setState((s) => ({
      ...s,
      locations: s.locations.filter((l) => l.id !== id),
    }));
  }

  function movePlace(index: number, direction: "up" | "down") {
    const newLocations = [...state.locations];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newLocations.length) return;

    // Swap
    const temp = newLocations[index];
    newLocations[index] = newLocations[targetIndex];
    newLocations[targetIndex] = temp;

    setState((s) => ({
      ...s,
      locations: newLocations,
    }));
  }

  function startEditing(loc: TripLocation) {
    setEditingPlaceId(loc.id);
    setEditName(loc.name);
    setEditDesc(loc.description);
    setEditNotes(loc.notes || "");
    setEditTimeSpent(loc.timeSpent || "");
    setEditExpectedTime(loc.expectedTime || "");
    setEditLocationLink(loc.locationLink || "");
    setEditPhoto(loc.coverPhoto || "");
  }

  function saveEdit(id: string) {
    setState((s) => ({
      ...s,
      locations: s.locations.map((l) =>
        l.id === id
          ? {
              ...l,
              name: editName.trim(),
              description: editDesc.trim(),
              notes: editNotes.trim() || undefined,
              timeSpent: editTimeSpent.trim() || undefined,
              expectedTime: editExpectedTime.trim() || undefined,
              locationLink: editLocationLink.trim() || undefined,
              coverPhoto: editPhoto || undefined,
            }
          : l
      ),
    }));
    setEditingPlaceId(null);
  }

  function addNewPlace(e: React.FormEvent) {
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
          emoji: "🏖️",
          expectedTime: placeTime.trim() || undefined,
          locationLink: placeLink.trim() || undefined,
          coverPhoto: placePhoto || undefined,
        },
      ],
    }));

    setPlaceName("");
    setPlaceDesc("");
    setPlaceTime("");
    setPlaceLink("");
    setPlacePhoto("");
    setShowAddForm(false);
  }

  return (
    <AppShell>
      <ScreenHeader
        eyebrow={state.name}
        title="The Itinerary"
        subtitle={`${visited}/${state.locations.length} spots checked off`}
        right={
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="grid place-items-center h-11 w-11 rounded-2xl bg-secondary shadow-glow-lime hover:scale-105 active:scale-95 transition-transform"
          >
            <Plus className="h-5 w-5 text-primary" strokeWidth={2.6} />
          </button>
        }
      />

      {/* Inline Add Place Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.section
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="px-4 mb-5"
          >
            <form onSubmit={addNewPlace} className="card-soft p-5 space-y-4 border border-border text-left">
              <h3 className="font-bold text-secondary text-sm">➕ Add New Place</h3>
              <div>
                <label className="block text-xs uppercase tracking-wider font-bold text-muted-foreground mb-1">Place Name</label>
                <input
                  type="text"
                  required
                  value={placeName}
                  onChange={(e) => setPlaceName(e.target.value)}
                  placeholder="e.g. Black Sand Beach"
                  className="w-full card-soft bg-muted/40 border border-border px-4 py-2.5 text-sm font-semibold outline-none focus:border-secondary"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider font-bold text-muted-foreground mb-1">Description (Optional)</label>
                <input
                  type="text"
                  value={placeDesc}
                  onChange={(e) => setPlaceDesc(e.target.value)}
                  placeholder="e.g. Volcanic sands of Papanasam"
                  className="w-full card-soft bg-muted/40 border border-border px-4 py-2.5 text-sm font-semibold outline-none focus:border-secondary"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs uppercase tracking-wider font-bold text-muted-foreground mb-1">Expected Time</label>
                  <input
                    type="text"
                    value={placeTime}
                    onChange={(e) => setPlaceTime(e.target.value)}
                    placeholder="e.g. Sunset"
                    className="w-full card-soft bg-muted/40 border border-border px-4 py-2.5 text-sm font-semibold outline-none focus:border-secondary"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider font-bold text-muted-foreground mb-1">Maps Link</label>
                  <input
                    type="text"
                    value={placeLink}
                    onChange={(e) => setPlaceLink(e.target.value)}
                    placeholder="Google Maps URL"
                    className="w-full card-soft bg-muted/40 border border-border px-4 py-2.5 text-sm font-semibold outline-none focus:border-secondary"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider font-bold text-muted-foreground mb-1">Cover Photo</label>
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-secondary text-primary font-bold text-xs shadow-soft active:scale-[0.98]">
                    <Camera className="h-4 w-4" />
                    Upload Image
                    <input type="file" accept="image/*" onChange={(e) => handlePhotoUpload(e, false)} className="hidden" />
                  </label>
                  {placePhoto && (
                    <div className="relative h-10 w-10 rounded-lg overflow-hidden border border-border">
                      <img src={placePhoto} alt="Preview" className="h-full w-full object-cover" />
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowAddForm(false)} className="flex-1 rounded-xl py-2.5 text-xs font-bold uppercase tracking-wider border border-border text-secondary">Cancel</button>
                <button type="submit" className="flex-1 rounded-xl py-2.5 text-xs font-bold uppercase tracking-wider bg-secondary text-primary shadow-glow-lime">Add Place</button>
              </div>
            </form>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Places Timeline */}
      <section className="px-4 space-y-4">
        {state.locations.map((loc, i) => {
          // Dynamic calculation of Spent Amount At Location
          const locationExpenses = state.expenses.filter((e) => e.locationId === loc.id);
          const spentAmount = locationExpenses.reduce((sum, e) => sum + e.amount, 0);
          const isEditing = editingPlaceId === loc.id;

          return (
            <motion.div
              key={loc.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="card-soft overflow-hidden border border-border text-left relative"
            >
              {/* Cover Photo */}
              {loc.coverPhoto && (
                <div className="h-36 w-full relative">
                  <img src={loc.coverPhoto} alt={loc.name} className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                </div>
              )}

              {/* Body */}
              <div className="p-5">
                {isEditing ? (
                  // EDIT MODE FORM
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">Place Name</label>
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full card-soft bg-muted/40 border border-border px-3 py-2 text-sm font-semibold outline-none focus:border-secondary"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">Description</label>
                      <input
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        className="w-full card-soft bg-muted/40 border border-border px-3 py-2 text-sm font-semibold outline-none focus:border-secondary"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">Expected Time</label>
                        <input
                          value={editExpectedTime}
                          onChange={(e) => setEditExpectedTime(e.target.value)}
                          className="w-full card-soft bg-muted/40 border border-border px-3 py-2 text-sm font-semibold outline-none focus:border-secondary"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">Time Spent</label>
                        <input
                          value={editTimeSpent}
                          onChange={(e) => setEditTimeSpent(e.target.value)}
                          placeholder="e.g. 2 hours"
                          className="w-full card-soft bg-muted/40 border border-border px-3 py-2 text-sm font-semibold outline-none focus:border-secondary"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">Google Maps Link</label>
                      <input
                        value={editLocationLink}
                        onChange={(e) => setEditLocationLink(e.target.value)}
                        className="w-full card-soft bg-muted/40 border border-border px-3 py-2 text-sm font-semibold outline-none focus:border-secondary"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">Custom Notes</label>
                      <textarea
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        placeholder="Notes (e.g. Reached at 8:15 AM)"
                        rows={2}
                        className="w-full card-soft bg-muted/40 border border-border px-3 py-2 text-sm font-semibold outline-none focus:border-secondary resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">Cover Photo</label>
                      <div className="flex items-center gap-2">
                        <label className="cursor-pointer flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg bg-secondary text-primary font-bold text-[10px] shadow-soft active:scale-[0.98]">
                          <Camera className="h-3 w-3" />
                          Replace Photo
                          <input type="file" accept="image/*" onChange={(e) => handlePhotoUpload(e, true)} className="hidden" />
                        </label>
                        {editPhoto && (
                          <button type="button" onClick={() => setEditPhoto("")} className="text-[10px] font-bold text-rose-500 hover:underline">Remove</button>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button type="button" onClick={() => setEditingPlaceId(null)} className="flex-1 rounded-xl py-2 text-xs font-bold uppercase border border-border text-secondary">Cancel</button>
                      <button type="button" onClick={() => saveEdit(loc.id)} className="flex-1 rounded-xl py-2 text-xs font-bold uppercase bg-secondary text-primary flex items-center justify-center gap-1"><Save className="h-3.5 w-3.5" /> Save</button>
                    </div>
                  </div>
                ) : (
                  // VIEW MODE SMART CARD
                  <div>
                    {/* Header info */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="text-lg font-black text-secondary flex items-center gap-2">
                          <span className="shrink-0">{loc.emoji}</span>
                          <span className="truncate">{loc.name}</span>
                        </h3>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{loc.description}</p>
                      </div>
                      <button
                        onClick={() => toggleVisited(loc.id)}
                        className={`shrink-0 text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-full flex items-center gap-1 active:scale-95 transition-all ${
                          loc.visited ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {loc.visited ? (
                          <>
                            <Check className="h-3 w-3" strokeWidth={3} /> Visited
                          </>
                        ) : (
                          "Pending"
                        )}
                      </button>
                    </div>

                    {/* Metadata indicators */}
                    <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                      {loc.expectedTime && (
                        <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
                          <Clock className="h-3.5 w-3.5 text-sky-500" />
                          <span>Expected: {loc.expectedTime}</span>
                        </div>
                      )}
                      {loc.timeSpent && (
                        <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
                          <Clock className="h-3.5 w-3.5 text-amber-500" />
                          <span>Duration: {loc.timeSpent}</span>
                        </div>
                      )}
                      {spentAmount > 0 && (
                        <div className="flex items-center gap-1.5 text-emerald-600 font-bold col-span-2">
                          <DollarSign className="h-3.5 w-3.5" />
                          <span>Spent At Location: {fmtINR(spentAmount)}</span>
                        </div>
                      )}
                    </div>

                    {/* Notes display */}
                    {loc.notes && (
                      <div className="mt-3 p-3 rounded-2xl bg-muted/50 border border-muted text-xs text-secondary font-medium">
                        <span className="block text-[10px] uppercase font-bold text-muted-foreground mb-0.5">Notes:</span>
                        {loc.notes}
                      </div>
                    )}

                    {/* Footer Actions */}
                    <div className="mt-4 border-t border-border pt-3 flex items-center justify-between text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <button
                          disabled={i === 0}
                          onClick={() => movePlace(i, "up")}
                          className="p-1 rounded hover:bg-muted text-secondary disabled:opacity-30"
                          title="Move Up"
                        >
                          <ArrowUp className="h-4 w-4" />
                        </button>
                        <button
                          disabled={i === state.locations.length - 1}
                          onClick={() => movePlace(i, "down")}
                          className="p-1 rounded hover:bg-muted text-secondary disabled:opacity-30"
                          title="Move Down"
                        >
                          <ArrowDown className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        {loc.locationLink && (
                          <a
                            href={loc.locationLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded hover:bg-muted text-sky-500"
                            title="Open Google Maps"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                        <button
                          onClick={() => startEditing(loc)}
                          className="p-1.5 rounded hover:bg-muted text-secondary"
                          title="Edit Spot"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => removePlace(loc.id)}
                          className="p-1.5 rounded hover:bg-muted text-rose-500"
                          title="Remove Spot"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}

        {state.locations.length === 0 && (
          <div className="card-soft p-8 text-center">
            <p className="text-4xl">🗺️</p>
            <p className="mt-3 font-bold text-secondary">Itinerary is empty</p>
            <p className="mt-1 text-sm text-muted-foreground">Click the + in the header to map your spots.</p>
          </div>
        )}
      </section>
    </AppShell>
  );
}
