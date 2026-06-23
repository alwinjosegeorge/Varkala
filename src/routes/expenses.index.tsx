import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { AppShell, ScreenHeader } from "@/components/AppShell";
import { MemberAvatar } from "@/components/Avatar";
import { fmtINR, memberById, useStore } from "@/lib/store";

export const Route = createFileRoute("/expenses/")({
  head: () => ({
    meta: [
      { title: "Expenses · ERROR_404" },
      { name: "description", content: "Every rupee, every receipt — the Varkala expense timeline." },
    ],
  }),
  component: ExpensesPage,
});

function ExpensesPage() {
  const { state } = useStore();
  const expenses = [...state.expenses].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
  const total = expenses.reduce((a, e) => a + e.amount, 0);

  // group by day
  const grouped = expenses.reduce<Record<string, typeof expenses>>((acc, e) => {
    const k = new Date(e.date).toDateString();
    (acc[k] ??= []).push(e);
    return acc;
  }, {});

  return (
    <AppShell>
      <ScreenHeader
        eyebrow="Timeline"
        title="Every Bill"
        subtitle={`${expenses.length} expenses · ${fmtINR(total)} tracked`}
        right={
          <Link
            to="/expenses/new"
            className="grid place-items-center h-11 w-11 rounded-2xl bg-secondary shadow-glow-lime"
          >
            <Plus className="h-5 w-5 text-primary" strokeWidth={2.6} />
          </Link>
        }
      />

      <div className="px-4 space-y-6">
        {Object.entries(grouped).map(([day, list]) => (
          <section key={day}>
            <div className="flex items-center gap-3 mb-3 px-1">
              <p className="text-[11px] uppercase tracking-[0.18em] font-bold text-muted-foreground">
                {formatDay(day)}
              </p>
              <div className="flex-1 h-px bg-border" />
              <p className="text-[11px] font-bold text-secondary tabular">
                {fmtINR(list.reduce((a, e) => a + e.amount, 0))}
              </p>
            </div>

            <div className="space-y-3">
              {list.map((e, i) => {
                const payer = memberById(state.members, e.paidBy);
                const meta = state.categories.find(c => c.id === e.category || c.name === e.category) || { emoji: "✨", color: "#94A3B8", name: e.category };

                 return (
                  <Link
                    key={e.id}
                    to="/expenses/new"
                    search={{ editId: e.id }}
                    className="card-soft p-4 flex items-center gap-4 active:scale-[0.99] transition-transform text-left"
                  >
                    <div
                      className="h-12 w-12 rounded-2xl grid place-items-center text-xl shrink-0"
                      style={{ background: `${meta.color}22`, color: meta.color }}
                    >
                      {meta.emoji}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-secondary truncate">{e.name}</p>
                      {e.tags && e.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-0.5 mb-1">
                          {e.tags.map(t => (
                            <span key={t} className="text-[9px] font-bold bg-muted px-1.5 py-0.5 rounded text-muted-foreground uppercase tracking-wider">
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                        {payer && <MemberAvatar member={payer} size={16} />}
                        <span className="truncate">
                          {payer?.name} · {meta.name || e.category} ·{" "}
                          {new Date(e.date).toLocaleTimeString("en-IN", {
                            hour: "numeric", minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-base font-black text-secondary tabular">
                        {fmtINR(e.amount)}
                      </p>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center justify-end gap-1">
                        {e.splitMode}
                        {e.attachments && e.attachments.length > 0 && (
                          <span title={`${e.attachments.length} attachments`}>📎</span>
                        )}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}

        {expenses.length === 0 && (
          <div className="card-soft p-8 text-center">
            <p className="text-4xl">🧾</p>
            <p className="mt-3 font-bold text-secondary">No expenses yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Tap + to add your first bill.</p>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function formatDay(d: string) {
  const date = new Date(d);
  const today = new Date();
  const diff = Math.round((today.getTime() - date.getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return date.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}
