import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Crown, Loader2 } from "lucide-react";
import { useApp, type Player } from "@/lib/app-store";
import { PlayerProfileSheet } from "@/components/PlayerProfileSheet";
import { supabase } from "@/lib/supabase";

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
  const { visibleFriends, isProMember, equippedProFrame } = useApp();
  const [tab, setTab] = useState<Tab>("points");
  const [selected, setSelected] = useState<Player | null>(null);
  const [profilePlayers, setProfilePlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const client = supabase;
    if (!client) {
      setLoading(false);
      setLoadError("بەستەری داتابەیس بەردەست نییە");
      return;
    }
    let cancelled = false;
    const loadProfiles = async () => {
      setLoading(true);
      setLoadError(null);
      const { data, error } = await client
        .from("profiles")
        .select("id, username, avatar_url, gold, wins, games_played")
        .order("gold", { ascending: false });
      if (error) {
        console.error("Supabase Profiles Error:", error);
        if (!cancelled) {
          setLoadError("نەتوانرا ڕیزبەندییەکە بار بکرێت");
          setLoading(false);
        }
        return;
      }
      const players = (data ?? []).map((profile): Player => ({
        id: String(profile.id),
        name: String(profile.username ?? "یاریزان"),
        handle: "",
        avatar: String(profile.avatar_url ?? ""),
        online: true,
        points: 0,
        gold: Number(profile.gold ?? 0),
        games_played: Number(profile.games_played ?? 0),
        wins: Number(profile.wins ?? 0),
      }));
      if (!cancelled) {
        setProfilePlayers(players);
        setLoading(false);
      }
    };
    void loadProfiles();
    const channel = client
      .channel("leaderboard-profiles")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => void loadProfiles(),
      )
      .subscribe();
    return () => {
      cancelled = true;
      void client.removeChannel(channel);
    };
  }, []);

  const rows = useMemo(() => {
    return profilePlayers;
  }, [profilePlayers]);

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

      {loading ? (
        <div className="flex min-h-48 items-center justify-center text-primary">
          <Loader2 className="size-7 animate-spin" aria-label="بارکردن" />
        </div>
      ) : loadError ? (
        <p className="pt-10 text-center text-sm text-destructive">{loadError}</p>
      ) : rows.length === 0 ? (
        <p className="pt-10 text-center text-sm text-muted-foreground">هیچ یاریزانێک دیار نییە</p>
      ) : (
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
                {p.gold}
              </span>
            </div>
          ))}
        </div>
      )}

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
