import { useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { Plus, Cloud, CloudOff, RefreshCw, AlertCircle } from "lucide-react";
import { BottomNav } from "./BottomNav";
import { useStore } from "../lib/store";
import { QuickAddModal } from "./QuickAddModal";

export function AppShell({ children }: { children: ReactNode }) {
  const { state, syncStatus, triggerSync } = useStore();
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

  // Parse active trip theme color, default to primary (#D6FF3F)
  const themeColor = state.themeColor || "#D6FF3F";

  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden" style={{ ["--primary" as any]: themeColor }}>
      {/* Ambient color washes */}
      <div className="pointer-events-none fixed -top-40 -right-32 h-96 w-96 rounded-full blur-3xl opacity-30 gradient-sunset" />
      <div className="pointer-events-none fixed top-1/3 -left-32 h-80 w-80 rounded-full blur-3xl opacity-25 gradient-ocean" />

      {/* Sync Status Floating Indicator */}
      <div className="fixed top-4 right-4 z-40 flex items-center gap-1.5 px-3 py-1.5 rounded-full glass text-[10px] font-bold text-secondary shadow-soft">
        <button onClick={() => triggerSync()} className="flex items-center gap-1" title="Click to sync now">
          {syncStatus === "synced" && (
            <>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>Synced</span>
            </>
          )}
          {syncStatus === "syncing" && (
            <>
              <RefreshCw className="h-3 w-3 animate-spin text-accent" />
              <span>Syncing...</span>
            </>
          )}
          {syncStatus === "offline" && (
            <>
              <Cloud className="h-3 w-3 text-muted-foreground" />
              <span>Offline</span>
            </>
          )}
          {syncStatus === "error" && (
            <>
              <AlertCircle className="h-3 w-3 text-rose-500" />
              <span>Sync Error</span>
            </>
          )}
        </button>
      </div>

      <motion.main
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.2, 0.65, 0.3, 1] }}
        className="mx-auto max-w-md pb-32 relative"
      >
        {children}
      </motion.main>

      {/* Floating Add Button (+) visible on every screen */}
      <button
        onClick={() => setIsQuickAddOpen(true)}
        className="fixed bottom-24 right-5 z-40 grid place-items-center h-14 w-14 rounded-full bg-secondary shadow-floating hover:scale-105 active:scale-95 transition-transform"
        aria-label="Quick Add Menu"
        style={{ color: themeColor }}
      >
        <Plus className="h-7 w-7" strokeWidth={2.8} />
      </button>

      <QuickAddModal isOpen={isQuickAddOpen} onClose={() => setIsQuickAddOpen(false)} />
      <BottomNav />
    </div>
  );
}

export function ScreenHeader({
  eyebrow,
  title,
  subtitle,
  right,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <header className="px-6 pt-10 pb-4 flex items-start justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">
            {eyebrow}
          </p>
        )}
        <h1 className="mt-1 text-3xl font-black text-secondary leading-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </header>
  );
}

