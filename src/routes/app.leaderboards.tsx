import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { globalPlayers, useApp, type Player } from "@/lib/app-store";
import { GoldPill } from "@/components/GoldCounter";

export const Route = createFileRoute("/app/leaderboards")({
  head: () => ({
    meta: [
      { title: "پێشەنگەکان — مار و پەیژە" },
      { name: "description", content: "ڕیزبەندی یاریزانان بەپێی خاڵ و زێڕ و هاوڕێکان." },
      { property: "og:title", content: "پێشەنگەکان — مار و پەیژە" },
      { property: "og:description", content: "ڕیزبەندی گشتی یاریزانان." },
    ],
  }),
  component: LeaderboardsTab,
});

type Tab = "points" | "friends" | "gold";

const tabs: { id: Tab; label: string }[] = [
  { id: "points", label: "بەرزترین خاڵ" },
  { id: "friends", label: "ڕیزبەندی هاوڕێکان" },
  { id: "gold", label: "زۆرترین زێڕ" },
];

function LeaderboardsTab() {
  const { visibleFriends } = useApp();
  const [tab, setTab] = useState<Tab>("points");
  const [selected, setSelected] = useState<Player | null>(null);

  const rows = useMemo(() => {
    if (tab === "gold") return [...globalPlayers].sort((a, b) => b.gold - a.gold);
    if (tab === "friends") return [...visibleFriends].sort((a, b) => b.points - a.points);
    return [...globalPlayers].sort((a, b) => b.points - a.points);
  }, [tab, visibleFriends]);

  return (
    <section className="min-h-screen px-4 pt-[max(4.5rem,calc(env(safe-area-inset-top)+3.5rem))] pb-32">
      <div className="glass mb-5 flex gap-1 rounded-2xl p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition-all duration-300 ${
              tab === t.id
                ? "bg-primary text-primary-foreground shadow-[var(--shadow-glow)]"
                : "text-muted-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {rows.map((p, i) => (
          <div
            key={p.id}
            style={{ animationDelay: `${i * 40}ms` }}
            className="glass animate-rise-in flex items-center gap-3 rounded-2xl p-3"
          >
            <span className="w-6 text-center text-sm font-extrabold text-primary">{i + 1}</span>
            <img src={p.avatar} alt={p.name} className="size-10 rounded-full bg-secondary" />
            <button onClick={() => setSelected(p)} className="press flex-1 text-right font-bold">
              {p.name}
            </button>
            <span className="text-sm font-bold tabular-nums text-gold">
              {tab === "gold" ? p.gold : p.points}
            </span>
          </div>
        ))}
      </div>

      {selected && <PlayerSheet player={selected} onClose={() => setSelected(null)} />}
    </section>
  );
}

function PlayerSheet({ player, onClose }: { player: Player; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-background/60" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="panel animate-sheet-up mx-auto h-1/2 w-full max-w-md rounded-t-3xl p-5 shadow-[var(--shadow-glass)]"
      >
        <div className="flex items-start justify-between">
          <GoldPill amount={player.gold} />
          <div className="h-1.5 w-12 rounded-full bg-panel-border" />
          <span className="w-20" />
        </div>

        <div className="mt-4 flex flex-col items-center">
          <img
            src={player.avatar}
            alt={player.name}
            className="size-20 rounded-full border-2 border-panel-border bg-panel-foreground/5"
          />
          <h3 className="mt-2 text-xl font-extrabold text-panel-foreground">{player.name}</h3>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3">
          <Cell label="یارییەکان" value={player.games} />
          <Cell label="بردنەوە" value={player.wins} />
          <Cell label="دۆڕان" value={player.games - player.wins} />
        </div>
      </div>
    </div>
  );
}

function Cell({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-panel-border bg-panel-foreground/5 p-3 text-center">
      <p className="text-xl font-extrabold tabular-nums text-panel-foreground">{value}</p>
      <p className="mt-1 text-[11px] text-panel-muted">{label}</p>
    </div>
  );
}
