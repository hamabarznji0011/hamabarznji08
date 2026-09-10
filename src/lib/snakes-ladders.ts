// Core data + pure helpers for the Snakes & Ladders game.

export const BOARD_SIZE = 10;
export const LAST_SQUARE = 100;

/** ladder bottom -> top */
export const LADDERS: Record<number, number> = {
  4: 25,
  13: 46,
  33: 49,
  42: 63,
  50: 69,
  62: 81,
  74: 92,
};

/** snake head -> tail */
export const SNAKES: Record<number, number> = {
  27: 5,
  40: 3,
  43: 18,
  54: 31,
  66: 45,
  76: 58,
  89: 53,
  99: 41,
};

export type PlayerColor = { id: string; from: string; to: string; ring: string };

export const PLAYER_COLORS: PlayerColor[] = [
  { id: "red", from: "#ff6b6b", to: "#c0392b", ring: "#ff8f8f" },
  { id: "blue", from: "#6bb8ff", to: "#1b64c0", ring: "#8fcaff" },
  { id: "green", from: "#7ce87c", to: "#1e8b3a", ring: "#a5f0a5" },
  { id: "yellow", from: "#ffe066", to: "#d19a00", ring: "#ffee9c" },
];

export type GamePlayer = {
  id: string;
  name: string;
  avatar: string;
  color: PlayerColor;
  isHuman: boolean;
  position: number; // 0 = not yet on the board
};

/** Percentage coordinates (0-100) of the centre of a square, origin bottom-left. */
export function squareCenter(square: number): { x: number; y: number } {
  const n = Math.max(1, Math.min(LAST_SQUARE, square));
  const row = Math.floor((n - 1) / BOARD_SIZE);
  const idx = (n - 1) % BOARD_SIZE;
  const col = row % 2 === 0 ? idx : BOARD_SIZE - 1 - idx;
  return { x: (col + 0.5) * 10, y: (row + 0.5) * 10 };
}

/** Applies the bounce-back rule at 100. */
export function nextPosition(from: number, roll: number): number {
  const target = from + roll;
  if (target <= LAST_SQUARE) return target;
  return LAST_SQUARE - (target - LAST_SQUARE);
}

/** Sequence of squares a token steps through, including the bounce back. */
export function walkPath(from: number, roll: number): number[] {
  const path: number[] = [];
  let cur = from;
  let remaining = roll;
  let direction = 1;
  while (remaining > 0) {
    if (cur === LAST_SQUARE) direction = -1;
    cur += direction;
    path.push(cur);
    remaining--;
  }
  return path;
}

export function jumpFor(square: number): { to: number; kind: "ladder" | "snake" } | null {
  if (LADDERS[square]) return { to: LADDERS[square]!, kind: "ladder" };
  if (SNAKES[square]) return { to: SNAKES[square]!, kind: "snake" };
  return null;
}

export const BOT_NAMES = ["ئارام", "شیلان", "هێمن"];

export const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
