import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Loader2, Star } from "lucide-react";
import {
  BOARD_SIZE,
  BOT_NAMES,
  LADDERS,
  LAST_SQUARE,
  PLAYER_COLORS,
  REACTIONS,
  SNAKES,
  SNAKE_COLORS,
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

const CELL_GREEN = "#bfe0a8";
const CELL_WHITE = "#f6f5ef";

/* ---------------------------------- board --------------------------------- */

function BoardGrid() {
  const rows = Array.from({ length: BOARD_SIZE }, (_, i) => BOARD_SIZE - 1 - i);
  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden rounded-[14px]">
      {rows.map((row) => {
        const cells = Array.from({ length: BOARD_SIZE }, (_, i) => {
          const idx = row % 2 === 0 ? BOARD_SIZE - 1 - i : i;
          return { n: row * BOARD_SIZE + idx + 1, col: i };
        });
        return (
          <div key={row} className="flex flex-1">
            {cells.map(({ n, col }) => {
              const isLast = n === LAST_SQUARE;
              return (
                <div
                  key={n}
                  className="relative flex flex-1 items-center justify-center border-[0.5px] border-black/5"
                  style={{
                    background: isLast
                      ? "linear-gradient(150deg,#c0392b,#8e2019)"
                      : (col + row) % 2 === 0
                        ? CELL_GREEN
                        : CELL_WHITE,
                  }}
                >
                  {isLast ? (
                    <Star className="size-[55%] fill-[#f2c14e] text-[#c99a24]" />
                  ) : (
                    <span className="select-none text-[9px] font-bold leading-none text-[#4a4a4a]">
                      {n}
                    </span>
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

const pt = (n: number) => {
  const c = squareCenter(n);
  return { x: 100 - c.x, y: 100 - c.y };
};

function Ladders() {
  return (
    <svg viewBox="0 0 100 100" className="pointer-events-none absolute inset-0 size-full" aria-hidden="true">
      <defs>
        <linearGradient id="sg-rail" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#b02a20" />
          <stop offset="45%" stopColor="#f0574a" />
          <stop offset="100%" stopColor="#8f1f18" />
        </linearGradient>
      </defs>
      {Object.entries(LADDERS).map(([from, to]) => {
        const a = pt(Number(from));
        const b = pt(to);
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const len = Math.hypot(dx, dy) || 1;
        const nx = (-dy / len) * 1.2;
        const ny = (dx / len) * 1.2;
        const rungs = Math.max(3, Math.round(len / 7));
        return (
          <g key={`l-${from}`} strokeLinecap="round">
            {Array.from({ length: rungs }, (_, i) => {
              const t = (i + 0.5) / rungs;
              const cx = a.x + dx * t;
              const cy = a.y + dy * t;
              return (
                <g key={i}>
                  <line
                    x1={cx + nx}
                    y1={cy + ny}
                    x2={cx - nx}
                    y2={cy - ny}
                    stroke="#7d1a14"
                    strokeWidth="0.8"
                  />
                  <line
                    x1={cx + nx}
                    y1={cy + ny - 0.2}
                    x2={cx - nx}
                    y2={cy - ny - 0.2}
                    stroke="#f5776a"
                    strokeWidth="0.4"
                  />
                </g>
              );
            })}
            <line
              x1={a.x + nx}
              y1={a.y + ny}
              x2={b.x + nx}
              y2={b.y + ny}
              stroke="url(#sg-rail)"
              strokeWidth="0.8"
            />
            <line
              x1={a.x - nx}
              y1={a.y - ny}
              x2={b.x - nx}
              y2={b.y - ny}
              stroke="url(#sg-rail)"
              strokeWidth="0.8"
            />
          </g>
        );
      })}
    </svg>
  );
}

function Snakes() {
  return (
    <svg viewBox="0 0 100 100" className="pointer-events-none absolute inset-0 size-full" aria-hidden="true">
      {Object.entries(SNAKES).map(([head, tail], idx) => {
        const a = pt(Number(head));
        const b = pt(tail);
        const c = SNAKE_COLORS[Number(head)] ?? { body: "#34d399", belly: "#bbf7d0", dark: "#059669" };
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const len = Math.hypot(dx, dy) || 1;
        const ox = (-dy / len) * 5;
        const oy = (dx / len) * 5;
        const p1 = { x: a.x + dx * 0.3 + ox, y: a.y + dy * 0.3 + oy };
        const p2 = { x: a.x + dx * 0.7 - ox, y: a.y + dy * 0.7 - oy };
        const d = `M ${a.x} ${a.y} C ${p1.x} ${p1.y}, ${p2.x} ${p2.y}, ${b.x} ${b.y}`;
        const hx = a.x - dx / len * 0.4;
        const hy = a.y - dy / len * 0.4;
        return (
          <g
            key={`s-${head}`}
            style={{ animation: `sg-slither 6s ease-in-out ${idx * 0.4}s infinite`, transformOrigin: `${a.x}% ${a.y}%` }}
          >
            <path d={d} stroke="rgba(0,0,0,.16)" strokeWidth="2.5" fill="none" strokeLinecap="round" transform="translate(0.5,0.7)" />
            <path d={d} stroke={c.dark} strokeWidth="2.2" fill="none" strokeLinecap="round" />
            <path d={d} stroke={c.body} strokeWidth="1.6" fill="none" strokeLinecap="round" />
            <path d={d} stroke={c.belly} strokeWidth="0.6" fill="none" strokeLinecap="round" opacity="0.55" />
            {/* head */}
            <circle cx={hx} cy={hy} r="1.6" fill={c.body} stroke={c.dark} strokeWidth="0.4" />
            <circle cx={hx - 0.6} cy={hy - 0.5} r="0.55" fill="#fff" />
            <circle cx={hx + 0.6} cy={hy - 0.5} r="0.55" fill="#fff" />
            <circle cx={hx - 0.6} cy={hy - 0.5} r="0.25" fill="#111">
              <animate attributeName="cy" values={`${hy - 0.5};${hy - 0.3};${hy - 0.5}`} dur="3s" repeatCount="indefinite" />
            </circle>
            <circle cx={hx + 0.6} cy={hy - 0.5} r="0.25" fill="#111">
              <animate attributeName="cy" values={`${hy - 0.5};${hy - 0.3};${hy - 0.5}`} dur="3s" repeatCount="indefinite" />
            </circle>
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
      className="absolute size-[5.5%] -translate-x-1/2 translate-y-1/2 rounded-full border-[1.5px]"
      style={{
        left: `${100 - (c.x + spread[0]!)}%`,
        bottom: `${c.y + spread[1]!}%`,
        background: `radial-gradient(circle at 32% 26%, #ffffffcc, ${player.color.from} 42%, ${player.color.to})`,
        borderColor: "#ffffff",
        boxShadow: "0 3px 6px rgba(0,0,0,.35)",
        opacity: on ? 1 : 0.6,
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
    [30, 30],
    [70, 70],
  ],
  3: [
    [28, 28],
    [50, 50],
    [72, 72],
  ],
  4: [
    [30, 30],
    [70, 30],
    [30, 70],
    [70, 70],
  ],
  5: [
    [30, 30],
    [70, 30],
    [50, 50],
    [30, 70],
    [70, 70],
  ],
  6: [
    [30, 26],
    [70, 26],
    [30, 50],
    [70, 50],
    [30, 74],
    [70, 74],
  ],
};

function DiceFace({ value, rolling }: { value: number; rolling: boolean }) {
  return (
    <div
      className="grid size-[68px] place-items-center rounded-[18px]"
      style={{
        background: "linear-gradient(155deg,#ffffff,#f4f1e6 60%,#ded9c7)",
        boxShadow:
          "inset 0 3px 4px rgba(255,255,255,.95), inset 0 -6px 8px rgba(0,0,0,.14), 0 10px 18px rgba(0,0,0,.25)",
        animation: rolling ? "sg-shake .35s linear infinite" : undefined,
      }}
    >
      <svg viewBox="0 0 100 100" className="size-full p-2">
        {PIPS[value]!.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="8.5" fill="#141414" />
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
  board: _board,
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
  const [reaction, setReaction] = useState<string | null>(null);
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

      const index = playerIndex;
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
          setStatus(jump.kind === "ladder" ? `${current.name} بە پەیژە سەرکەوت!` : `${current.name} مار خواردی!`);
          await delay(250);
          pos = jump.to;
          setPos(current.id, jump.to);
          await delay(JUMP_MS);
        }
        if (!alive.current) return;

        let eaten: string[] = [];
        setPlayers((ps) => {
          eaten = ps.filter((p) => p.id !== current.id && p.position === pos && pos > 0).map((p) => p.name);
          return ps.map((p) =>
            p.id !== current.id && p.position === pos && pos > 0 ? { ...p, position: 0 } : p,
          );
        });
        if (eaten.length) {
          setStatus(`${current.name} ${eaten.join(" و ")}ی خوارد!`);
          await delay(500);
        }

        if (pos === LAST_SQUARE) {
          setWinner({ ...current, position: pos });
          busy.current = false;
          return;
        }

        if (roll === 6) {
          setStatus(`${current.name} شەشی هێنا — جارێکی تر!`);
          again = true;
          await delay(500);
        }
      }

      busy.current = false;
      setTurn((index + 1) % players.length);
      setStatus("");
    },
    [players, setPos, winner],
  );

  useEffect(() => {
    if (phase !== "playing" || winner) return;
    const current = players[turn];
    if (!current || current.isHuman) return;
    const t = setTimeout(() => void takeTurn(turn), 700);
    return () => clearTimeout(t);
  }, [phase, turn, winner, players, takeTurn]);

  const myTurn = players[turn]?.isHuman && !winner && !busy.current;
  const meP = players[0]!;
  const opponents = players.slice(1);

  return (
    <div
      dir="rtl"
      className="animate-soft-in fixed inset-0 z-50 mx-auto flex w-full max-w-2xl flex-col overflow-y-auto overflow-x-hidden px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]"
      style={{
        background:
          "radial-gradient(120% 80% at 50% 0%, #f7ecd9 0%, #f1e2c8 55%, #e9d9bd 100%)",
      }}
    >
      <style>{`
@keyframes sg-shake { 0%{transform:rotate(-12deg) translateY(0)} 50%{transform:rotate(14deg) translateY(-4px)} 100%{transform:rotate(-12deg) translateY(0)} }
@keyframes sg-fall { 0%{transform:translateY(0) rotate(0)} 100%{transform:translateY(115vh) rotate(720deg)} }
@keyframes sg-pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.04)} }
@keyframes sg-radar { 0%{transform:scale(.4);opacity:.9} 100%{transform:scale(2.4);opacity:0} }
@keyframes sg-slither { 0%,100%{transform:rotate(-1.2deg)} 50%{transform:rotate(1.2deg)} }
@keyframes sg-pop { 0%{transform:scale(.6);opacity:0} 25%{transform:scale(1.05);opacity:1} 80%{opacity:1} 100%{transform:scale(1);opacity:0} }
`}</style>

      {/* leafy decorations */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -left-10 top-24 size-40 rounded-full bg-[#8cc06a]/25 blur-2xl" />
        <div className="absolute -right-12 top-1/2 size-44 rounded-full bg-[#6fae55]/20 blur-2xl" />
        <div className="absolute bottom-4 -left-8 size-36 rounded-full bg-[#7cb85f]/25 blur-2xl" />
      </div>

      {/* top bar */}
      <div className="relative flex items-center justify-between mt-2">
        <button
          onClick={onClose}
          aria-label="گەڕانەوە"
          className="press flex size-11 items-center justify-center rounded-full bg-white text-[#c0392b] shadow-md"
        >
          <ArrowRight className="size-5" />
        </button>
        <div className="flex items-center gap-2 rounded-full border-2 border-[#c0392b] bg-white px-4 py-2 shadow-md">
          <span className="size-2.5 rounded-full bg-[#c0392b]" />
          <span className="text-sm font-extrabold text-[#2c2c2c]">
            {myTurn ? "نۆرەی تۆیە" : `نۆرەی ${players[turn]?.name ?? ""}`}
          </span>
        </div>
        <span className="size-11" />
      </div>

      {phase === "matchmaking" ? (
        <Matchmaking players={players} />
      ) : (
        <>
          {/* opponents */}
          <div className="relative mt-4 grid grid-cols-3 gap-3">
            {opponents.map((p) => {
              const active = players[turn]?.id === p.id;
              return (
                <div
                  key={p.id}
                  className="rounded-2xl bg-white p-2 text-center shadow-[0_6px_14px_rgba(0,0,0,.10)]"
                  style={{
                    outline: active ? "2px solid #c0392b" : "none",
                    animation: active ? "sg-pulse 1.3s ease-in-out infinite" : undefined,
                  }}
                >
                  <div className="relative mx-auto size-10 md:size-12">
                    <img src={p.avatar} alt={p.name} className="size-full rounded-full object-cover" />
                    <span
                      className="absolute -bottom-0.5 -left-0.5 size-3 rounded-full border-2 border-white"
                      style={{ background: p.color.from }}
                    />
                  </div>
                  <p className="mt-1.5 truncate text-[12px] font-bold text-[#2c2c2c]">{p.name}</p>
                  <span className="mt-1 inline-block rounded-full bg-[#f4f1e6] px-2 py-0.5 text-[10px] md:text-xs font-bold text-[#8a6d1f]">
                    {p.position}
                  </span>
                </div>
              );
            })}
          </div>

          {/* board */}
          <div
            dir="ltr"
            className="relative mt-4 aspect-square w-full rounded-[16px] p-[3px] md:p-1"
            style={{ background: "#ffffff", boxShadow: "0 14px 30px rgba(0,0,0,.18)" }}
          >
            <div className="relative size-full">
              <BoardGrid />
              <Ladders />
              <Snakes />
              {players.map((p, i) => (
                <Token key={p.id} player={p} offset={i} />
              ))}
            </div>
          </div>

          <p className="mt-3 h-5 text-center text-xs font-bold text-[#6b5a3e]">{status}</p>

          {/* dice */}
          <div className="relative mt-2 flex items-center justify-center">
            <button
              onClick={() => void takeTurn(turn)}
              disabled={!myTurn}
              aria-label="تاوەدان"
              className="press disabled:opacity-50"
            >
              <DiceFace value={dice} rolling={rolling} />
            </button>
            {reaction && (
              <span
                className="pointer-events-none absolute -top-6 rounded-full bg-white px-3 py-1 text-sm font-bold text-[#2c2c2c] shadow"
                style={{ animation: "sg-pop 1.8s ease-out forwards" }}
              >
                {reaction}
              </span>
            )}
          </div>

          {/* reactions */}
          <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-2">
            {REACTIONS.map((r) => (
              <button
                key={r}
                onClick={() => {
                  setReaction(r);
                  setTimeout(() => setReaction(null), 1800);
                }}
                className="press shrink-0 rounded-full border border-[#8cc06a]/50 bg-[#8cc06a]/25 px-5 py-2.5 text-sm md:text-base font-bold text-[#33502a] backdrop-blur-sm"
              >
                {r}
              </button>
            ))}
          </div>

          {/* my bar */}
          <div className="mt-4 mb-4 flex items-center gap-4 rounded-2xl border-2 border-[#c0392b] bg-white p-3 shadow-[0_8px_18px_rgba(0,0,0,.12)]">
            <img
              src={meP.avatar}
              alt={meP.name}
              className="size-12 md:size-14 rounded-full border-2 border-[#c0392b] object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-extrabold text-[#2c2c2c]">{meP.name}</p>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#eee8dc]">
                <div
                  className="h-full rounded-full bg-[#c0392b] transition-all duration-300"
                  style={{ width: `${meP.position}%` }}
                />
              </div>
            </div>
            <span className="rounded-full bg-[#f4f1e6] px-3 py-1 text-sm font-bold text-[#8a6d1f]">
              {meP.position}/100
            </span>
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
    <div className="relative flex flex-1 flex-col items-center justify-center gap-6">
      <div className="relative grid size-28 place-items-center">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="absolute size-28 rounded-full border border-[#c0392b]/50"
            style={{ animation: `sg-radar 2.1s ease-out ${i * 0.7}s infinite` }}
          />
        ))}
        <Loader2 className="size-10 animate-spin text-[#c0392b]" />
      </div>
      <p className="text-lg md:text-xl font-extrabold text-[#2c2c2c]">گەڕان بەدوای یاریزاندا…</p>
      <div className="flex gap-4">
        {players.map((p, i) => (
          <div
            key={p.id}
            className="flex flex-col items-center gap-2 transition-all duration-500"
            style={{ opacity: i < found ? 1 : 0.25, transform: i < found ? "scale(1)" : "scale(.85)" }}
          >
            <div className="size-14 overflow-hidden rounded-full border-2 bg-white" style={{ borderColor: p.color.from }}>
              <img src={p.avatar} alt={p.name} className="size-full object-cover" />
            </div>
            <span className="max-w-16 md:max-w-20 truncate text-[11px] md:text-xs font-semibold text-[#5c5140]">{p.name}</span>
          </div>
        ))}
      </div>
      <p className="text-sm text-[#8a7c66]">{found}/4 یاریزان ئامادەن</p>
    </div>
  );
}

function WinOverlay({ winner, onClose }: { winner: GamePlayer; onClose: () => void }) {
  return (
    <div className="absolute inset-0 z-50 grid place-items-center bg-black/60 px-6">
      <Confetti />
      <div className="animate-soft-in w-full max-w-sm rounded-3xl bg-white p-8 text-center shadow-2xl">
        <div
          className="mx-auto size-24 overflow-hidden rounded-full border-4"
          style={{ borderColor: winner.color.from }}
        >
          <img src={winner.avatar} alt={winner.name} className="size-full object-cover" />
        </div>
        <h3 className="mt-4 text-3xl font-extrabold text-neutral-900">
          {winner.isHuman ? "تۆ بردتەوە! 🎉" : "یاری تەواو بوو"}
        </h3>
        <p className="mt-2 text-base text-neutral-600">{winner.name} گەیشتە خانەی ١٠٠</p>
        <button
          onClick={onClose}
          className="press mt-6 w-full rounded-2xl bg-[#c0392b] py-4 text-lg font-bold text-white"
        >
          گەڕانەوە
        </button>
      </div>
    </div>
  );
}