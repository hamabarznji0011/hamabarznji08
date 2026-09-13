import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ArrowRight, Dices, Volume2, Sticker, LayoutGrid, User, Settings, Plus } from "lucide-react";
import { boardById, boards as defaultBoards, tokenById, tokens as defaultTokens } from "@/lib/game-data";
import { BoardArt, TokenArt } from "@/components/skins";
import { useApp } from "@/lib/app-store";
import { useHideChrome } from "@/components/chrome";
import { SnakesGame } from "@/components/SnakesGame";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

export const Route = createFileRoute("/app/play")({
  head: () => ({
    meta: [
      { title: "Game - Snakes and Ladders" },
      { name: "description", content: "Snakes and Ladders Game" },
    ],
  }),
  component: PlayTab,
});

function PlayTab() {
  const { tokenId, boardId, user } = useApp();
  const [overlay, setOverlay] = useState<"token" | "board" | "sound" | "sticker" | "admin" | null>(null);
  const [playing, setPlaying] = useState(false);

  const [dbSounds, setDbSounds] = useState<any[]>([]);
  const [dbStickers, setDbStickers] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: sounds } = await supabase.from("sounds").select("*");
    const { data: stickers } = await supabase.from("stickers").select("*");
    if (sounds) setDbSounds(sounds);
    if (stickers) setDbStickers(stickers);
  };

  const board = boardById(boardId);

  return (
    <section className="relative min-h-screen flex flex-col px-4 pt-[max(4.5rem,calc(env(safe-area-inset-top)+3.5rem))] pb-32">
      <button
        onClick={() => setOverlay("admin")}
        className="absolute top-4 right-4 z-10 glass press flex size-10 items-center justify-center rounded-full text-primary"
      >
        <Settings className="size-5" />
      </button>

      <div className="grid grid-cols-4 gap-2">
        <button
          onClick={() => setOverlay("token")}
          className="glass press animate-rise-in flex flex-col items-center justify-center gap-2 rounded-2xl p-3 text-foreground"
        >
          <User className="size-8 text-primary/80" strokeWidth={2} />
          <span className="text-xs font-bold">پوول</span>
        </button>
        
        <button
          onClick={() => setOverlay("board")}
          className="glass press animate-rise-in flex flex-col items-center justify-center gap-2 rounded-2xl p-3 text-foreground"
        >
          <LayoutGrid className="size-8 text-primary/80" strokeWidth={2} />
          <span className="text-xs font-bold">تەختە</span>
        </button>

        <button
          onClick={() => setOverlay("sound")}
          className="glass press animate-rise-in flex flex-col items-center justify-center gap-2 rounded-2xl p-3 text-foreground"
        >
          <Volume2 className="size-8 text-primary/80" strokeWidth={2} />
          <span className="text-xs font-bold">ساوند</span>
        </button>

        <button
          onClick={() => setOverlay("sticker")}
          className="glass press animate-rise-in flex flex-col items-center justify-center gap-2 rounded-2xl p-3 text-foreground"
        >
          <Sticker className="size-8 text-primary/80" strokeWidth={2} />
          <span className="text-xs font-bold">ستیکەر</span>
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center mt-8">
        <div className="glass-strong animate-rise-in w-full rounded-3xl p-6 text-center shadow-lg">
          <h1 className="text-2xl font-extrabold">ئامادەیت بۆ یاری؟</h1>
          <p className="mt-2 text-sm font-medium text-muted-foreground">
            چاوەڕێی سێ یاریزان بە
          </p>
          <button
            onClick={() => setPlaying(true)}
            className="press mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 font-bold text-lg text-primary-foreground shadow-[var(--shadow-glow)]"
          >
            <Dices className="size-6" />
            دەستپێکردنی یاری
          </button>
        </div>
      </div>

      {overlay === "token" && <TokenPicker onClose={() => setOverlay(null)} />}
      {overlay === "board" && <BoardPicker onClose={() => setOverlay(null)} />}
      {overlay === "sound" && <SoundList items={dbSounds} onClose={() => setOverlay(null)} />}
      {overlay === "sticker" && <StickerList items={dbStickers} onClose={() => setOverlay(null)} />}
      {overlay === "admin" && <AdminPanel onClose={() => { setOverlay(null); fetchData(); }} />}
      
      {playing && (
        <SnakesGame
          board={board}
          me={{ name: user?.name ?? "من", avatar: user?.avatar ?? "" }}
          onClose={() => setPlaying(false)}
        />
      )}
    </section>
  );
}

function OverlayShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  useHideChrome();
  return (
    <div className="glass-strong animate-soft-in fixed inset-0 z-50 mx-auto flex max-w-md flex-col px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-8">
      <div className="flex items-center justify-between">
        <button onClick={onClose} className="glass press flex size-11 items-center justify-center rounded-full">
          <ArrowRight className="size-5" />
        </button>
        <h2 className="text-lg font-bold">{title}</h2>
        <span className="size-11" />
      </div>
      <div className="mt-5 flex-1 overflow-y-auto no-scrollbar">{children}</div>
    </div>
  );
}

function TokenPicker({ onClose }: { onClose: () => void }) {
  const { tokenId, setTokenId } = useApp();
  return (
    <OverlayShell title="پوولەکان" onClose={onClose}>
      <div className="grid grid-cols-3 gap-3 pb-6">
        {defaultTokens.map((t) => (
          <button
            key={t.id}
            onClick={() => setTokenId(t.id)}
            className={`press flex flex-col items-center gap-1 rounded-2xl border-2 bg-input p-3 transition-all ${
              tokenId === t.id ? "border-primary shadow-[var(--shadow-glow)]" : "border-transparent"
            }`}
          >
            <TokenArt token={t} className="h-16 w-auto" />
            <span className="text-[11px] font-semibold">{t.name}</span>
          </button>
        ))}
      </div>
    </OverlayShell>
  );
}

function BoardPicker({ onClose }: { onClose: () => void }) {
  const { boardId, setBoardId } = useApp();
  return (
    <OverlayShell title="تەختەکان" onClose={onClose}>
      <div className="grid grid-cols-2 gap-3 pb-6">
        {defaultBoards.map((b) => (
          <button
            key={b.id}
            onClick={() => setBoardId(b.id)}
            className={`press flex flex-col items-center gap-2 rounded-2xl border-2 bg-input p-3 transition-all ${
              boardId === b.id ? "border-primary shadow-[var(--shadow-glow)]" : "border-transparent"
            }`}
          >
            <BoardArt board={b} className="w-full rounded-xl" />
            <span className="text-[11px] font-semibold">{b.name}</span>
          </button>
        ))}
      </div>
    </OverlayShell>
  );
}

function SoundList({ items, onClose }: { items: any[]; onClose: () => void }) {
  return (
    <OverlayShell title="ساوندەکان" onClose={onClose}>
      {items.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center gap-4 text-center">
          <Volume2 className="size-16 text-muted-foreground/50" />
          <p className="text-xl font-bold text-muted-foreground">چاوەڕێی ساوند بە...</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((s) => (
            <div key={s.id} className="glass p-3 rounded-xl flex items-center justify-between">
              <span className="font-semibold">{s.name}</span>
              <audio controls src={s.audio_url} className="h-8 w-40" />
            </div>
          ))}
        </div>
      )}
    </OverlayShell>
  );
}

function StickerList({ items, onClose }: { items: any[]; onClose: () => void }) {
  return (
    <OverlayShell title="ستیکەرەکان" onClose={onClose}>
      {items.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center gap-4 text-center">
          <Sticker className="size-16 text-muted-foreground/50" />
          <p className="text-xl font-bold text-muted-foreground">چاوەڕێی ستیکەر بە...</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {items.map((st) => (
            <div key={st.id} className="glass p-2 rounded-xl flex flex-col items-center gap-1">
              <img src={st.image_url} alt={st.name} className="size-16 object-contain" />
              <span className="text-xs font-semibold">{st.name}</span>
            </div>
          ))}
        </div>
      )}
    </OverlayShell>
  );
}

function AdminPanel({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<"sounds" | "stickers">("sounds");
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    if (!name || !url) return alert("تکایە ناو و لینک بنووسە");
    setLoading(true);

    if (tab === "sounds") {
      await supabase.from("sounds").insert([{ name, audio_url: url }]);
    } else {
      await supabase.from("stickers").insert([{ name, image_url: url }]);
    }

    setLoading(false);
    setName("");
    setUrl("");
    alert("بە سەرکەوتوویی زیادکرا!");
  };

  return (
    <OverlayShell title="بەڕێوەبەری ئادمین" onClose={onClose}>
      <div className="flex flex-col gap-4">
        <div className="flex gap-2 border-b border-border pb-2">
          <button
            onClick={() => setTab("sounds")}
            className={`flex-1 py-2 font-bold rounded-xl ${tab === "sounds" ? "bg-primary text-primary-foreground" : "glass"}`}
          >
            ساوند
          </button>
          <button
            onClick={() => setTab("stickers")}
            className={`flex-1 py-2 font-bold rounded-xl ${tab === "stickers" ? "bg-primary text-primary-foreground" : "glass"}`}
          >
            ستیکەر
          </button>
        </div>

        <div className="flex flex-col gap-3 glass p-4 rounded-2xl">
          <h3 className="font-bold">زیادکردنی {tab === "sounds" ? "ساوندی" : "ستیکەری"} نوێ</h3>
          <input
            type="text"
            placeholder="ناو"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="p-3 rounded-xl bg-input border border-border text-sm"
          />
          <input
            type="text"
            placeholder={tab === "sounds" ? "لینکی فایلی دەنگ (URL)" : "لینکی وێنە (URL)"}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="p-3 rounded-xl bg-input border border-border text-sm"
          />
          <button
            onClick={handleAdd}
            disabled={loading}
            className="press mt-2 flex items-center justify-center gap-2 rounded-xl bg-primary py-3 font-bold text-primary-foreground"
          >
            <Plus className="size-5" />
            {loading ? "چاوەڕێ بە..." : "زیادکردن"}
          </button>
        </div>
      </div>
    </OverlayShell>
  );
}