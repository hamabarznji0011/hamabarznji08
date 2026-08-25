import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Dices } from "lucide-react";
import { boards, tokens } from "@/lib/game-data";
import { BoardArt, TokenArt } from "@/components/skins";
import { useApp } from "@/lib/app-store";
import { useHideChrome } from "@/components/chrome";

export const Route = createFileRoute("/app/play")({
  head: () => ({
    meta: [
      { title: "یاری — مار و پەیژە" },
      { name: "description", content: "مۆرە و تەختەکەت هەڵبژێرە و یاری دەست پێ بکە." },
      { property: "og:title", content: "یاری — مار و پەیژە" },
      { property: "og:description", content: "مۆرە و تەختەی یاری هەڵبژێرە." },
    ],
  }),
  component: PlayTab,
});

function PlayTab() {
  const { tokenId, boardId } = useApp();
  const [overlay, setOverlay] = useState<"token" | "board" | null>(null);
  const [playing, setPlaying] = useState(false);

  const token = tokens.find((t) => t.id === tokenId) ?? tokens[0];
  const board = boards.find((b) => b.id === boardId) ?? boards[0];

  return (
    <section className="min-h-screen px-4 pt-[max(4.5rem,calc(env(safe-area-inset-top)+3.5rem))] pb-32">
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setOverlay("token")}
          className="glass press animate-rise-in flex flex-col items-center gap-2 rounded-3xl p-4"
        >
          <TokenArt token={token} className="h-24 w-auto" />
          <span className="text-sm font-bold">مۆرە</span>
          <span className="text-xs text-muted-foreground">{token.name}</span>
        </button>
        <button
          onClick={() => setOverlay("board")}
          className="glass press animate-rise-in flex flex-col items-center gap-2 rounded-3xl p-4"
        >
          <BoardArt board={board} className="size-24 rounded-xl" />
          <span className="text-sm font-bold">تەختە</span>
          <span className="text-xs text-muted-foreground">{board.name}</span>
        </button>
      </div>

      <div className="glass-strong animate-rise-in mt-5 rounded-3xl p-5 text-center">
        <h1 className="text-xl font-extrabold">ئامادەیت بۆ یاری؟</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          بەرامبەرێک بدۆزەرەوە و مار و پەیژە یاری بکە
        </p>
        <button
          onClick={() => setPlaying(true)}
          className="press mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 font-bold text-primary-foreground shadow-[var(--shadow-glow)]"
        >
          <Dices className="size-5" />
          دەستپێکردنی یاری
        </button>
      </div>

      {overlay === "token" && <TokenPicker onClose={() => setOverlay(null)} />}
      {overlay === "board" && <BoardPicker onClose={() => setOverlay(null)} />}
      {playing && <Gameplay onClose={() => setPlaying(false)} />}
    </section>
  );
}

function OverlayShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useHideChrome();
  return (
    <div className="glass-strong animate-soft-in fixed inset-0 z-50 mx-auto flex max-w-md flex-col px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-8">
      <div className="flex items-center justify-between">
        <button
          onClick={onClose}
          aria-label="گەڕانەوە"
          className="glass press flex size-11 items-center justify-center rounded-full"
        >
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
    <OverlayShell title="مۆرەکان" onClose={onClose}>
      <div className="grid grid-cols-3 gap-3 pb-6">
        {tokens.map((t) => (
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
        {boards.map((b) => (
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

function Gameplay({ onClose }: { onClose: () => void }) {
  const { tokenId, boardId } = useApp();
  const token = tokens.find((t) => t.id === tokenId) ?? tokens[0];
  const board = boards.find((b) => b.id === boardId) ?? boards[0];
  const [pos, setPos] = useState(1);
  const [dice, setDice] = useState(1);
  useHideChrome();

  const roll = () => {
    const value = 1 + Math.floor(Math.random() * 6);
    setDice(value);
    setPos((p) => Math.min(100, p + value));
  };

  return (
    <div className="animate-soft-in fixed inset-0 z-50 mx-auto flex max-w-md flex-col bg-background/95 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-8 backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <button
          onClick={onClose}
          aria-label="گەڕانەوە"
          className="glass press flex size-11 items-center justify-center rounded-full"
        >
          <ArrowRight className="size-5" />
        </button>
        <h2 className="text-lg font-bold">یاری</h2>
        <span className="size-11" />
      </div>

      <div className="relative mt-5">
        <BoardArt board={board} className="w-full rounded-2xl" />
      </div>

      <div className="glass mt-5 flex items-center justify-between rounded-2xl p-4">
        <div className="flex items-center gap-2">
          <TokenArt token={token} className="h-10 w-auto" />
          <span className="text-sm font-bold">خانەی {pos}</span>
        </div>
        <button
          onClick={roll}
          className="press flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 font-bold text-primary-foreground"
        >
          <Dices className="size-5" />
          تاوەدان ({dice})
        </button>
      </div>
    </div>
  );
}
