import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, ScreenHeader } from "@/components/AppShell";
import { MemberAvatar } from "@/components/Avatar";
import { fmtINR, useStore } from "@/lib/store";
import { computeBalances } from "@/lib/settlement";
import { motion } from "framer-motion";

export const Route = createFileRoute("/members/")({
  head: () => ({ meta: [{ title: "Members · ERROR_404" }] }),
  component: MembersPage,
});

function MembersPage() {
  const { state } = useStore();
  const b = computeBalances(state.members, state.expenses);
  const totalSpend = state.expenses.reduce((a, e) => a + e.amount, 0);

  return (
    <AppShell>
      <ScreenHeader eyebrow="The Crew" title={`${state.members.length} Members`} subtitle="Who paid, who owes, who's the legend" />

      <div className="px-4 space-y-3">
        {state.members.map((m, i) => {
          const paid = b.paid[m.id] ?? 0;
          const owes = b.owes[m.id] ?? 0;
          const net = b.net[m.id] ?? 0;
          const pct = totalSpend > 0 ? Math.round((paid / totalSpend) * 100) : 0;
          return (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Link to="/members/$id" params={{ id: m.id }} className="block card-soft p-5 active:scale-[0.99] transition-transform">
                <div className="flex items-center gap-4">
                  <MemberAvatar member={m} size={56} />
                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-black text-secondary">{m.name}</p>
                    <p className="text-xs text-muted-foreground">{pct}% of total contributions</p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-base font-black tabular ${
                        net > 0 ? "text-emerald-600" : net < 0 ? "text-rose-500" : "text-muted-foreground"
                      }`}
                    >
                      {net > 0 ? "+" : ""}
                      {fmtINR(net)}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {net > 0 ? "Receives" : net < 0 ? "Owes" : "Settled"}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <Stat label="Paid" value={fmtINR(paid)} />
                  <Stat label="Share" value={fmtINR(owes)} />
                  <Stat label="Contrib." value={`${pct}%`} />
                </div>
                <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full gradient-lime" style={{ width: `${pct}%` }} />
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-muted/60 py-2">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">{label}</p>
      <p className="mt-0.5 text-sm font-bold text-secondary tabular">{value}</p>
    </div>
  );
}
