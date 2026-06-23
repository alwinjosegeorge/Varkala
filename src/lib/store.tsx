import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type {
  Borrowing,
  Expense,
  FundContribution,
  Member,
  SettlementDone,
  TripLocation,
  CategoryItem,
  Trip,
} from "./types";

const STORAGE_KEY = "error404_trip_v2";

const DEFAULT_MEMBERS: Member[] = [
  { id: "alwin",     name: "Alwin",     emoji: "🌊", color: "#38BDF8", avatarUrl: "/alwin.png" },
  { id: "joe",       name: "Joe",       emoji: "🔥", color: "#F97316", avatarUrl: "/Joe.png" },
  { id: "alex",      name: "Alex",      emoji: "⚡", color: "#D6FF3F", avatarUrl: "/alex.png" },
  { id: "joshwin",   name: "Joshwin",   emoji: "🌅", color: "#F472B6", avatarUrl: "/joswin.png" },
  { id: "febin",     name: "Febin",     emoji: "🌴", color: "#34D399", avatarUrl: "/febin.png" },
  { id: "christwin", name: "Christwin", emoji: "🌙", color: "#A78BFA", avatarUrl: "/Chirstwin.png" },
];

const DEFAULT_LOCATIONS: TripLocation[] = [
  { id: "blacksand", name: "Black Sand Beach", description: "Volcanic sands of Papanasam", visited: true, emoji: "🏖️" },
  { id: "mangrove",  name: "Mangrove Forest",  description: "Backwater paddle through green canopies", visited: true, emoji: "🌿" },
  { id: "kayaks",    name: "Zebra Kayaks",     description: "Sunset kayaking across the lagoon",        visited: false, emoji: "🛶" },
  { id: "northcliff",name: "North Cliff",      description: "Cafés on the laterite cliff edge",         visited: true, emoji: "🌅" },
  { id: "southcliff",name: "South Cliff",      description: "Quiet ocean views and steps to the sea",   visited: false, emoji: "🌄" },
  { id: "kappil",    name: "Kappil Beach",     description: "Where backwaters meet the Arabian Sea",    visited: false, emoji: "🌊" },
  { id: "shang",     name: "Shangumugham",     description: "Mermaid sculpture and sunset boulevards",  visited: false, emoji: "🧜" },
];

export const DEFAULT_CATEGORIES: CategoryItem[] = [
  { id: "travel", name: "Travel", emoji: "🛺", color: "#38BDF8" },
  { id: "petrol", name: "Petrol", emoji: "⛽", color: "#F59E0B" },
  { id: "food", name: "Food", emoji: "🍛", color: "#F472B6" },
  { id: "activities", name: "Activities", emoji: "🌊", color: "#D6FF3F" },
  { id: "stay", name: "Stay", emoji: "🏖️", color: "#A78BFA" },
  { id: "misc", name: "Misc", emoji: "✨", color: "#94A3B8" },
];

export interface GeneralStoreState {
  trips: Trip[];
  activeTripId: string;
}

const INITIAL_TRIP_VARKALA: Trip = {
  id: "varkala2026",
  name: "Varkala 2026",
  description: "Lost Friends. Found Bills. A premium expense tracker for the Varkala crew.",
  startDate: "2026-06-17",
  endDate: "2026-06-21",
  themeColor: "#D6FF3F",
  members: DEFAULT_MEMBERS,
  expenses: [],
  borrowings: [],
  fund: [],
  fundSpends: [],
  settlements: [],
  locations: DEFAULT_LOCATIONS,
  categories: DEFAULT_CATEGORIES,
};

const INITIAL_TRIP_GOA: Trip = {
  id: "goa2026",
  name: "Goa Trip",
  description: "Beach shacks, sun-kissed sands, and endless parties.",
  startDate: "2026-11-10",
  endDate: "2026-11-15",
  themeColor: "#38BDF8",
  members: [
    { id: "alwin",     name: "Alwin",     emoji: "🌊", color: "#38BDF8", avatarUrl: "/alwin.png" },
    { id: "joe",       name: "Joe",       emoji: "🔥", color: "#F97316", avatarUrl: "/Joe.png" },
  ],
  expenses: [],
  borrowings: [],
  fund: [],
  fundSpends: [],
  settlements: [],
  locations: [
    { id: "anjuna", name: "Anjuna Beach", description: "Flea markets and trance vibes", visited: false, emoji: "🏖️" },
    { id: "fort", name: "Aguada Fort", description: "17th-century lighthouse with sea views", visited: false, emoji: "🏰" },
  ],
  categories: DEFAULT_CATEGORIES,
};

const DEFAULT_STORE_STATE: GeneralStoreState = {
  trips: [INITIAL_TRIP_VARKALA, INITIAL_TRIP_GOA],
  activeTripId: "varkala2026",
};

export type SyncStatus = "synced" | "offline" | "error" | "syncing";

type Ctx = {
  generalState: GeneralStoreState;
  state: Trip; // Current active trip
  setState: (updater: (s: Trip) => Trip) => void;
  setGeneralState: (updater: (s: GeneralStoreState) => GeneralStoreState) => void;
  syncStatus: SyncStatus;
  triggerSync: () => Promise<void>;
  reset: () => void;
};

const StoreContext = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [generalState, setGeneralStateRaw] = useState<GeneralStoreState>(DEFAULT_STORE_STATE);
  const [hydrated, setHydrated] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("offline");

  // Load from localStorage or initialize
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Handle migration from old v1 state layout
        if (parsed.members && !parsed.trips) {
          const migratedTrip: Trip = {
            id: "varkala2026",
            name: "Varkala 2026",
            themeColor: "#D6FF3F",
            members: parsed.members || DEFAULT_MEMBERS,
            expenses: parsed.expenses || [],
            borrowings: parsed.borrowings || [],
            fund: parsed.fund || [],
            fundSpends: parsed.fundSpends || [],
            settlements: parsed.settlements || [],
            locations: parsed.locations || DEFAULT_LOCATIONS,
            categories: DEFAULT_CATEGORIES,
          };
          setGeneralStateRaw({
            trips: [migratedTrip, INITIAL_TRIP_GOA],
            activeTripId: "varkala2026",
          });
        } else {
          setGeneralStateRaw(parsed);
        }
      }
    } catch {}
    setHydrated(true);
  }, []);

  // Fetch state from Neon Postgres database on startup
  useEffect(() => {
    if (!hydrated) return;
    async function loadFromDb() {
      try {
        setSyncStatus("syncing");
        const res = await fetch("/api/sync");
        const data = await res.json();
        if (data.success && data.state) {
          setGeneralStateRaw(data.state);
          setSyncStatus("synced");
        } else {
          setSyncStatus("offline");
        }
      } catch {
        setSyncStatus("offline");
      }
    }
    loadFromDb();
  }, [hydrated]);

  // Save to localStorage & database sync
  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(generalState));

    let active = true;
    const timeout = setTimeout(async () => {
      try {
        setSyncStatus("syncing");
        const res = await fetch("/api/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(generalState),
        });
        const data = await res.json();
        if (active) {
          if (data.success) setSyncStatus("synced");
          else setSyncStatus("error");
        }
      } catch {
        if (active) setSyncStatus("offline");
      }
    }, 1500); // debounce sync to database

    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [generalState, hydrated]);

  const setGeneralState = (u: (s: GeneralStoreState) => GeneralStoreState) => {
    setGeneralStateRaw((s) => u(s));
  };

  const triggerSync = async () => {
    try {
      setSyncStatus("syncing");
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(generalState),
      });
      const data = await res.json();
      if (data.success) setSyncStatus("synced");
      else setSyncStatus("error");
    } catch {
      setSyncStatus("offline");
    }
  };

  // Find active trip
  const activeTrip = generalState.trips.find((t) => t.id === generalState.activeTripId) || generalState.trips[0] || INITIAL_TRIP_VARKALA;

  // Custom updater for active trip state
  const setState = (updater: (s: Trip) => Trip) => {
    setGeneralStateRaw((prev) => {
      const trips = prev.trips.map((t) => {
        if (t.id === prev.activeTripId) {
          return updater(t);
        }
        return t;
      });
      return { ...prev, trips };
    });
  };

  const reset = () => {
    setGeneralStateRaw(DEFAULT_STORE_STATE);
  };

  return (
    <StoreContext.Provider
      value={{
        generalState,
        state: activeTrip,
        setState,
        setGeneralState,
        syncStatus,
        triggerSync,
        reset,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

export function fmtINR(n: number) {
  const r = Math.round(n);
  return "₹" + r.toLocaleString("en-IN");
}

export function memberById(members: Member[], id: string): Member | undefined {
  return members.find((m) => m.id === id);
}
