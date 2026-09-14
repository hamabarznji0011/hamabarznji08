import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { ArrowRight, Dices, Volume2, Sticker, LayoutGrid, User, Settings, Play } from "lucide-react";
import { boardById, boards as defaultBoards, tokenById, tokens as defaultTokens } from "@/lib/game-data";
import { BoardArt, TokenArt } from "@/components/skins";
import { useApp } from "@/lib/app-store";
import { useHideChrome } from "@/components/chrome";
import { SnakesGame } from "@/components/SnakesGame";
import { AdminPanel } from "@/components/AdminPanel";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// شوێنێک بۆ خەزنکردنی دەنگەکان لە میمۆری تا بێ دواکەوتن لێبدەن
const audioCache: Record<string, any> = {};

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
  const [dbBoards, setDbBoards] = useState<any[]>([]);
  const [dbTokens, setDbTokens] = useState<any[]>([]);

  // هەڵبژاردنە ناوخۆییەکان بۆ سەکۆکان
  const [selectedSoundId, setSelectedSoundId] = useState<string | null>(null);
  
  // گۆڕینی State بۆ Array تاوەکو تا ٥ ستیکەر هەڵبگرێت
  const [selectedStickerIds, setSelectedStickerIds] = useState<string[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: sounds } = await supabase.from("sounds").select("*");
    const { data: stickers } = await supabase.from("stickers").select("*");
    const { data: boards } = await supabase.from("boards").select("*");
    const { data: tokens } = await supabase.from("tokens").select("*");
    
    if (sounds) {
      setDbSounds(sounds);
      // لێرەدا دەنگەکان پێشوەختە دادەبەزێنینە ناو میمۆری (Preload)
      sounds.forEach((s) => {
        if (!audioCache[s.id] && s.audio_url) {
          const audio = new Audio(s.audio_url);
          audio.preload = "auto";
          audioCache[s.id] = audio;
        }
      });
    }
    if (stickers) setDbStickers(stickers);
    if (boards) setDbBoards(boards);
    if (tokens) setDbTokens(tokens);
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

      {overlay === "token" && <TokenPicker customTokens={dbTokens} onClose={() => setOverlay(null)} />}
      {overlay === "board" && <BoardPicker customBoards={dbBoards} onClose={() => setOverlay(null)} />}
      {overlay === "sound" && <SoundList items={dbSounds} selectedId={selectedSoundId} onSelect={setSelectedSoundId} onClose={() => setOverlay(null)} />}
      {overlay === "sticker" && (
        <StickerList 
          items={dbStickers} 
          selectedIds={selectedStickerIds} 
          onToggle={(id) => {
            setSelectedStickerIds(prev => {
              // ئەگەر پێشتر هەڵبژێردرابوو، لایبە (Deselect)
              if (prev.includes(id)) return prev.filter(i => i !== id);
              // ئەگەر گەیشتبووە ٥ دانە، ڕێگە مەدە زیاتر هەڵبژێرێت
              if (prev.length >= 5) return prev;
              // ئەگەرنا، زیادی بکە بۆ لیستەکە
              return [...prev, id];
            });
          }} 
          onClose={() => setOverlay(null)} 
        />
      )}
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

function MediaDisplay({ url, alt }: { url: string; alt: string }) {
  const isVideo = url?.endsWith(".mp4") || url?.endsWith(".webm");
  if (isVideo) {
    return (
      <video
        src={url}
        autoPlay
        loop
        muted
        playsInline
        className="w-full h-full object-cover rounded-xl"
      />
    );
  }
  return <img src={url} alt={alt} className="w-full h-full object-cover rounded-xl" />;
}

function TokenPicker({ customTokens, onClose }: { customTokens: any[]; onClose: () => void }) {
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

        {customTokens.map((ct) => (
          <button
            key={ct.id}
            onClick={() => setTokenId(ct.id)}
            className={`press flex flex-col items-center gap-1 rounded-2xl border-2 bg-input p-3 transition-all ${
              tokenId === ct.id ? "border-primary shadow-[var(--shadow-glow)]" : "border-transparent"
            }`}
          >
            <div className="size-16 overflow-hidden rounded-xl bg-black/10 flex items-center justify-center">
              <MediaDisplay url={ct.image_url} alt={ct.name} />
            </div>
            <span className="text-[11px] font-semibold">{ct.name}</span>
          </button>
        ))}
      </div>
    </OverlayShell>
  );
}

function BoardPicker({ customBoards, onClose }: { customBoards: any[]; onClose: () => void }) {
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

        {customBoards.map((cb) => (
          <button
            key={cb.id}
            onClick={() => setBoardId(cb.id)}
            className={`press flex flex-col items-center gap-2 rounded-2xl border-2 bg-input p-3 transition-all ${
              boardId === cb.id ? "border-primary shadow-[var(--shadow-glow)]" : "border-transparent"
            }`}
          >
            <div className="w-full h-24 overflow-hidden rounded-xl bg-black/10 flex items-center justify-center">
              <MediaDisplay url={cb.image_url} alt={cb.name} />
            </div>
            <span className="text-[11px] font-semibold">{cb.name}</span>
          </button>
        ))}
      </div>
    </OverlayShell>
  );
}

function SoundList({ items, selectedId, onSelect, onClose }: { items: any[]; selectedId: string | null; onSelect: (id: string) => void; onClose: () => void }) {
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);

  const handlePlay = (s: any) => {
    onSelect(s.id);

    // ١. ئەگەر کلیک لە هەمان ئەو دەنگە کرا کە ئێستا لێدەدات، بیوەستێنە
    if (playingId === s.id && currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      setPlayingId(null);
      currentAudioRef.current = null;
      return; 
    }

    // ٢. ئەگەر دەنگێکی تر لێیدەدا، سەرەتا ئەوەی پێشوو بوەستێنە
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
    }

    // ٣. دەنگەکە لە ناو میمۆرییەوە ڕابکێشە (تا بێ دواکەوتن لێبدات)
    let audio = audioCache[s.id];
    if (!audio) {
      audio = new Audio(s.audio_url);
      audio.preload = "auto";
      audioCache[s.id] = audio;
    }

    // ٤. دەنگە نوێیەکە لێبدە
    currentAudioRef.current = audio;
    audio.currentTime = 0; 
    audio.play().catch(() => {});
    setPlayingId(s.id);

    // ٥. کاتێک دەنگەکە تەواو بوو، نیشانەی لێدانەکە لابدە
    audio.onended = () => {
      setPlayingId(null);
      if (currentAudioRef.current === audio) {
        currentAudioRef.current = null;
      }
    };
  };

  return (
    <OverlayShell title="ساوندەکان" onClose={onClose}>
      {items.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center gap-4 text-center">
          <Volume2 className="size-16 text-muted-foreground/50" />
          <p className="text-xl font-bold text-muted-foreground">چاوەڕێی ساوند بە...</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3 pb-6">
          {items.map((s) => {
            const isSelected = selectedId === s.id;
            const isPlaying = playingId === s.id;
            return (
              <div
                key={s.id}
                onClick={() => handlePlay(s)}
                className={`press flex flex-col items-center justify-between gap-2 rounded-2xl border-2 bg-input p-3 cursor-pointer transition-all ${
                  isSelected ? "border-primary shadow-[var(--shadow-glow)] bg-primary/10" : "border-transparent"
                }`}
              >
                <div className="flex size-12 items-center justify-center rounded-full bg-primary/20 text-primary">
                  <Play className={`size-6 fill-current ${isPlaying ? "animate-pulse" : ""}`} />
                </div>
                <span className="text-xs font-bold text-center truncate w-full">{s.name}</span>
              </div>
            );
          })}
        </div>
      )}
    </OverlayShell>
  );
}

function StickerList({ items, selectedIds, onToggle, onClose }: { items: any[]; selectedIds: string[]; onToggle: (id: string) => void; onClose: () => void }) {
  // فلتەرکردنی ستیکەرە هەڵبژێراوەکان بۆ ناو Containerـەکەی سەرەوە
  const selectedStickers = selectedIds.map(id => items.find(i => i.id === id)).filter(Boolean);

  return (
    <OverlayShell title="ستیکەرەکان" onClose={onClose}>
      
      {/* Container بۆ نیشاندانی ستیکەرە هەڵبژێراوەکان */}
      <div className="mb-6 flex min-h-[4.5rem] items-center gap-2 overflow-x-auto no-scrollbar rounded-2xl border-2 border-dashed border-primary/30 bg-black/5 p-2">
        {selectedStickers.length > 0 ? (
          selectedStickers.map(st => (
            <div 
              key={st.id} 
              onClick={() => onToggle(st.id)}
              className="relative size-14 shrink-0 cursor-pointer overflow-hidden rounded-xl border-2 border-green-500 bg-black/10 shadow-[0_0_8px_rgba(34,197,94,0.4)] transition-transform active:scale-95"
            >
              <MediaDisplay url={st.image_url} alt={st.name} />
            </div>
          ))
        ) : (
          <span className="m-auto block w-full text-center text-xs font-medium text-muted-foreground">
            هیچ ستیکەرێک هەڵنەبژێراوە (تا ٥ دانە)
          </span>
        )}
      </div>

      {/* لیستی هەموو ستیکەرەکان */}
      {items.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center gap-4 text-center">
          <Sticker className="size-16 text-muted-foreground/50" />
          <p className="text-xl font-bold text-muted-foreground">چاوەڕێی ستیکەر بە...</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3 pb-6">
          {items.map((st) => {
            const isSelected = selectedIds.includes(st.id);
            return (
              <div
                key={st.id}
                onClick={() => onToggle(st.id)}
                className={`press flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 p-3 transition-all ${
                  isSelected 
                    ? "border-green-500 bg-green-500/10 shadow-[0_0_10px_rgba(34,197,94,0.3)]" 
                    : "border-transparent bg-input"
                }`}
              >
                <div className="flex size-20 items-center justify-center overflow-hidden rounded-xl bg-black/10">
                  <MediaDisplay url={st.image_url} alt={st.name} />
                </div>
                <span className="w-full truncate text-center text-xs font-semibold">{st.name}</span>
              </div>
            );
          })}
        </div>
      )}
    </OverlayShell>
  );
}