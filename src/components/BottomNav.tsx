import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Receipt, Map, Users, PieChart } from "lucide-react";
import { motion } from "framer-motion";

const ITEMS = [
  { to: "/",         label: "Home",     icon: Home },
  { to: "/expenses", label: "Expenses", icon: Receipt },
  { to: "/trip",     label: "Trip",     icon: Map },
  { to: "/members",  label: "Members",  icon: Users },
  { to: "/summary",  label: "Summary",  icon: PieChart },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 pointer-events-none">
      <div className="mx-auto max-w-md px-4 pb-4 pt-2 pointer-events-auto">
        <nav className="glass shadow-floating rounded-3xl px-2 py-2 flex items-center justify-between">
          {ITEMS.map((it) => {
            const active =
              it.to === "/" ? pathname === "/" : pathname.startsWith(it.to);
            const Icon = it.icon;
            return (
              <Link
                key={it.to}
                to={it.to}
                className="relative flex-1 flex flex-col items-center justify-center py-2 rounded-2xl"
              >
                {active && (
                  <motion.div
                    layoutId="navpill"
                    className="absolute inset-1 rounded-2xl bg-secondary"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                <div className="relative flex flex-col items-center gap-0.5">
                  <Icon
                    className={`h-5 w-5 ${active ? "text-primary" : "text-muted-foreground"}`}
                    strokeWidth={active ? 2.4 : 2}
                  />
                  <span
                    className={`text-[10px] font-semibold tracking-wide ${
                      active ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {it.label}
                  </span>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
