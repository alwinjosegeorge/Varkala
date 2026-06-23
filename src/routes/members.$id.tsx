import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { MemberAvatar } from "@/components/Avatar";
import { fmtINR, memberById, useStore } from "@/lib/store";
import { computeBalances } from "@/lib/settlement";

export const Route = createFileRoute("/members/$id")({
  head: () => ({ meta: [{ title: "Member · ERROR_404" }] }),
  component: MemberDetail,
});

function MemberDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { state } = useStore();
  const member = memberById(state.members, id);
  if (!member) {
    return (
      <AppShell>
        <div className="p-10 text-center text-muted-foreground">Member not found</div>
      </AppShell>
    );
  }

  const b = computeBalances(state.members, state.expenses);
  const paid = b.paid[id] ?? 0;
  const owes = b.owes[id] ?? 0;
  const net = b.net[id] ?? 0;
  const total = state.expenses.reduce((a, e) => a + e.amount, 0);
  const pct = total > 0 ? Math.round((paid / total) * 100) : 0;

  const personalBorrows = state.borrowings.filter((br) => br.from === id || br.to === id);
  const history = state.expenses
    .filter((e) => e.paidBy === id || e.splits.some((s) => s.memberId === id))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <AppShell>
      <header className="px-5 pt-8 pb-2 flex items-center justify-between">
        <button
          onClick={() => navigate({ to: "/members" })}
          className="h-11 w-11 grid place-items-center rounded-2xl glass shadow-soft"
        >
          <ArrowLeft className="h-5 w-5 text-secondary" />
        </button>
        <p className="text-[11px] uppercase tracking-[0.22em] font-bold text-muted-foreground">Profile</p>
        <div className="h-11 w-11" />
      </header>

      <section className="px-4">
        <div
          className="rounded-[2rem] p-6 text-white shadow-floating relative overflow-hidden"
          style={{ background: `linear-gradient(140deg, ${member.color}, #0F172A 85%)` }}
        >
          <div className="flex items-center gap-4">
            <MemberAvatar member={member} size={72} ring />
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] font-bold text-white/70">Member</p>
              <h1 className="text-3xl font-black">{member.name}</h1>
              <p className="text-xs text-white/70">{pct}% of total trip contributions</p>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2">
            <Box label="Paid" value={fmtINR(paid)} />
            <Box label="Share" value={fmtINR(owes)} />
            <Box label={net >= 0 ? "Receives" : "Owes"} value={fmtINR(Math.abs(net))} accent />
          </div>
        </div>
      </section>

      <section className="px-4 mt-5">
        <h2 className="text-sm uppercase tracking-widest font-bold text-muted-foreground mb-3 px-1">
          Personal Borrowings
        </h2>
        {personalBorrows.length === 0 ? (
          <div className="card-soft p-5 text-sm text-muted-foreground text-center">No personal IOUs.</div>
        ) : (
          <div className="space-y-2">
            {personalBorrows.map((br) => {
              const lender = memberById(state.members, br.from);
              const borrower = memberById(state.members, br.to);
              const youAre = br.from === id ? "lent" : "borrowed";
              const other = br.from === id ? borrower : lender;
              return (
                <div key={br.id} className="card-soft p-4 flex items-center gap-3">
                  {other && <MemberAvatar member={other} size={36} />}
                  <div className="flex-1">
                    <p className="text-sm font-bold text-secondary">
                      {youAre === "lent" ? "Lent to" : "Borrowed from"} {other?.name}
                    </p>
                    {br.note && <p className="text-xs text-muted-foreground">{br.note}</p>}
                  </div>
                  <p
                    className={`font-black tabular ${
                      youAre === "lent" ? "text-emerald-600" : "text-rose-500"
                    }`}
                  >
                    {youAre === "lent" ? "+" : "-"}
                    {fmtINR(br.amount)}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="px-4 mt-6">
        <h2 className="text-sm uppercase tracking-widest font-bold text-muted-foreground mb-3 px-1">
          Expense History
        </h2>
        <div className="space-y-2">
          {history.map((e) => {
            const meta = state.categories.find(c => c.id === e.category || c.name === e.category) || { emoji: "✨", color: "#94A3B8" };
            const share = e.splits.find((s) => s.memberId === id)?.amount ?? 0;
            const paidThis = e.paidBy === id;
            return (
              <div key={e.id} className="card-soft p-4 flex items-center gap-3">
                <div
                  className="h-10 w-10 rounded-xl grid place-items-center text-lg shrink-0"
                  style={{ background: `${meta.color}22`, color: meta.color }}
                >
                  {meta.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-secondary truncate">{e.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {paidThis ? "You paid" : "Your share"} · {new Date(e.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </p>
                </div>
                <p className="font-black text-secondary tabular text-sm">
                  {fmtINR(paidThis ? e.amount : share)}
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </AppShell>
  );
}

function Box({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl p-3 ${accent ? "bg-primary text-secondary" : "bg-white/10 backdrop-blur text-white"}`}>
      <p className="text-[10px] uppercase tracking-wider font-bold opacity-80">{label}</p>
      <p className="mt-0.5 text-base font-black tabular">{value}</p>
    </div>
  );
}
