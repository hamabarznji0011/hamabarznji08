import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import {
  BOARD_SIZE,
  BOT_NAMES,
  LADDERS,
  LAST_SQUARE,
  PLAYER_COLORS,
  SNAKES,
  delay,
  jumpFor,
  squareCenter,
  walkPath,
  type GamePlayer,
} from "@/lib/snakes-ladders";
import type { BoardSkin } from "@/lib/game-data";
import { useHideChrome } from "@/components/chrome";

const STEP_MS = 220;
const JUMP_MS = 750;

/* ---------------------------------- board --------------------------------- */

function BoardGrid({ board }: { board: BoardSkin }) {
  const [dark, mid, light] = board.colors;
  const rows = Array.from({ length: BOARD_SIZE }, (_, i) => BOARD_SIZE - 1 - i); // top row first
  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden rounded-2xl" style={{ background: dark }}>
      {rows.map((row) => {
        const cells = Array.from({ length: BOARD_SIZE }, (_, i) => {
          const idx = row % 2 === 0 ? i : BOARD_SIZE - 1 - i;
          return row * BOARD_SIZE + idx + 1;
        });
        return (
          <div key={row} className="flex flex-1">
            {cells.map((n) => {
              const isLadder = LADDERS[n] !== undefined;
              const isSnake = SNAKES[n] !== undefined;
              return (
                <div
                  key={n}
                  className="relative flex-1 border border-black/10"
                  style={{ background: (n + row) % 2 === 0 ? mid : dark }}
                >
                  <span
                    className="absolute left-[3px] top-[1px] text-[7px] font-bold leading-none"
                    style={{ color: light, opacity: 0.85 }}
                  >
                    {n}
                  </span>
                  {(isLadder || isSnake) && (
                    <span
                      className="absolute bottom-[2px] right-[2px] size-1.5 rounded-full"
                      style={{ background: isLadder ? "#4ade80" : "#f87171" }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function BoardPaths() {
  const pt = (n: number) => {
    const c = squareCenter(n);
    return { x: c.x, y: 100 - c.y };
  };
  return (
    <svg viewBox="0 0 100 100" className="pointer-events-none absolute inset-0 size-full" aria-hidden="true">
      <defs>
        <linearGradient id="sg-ladder" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
        <linearGradient id="sg-snake" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#065f46" />
        </linearGradient>
      </defs>

      {Object.entries(LADDERS).map(([from, to]) => {
        const a = pt(Number(from));
        const b = pt(to);
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const len = Math.hypot(dx, dy) || 1;
        const nx = (-dy / len) * 1.7;
        const ny = (dx / len) * 1.7;
        const rungs = Math.max(3, Math.round(len / 6));
        return (
          <g key={`l-${from}`} stroke="url(#sg-ladder)" strokeWidth="1.1" strokeLinecap="round">
            <line x1={a.x + nx} y1={a.y + ny} x2={b.x + nx} y2={b.y + ny} />
            <line x1={a.x - nx} y1={a.y - ny} x2={b.x - nx} y2={b.y - ny} />
            {Array.from({ length: rungs }, (_, i) => {
              const t = (i + 0.5) / rungs;
              const cx = a.x + dx * t;
              const cy = a.y + dy * t;
              return (
                <line key={i} x1={cx + nx} y1={cy + ny} x2={cx - nx} y2={cy - ny} strokeWidth="0.8" />
              );
            })}
          </g>
        );
      })}

      {Object.entries(SNAKES).map(([head, tail]) => {
        const a = pt(Number(head));
        const b = pt(tail);
        const mx = (a.x + b.x) / 2;
        const my = (a.y + b.y) / 2;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const len = Math.hypot(dx, dy) || 1;
        const ox = (-dy / len) * 9;
        const oy = (dx / len) * 9;
        return (
          <g key={`s-${head}`}>
            <path
              d={`M ${a.x} ${a.y} Q ${mx + ox} ${my + oy} ${b.x} ${b.y}`}
              stroke="url(#sg-snake)"
              strokeWidth="2.6"
              fill="none"
              strokeLinecap="round"
              opacity="0.95"
            />
            <circle cx={a.x} cy={a.y} r="2.4" fill="#065f46" />
            <circle cx={a.x - 0.9} cy={a.y - 0.7} r="0.5" fill="#fff" />
            <circle cx={a.x + 0.9} cy={a.y - 0.7} r="0.5" fill="#fff" />
          </g>
        );
      })}
    </svg>
  );
}

function Token({ player, offset }: { player: GamePlayer; offset: number }) {
  const on = player.position >= 1;
  const c = squareCenter(player.position || 1);
  const spread = [
    [-1.8, -1.8],
    [1.8, -1.8],
    [-1.8, 1.8],
    [1.8, 1.8],
  ][offset] ?? [0, 0];
  return (
    <div
      className="absolute size-[7%] -translate-x-1/2 translate-y-1/2 rounded-full border-2 shadow-lg"
      style={{
        left: `${c.x + spread[0]!}%`,
        bottom: `${c.y + spread[1]!}%`,
        background: `radial-gradient(circle at 30% 25%, ${player.color.ring}, ${player.color.from} 45%, ${player.color.to})`,
        borderColor: "rgba(255,255,255,0.85)",
        opacity: on ? 1 : 0.55,
        transition: `left ${STEP_MS}ms cubic-bezier(.3,.9,.35,1), bottom ${STEP_MS}ms cubic-bezier(.3,.9,.35,1)`,
        zIndex: 20 + offset,
      }}
    />
  );
}

/* ---------------------------------- dice ---------------------------------- */

const PIPS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [
    [28, 28],
    [72, 72],
  ],
  3: [
    [26, 26],
    [50, 50],
    [74, 74],
  ],
  4: [
    [28, 28],
    [72, 28],
    [28, 72],
    [72, 72],
  ],
  5: [
    [28, 28],
    [72, 28],
    [50, 50],
    [28, 72],
    [72, 72],
  ],
  6: [
    [28, 24],
    [72, 24],
    [28, 50],
    [72, 50],
    [28, 76],
    [72, 76],
  ],
};

function DiceFace({ value, rolling }: { value: number; rolling: boolean }) {
  return (
    <div
      className="grid size-14 place-items-center rounded-2xl"
      style={{
        background: "linear-gradient(155deg,#ffffff,#dfe4ec 60%,#b9c1cf)",
        boxShadow: "inset 0 2px 3px rgba(255,255,255,.9), inset 0 -4px 6px rgba(0,0,0,.22), 0 8px 18px rgba(0,0,0,.35)",
        animation: rolling ? "sg-shake .35s linear infinite" : undefined,
      }}
    >
      <svg viewBox="0 0 100 100" className="size-full">
        {PIPS[value]!.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="9" fill="#1f2430" />
        ))}
      </svg>
    </div>
  );
}

/* -------------------------------- confetti -------------------------------- */

function Confetti() {
  const bits = useMemo(
    () =>
      Array.from({ length: 70 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 1.2,
        dur: 1.8 + Math.random() * 1.6,
        color: ["#ff6b6b", "#ffd166", "#4ade80", "#60a5fa", "#f472b6"][i % 5]!,
        size: 6 + Math.random() * 7,
      })),
    [],
  );
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {bits.map((b) => (
        <span
          key={b.id}
          className="absolute top-[-8%] block rounded-[2px]"
          style={{
            left: `${b.left}%`,
            width: b.size,
            height: b.size * 1.6,
            background: b.color,
            animation: `sg-fall ${b.dur}s linear ${b.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

/* --------------------------------- game ----------------------------------- */

export function SnakesGame({
  board,
  me,
  onClose,
}: {
  board: BoardSkin;
  me: { name: string; avatar: string };
  onClose: () => void;
}) {
  useHideChrome();
  const [phase, setPhase] = useState<"matchmaking" | "playing">("matchmaking");
  const [players, setPlayers] = useState<GamePlayer[]>(() => [
    { id: "me", name: me.name, avatar: me.avatar, color: PLAYER_COLORS[0]!, isHuman: true, position: 0 },
    ...BOT_NAMES.map((n, i) => ({
      id: `bot-${i}`,
      name: n,
      avatar: `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(n)}`,
      color: PLAYER_COLORS[i + 1]!,
      isHuman: false,
      position: 0,
    })),
  ]);
  const [turn, setTurn] = useState(0);
  const [dice, setDice] = useState(1);
  const [rolling, setRolling] = useState(false);
  const [status, setStatus] = useState("");
  const [winner, setWinner] = useState<GamePlayer | null>(null);
  const busy = useRef(false);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  useEffect(() => {
    if (phase !== "matchmaking") return;
    const t = setTimeout(() => setPhase("playing"), 2600);
    return () => clearTimeout(t);
  }, [phase]);

  const setPos = useCallback((id: string, pos: number) => {
    setPlayers((ps) => ps.map((p) => (p.id === id ? { ...p, position: pos } : p)));
  }, []);

  const takeTurn = useCallback(
    async (playerIndex: number) => {
      if (busy.current || winner) return;
      busy.current = true;

      let index = playerIndex;
      let again = true;
      while (again && alive.current && !winner) {
        again = false;
        const current = players[index]!;

        setRolling(true);
        for (let i = 0; i < 8; i++) {
          setDice(1 + Math.floor(Math.random() * 6));
          await delay(55);
        }
        const roll = 1 + Math.floor(Math.random() * 6);
        setDice(roll);
        setRolling(false);
        await delay(180);
        if (!alive.current) break;

        // read the freshest position
        let from = 0;
        setPlayers((ps) => {
          from = ps.find((p) => p.id === current.id)!.position;
          return ps;
        });
        await delay(0);

        let pos = from;
        for (const step of walkPath(from, roll)) {
          pos = step;
          setPos(current.id, step);
          await delay(STEP_MS);
          if (!alive.current) return;
        }

        const jump = jumpFor(pos);
        if (jump) {
          setStatus(jump.kind === "ladder" ? `${current.name} بە پەیژە سەرکەوت! 🪜` : `${current.name} مار خواردی! 🐍`);
          await delay(250);
          pos = jump.to;
          setPos(current.id, jump.to);
          await delay(JUMP_MS);
        }
        if (!alive.current) return;

        // collision: eat any other token on this square
        let eaten: string[] = [];
        setPlayers((ps) => {
          eaten = ps.filter((p) => p.id !== current.id && p.position === pos && pos > 0).map((p) => p.name);
          return ps.map((p) =>
            p.id !== current.id && p.position === pos && pos > 0 ? { ...p, position: 0 } : p,
          );
        });
        if (eaten.length) {
          setStatus(`${current.name} ${eaten.join(" و ")}ی خوارد! 💥`);
          await delay(500);
        }

        if (pos === LAST_SQUARE) {
          setWinner({ ...current, position: pos });
          busy.current = false;
          return;
        }

        if (roll === 6) {
          setStatus(`${current.name} شەشی هێنا — جارێکی تر! 🎲`);
          again = true;
          await delay(500);
        }
      }

      busy.current = false;
      const next = (index + 1) % players.length;
      setTurn(next);
      setStatus("");
    },
    [players, setPos, winner],
  );

  // bots play automatically
  useEffect(() => {
    if (phase !== "playing" || winner) return;
    const current = players[turn];
    if (!current || current.isHuman) return;
    const t = setTimeout(() => void takeTurn(turn), 700);
    return () => clearTimeout(t);
  }, [phase, turn, winner, players, takeTurn]);

  const myTurn = players[turn]?.isHuman && !winner && !busy.current;

  return (
    <div className="animate-soft-in fixed inset-0 z-50 mx-auto flex max-w-md flex-col bg-[#0d1117] px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-6">
      <style>{`
@keyframes sg-shake { 0%{transform:rotate(-12deg) translateY(0)} 50%{transform:rotate(14deg) translateY(-4px)} 100%{transform:rotate(-12deg) translateY(0)} }
@keyframes sg-fall { 0%{transform:translateY(0) rotate(0)} 100%{transform:translateY(115vh) rotate(720deg)} }
@keyframes sg-pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.06)} }
@keyframes sg-radar { 0%{transform:scale(.4);opacity:.9} 100%{transform:scale(2.4);opacity:0} }
`}</style>

      <div className="flex items-center justify-between">
        <button
          onClick={onClose}
          aria-label="گەڕانەوە"
          className="glass press flex size-10 items-center justify-center rounded-full text-white"
        >
          <ArrowRight className="size-5" />
        </button>
        <h2 className="text-base font-bold text-white">مار و پەیژە</h2>
        <span className="size-10" />
      </div>

      {phase === "matchmaking" ? (
        <Matchmaking players={players} />
      ) : (
        <>
          {/* scoreboard */}
          <div className="mt-3 grid grid-cols-4 gap-2">
            {players.map((p, i) => (
              <div
                key={p.id}
                className="rounded-2xl border p-1.5 text-center"
                style={{
                  borderColor: turn === i ? p.color.ring : "rgba(255,255,255,.12)",
                  background: turn === i ? "rgba(255,255,255,.10)" : "rgba(255,255,255,.04)",
                  animation: turn === i ? "sg-pulse 1.3s ease-in-out infinite" : undefined,
                }}
              >
                <div className="mx-auto size-8 overflow-hidden rounded-full border-2" style={{ borderColor: p.color.from }}>
                  <img src={p.avatar} alt={p.name} className="size-full object-cover" />
                </div>
                <p className="mt-1 truncate text-[10px] font-bold text-white">{p.name}</p>
                <p className="text-[10px] font-semibold" style={{ color: p.color.ring }}>
                  {p.position}
                </p>
              </div>
            ))}
          </div>

          {/* board */}
          <div dir="ltr" className="relative mt-3 aspect-square w-full">
            <BoardGrid board={board} />
            <BoardPaths />
            {players.map((p, i) => (
              <Token key={p.id} player={p} offset={i} />
            ))}
          </div>

          <p className="mt-2 h-5 text-center text-xs font-semibold text-white/80">{status}</p>

          {/* controls */}
          <div className="mt-auto flex items-center justify-between rounded-3xl border border-white/10 bg-white/5 p-3">
            <div className="text-right">
              <p className="text-[11px] text-white/60">نۆرەی</p>
              <p className="text-sm font-bold" style={{ color: players[turn]?.color.ring }}>
                {players[turn]?.name}
              </p>
            </div>
            <button
              onClick={() => void takeTurn(turn)}
              disabled={!myTurn}
              className="press flex items-center gap-3 rounded-2xl px-4 py-2.5 font-bold text-white disabled:opacity-45"
              style={{ background: "linear-gradient(160deg,#2f7cf6,#1741a6)", boxShadow: "0 10px 22px rgba(23,65,166,.45)" }}
            >
              <DiceFace value={dice} rolling={rolling} />
              <span className="text-sm">تاوەدان</span>
            </button>
          </div>
        </>
      )}

      {winner && <WinOverlay winner={winner} onClose={onClose} />}
    </div>
  );
}

function Matchmaking({ players }: { players: GamePlayer[] }) {
  const [found, setFound] = useState(1);
  useEffect(() => {
    const t1 = setTimeout(() => setFound(2), 800);
    const t2 = setTimeout(() => setFound(3), 1500);
    const t3 = setTimeout(() => setFound(4), 2100);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6">
      <div className="relative grid size-28 place-items-center">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="absolute size-28 rounded-full border border-primary/60"
            style={{ animation: `sg-radar 2.1s ease-out ${i * 0.7}s infinite` }}
          />
        ))}
        <Loader2 className="size-10 animate-spin text-primary" />
      </div>
      <p className="text-lg font-extrabold text-white">گەڕان بەدوای یاریزاندا…</p>
      <div className="flex gap-3">
        {players.map((p, i) => (
          <div
            key={p.id}
            className="flex flex-col items-center gap-1 transition-all duration-500"
            style={{ opacity: i < found ? 1 : 0.2, transform: i < found ? "scale(1)" : "scale(.85)" }}
          >
            <div className="size-12 overflow-hidden rounded-full border-2" style={{ borderColor: p.color.from }}>
              <img src={p.avatar} alt={p.name} className="size-full object-cover" />
            </div>
            <span className="max-w-14 truncate text-[10px] font-semibold text-white/80">{p.name}</span>
          </div>
        ))}
      </div>
      <p className="text-xs text-white/50">{found}/4 یاریزان ئامادەن</p>
    </div>
  );
}

function WinOverlay({ winner, onClose }: { winner: GamePlayer; onClose: () => void }) {
  return (
    <div className="absolute inset-0 z-50 grid place-items-center bg-black/70 px-6">
      <Confetti />
      <div className="animate-soft-in w-full max-w-xs rounded-3xl bg-white p-6 text-center shadow-2xl">
        <div
          className="mx-auto size-20 overflow-hidden rounded-full border-4"
          style={{ borderColor: winner.color.from }}
        >
          <img src={winner.avatar} alt={winner.name} className="size-full object-cover" />
        </div>
        <h3 className="mt-3 text-2xl font-extrabold text-neutral-900">
          {winner.isHuman ? "تۆ بردتەوە! 🎉" : "یاری تەواو بوو"}
        </h3>
        <p className="mt-1 text-sm text-neutral-600">{winner.name} گەیشتە خانەی ١٠٠</p>
        <button
          onClick={onClose}
          className="press mt-5 w-full rounded-2xl bg-primary py-3 font-bold text-primary-foreground"
        >
          گەڕانەوە
        </button>
      </div>
    </div>
  );
}
