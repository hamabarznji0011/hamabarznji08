import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Message = {
  id: string;
  senderId: string;
  text: string;
  at: number;
};

export type Friend = {
  id: string;
  name: string;
  avatar: string;
  points: number;
  gold: number;
  games: number;
  wins: number;
};

export type Group = {
  id: string;
  name: string;
  code: string;
  memberIds: string[];
  color: string;
};

export type Player = {
  id: string;
  name: string;
  avatar: string;
  points: number;
  gold: number;
  games: number;
  wins: number;
};

export type User = {
  id: string;
  name: string;
  avatar: string;
  points: number;
  games: number;
  wins: number;
};

type State = {
  user: User | null;
  savedAccount: { name: string } | null;
  gold: number;
  online: boolean;
  friends: Friend[];
  friendRequests: Friend[];
  blockedIds: string[];
  groups: Group[];
  directMessages: Record<string, Message[]>;
  groupMessages: Record<string, Message[]>;
  readAt: Record<string, number>;
  tokenId: string;
  boardId: string;
  nameChangedAt: number | null;
};

export const NAME_MAX = 26;
export const NAME_COOLDOWN_DAYS = 30;

const STORAGE_KEY = "snakes_ladders_state_v1";

const avatarFor = (seed: string) =>
  `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(seed)}`;

const makeFriend = (
  id: string,
  name: string,
  points: number,
  gold: number,
  games: number,
  wins: number,
): Friend => ({ id, name, avatar: avatarFor(id), points, gold, games, wins });

const now = Date.now();
const min = 60_000;

const seedFriends: Friend[] = [
  makeFriend("f1", "ئاکۆ", 4820, 1340, 210, 128),
  makeFriend("f2", "شیلان", 4310, 980, 188, 101),
  makeFriend("f3", "هێمن", 3990, 2210, 240, 132),
  makeFriend("f4", "ڕۆژان", 3110, 640, 96, 44),
  makeFriend("f5", "کارزان", 2870, 1520, 143, 71),
  makeFriend("f6", "دەریا", 2240, 410, 77, 30),
];

const seedRequests: Friend[] = [
  makeFriend("r1", "ئارام", 3420, 760, 132, 70),
  makeFriend("r2", "نەرمین", 2980, 1120, 118, 55),
  makeFriend("r3", "زانا", 2510, 430, 88, 39),
];

export const globalPlayers: Player[] = [
  ...seedFriends,

  makeFriend("g1", "سۆران", 7120, 3050, 380, 244),
  makeFriend("g2", "ئەڤین", 6640, 4210, 355, 219),
  makeFriend("g3", "بەختیار", 6010, 1890, 300, 176),
  makeFriend("g4", "نیشتمان", 5480, 5120, 412, 232),
  makeFriend("g5", "هەڵاڵە", 5090, 2760, 268, 149),
];

const seedState = (): State => ({
  user: null,
  savedAccount: null,
  gold: 250,
  online: true,
  friends: seedFriends,
  friendRequests: seedRequests,
  blockedIds: [],
  groups: [
    {
      id: "gr1",
      name: "تیمی مارەکان",
      code: "482913",
      memberIds: ["f1", "f2", "f3"],
      color: "violet",
    },
  ],
  directMessages: {
    f1: [
      { id: "m1", senderId: "f1", text: "سڵاو، یارییەک بکەین؟", at: now - 42 * min },
      { id: "m2", senderId: "me", text: "بەڵێ، چەند خولەک", at: now - 40 * min },
      { id: "m3", senderId: "f1", text: "ئامادەم 🙂", at: now - 12 * min },
      { id: "m4", senderId: "f1", text: "کوا؟", at: now - 8 * min },
      { id: "m5", senderId: "f1", text: "دەستپێبکەین", at: now - 5 * min },
    ],
    f2: [
      { id: "m6", senderId: "f2", text: "تەختەی نوێت بینی؟", at: now - 120 * min },
      { id: "m7", senderId: "f2", text: "زۆر جوانە!", at: now - 118 * min },
    ],
    f3: [{ id: "m8", senderId: "me", text: "دواتر یاری دەکەین", at: now - 300 * min }],
  },
  groupMessages: {
    gr1: [
      { id: "gm1", senderId: "f2", text: "ئەمشەو یاری گروپی؟", at: now - 60 * min },
      { id: "gm2", senderId: "f3", text: "من ئامادەم", at: now - 55 * min },
    ],
  },
  readAt: { f3: now },
  tokenId: "t1",
  boardId: "b1",
  nameChangedAt: null,
});

type Ctx = State & {
  register: (name: string) => void;
  login: (name: string) => void;
  loginSaved: () => void;
  logout: () => void;
  setOnline: (v: boolean) => void;
  addGold: (amount: number) => void;
  sendDirect: (friendId: string, text: string) => void;
  sendGroup: (groupId: string, text: string) => void;
  markRead: (chatId: string) => void;
  unreadFor: (friendId: string) => number;
  totalUnread: number;
  blockFriend: (friendId: string) => void;
  unblockFriend: (friendId: string) => void;
  createGroup: (name: string, memberIds: string[]) => void;
  leaveGroup: (groupId: string) => void;
  joinGroupByCode: (code: string) => Group | null;
  setTokenId: (id: string) => void;
  setBoardId: (id: string) => void;
  visibleFriends: Friend[];
  blockedFriends: Friend[];
  playerById: (id: string) => Player | undefined;
  acceptRequest: (id: string) => void;
  declineRequest: (id: string) => void;
  requestFriend: (player: Player) => "added" | "exists";
  isNameTaken: (name: string) => boolean;
  nameCooldownDaysLeft: number;
  updateProfile: (data: { name?: string | undefined; avatar?: string | undefined }) => void;
  deleteAccount: () => void;
};

const AppContext = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(seedState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setState((prev) => ({ ...prev, ...(JSON.parse(raw) as State) }));
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state, hydrated]);

  const patch = useCallback((fn: (prev: State) => State) => setState(fn), []);

  const value = useMemo<Ctx>(() => {
    const visibleFriends = state.friends.filter((f) => !state.blockedIds.includes(f.id));
    const blockedFriends = state.friends.filter((f) => state.blockedIds.includes(f.id));

    const unreadFor = (friendId: string) => {
      if (state.blockedIds.includes(friendId)) return 0;
      const last = state.readAt[friendId] ?? 0;
      return (state.directMessages[friendId] ?? []).filter(
        (m) => m.senderId !== "me" && m.at > last,
      ).length;
    };

    const totalUnread = visibleFriends.reduce((sum, f) => sum + unreadFor(f.id), 0);

    return {
      ...state,
      friendRequests: state.friendRequests ?? [],
      visibleFriends,
      blockedFriends,
      unreadFor,
      totalUnread,
      playerById: (id) => globalPlayers.find((p) => p.id === id),
      acceptRequest: (id) =>
        patch((p) => {
          const req = (p.friendRequests ?? []).find((r) => r.id === id);
          return {
            ...p,
            friendRequests: (p.friendRequests ?? []).filter((r) => r.id !== id),
            friends: req && !p.friends.some((f) => f.id === id) ? [...p.friends, req] : p.friends,
          };
        }),
      declineRequest: (id) =>
        patch((p) => ({
          ...p,
          friendRequests: (p.friendRequests ?? []).filter((r) => r.id !== id),
        })),
      requestFriend: (player) => {
        if (
          state.friends.some((f) => f.id === player.id) ||
          (state.friendRequests ?? []).some((r) => r.id === player.id)
        )
          return "exists";
        patch((p) => ({
          ...p,
          friendRequests: [
            { ...player } as Friend,
            ...(p.friendRequests ?? []),
          ],
        }));
        return "added";
      },

      isNameTaken: (name) => {
        const q = name.trim().toLowerCase();
        if (!q) return false;
        if (q === (state.user?.name ?? "").trim().toLowerCase()) return false;
        return [...globalPlayers, ...state.friends, ...(state.friendRequests ?? [])].some(
          (p) => p.name.trim().toLowerCase() === q,
        );
      },
      nameCooldownDaysLeft: (() => {
        if (!state.nameChangedAt) return 0;
        const elapsed = Date.now() - state.nameChangedAt;
        const total = NAME_COOLDOWN_DAYS * 86_400_000;
        return elapsed >= total ? 0 : Math.ceil((total - elapsed) / 86_400_000);
      })(),
      updateProfile: ({ name, avatar }) =>
        patch((p) => {
          if (!p.user) return p;
          const nameChanged = !!name && name !== p.user.name;
          return {
            ...p,
            user: {
              ...p.user,
              name: name ?? p.user.name,
              avatar: avatar ?? p.user.avatar,
            },
            savedAccount: nameChanged ? { name: name! } : p.savedAccount,
            nameChangedAt: nameChanged ? Date.now() : p.nameChangedAt,
          };
        }),
      deleteAccount: () => {
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch {
          /* ignore */
        }
        setState(seedState());
      },

      register: (name) =>
        patch((p) => ({
          ...p,
          user: {
            id: "me",
            name,
            avatar: avatarFor(name || "me"),
            points: 0,
            games: 0,
            wins: 0,
          },
          savedAccount: { name },
        })),
      login: (name) =>
        patch((p) => ({
          ...p,
          user: {
            id: "me",
            name,
            avatar: avatarFor(name || "me"),
            points: p.user?.points ?? 1840,
            games: p.user?.games ?? 62,
            wins: p.user?.wins ?? 35,
          },
          savedAccount: { name },
        })),
      loginSaved: () =>
        patch((p) => ({
          ...p,
          user: {
            id: "me",
            name: p.savedAccount?.name ?? "یاریزان",
            avatar: avatarFor(p.savedAccount?.name ?? "me"),
            points: p.user?.points ?? 1840,
            games: p.user?.games ?? 62,
            wins: p.user?.wins ?? 35,
          },
        })),
      logout: () => patch((p) => ({ ...p, user: null })),
      setOnline: (v) => patch((p) => ({ ...p, online: v })),
      addGold: (amount) => patch((p) => ({ ...p, gold: p.gold + amount })),
      sendDirect: (friendId, text) =>
        patch((p) => ({
          ...p,
          directMessages: {
            ...p.directMessages,
            [friendId]: [
              ...(p.directMessages[friendId] ?? []),
              { id: crypto.randomUUID(), senderId: "me", text, at: Date.now() },
            ],
          },
        })),
      sendGroup: (groupId, text) =>
        patch((p) => ({
          ...p,
          groupMessages: {
            ...p.groupMessages,
            [groupId]: [
              ...(p.groupMessages[groupId] ?? []),
              { id: crypto.randomUUID(), senderId: "me", text, at: Date.now() },
            ],
          },
        })),
      markRead: (chatId) =>
        patch((p) => ({ ...p, readAt: { ...p.readAt, [chatId]: Date.now() } })),
      blockFriend: (friendId) =>
        patch((p) => ({
          ...p,
          blockedIds: p.blockedIds.includes(friendId)
            ? p.blockedIds
            : [...p.blockedIds, friendId],
        })),
      unblockFriend: (friendId) =>
        patch((p) => ({ ...p, blockedIds: p.blockedIds.filter((id) => id !== friendId) })),
      createGroup: (name, memberIds) =>
        patch((p) => ({
          ...p,
          groups: [
            ...p.groups,
            {
              id: crypto.randomUUID(),
              name,
              code: String(Math.floor(100000 + Math.random() * 900000)),
              memberIds: memberIds.slice(0, 4),
              color: ["violet", "cyan", "amber", "rose"][p.groups.length % 4] ?? "violet",
            },
          ],
        })),
      leaveGroup: (groupId) =>
        patch((p) => ({ ...p, groups: p.groups.filter((g) => g.id !== groupId) })),
      joinGroupByCode: (code) => {
        const existing = state.groups.find((g) => g.code === code);
        if (existing) return existing;
        return null;
      },
      setTokenId: (id) => patch((p) => ({ ...p, tokenId: id })),
      setBoardId: (id) => patch((p) => ({ ...p, boardId: id })),
    };
  }, [state, patch]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}

export function formatTime(at: number) {
  const d = new Date(at);
  const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  const date = d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit" });
  return `${time} · ${date}`;
}
