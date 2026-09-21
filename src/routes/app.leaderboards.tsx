import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Crown } from "lucide-react";
import { globalPlayers, useApp, type Player } from "@/lib/app-store";
import { PlayerProfileSheet } from "@/components/PlayerProfileSheet";

export const Route = createFileRoute("/app/leaderboards")({
  head: () => ({
    meta: [
      { title: "ڕیزبەندی — مار و پەیژە" },
      { name: "description", content: "ڕیزبەندی یاریزانان بەپێی خاڵ و زێڕ و هاوڕێکان." },
      { property: "og:title", content: "ڕیزبەندی — مار و پەیژە" },
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

const ROW = 68;

function LeaderboardsTab() {
  const { visibleFriends, user, gold, isProMember, equippedProFrame } = useApp();
  const [tab, setTab] = useState<Tab>("points");
  const [selected, setSelected] = useState<Player | null>(null);
  const [drift, setDrift] = useState<Record<string, { points: number; gold: number }>>({});

  useEffect(() => {
    const id = setInterval(() => {
      setDrift((prev) => {
        const next = { ...prev };
        const pool = [...globalPlayers.map((p) => p.id), "me"];
        for (let i = 0; i < 3; i++) {
          const pick = pool[Math.floor(Math.random() * pool.length)];
          if (!pick) continue;
          const cur = next[pick] ?? { points: 0, gold: 0 };
          next[pick] = {
            points: cur.points + Math.floor(Math.random() * 160),
            gold: cur.gold + Math.floor(Math.random() * 90),
          };
        }
        return next;
      });
    }, 2600);
    return () => clearInterval(id);
  }, []);

  const me: Player = useMemo(
    () => ({
      id: "me",
      name: user?.name ?? "تۆ",
      handle: user?.handle ?? "",
      online: user?.online ?? true,
      avatar: user?.avatar ?? "",
      points: user?.points ?? 0,
      gold,
      games: user?.games ?? 0,
      wins: user?.wins ?? 0,
    }),
    [user, gold],
  );

  const rows = useMemo(() => {
    const live = (p: Player): Player => {
      const d = drift[p.id];
      return d ? { ...p, points: p.points + d.points, gold: p.gold + d.gold } : p;
    };
    const base = tab === "friends" ? [...visibleFriends, me] : [...globalPlayers, me];
    const list = base.map(live);
    return tab === "gold"
      ? list.sort((a, b) => b.gold - a.gold)
      : list.sort((a, b) => b.points - a.points);
  }, [tab, visibleFriends, me, drift]);

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

      <div className="relative" style={{ height: rows.length * ROW }}>
        {rows.map((p, i) => (
          <div
            key={p.id}
            style={{ transform: `translateY(${i * ROW}px)` }}
            className={`glass absolute inset-x-0 top-0 flex h-[60px] items-center gap-3 rounded-2xl p-3 transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              p.id === "me" ? "border-primary/60 shadow-[var(--shadow-glow)]" : ""
            }`}
          >
            <span className="w-6 text-center text-sm font-extrabold text-primary">{i + 1}</span>
            {p.avatar ? (
              <button
                onClick={() => setSelected(p)}
                className="press shrink-0"
                aria-label={`پرۆفایلی ${p.name}`}
              >
                <img
                  src={p.avatar}
                  alt={p.name}
                  className={`size-9 rounded-full bg-secondary ${p.id === "me" && isProMember && equippedProFrame ? "border-2 border-yellow-300 shadow-[0_0_12px_rgba(250,204,21,.8)]" : ""}`}
                />
              </button>
            ) : (
              <span className="size-9 rounded-full bg-secondary" />
            )}
            <button onClick={() => setSelected(p)} className="press flex-1 text-right font-bold">
              <span
                className={
                  p.id === "me" && isProMember
                    ? "bg-gradient-to-r from-yellow-200 to-amber-600 bg-clip-text text-transparent"
                    : ""
                }
              >
                {p.name}
              </span>
              {p.id === "me" && isProMember && (
                <Crown className="mr-1 inline size-3 text-yellow-500" />
              )}
              {p.id === "me" && <span className="mr-2 text-xs text-primary">(تۆ)</span>}
            </button>
            <span className="text-sm font-bold tabular-nums text-gold transition-all duration-500">
              {tab === "gold" ? p.gold : p.points}
            </span>
          </div>
        ))}
      </div>

      {selected && (
        <PlayerProfileSheet
          player={selected}
          followersCount={visibleFriends.length}
          followingCount={visibleFriends.length}
          allowFriendRequest
          onClose={() => setSelected(null)}
        />
      )}
    </section>
  );
}
