import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { ArrowRight, Volume2, Sticker, LayoutGrid, Castle, Settings, Play, Coins, Dices, Plus, Search, Loader2, X } from "lucide-react";
import { boards as defaultBoards, tokens as defaultTokens } from "@/lib/game-data";
import { BoardArt, TokenArt } from "@/components/skins";
import { useApp, userStorageKey } from "@/lib/app-store";
import { useHideChrome } from "@/components/chrome";
import { AdminPanel } from "@/components/AdminPanel";
import { createClient } from "@supabase/supabase-js";
import { SnakesGame } from "@/components/SnakesGame";
import { GoldBar } from "@/components/GoldBar";
import { toast } from "sonner";

const supabaseUrl = import.meta.env["VITE_SUPABASE_URL"] || "";
const supabaseKey = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] || "";
const supabase = createClient(supabaseUrl, supabaseKey);
const API_KEY = 'ywuSvBa2XpYz5dGoe5Owg5zeBAxP93Ya';
const BANNED_TERMS = ['سێکس', 'پۆرن', 'گان', 'قوز', 'کێر', 'سکسی', 'porn', 'sex', 'pussy', 'dick', 'puse', 'deck', 'nude', 'naked', '18+'];

type StickerItem = {
  id: string;
  name: string;
  image_url: string;
  price?: number | string | null;
};

function buildGiphyUrl(query = '', offset = 0) {
  const endpoint = query && query.trim() !== '' ? 'search' : 'trending';
  const queryParam = query && query.trim() !== '' ? `&q=${encodeURIComponent(query)}` : '';
  return `https://api.giphy.com/v1/gifs/${endpoint}?api_key=${API_KEY}${queryParam}&limit=50&offset=${offset}&rating=g`;
}

async function fetchStickers(query = "", offset = 0): Promise<StickerItem[]> {
  const targetUrl = buildGiphyUrl(query, offset);
  console.log("--> GIPHY REQUEST URL:", targetUrl);

  try {
    const response = await fetch(targetUrl);
    console.log("--> GIPHY STATUS:", response.status);
    const data = await response.json() as { data?: Array<{ id: string; title?: string; images?: { fixed_height?: { url?: string } } }> };
    console.log("--> GIPHY DATA:", data);

    if (!response.ok) {
      throw new Error(`GIPHY request failed: ${response.status} ${response.statusText}`);
    }

    if (data.data) {
      const stickers = data.data
        .map((item) => ({
          id: `giphy-${item.id}`,
          name: item.title || "GIPHY sticker",
          image_url: item.images?.fixed_height?.url || "",
        }))
        .filter((item) => item.image_url);
      return stickers;
    }
    return [];
  } catch (error) {
    console.error("--> GIPHY ERROR:", error);
    throw error;
  }
}

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
  const { user, spendGold, unlockedStickerSlots, unlockStickerSlot } = useApp();
  const stickerSlotsStorageKey = user?.id ? userStorageKey(user.id, "stickers") : null;
  const soundStorageKey = user?.id ? userStorageKey(user.id, "active_sound") : null;
  const [overlay, setOverlay] = useState<"token" | "board" | "sound" | "sticker" | "admin" | null>(null);

  const [dbSounds, setDbSounds] = useState<any[]>([]);
  const [dbStickers, setDbStickers] = useState<any[]>([]);
  const [giphyStickers, setGiphyStickers] = useState<StickerItem[]>([]);
  const [dbBoards, setDbBoards] = useState<any[]>([]);
  const [dbTokens, setDbTokens] = useState<any[]>([]);

  // هەڵبژاردنە ناوخۆییەکان بۆ سەکۆکان
  const [selectedSoundUrl, setSelectedSoundUrl] = useState<string | null>(() => {
    if (typeof window === "undefined" || !soundStorageKey) return null;
    return localStorage.getItem(soundStorageKey);
  });
  const [selectedStickerSlots, setSelectedStickerSlots] = useState<Array<string | null>>(() => {
    if (typeof window === "undefined") return [null, null, null, null, null];
    try {
      if (!stickerSlotsStorageKey) return [null, null, null, null, null];
      const saved = localStorage.getItem(stickerSlotsStorageKey);
      const parsed = saved ? JSON.parse(saved) : null;
      const slots = Array.isArray(parsed) && parsed.length === 5
          ? parsed.map((value) => typeof value === "string" ? value : null)
          : [null, null, null, null, null];
      return slots;
    } catch {
      return [null, null, null, null, null];
    }
  });

  // ستەیتی کڕینەکان
  const [purchasedIds, setPurchasedIds] = useState<string[]>([]);
  const [purchaseModalItem, setPurchaseModalItem] = useState<any | null>(null);
  const hydratedStickerKey = useRef<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!soundStorageKey) {
      setSelectedSoundUrl(null);
      return;
    }
    setSelectedSoundUrl(localStorage.getItem(soundStorageKey));
  }, [soundStorageKey]);

  useEffect(() => {
    if (!stickerSlotsStorageKey) {
      setSelectedStickerSlots([null, null, null, null, null]);
      hydratedStickerKey.current = null;
      return;
    }
    try {
      const saved = localStorage.getItem(stickerSlotsStorageKey);
      const parsed = saved ? JSON.parse(saved) : null;
      const slots = Array.isArray(parsed) && parsed.length === 5
        ? parsed.map((value) => typeof value === "string" ? value : null)
        : [null, null, null, null, null];
      setSelectedStickerSlots(slots);
      hydratedStickerKey.current = stickerSlotsStorageKey;
    } catch {
      setSelectedStickerSlots([null, null, null, null, null]);
      hydratedStickerKey.current = stickerSlotsStorageKey;
    }
  }, [stickerSlotsStorageKey]);

  useEffect(() => {
    if (!stickerSlotsStorageKey) return;
    if (hydratedStickerKey.current !== stickerSlotsStorageKey) return;
    localStorage.setItem(stickerSlotsStorageKey, JSON.stringify(selectedStickerSlots));
    window.dispatchEvent(new CustomEvent("user-stickers-updated", {
      detail: { userId: user?.id, slots: selectedStickerSlots },
    }));
    selectedStickerSlots.forEach((url) => {
      if (url) {
        const image = new Image();
        image.src = url;
      }
    });
  }, [selectedStickerSlots, stickerSlotsStorageKey, user?.id]);

  const fetchData = async () => {
    const { data: sounds } = await supabase.from("sounds").select("*");
    const { data: stickers } = await supabase.from("stickers").select("*");
    const { data: boards } = await supabase.from("boards").select("*");
    const { data: tokens } = await supabase.from("tokens").select("*");
    
    if (sounds) {
      setDbSounds(sounds);
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

  const handleConfirmPurchase = () => {
    if (purchaseModalItem) {
      const price = Number(purchaseModalItem.price) || 0;
      if (!spendGold(price)) {
        toast.error("زێرەکەت بەش ناکات", { duration: 1000 });
        return;
      }
      
      // زیادکردنی ئایتمەکە بۆ لیستی کڕدراوەکان
      setPurchasedIds((prev) => prev.includes(purchaseModalItem.id) ? prev : [...prev, purchaseModalItem.id]);
      setPurchaseModalItem(null);
    }
  };

  // پاڵاوتنی ئەو ستیکەرانەی کە بەکارهێنەر لە دەرەوە هەڵیبژاردوون تا بدرێنە یارییەکە
  const stickerCatalog = [...dbStickers, ...giphyStickers];
  const activeStickers = selectedStickerSlots
    .filter((imageUrl): imageUrl is string => Boolean(imageUrl))
    .map((imageUrl) => stickerCatalog.find((st) => st.image_url === imageUrl) ?? {
      id: `persisted-sticker-${imageUrl}`,
      name: "Saved sticker",
      image_url: imageUrl,
    });

  const assignSticker = (slotIndex: number, imageUrl: string) => {
    setSelectedStickerSlots((prev) => {
      const next = prev.map((value, index) => (index === slotIndex || value === imageUrl ? null : value));
      next[slotIndex] = imageUrl;
      return next;
    });
  };

  const removeSticker = (slotIndex: number) => {
    setSelectedStickerSlots((prev) => {
      const next = [...prev];
      next[slotIndex] = null;
      return next;
    });
  };

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
          <Castle className="size-8 text-primary/80" strokeWidth={2} />
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

      {/* ناردنی تەختە، پوول و ستیکەرە هەڵبژێردراوەکان بۆ یاری */}
      <PlayGameStarter stickers={activeStickers} customBoards={dbBoards} customTokens={dbTokens} />

      {overlay === "token" && <TokenPicker customTokens={dbTokens} purchasedIds={purchasedIds} onBuyRequest={setPurchaseModalItem} onClose={() => setOverlay(null)} />}
      {overlay === "board" && <BoardPicker customBoards={dbBoards} purchasedIds={purchasedIds} onBuyRequest={setPurchaseModalItem} onClose={() => setOverlay(null)} />}
      {overlay === "sound" && (
        <SoundList
          items={dbSounds}
          selectedUrl={selectedSoundUrl}
          onSelect={(url) => {
            setSelectedSoundUrl(url);
            if (!soundStorageKey) return;
            if (url) localStorage.setItem(soundStorageKey, url);
            else localStorage.removeItem(soundStorageKey);
          }}
          onReplaceSlot={() => spendGold(15)}
          onClose={() => setOverlay(null)}
        />
      )}
      {overlay === "sticker" && (
          <StickerList
          items={dbStickers} 
          onGiphyItems={setGiphyStickers}
          selectedSlots={selectedStickerSlots}
          unlockedSlots={[0, ...(unlockedStickerSlots ?? []).filter((slotIndex) => slotIndex !== 0)]}
          onUnlockSlot={(slotIndex) => {
            const didUnlock = unlockStickerSlot(slotIndex);
            if (!didUnlock) {
              toast.error("Not enough Gold", { duration: 1200 });
            }
            return didUnlock;
          }}
          onAssign={assignSticker}
          onRemove={removeSticker}
          purchasedIds={purchasedIds}
          onBuyRequest={setPurchaseModalItem}
          onClose={() => setOverlay(null)} 
        />
      )}
      {overlay === "admin" && <AdminPanel onClose={() => { setOverlay(null); fetchData(); }} />}
      
      {/* پەنجەرەی کڕین (Modal) */}
      {purchaseModalItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 animate-in fade-in duration-200">
          <div className="bg-[#2e7d32] rounded-3xl p-6 w-full max-w-[18rem] flex flex-col items-center shadow-2xl scale-100 animate-in zoom-in-95 duration-200 border-2 border-green-400/30">
            <div className="size-16 mb-4 bg-white/20 rounded-full flex items-center justify-center shadow-inner">
               <Coins className="size-8 text-yellow-300" />
            </div>
            <h3 className="text-white text-lg font-bold mb-6 text-center">دڵنیای دەتەوێت بیکڕیت؟</h3>
            <div className="flex gap-3 w-full">
               <button 
                 onClick={() => setPurchaseModalItem(null)} 
                 className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-2xl font-bold transition-colors shadow-sm"
               >
                 نەخێر
               </button>
               <button 
                 onClick={handleConfirmPurchase} 
                 className="flex-1 bg-green-400 hover:bg-green-300 text-green-950 py-2.5 rounded-2xl font-bold transition-colors shadow-sm"
               >
                 بەڵێ
               </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function PlayGameStarter({
  stickers,
  customBoards,
  customTokens,
}: {
  stickers: any[];
  customBoards: any[];
  customTokens: any[];
}) {
  const { boardId, tokenId, user } = useApp();
  const [playing, setPlaying] = useState(false);

  const allBoards = [...defaultBoards, ...customBoards];
  const allTokens = [...defaultTokens, ...customTokens];
  const selectedBoard = allBoards.find((board) => board.id === boardId) ?? defaultBoards[0];
  const selectedToken = allTokens.find((token) => token.id === tokenId);

  return (
    <>
      <div className="flex-1 flex flex-col items-center justify-center mt-8">
        <div className="glass-strong animate-rise-in w-full rounded-3xl p-6 text-center shadow-lg">
          <h1 className="text-2xl font-extrabold">ئامادەیت بۆ یاری؟</h1>
          <p className="mt-2 text-sm font-medium text-muted-foreground">
            چاوەڕێی سێ یاریزان بە
          </p>
          <button
            onClick={() => {
              setPlaying(true);
              window.dispatchEvent(new Event("hide-gold-counter"));
            }}
            className="press mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 font-bold text-lg text-primary-foreground shadow-[var(--shadow-glow)]"
          >
            <Dices className="size-6" />
            دەستپێکردنی یاری
          </button>
        </div>
      </div>

      {playing && (
        <SnakesGame
          board={selectedBoard}
          me={{
            name: user?.name ?? "من",
            avatar: user?.avatar ?? "",
            token_url: selectedToken?.image_url ?? (user as any)?.token_url,
          }}
          stickers={stickers}
          onClose={() => {
            setPlaying(false);
            window.dispatchEvent(new Event("show-gold-counter"));
          }}
        />
      )}
    </>
  );
}

function OverlayShell({ title, onClose, onScroll, children }: { title: string; onClose: () => void; onScroll?: (event: React.UIEvent<HTMLDivElement>) => void; children: React.ReactNode }) {
  useHideChrome();
  return (
    <div className="glass-strong animate-soft-in fixed inset-0 z-50 mx-auto flex max-w-md flex-col px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-8">
      <div className="relative flex items-center justify-center w-full min-h-[44px]">
        <h2 className="text-lg font-bold text-center">{title}</h2>
        <button onClick={onClose} className="absolute right-0 glass press flex size-11 items-center justify-center rounded-full">
          <ArrowRight className="size-5" />
        </button>
      </div>
      <div className="mt-5 flex-1 overflow-y-auto no-scrollbar" onScroll={onScroll}>{children}</div>
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

function TokenPicker({ customTokens, purchasedIds, onBuyRequest, onClose }: { customTokens: any[]; purchasedIds: string[]; onBuyRequest: (item: any) => void; onClose: () => void }) {
  const { tokenId, setTokenId } = useApp();
  const allTokens = [...defaultTokens, ...customTokens];
  
  const sortedTokens = [...allTokens].sort((a, b) => {
    const aOwned = defaultTokens.some(d => d.id === a.id) || purchasedIds.includes(a.id) || !a.price;
    const bOwned = defaultTokens.some(d => d.id === b.id) || purchasedIds.includes(b.id) || !b.price;
    if (aOwned && !bOwned) return -1;
    if (!aOwned && bOwned) return 1;
    return 0;
  });

  const selectedToken = allTokens.find((t) => t.id === tokenId);

  const toggleToken = (id: string) => {
    setTokenId(tokenId === id ? "" : id);
  };

  return (
    <OverlayShell title="پوولەکان" onClose={onClose}>
      <div className="mb-6 flex min-h-[4.5rem] items-center gap-2 overflow-x-auto no-scrollbar rounded-2xl border-2 border-dashed border-primary/30 bg-black/5 p-2">
        {selectedToken ? (
          <div 
            onClick={() => toggleToken(selectedToken.id)}
            className="relative flex h-14 w-full cursor-pointer items-center gap-4 overflow-hidden rounded-xl border-2 border-green-500 bg-black/10 px-4 shadow-[0_0_8px_rgba(34,197,94,0.4)] transition-transform active:scale-95"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center">
              {defaultTokens.some((t) => t.id === selectedToken.id) ? (
                <TokenArt token={selectedToken} className="h-10 w-auto" />
              ) : (
                <div className="size-10 overflow-hidden rounded-md bg-black/20 flex items-center justify-center">
                  <MediaDisplay url={selectedToken.image_url} alt={selectedToken.name} />
                </div>
              )}
            </div>
            <span className="truncate text-sm font-bold">{selectedToken.name}</span>
          </div>
        ) : (
          <span className="m-auto block w-full text-center text-xs font-medium text-muted-foreground">
            هیچ پوولێک هەڵنەبژێراوە
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 pb-6">
        {sortedTokens.map((t) => {
          const isSelected = tokenId === t.id;
          const isOwned = defaultTokens.some(d => d.id === t.id) || purchasedIds.includes(t.id) || !t.price;
          const isDefault = defaultTokens.some(d => d.id === t.id);

          return (
            <div key={t.id} className="flex flex-col items-center gap-2">
              <button
                onClick={() => toggleToken(t.id)}
                className={`press flex w-full flex-col items-center gap-1 rounded-2xl border-2 p-3 transition-all ${
                  isSelected 
                    ? "border-green-500 bg-green-500/10 shadow-[0_0_10px_rgba(34,197,94,0.3)]" 
                    : "border-transparent bg-input"
                }`}
              >
                {isDefault ? (
                  <TokenArt token={t} className="h-16 w-auto" />
                ) : (
                  <div className="size-16 overflow-hidden rounded-xl bg-black/10 flex items-center justify-center">
                    <MediaDisplay url={t.image_url} alt={t.name} />
                  </div>
                )}
                <span className="text-[11px] font-semibold w-full truncate text-center">{t.name}</span>
              </button>
              
              {!isOwned && (
                <button 
                  onClick={(e) => { e.stopPropagation(); onBuyRequest(t); }} 
                  className="flex w-[80%] max-w-[5rem] items-center justify-center gap-1.5 rounded-lg bg-yellow-400 py-1.5 text-[11px] font-extrabold text-yellow-950 shadow-sm transition-transform active:scale-95"
                >
                  <span>{t.price}</span>
                  <Coins className="size-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </OverlayShell>
  );
}

function BoardPicker({ customBoards, purchasedIds, onBuyRequest, onClose }: { customBoards: any[]; purchasedIds: string[]; onBuyRequest: (item: any) => void; onClose: () => void }) {
  const { boardId, setBoardId } = useApp();
  const allBoards = [...defaultBoards, ...customBoards];

  const sortedBoards = [...allBoards].sort((a, b) => {
    const aOwned = defaultBoards.some(d => d.id === a.id) || purchasedIds.includes(a.id) || !a.price;
    const bOwned = defaultBoards.some(d => d.id === b.id) || purchasedIds.includes(b.id) || !b.price;
    if (aOwned && !bOwned) return -1;
    if (!aOwned && bOwned) return 1;
    return 0;
  });

  const selectedBoard = allBoards.find((b) => b.id === boardId);

  const toggleBoard = (id: string) => {
    setBoardId(boardId === id ? "" : id);
  };

  return (
    <OverlayShell title="تەختەکان" onClose={onClose}>
      <div className="mb-6 flex min-h-[4.5rem] items-center gap-2 overflow-x-auto no-scrollbar rounded-2xl border-2 border-dashed border-primary/30 bg-black/5 p-2">
        {selectedBoard ? (
          <div 
            onClick={() => toggleBoard(selectedBoard.id)}
            className="relative flex h-14 w-full cursor-pointer items-center gap-4 overflow-hidden rounded-xl border-2 border-green-500 bg-black/10 px-4 shadow-[0_0_8px_rgba(34,197,94,0.4)] transition-transform active:scale-95"
          >
            <div className="h-10 w-14 shrink-0 rounded-md overflow-hidden bg-black/20 flex items-center justify-center">
              {defaultBoards.some((b) => b.id === selectedBoard.id) ? (
                <BoardArt board={selectedBoard} className="h-full w-full object-cover" />
              ) : (
                <MediaDisplay url={selectedBoard.image_url} alt={selectedBoard.name} />
              )}
            </div>
            <span className="truncate text-sm font-bold">{selectedBoard.name}</span>
          </div>
        ) : (
          <span className="m-auto block w-full text-center text-xs font-medium text-muted-foreground">
            هیچ تەختەیەک هەڵنەبژێراوە
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 pb-6">
        {sortedBoards.map((b) => {
          const isSelected = boardId === b.id;
          const isOwned = defaultBoards.some(d => d.id === b.id) || purchasedIds.includes(b.id) || !b.price;
          const isDefault = defaultBoards.some(d => d.id === b.id);

          return (
            <div key={b.id} className="flex flex-col items-center gap-2">
              <button
                onClick={() => toggleBoard(b.id)}
                className={`press flex w-full flex-col items-center gap-2 rounded-2xl border-2 p-3 transition-all ${
                  isSelected 
                    ? "border-green-500 bg-green-500/10 shadow-[0_0_10px_rgba(34,197,94,0.3)]" 
                    : "border-transparent bg-input"
                }`}
              >
                {isDefault ? (
                  <BoardArt board={b} className="w-full rounded-xl" />
                ) : (
                  <div className="w-full h-24 overflow-hidden rounded-xl bg-black/10 flex items-center justify-center">
                    <MediaDisplay url={b.image_url} alt={b.name} />
                  </div>
                )}
                <span className="text-[11px] font-semibold w-full truncate text-center">{b.name}</span>
              </button>

              {!isOwned && (
                <button 
                  onClick={(e) => { e.stopPropagation(); onBuyRequest(b); }} 
                  className="flex w-[80%] max-w-[6rem] items-center justify-center gap-1.5 rounded-lg bg-yellow-400 py-1.5 text-xs font-extrabold text-yellow-950 shadow-sm transition-transform active:scale-95"
                >
                  <span>{b.price}</span>
                  <Coins className="size-4" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </OverlayShell>
  );
}

function SoundList({ items, selectedUrl, onSelect, onReplaceSlot, onClose }: { items: any[]; selectedUrl: string | null; onSelect: (url: string | null) => void; onReplaceSlot: () => boolean; onClose: () => void }) {
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [replacementConfirmation, setReplacementConfirmation] = useState(false);
  const [previewedUrl, setPreviewedUrl] = useState<string | null>(null);
  
  const selectedSound = selectedUrl
    ? items.find((s) => s.audio_url === selectedUrl) ?? {
        id: "active-reaction-sound",
        name: "دەنگی هەڵبژێردراو",
        audio_url: selectedUrl,
      }
    : null;

  const handlePlay = (s: any) => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
    }

    let audio = audioCache[s.id];
    if (!audio) {
      audio = new Audio(s.audio_url);
      audio.preload = "auto";
      audioCache[s.id] = audio;
    }

    currentAudioRef.current = audio;
    setPreviewedUrl(s.audio_url);
    audio.currentTime = 0; 
    audio.play().catch(() => {});
    setPlayingId(s.id);

    audio.onended = () => {
      setPlayingId(null);
      if (currentAudioRef.current === audio) {
        currentAudioRef.current = null;
      }
    };
  };

  const handleSlotClick = () => {
    if (selectedUrl) {
      setReplacementConfirmation(true);
      return;
    }
    if (previewedUrl) onSelect(previewedUrl);
  };

  const confirmReplacement = () => {
    if (!onReplaceSlot()) {
      toast.error("زێڕی پێویستت نییە!", { duration: 1200 });
      return;
    }
    onSelect(null);
    setPreviewedUrl(null);
    setReplacementConfirmation(false);
  };

  return (
    <OverlayShell title="ساوندەکان" onClose={onClose}>
      <div className="mb-6 flex min-h-[8rem] items-center justify-center gap-2 overflow-x-auto no-scrollbar rounded-2xl border-2 border-dashed border-primary/30 bg-black/5 p-2">
        {selectedSound ? (
          <div 
            onClick={handleSlotClick}
            className="relative flex size-28 cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border-2 border-green-500 bg-black/10 px-2 shadow-[0_0_8px_rgba(34,197,94,0.4)] transition-transform active:scale-95"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
               <Volume2 className="size-5 fill-current" />
            </div>
            <span className="w-full truncate text-center text-xs font-bold">{selectedSound.name}</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleSlotClick}
            className="flex size-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-primary/30 bg-black/5 text-xs font-medium text-muted-foreground transition-transform active:scale-95"
          >
            <Volume2 className="size-7" />
            {previewedUrl ? "هەڵبژاردنی دەنگ" : "هیچ ساوندێک هەڵنەبژێراوە"}
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center gap-4 text-center">
          <Volume2 className="size-16 text-muted-foreground/50" />
          <p className="text-xl font-bold text-muted-foreground">چاوەڕێی ساوند بە...</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3 pb-6">
          {items.map((s) => {
            const isSelected = selectedUrl === s.audio_url;
            const isPlaying = playingId === s.id;

            return (
              <div key={s.id} className="flex flex-col items-center gap-2">
                <div
                  onClick={() => handlePlay(s)}
                  className={`press flex w-full flex-col items-center justify-between gap-2 rounded-2xl border-2 p-3 cursor-pointer transition-all ${
                    isSelected 
                      ? "border-green-500 bg-green-500/10 shadow-[0_0_10px_rgba(34,197,94,0.3)]" 
                      : "border-transparent bg-input"
                  }`}
                >
                  <div className="flex size-12 items-center justify-center rounded-full bg-primary/20 text-primary">
                    <Play className={`size-6 fill-current ${isPlaying ? "animate-pulse" : ""}`} />
                  </div>
                  <span className="text-xs font-bold text-center truncate w-full">{s.name}</span>
                </div>

              </div>
            );
          })}
        </div>
      )}
      {replacementConfirmation && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/55 px-5 backdrop-blur-sm">
          <div className="w-full max-w-xs rounded-2xl border border-primary/30 bg-[#173d2f] p-4 text-center shadow-2xl animate-in zoom-in-95 duration-200">
            <p className="text-sm font-bold leading-7 text-white">
              ئەگەر دەنگی نوێ لەو خانەیە زیاد بکەی ئەبێت بڕی 15 زێڕ سەرف بکەی
            </p>
            <div className="mt-5 flex flex-row-reverse gap-3">
              <button
                type="button"
                onClick={confirmReplacement}
                className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-bold text-primary-foreground transition-transform active:scale-95"
              >
                بەڵێ
              </button>
              <button
                type="button"
                onClick={() => setReplacementConfirmation(false)}
                className="flex-1 rounded-xl bg-white/15 py-2.5 text-sm font-bold text-white transition-transform active:scale-95"
              >
                نەخێر
              </button>
            </div>
          </div>
        </div>
      )}
    </OverlayShell>
  );
}

const STICKER_SLOT_PRICES = [0, 75, 99, 120, 150];

function StickerList({ items, selectedSlots, unlockedSlots, onUnlockSlot, onAssign, onRemove, onGiphyItems, purchasedIds, onBuyRequest, onClose }: { items: any[]; selectedSlots: Array<string | null>; unlockedSlots: number[]; onUnlockSlot: (slotIndex: number) => boolean; onAssign: (slotIndex: number, imageUrl: string) => void; onRemove: (slotIndex: number) => void; onGiphyItems: (items: StickerItem[]) => void; purchasedIds: string[]; onBuyRequest: (item: any) => void; onClose: () => void }) {
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [unlockingSlots, setUnlockingSlots] = useState<Set<number>>(new Set());
  const [unlockSlot, setUnlockSlot] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [giphyItems, setGiphyItems] = useState<StickerItem[]>([]);
  const [giphyLoading, setGiphyLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMoreGiphy, setHasMoreGiphy] = useState(true);
  const [bannedSearch, setBannedSearch] = useState(false);
  const requestInFlight = useRef(false);

  const containsBannedTerm = (query: string) => {
    const normalizedQuery = query.toLocaleLowerCase();
    return BANNED_TERMS.some((term) => normalizedQuery.includes(term.toLocaleLowerCase()));
  };

  const handleStickerScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const target = event.currentTarget;
    const nearBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 500;
    if (nearBottom && !requestInFlight.current && hasMoreGiphy && !bannedSearch) {
      setOffset((currentOffset) => currentOffset + 50);
    }
  };

  useEffect(() => {
    let cancelled = false;
    if (containsBannedTerm(searchQuery)) return undefined;

    const timer = window.setTimeout(async () => {
      requestInFlight.current = true;
      setGiphyLoading(true);
      setErrorMessage(null);
      try {
        const results = await fetchStickers(searchQuery, offset);
        if (!cancelled) {
          setErrorMessage(null);
          setHasMoreGiphy(results.length === 50);
          setGiphyItems((previousItems) => {
            const nextItems = offset === 0
              ? results
              : [...previousItems, ...results.filter((result) => !previousItems.some((item) => item.id === result.id))];
            onGiphyItems(nextItems);
            return nextItems;
          });
        }
      } catch (error) {
        console.error("GIPHY Error Details:", error);
        if (!cancelled) {
          const message = error instanceof Error ? error.message : String(error);
          setErrorMessage(message);
          setGiphyItems([]);
          onGiphyItems([]);
        }
      } finally {
        requestInFlight.current = false;
        if (!cancelled) setGiphyLoading(false);
      }
    }, searchQuery.trim() ? 300 : 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [onGiphyItems, offset, searchQuery]);

  const handleGifClick = (gifUrl: string) => {
    const targetSlot = activeSlot !== null && unlockedSlots.includes(activeSlot)
      ? activeSlot
      : unlockedSlots.find((slotIndex) => !selectedSlots[slotIndex]);
    if (targetSlot === undefined) {
      toast.error("Unlock a sticker slot first", { duration: 1200 });
      return;
    }
    if (selectedSlots.includes(gifUrl)) return;
    onAssign(targetSlot, gifUrl);
    setActiveSlot(null);
  };

  const handleSlotClick = (slotIndex: number) => {
    if (unlockedSlots.includes(slotIndex)) {
      if (slotIndex === 0 && selectedSlots[slotIndex]) {
        onRemove(slotIndex);
        setActiveSlot(null);
        return;
      }
      setActiveSlot(slotIndex);
      return;
    }
    if (slotIndex === 0 || unlockingSlots.has(slotIndex)) return;
    setUnlockSlot(slotIndex);
  };

  const confirmUnlock = () => {
    if (unlockSlot === null) return;
    if (!onUnlockSlot(unlockSlot)) {
      toast.error("زێڕی پێویستت نییە", { duration: 1200 });
      return;
    }
    const targetSlot = unlockSlot;
    setUnlockSlot(null);
    setActiveSlot(targetSlot);
    setUnlockingSlots((prev) => new Set(prev).add(targetSlot));
    window.setTimeout(() => {
      setUnlockingSlots((prev) => {
        const next = new Set(prev);
        next.delete(targetSlot);
        return next;
      });
    }, 1000);
  };

  const sortedStickers = [...items].sort((a, b) => {
    const aOwned = purchasedIds.includes(a.id) || !a.price;
    const bOwned = purchasedIds.includes(b.id) || !b.price;
    if (aOwned && !bOwned) return -1;
    if (!aOwned && bOwned) return 1;
    return 0;
  });

  return (
    <OverlayShell title="ستیکەرەکان" onClose={onClose} onScroll={handleStickerScroll}>
      <label className="mb-4 flex items-center gap-2 rounded-xl border border-primary/25 bg-black/10 px-3 py-2.5">
        <Search className="size-4 shrink-0 text-muted-foreground" />
        <input
          value={searchQuery}
          onChange={(event) => {
            const nextQuery = event.target.value;
            const isBanned = containsBannedTerm(nextQuery);
            setSearchQuery(nextQuery);
            setBannedSearch(isBanned);
            setOffset(0);
            setHasMoreGiphy(!isBanned);
            if (isBanned) {
              setErrorMessage("This search term is not allowed.");
              setGiphyItems([]);
              onGiphyItems([]);
            } else {
              setErrorMessage(null);
            }
          }}
          placeholder="گەڕان بەدوای ستیکەر..."
          className={`min-w-0 flex-1 rounded-lg border-2 bg-transparent px-2 py-1 text-sm outline-none placeholder:text-muted-foreground ${bannedSearch ? "border-[#ff4d4d] shadow-[0_0_12px_rgba(255,77,77,0.8)]" : "border-transparent"}`}
          type="search"
          aria-label="Search GIPHY stickers"
        />
        {giphyLoading && <Loader2 className="size-4 shrink-0 animate-spin text-primary" />}
      </label>

      <div className="mb-6 grid grid-cols-5 gap-2">
        {STICKER_SLOT_PRICES.map((price, slotIndex) => {
          const isUnlocking = unlockingSlots.has(slotIndex);
          const unlocked = unlockedSlots.includes(slotIndex) && !isUnlocking;
          const sticker = selectedSlots[slotIndex]
            ? [...items, ...giphyItems].find((item) => item.image_url === selectedSlots[slotIndex])
            : null;
          return (
            <button
              key={price}
              type="button"
              onClick={() => handleSlotClick(slotIndex)}
              className={`sticker-slot relative flex aspect-square min-w-0 items-center justify-center overflow-hidden rounded-xl border-2 transition-all duration-500 ${
                activeSlot === slotIndex ? "scale-105 border-primary shadow-[0_0_14px_rgba(34,197,94,0.55)]" : "border-primary/30"
              } ${unlocked ? "bg-primary/10" : "bg-black/10"} ${isUnlocking ? "sticker-slot-unlocking" : ""}`}
              aria-label={unlocked ? "Add Sticker" : `Unlock sticker slot for ${price} Gold`}
            >
              {sticker ? (
                <span className="relative block size-full animate-[sticker-slot-shrink_500ms_cubic-bezier(.22,1,.36,1)]">
                  <MediaDisplay url={sticker.image_url} alt={sticker.name} />
                  {unlocked && (
                    <span
                      role="button"
                      tabIndex={0}
                      aria-label="Clear sticker"
                      onClick={(event) => {
                        event.stopPropagation();
                        onRemove(slotIndex);
                        setActiveSlot(null);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          event.stopPropagation();
                          onRemove(slotIndex);
                          setActiveSlot(null);
                        }
                      }}
                      className="absolute right-1 top-1 z-10 flex size-6 items-center justify-center rounded-full bg-black/65 text-white"
                    >
                      <X className="size-3.5" />
                    </span>
                  )}
                </span>
              ) : unlocked ? (
                <Plus className="size-7 text-primary" />
              ) : (
                <span className="relative z-[3] flex flex-col items-center gap-0.5 text-[9px] font-extrabold text-gold">
                  <GoldBar className="h-5 w-8" />
                  {price}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {errorMessage && (
        <p className="mb-4 rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-2 text-xs text-red-200" role="alert">
          {errorMessage}
        </p>
      )}

      {items.length === 0 && giphyItems.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center gap-4 text-center">
          <Sticker className="size-16 text-muted-foreground/50" />
          <p className="text-xl font-bold text-muted-foreground">چاوەڕێی ستیکەر بە...</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3 pb-6">
          {[...giphyItems, ...sortedStickers].map((st) => {
            const isSelected = selectedSlots.includes(st.image_url);
            const isOwned = purchasedIds.includes(st.id) || !st.price;

            return (
              <div key={st.id} className="flex flex-col items-center gap-2">
                <div
                  onClick={() => handleGifClick(st.image_url)}
                  className={`press flex w-full cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 p-3 transition-all ${
                    isSelected 
                      ? "border-green-500 bg-green-500/10 shadow-[0_0_10px_rgba(34,197,94,0.3)]" 
                      : "border-transparent bg-input"
                  }`}
                >
                  <div className="flex size-20 w-full items-center justify-center overflow-hidden rounded-xl bg-black/10">
                    <MediaDisplay url={st.image_url} alt={st.name} />
                  </div>
                  <span className="w-full truncate text-center text-xs font-semibold">{st.name}</span>
                </div>

                {!isOwned && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); onBuyRequest(st); }} 
                    className="flex w-[80%] max-w-[5rem] items-center justify-center gap-1.5 rounded-lg bg-yellow-400 py-1.5 text-[11px] font-extrabold text-yellow-950 shadow-sm transition-transform active:scale-95"
                  >
                    <span>{st.price}</span>
                    <Coins className="size-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {unlockSlot !== null && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/55 px-5 backdrop-blur-sm">
          <div className="w-full max-w-xs rounded-2xl border border-primary/30 bg-[#173d2f] p-4 text-center shadow-2xl animate-in zoom-in-95 duration-200">
            <p className="text-sm font-bold leading-7 text-white">
              ئەگەر دەتەوێت ئەم خانەیە بە هەمیشەیی بکەیتەوە دەبێت بڕی {STICKER_SLOT_PRICES[unlockSlot]} زێڕ سەرف بکەی
            </p>
            <div className="mt-5 flex flex-row-reverse gap-3">
              <button
                type="button"
                onClick={confirmUnlock}
                className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-bold text-primary-foreground transition-transform active:scale-95"
              >
                بەڵێ
              </button>
              <button
                type="button"
                onClick={() => setUnlockSlot(null)}
                className="flex-1 rounded-xl bg-white/15 py-2.5 text-sm font-bold text-white transition-transform active:scale-95"
              >
                نەخێر
              </button>
            </div>
          </div>
        </div>
      )}
    </OverlayShell>
  );
}