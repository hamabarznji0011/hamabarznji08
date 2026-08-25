import type { BoardSkin, TokenSkin } from "@/lib/game-data";

export function TokenArt({ token, className = "" }: { token: TokenSkin; className?: string }) {
  return (
    <svg viewBox="0 0 64 80" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`tk-${token.id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={token.from} />
          <stop offset="100%" stopColor={token.to} />
        </linearGradient>
      </defs>
      <ellipse cx="32" cy="72" rx="22" ry="6" fill="#000" opacity="0.35" />
      <path
        d="M32 6c7 0 12 5 12 11 0 4-2 7-5 9 5 4 8 10 9 17H16c1-7 4-13 9-17-3-2-5-5-5-9 0-6 5-11 12-11Z"
        fill={`url(#tk-${token.id})`}
      />
      <path d="M14 45h36c3 6 6 12 8 22H6c2-10 5-16 8-22Z" fill={`url(#tk-${token.id})`} />
      <path
        d="M32 10c4 0 7 3 7 7 0 2-1 4-2 5"
        stroke="#fff"
        strokeOpacity="0.5"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function BoardArt({ board, className = "" }: { board: BoardSkin; className?: string }) {
  const [dark, mid, light] = board.colors;
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <rect width="100" height="100" rx="8" fill={dark} />
      {Array.from({ length: 100 }).map((_, i) => {
        const x = i % 10;
        const y = Math.floor(i / 10);
        return (
          <rect
            key={i}
            x={x * 10}
            y={y * 10}
            width="10"
            height="10"
            fill={(x + y) % 2 === 0 ? mid : dark}
            opacity="0.9"
          />
        );
      })}
      <path
        d="M18 88 C 40 70, 20 52, 44 34 S 60 16, 82 12"
        stroke={light}
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
        opacity="0.95"
      />
      <circle cx="82" cy="12" r="4" fill={light} />
      <g stroke={light} strokeWidth="2.4" opacity="0.85">
        <line x1="66" y1="88" x2="86" y2="46" />
        <line x1="76" y1="92" x2="96" y2="50" />
        {Array.from({ length: 5 }).map((_, i) => (
          <line key={i} x1={67 + i * 2.4} y1={86 - i * 9} x2={78 + i * 2.4} y2={90 - i * 9} />
        ))}
      </g>
    </svg>
  );
}
