import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, Award, Crown, Flame, Heart } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { AppShell, ScreenHeader } from "@/components/AppShell";
import { MemberAvatar } from "@/components/Avatar";
import { fmtINR, memberById, useStore } from "@/lib/store";
import { computeBalances, minimizeSettlements } from "@/lib/settlement";

export const Route = createFileRoute("/summary")({
  head: () => ({ meta: [{ title: "Summary · ERROR_404" }] }),
  component: SummaryPage,
});

function SummaryPage() {
  const { state, setState } = useStore();
  const { members, expenses } = state;
  const total = expenses.reduce((a, e) => a + e.amount, 0);

  const byCat = expenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + e.amount;
    return acc;
  }, {});
  const pieData = Object.entries(byCat).map(([name, value]) => ({
    name,
    value,
    color: state.categories.find(c => c.id === name || c.name === name)?.color ?? "#94A3B8",
  }));

  const b = computeBalances(members, expenses);
  const settlements = minimizeSettlements(b.net);

  // Fun stats
  const paidSorted = [...members].sort((a, c) => (b.paid[c.id] ?? 0) - (b.paid[a.id] ?? 0));
  const biggestSponsor = paidSorted[0];

  const txCount: Record<string, number> = {};
  for (const e of expenses) txCount[e.paidBy] = (txCount[e.paidBy] ?? 0) + 1;
  const mostActive = members.slice().sort((a, c) => (txCount[c.id] ?? 0) - (txCount[a.id] ?? 0))[0];
  const mostGenerous = members
    .slice()
    .sort((a, c) => (b.net[c.id] ?? 0) - (b.net[a.id] ?? 0))[0];

  function markSettled(idx: number) {
    const s = settlements[idx];
    setState((st) => ({
      ...st,
      settlements: [
        ...st.settlements,
        { id: crypto.randomUUID(), ...s, date: new Date().toISOString() },
      ],
      // create a balancing virtual expense
      expenses: [
        ...st.expenses,
        {
          id: crypto.randomUUID(),
          name: `Settlement: ${memberById(members, s.from)?.name} → ${memberById(members, s.to)?.name}`,
          amount: s.amount,
          paidBy: s.from,
          category: "Misc",
          date: new Date().toISOString(),
          splitMode: "selected",
          splits: [{ memberId: s.to, amount: s.amount }],
        },
      ],
    }));
  }

  return (
    <AppShell>
      <ScreenHeader eyebrow="Analytics" title="The Damage" subtitle={`${fmtINR(total)} across ${expenses.length} expenses`} />

      {/* Pie chart */}
      <section className="px-4">
        <div className="card-soft p-5">
          <p className="text-[11px] uppercase tracking-widest font-bold text-muted-foreground">Where it went</p>
          <div className="mt-2 flex items-center gap-4">
            <div className="h-44 w-44 shrink-0 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                    stroke="none"
                  >
                    {pieData.map((d) => (
                      <Cell key={d.name} fill={d.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: number) => fmtINR(v)}
                    contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 8px 24px rgba(0,0,0,0.12)" }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 grid place-items-center pointer-events-none">
                <div className="text-center">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Total</p>
                  <p className="text-base font-black text-secondary tabular">{fmtINR(total)}</p>
                </div>
              </div>
            </div>
            <div className="flex-1 space-y-1.5">
              {pieData.map((d) => (
                <div key={d.name} className="flex items-center gap-2 text-xs">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
                  <span className="flex-1 font-semibold text-secondary">{d.name}</span>
                  <span className="font-bold tabular text-muted-foreground">{fmtINR(d.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Category bars */}
      <section className="px-4 mt-4">
        <div className="card-soft p-5">
          <p className="text-[11px] uppercase tracking-widest font-bold text-muted-foreground">By Category</p>
          <div className="mt-3 space-y-3">
            {pieData
              .sort((a, c) => c.value - a.value)
              .map((d) => {
                const p = total > 0 ? (d.value / total) * 100 : 0;
                return (
                  <div key={d.name}>
                    <div className="flex items-center justify-between text-xs font-bold mb-1">
                      <span className="text-secondary">
                        {state.categories.find(c => c.id === d.name || c.name === d.name)?.emoji ?? "✨"} {d.name}
                      </span>
                      <span className="tabular text-muted-foreground">{fmtINR(d.value)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${p}%` }}
                        transition={{ duration: 0.7 }}
                        className="h-full rounded-full"
                        style={{ background: d.color }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </section>

      {/* Settlements */}
      <section className="px-4 mt-5">
        <div className="flex items-baseline justify-between mb-3 px-1">
          <h2 className="text-lg font-bold text-secondary">Settle Up</h2>
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
            {settlements.length} {settlements.length === 1 ? "txn" : "txns"}
          </p>
        </div>
        {settlements.length === 0 ? (
          <div className="card-soft p-6 text-center">
            <p className="text-3xl">✨</p>
            <p className="mt-2 font-bold text-secondary">All settled!</p>
            <p className="text-sm text-muted-foreground">No one owes anyone anything.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {settlements.map((s, i) => {
              const from = memberById(members, s.from);
              const to = memberById(members, s.to);
              if (!from || !to) return null;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="card-soft p-4"
                >
                  <div className="flex items-center gap-3">
                    <MemberAvatar member={from} size={42} />
                    <div className="flex-1 flex items-center justify-center gap-1.5">
                      <span className="text-xs font-bold text-muted-foreground">pays</span>
                      <ArrowRight className="h-4 w-4 text-accent" />
                    </div>
                    <MemberAvatar member={to} size={42} />
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-sm font-bold text-secondary">
                      {from.name} → {to.name}
                    </p>
                    <p className="text-lg font-black text-secondary tabular">{fmtINR(s.amount)}</p>
                  </div>
                  <button
                    onClick={() => markSettled(i)}
                    className="mt-3 w-full rounded-2xl py-2.5 text-xs font-bold uppercase tracking-wider bg-secondary text-primary"
                  >
                    Mark Settled
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>

      {/* Fun Stats */}
      <section className="px-4 mt-6">
        <h2 className="text-lg font-bold text-secondary mb-3 px-1">Fun Stats</h2>
        <div className="grid grid-cols-2 gap-3">
          {biggestSponsor && (
            <FunCard
              label="Biggest Sponsor"
              member={biggestSponsor}
              value={fmtINR(b.paid[biggestSponsor.id] ?? 0)}
              icon={<Crown className="h-4 w-4" />}
              tone="lime"
            />
          )}
          {mostActive && (
            <FunCard
              label="Most Active"
              member={mostActive}
              value={`${txCount[mostActive.id] ?? 0} bills`}
              icon={<Flame className="h-4 w-4" />}
              tone="sunset"
            />
          )}
          {mostGenerous && (
            <FunCard
              label="Most Generous"
              member={mostGenerous}
              value={fmtINR(Math.max(0, b.net[mostGenerous.id] ?? 0))}
              icon={<Heart className="h-4 w-4" />}
              tone="ink"
            />
          )}
          <FunCard
            label="Top Contributor"
            member={paidSorted[0]}
            value={`${Math.round(((b.paid[paidSorted[0]?.id] ?? 0) / (total || 1)) * 100)}%`}
            icon={<Award className="h-4 w-4" />}
            tone="ocean"
          />
        </div>
      </section>
    </AppShell>
  );
}

function FunCard({
  label, member, value, icon, tone,
}: {
  label: string;
  member?: { id: string; name: string; emoji: string; color: string };
  value: string;
  icon: React.ReactNode;
  tone: "lime" | "sunset" | "ink" | "ocean";
}) {
  const cls = {
    lime: "gradient-lime text-secondary",
    sunset: "gradient-sunset text-white",
    ink: "gradient-night text-white",
    ocean: "gradient-ocean text-white",
  }[tone];

  if (!member) return null;
  return (
    <div className={`rounded-3xl p-4 ${cls} shadow-card-soft`}>
      <div className="flex items-center justify-between opacity-90">
        <span className="text-[10px] uppercase tracking-widest font-bold">{label}</span>
        {icon}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <MemberAvatar member={member as any} size={32} />
        <p className="font-bold truncate">{member.name}</p>
      </div>
      <p className="mt-2 text-lg font-black tabular">{value}</p>
    </div>
  );
}
