import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";
import { globalPlayers, useApp, type Player } from "@/lib/app-store";
import { GoldPill } from "@/components/GoldCounter";
import { useHideChrome } from "@/components/chrome";

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
  const { visibleFriends, user, gold } = useApp();
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
    const base =
      tab === "friends" ? [...visibleFriends, me] : [...globalPlayers, me];
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
              <img src={p.avatar} alt={p.name} className="size-9 rounded-full bg-secondary" />
            ) : (
              <span className="size-9 rounded-full bg-secondary" />
            )}
            <button
              onClick={() => setSelected(p)}
              className="press flex-1 text-right font-bold"
            >
              {p.name}
              {p.id === "me" && <span className="mr-2 text-xs text-primary">(تۆ)</span>}
            </button>
            <span className="text-sm font-bold tabular-nums text-gold transition-all duration-500">
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
  const { requestFriend } = useApp();
  const isMe = player.id === "me";
  const [zoomed, setZoomed] = useState(false);

  useHideChrome();

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-background/60" onClick={onClose}>
      {zoomed && player.avatar && (
        <div
          className="animate-soft-in fixed inset-0 z-[60] flex items-center justify-center bg-black/90"
          onClick={(e) => {
            e.stopPropagation();
            setZoomed(false);
          }}
        >
          <img src={player.avatar} alt={player.name} className="max-h-[80vh] w-[85%] max-w-md object-contain" />
        </div>
      )}
      <div
        onClick={(e) => e.stopPropagation()}
        className="panel animate-sheet-up mx-auto h-1/2 w-full max-w-md overflow-y-auto overscroll-contain rounded-t-3xl p-5 shadow-[var(--shadow-glass)]"
      >
        <div className="flex items-start justify-between">
          <GoldPill amount={player.gold} />
          <div className="mt-2 h-1.5 w-12 rounded-full bg-panel-border" />
          {isMe ? (
            <span className="w-11" />
          ) : (
            <button
              onClick={() => {
                const res = requestFriend(player);
                toast[res === "added" ? "success" : "error"](
                  res === "added" ? "داواکاری نێردرا" : "پێشتر هەیە",
                );
              }}
              aria-label="زیادکردنی هاوڕێ"
              className="press flex size-11 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/30"
            >
              <UserPlus className="size-5" />
            </button>
          )}
        </div>

        <div className="mt-4 flex flex-col items-center">
          {player.avatar ? (
            <button
              type="button"
              onClick={() => setZoomed(true)}
              aria-label="گەورەکردنی وێنە"
              className="press"
            >
              <img
                src={player.avatar}
                alt={player.name}
                className="size-20 rounded-full border-2 border-panel-border bg-panel-foreground/5"
              />
            </button>
          ) : (
            <span className="size-20 rounded-full border-2 border-panel-border bg-panel-foreground/5" />
          )}
          <h3 className="mt-2 text-xl font-extrabold text-panel-foreground">{player.name}</h3>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3">
          <Cell label="یارییەکان" value={player.games} />
          <Cell label="دۆڕان" value={player.games - player.wins} />
          <Cell label="زێڕ" value={player.gold} />
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
