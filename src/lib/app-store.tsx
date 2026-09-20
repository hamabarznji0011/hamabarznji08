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
  imageUrl?: string;
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

type SavedAccount = { id: string; name: string };

type State = {
  user: User | null;
  savedAccount: SavedAccount | null;
  gold: number;
  unlockedStickerSlots: number[];
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
  isProMember: boolean;
  equippedProFrame: string | null;
  equippedProBanner: string | null;
  dailyGoldClaimedDate: string | null;
};

export const NAME_MAX = 26;
export const NAME_COOLDOWN_DAYS = 30;

export const userStorageKey = (userId: string, category: string) => `user_${userId}_${category}`;
const ACTIVE_SESSION_KEY = "snakes_ladders_active_session";

const accountIdFor = (name: string) => `account_${encodeURIComponent(name.trim().toLocaleLowerCase())}`;

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
  gold: 75,
  unlockedStickerSlots: [],
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
  isProMember: false,
  equippedProFrame: null,
  equippedProBanner: null,
  dailyGoldClaimedDate: null,
});

type Ctx = State & {
  register: (name: string) => void;
  login: (name: string) => void;
  loginSaved: () => void;
  logout: () => void;
  setOnline: (v: boolean) => void;
  addGold: (amount: number) => void;
  spendGold: (amount: number) => boolean;
  unlockStickerSlot: (slotIndex: number) => boolean;
  sendDirect: (friendId: string, text: string, imageUrl?: string) => void;
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
  activatePro: () => boolean;
  setProFrame: (frame: string | null) => void;
  setProBanner: (banner: string | null) => void;
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
  const [state, setState] = useState<State>(() => {
    if (typeof window === "undefined") return seedState();
    try {
      const userId = localStorage.getItem(ACTIVE_SESSION_KEY);
      if (!userId) return seedState();
      const raw = localStorage.getItem(userStorageKey(userId, "app_state"));
      if (!raw) return seedState();
      const stored = JSON.parse(raw) as Partial<State>;
      return {
        ...seedState(),
        ...stored,
        isProMember: localStorage.getItem(userStorageKey(userId, "isPro")) === "true" || stored.isProMember === true,
        equippedProFrame: localStorage.getItem(userStorageKey(userId, "equippedProFrame")) ?? stored.equippedProFrame ?? null,
        equippedProBanner: localStorage.getItem(userStorageKey(userId, "equippedProBanner")) ?? stored.equippedProBanner ?? null,
        dailyGoldClaimedDate: localStorage.getItem(userStorageKey(userId, "dailyGoldClaimedDate")) ?? stored.dailyGoldClaimedDate ?? null,
      };
    } catch {
      return seedState();
    }
  });
  const [hydrated, setHydrated] = useState(true);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!state.user?.id) return;
    try {
      localStorage.setItem(userStorageKey(state.user.id, "app_state"), JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state, hydrated]);

  useEffect(() => {
    if (!state.user?.id || !state.isProMember) return;
    const today = new Date().toISOString().slice(0, 10);
    if (state.dailyGoldClaimedDate === today) return;
    setState((previous) => ({
      ...previous,
      gold: previous.gold + 20,
      dailyGoldClaimedDate: today,
    }));
    localStorage.setItem(userStorageKey(state.user.id, "dailyGoldClaimedDate"), today);
  }, [state.user?.id, state.isProMember, state.dailyGoldClaimedDate]);

  const patch = useCallback((fn: (prev: State) => State) => setState(fn), []);

  const value = useMemo<Ctx>(() => {
    const friends = Array.isArray(state.friends) ? state.friends : [];
    const blockedIds = Array.isArray(state.blockedIds) ? state.blockedIds : [];
    const directMessages = state.directMessages && typeof state.directMessages === "object" ? state.directMessages : {};
    const readAt = state.readAt && typeof state.readAt === "object" ? state.readAt : {};
    const groups = Array.isArray(state.groups) ? state.groups : [];
    const visibleFriends = friends.filter((f) => f?.id && !blockedIds.includes(f.id));
    const blockedFriends = friends.filter((f) => f?.id && blockedIds.includes(f.id));

    const unreadFor = (friendId: string) => {
      if (blockedIds.includes(friendId)) return 0;
      const last = readAt[friendId] ?? 0;
      return (directMessages[friendId] ?? []).filter(
        (m) => m.senderId !== "me" && m.at > last,
      ).length;
    };

    const totalUnread = visibleFriends.reduce((sum, f) => sum + unreadFor(f.id), 0);

    return {
      ...state,
      friends,
      groups,
      blockedIds,
      directMessages,
      friendRequests: Array.isArray(state.friendRequests) ? state.friendRequests : [],
      visibleFriends,
      blockedFriends,
      unreadFor,
      totalUnread,
      playerById: (id) => globalPlayers.find((p) => p.id === id),
      acceptRequest: (id) =>
        patch((p) => {
          const req = (p.friendRequests ?? []).find((r) => r?.id === id);
          return {
            ...p,
            friendRequests: (p.friendRequests ?? []).filter((r) => r.id !== id),
            friends: req && !(p.friends ?? []).some((f) => f?.id === id) ? [...(p.friends ?? []), req] : (p.friends ?? []),
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
        return [...globalPlayers, ...friends, ...(state.friendRequests ?? [])].some(
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
            savedAccount: nameChanged && p.user
              ? { id: p.user.id, name: name! }
              : p.savedAccount,
            nameChangedAt: nameChanged ? Date.now() : p.nameChangedAt,
          };
        }),
      deleteAccount: () => {
        const accountId = state.user?.id;
        localStorage.removeItem(ACTIVE_SESSION_KEY);
        if (accountId) {
          try {
            localStorage.removeItem(userStorageKey(accountId, "app_state"));
            localStorage.removeItem(userStorageKey(accountId, "stickers"));
            localStorage.removeItem(userStorageKey(accountId, "active_sound"));
            localStorage.removeItem(userStorageKey(accountId, "isPro"));
            localStorage.removeItem(userStorageKey(accountId, "dailyGoldClaimedDate"));
            localStorage.removeItem(userStorageKey(accountId, "equippedProFrame"));
            localStorage.removeItem(userStorageKey(accountId, "equippedProBanner"));
          } catch {
            /* ignore */
          }
        }
        setState(seedState());
      },

      register: (name) =>
        setState(() => {
          const id = accountIdFor(name);
          try {
            localStorage.removeItem(userStorageKey(id, "app_state"));
            localStorage.removeItem(userStorageKey(id, "stickers"));
            localStorage.removeItem(userStorageKey(id, "active_sound"));
            localStorage.removeItem(userStorageKey(id, "isPro"));
            localStorage.removeItem(userStorageKey(id, "dailyGoldClaimedDate"));
            localStorage.removeItem(userStorageKey(id, "equippedProFrame"));
            localStorage.removeItem(userStorageKey(id, "equippedProBanner"));
          } catch {
            /* ignore */
          }
          localStorage.setItem(ACTIVE_SESSION_KEY, id);
          return {
            ...seedState(),
            user: { id, name, avatar: avatarFor(name || "me"), points: 0, gold: 75, games: 0, wins: 0 },
            savedAccount: { id, name },
          };
        }),
      login: (name) => {
        const id = accountIdFor(name);
        let stored: Partial<State> = {};
        try {
          const raw = localStorage.getItem(userStorageKey(id, "app_state"));
          if (raw) stored = JSON.parse(raw) as Partial<State>;
        } catch {
          /* ignore */
        }
        const isProMember = localStorage.getItem(userStorageKey(id, "isPro")) === "true" || stored.isProMember === true;
        setState(() => ({
          ...seedState(),
          ...stored,
          isProMember,
          user: {
            id,
            name,
            avatar: avatarFor(name || "me"),
            points: stored.user?.points ?? 1840,
            games: stored.user?.games ?? 62,
            wins: stored.user?.wins ?? 35,
          },
          savedAccount: { id, name },
        }));
        localStorage.setItem(ACTIVE_SESSION_KEY, id);
      },
      loginSaved: () =>
        setState((p) => {
          const name = p.savedAccount?.name ?? "یاریزان";
          const id = p.savedAccount?.id ?? accountIdFor(name);
          localStorage.setItem(ACTIVE_SESSION_KEY, id);
          let stored: Partial<State> = {};
          try {
            const raw = localStorage.getItem(userStorageKey(id, "app_state"));
            if (raw) stored = JSON.parse(raw) as Partial<State>;
          } catch {
            /* ignore */
          }
          return {
            ...seedState(),
            ...stored,
            isProMember: localStorage.getItem(userStorageKey(id, "isPro")) === "true" || stored.isProMember === true,
            equippedProFrame: localStorage.getItem(userStorageKey(id, "equippedProFrame")) ?? stored.equippedProFrame ?? null,
            equippedProBanner: localStorage.getItem(userStorageKey(id, "equippedProBanner")) ?? stored.equippedProBanner ?? null,
            user: {
              id,
              name,
              avatar: avatarFor(name),
              points: 1840,
              games: 62,
              wins: 35,
            },
            savedAccount: { id, name },
          };
        }),
      logout: () => {
        localStorage.removeItem(ACTIVE_SESSION_KEY);
        setState(seedState());
      },
      setOnline: (v) => patch((p) => ({ ...p, online: v })),
      addGold: (amount) => patch((p) => ({ ...p, gold: p.gold + amount })),
      spendGold: (amount) => {
        if (!Number.isFinite(amount) || amount < 0 || state.gold < amount) return false;
        patch((p) => ({ ...p, gold: p.gold - amount }));
        return true;
      },
      unlockStickerSlot: (slotIndex) => {
        const unlocked = state.unlockedStickerSlots ?? [];
        const price = [0, 75, 99, 120, 150][slotIndex];
        if (
          !Number.isInteger(slotIndex) ||
          slotIndex < 1 ||
          slotIndex > 4 ||
          unlocked.includes(slotIndex) ||
          price === undefined ||
          state.gold < price
        ) {
          return false;
        }
        patch((p) => ({
          ...p,
          gold: p.gold - price,
          unlockedStickerSlots: [...(p.unlockedStickerSlots ?? []), slotIndex].sort((a, b) => a - b),
        }));
        return true;
      },
      sendDirect: (friendId, text, imageUrl) =>
        patch((p) => {
          const directMessages = p.directMessages && typeof p.directMessages === "object"
            ? p.directMessages
            : {};
          const existingMessages = Array.isArray(directMessages[friendId])
            ? directMessages[friendId]
            : [];
          const optimisticMessage: Message = {
            id: `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            text: typeof text === "string" ? text : "",
            senderId: "me",
            imageUrl: typeof imageUrl === "string" && imageUrl ? imageUrl : undefined,
            at: Date.now(),
          };
          return {
            ...p,
            directMessages: {
              ...directMessages,
              [friendId]: [...existingMessages, optimisticMessage],
            },
          };
        }),
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
      activatePro: () => {
        if (!state.user?.id || state.isProMember) return false;
        const id = state.user.id;
        localStorage.setItem(userStorageKey(id, "isPro"), "true");
        localStorage.setItem(userStorageKey(id, "equippedProFrame"), "golden-shimmer");
        localStorage.setItem(userStorageKey(id, "equippedProBanner"), "vip-aurora");
        patch((p) => ({
          ...p,
          isProMember: true,
          gold: p.gold + 500,
          unlockedStickerSlots: p.unlockedStickerSlots.includes(1)
            ? p.unlockedStickerSlots
            : [...p.unlockedStickerSlots, 1].sort((a, b) => a - b),
          boardId: "vip-board",
          tokenId: "vip-token",
          equippedProFrame: "golden-shimmer",
          equippedProBanner: "vip-aurora",
          dailyGoldClaimedDate: null,
        }));
        return true;
      },
      setProFrame: (frame) => {
        if (!state.user?.id || !state.isProMember) return;
        localStorage.setItem(userStorageKey(state.user.id, "equippedProFrame"), frame ?? "");
        patch((p) => ({ ...p, equippedProFrame: frame }));
      },
      setProBanner: (banner) => {
        if (!state.user?.id || !state.isProMember) return;
        localStorage.setItem(userStorageKey(state.user.id, "equippedProBanner"), banner ?? "");
        patch((p) => ({ ...p, equippedProBanner: banner }));
      },
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
