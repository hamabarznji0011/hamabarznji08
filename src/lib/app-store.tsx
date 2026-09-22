import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/lib/supabase";

export type Message = {
  id: string;
  senderId: string;
  text: string;
  at: number;
  imageUrl?: string;
  readAt?: number;
  reaction?: string;
};

type DatabaseMessage = {
  id: string;
  sender_id: string;
  receiver_id: string;
  body: string;
  image_url?: string | null;
  read_at?: string | null;
  reaction?: string | null;
  created_at: string;
};

export type Friend = {
  id: string;
  name: string;
  handle?: string;
  bio?: string;
  birth_year?: string;
  city?: string;
  online?: boolean;
  avatar: string;
  points: number;
  gold: number;
  games_played: number;
  wins: number;
  losses?: number;
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
  handle?: string;
  bio?: string;
  birth_year?: string;
  city?: string;
  online?: boolean;
  avatar: string;
  points: number;
  gold: number;
  games_played: number;
  wins: number;
  losses?: number;
};

export type User = {
  id: string;
  name: string;
  handle?: string;
  bio?: string;
  birth_year?: string;
  city?: string;
  online?: boolean;
  avatar: string;
  points: number;
  games_played: number;
  wins: number;
};

type SavedAccount = {
  id: string;
  name: string;
  handle?: string;
  bio?: string;
  birth_year?: string;
  city?: string;
  password?: string;
  lastPasswordChangedAt?: number;
  last_username_change?: number;
  last_name_change?: number;
  email?: string;
  hideProfileDetails?: boolean;
  hideFollowing?: boolean;
};

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

export type ProfileRecord = {
  id: string;
  username: string;
  avatar_url?: string | null;
  city?: string | null;
  birth_year?: string | null;
  gold?: number | null;
  points?: number | null;
  games_played?: number | null;
  wins?: number | null;
  losses?: number | null;
};

export const NAME_MAX = 26;
export const NAME_COOLDOWN_DAYS = 30;

export const userStorageKey = (userId: string, category: string) => `user_${userId}_${category}`;
const ACTIVE_SESSION_KEY = "snakes_ladders_active_session";

const accountIdFor = (name: string) =>
  `account_${encodeURIComponent(name.trim().toLocaleLowerCase())}`;

const avatarFor = (seed: string) =>
  `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(seed)}`;

export const formatHandle = (handle: string | undefined) =>
  handle?.trim() ? `@${handle.trim().replace(/^@+/, "")}` : "";

export const globalPlayers: Player[] = [];

const seedState = (): State => ({
  user: null,
  savedAccount: null,
  gold: 75,
  unlockedStickerSlots: [],
  online: true,
  friends: [],
  friendRequests: [],
  blockedIds: [],
  groups: [],
  directMessages: {},
  groupMessages: {},
  readAt: {},
  tokenId: "t1",
  boardId: "b1",
  nameChangedAt: null,
  isProMember: false,
  equippedProFrame: null,
  equippedProBanner: null,
  dailyGoldClaimedDate: null,
});

type Ctx = State & {
  register: (
    name: string,
    password: string,
    birth_year?: string,
    city?: string,
    id?: string,
  ) => boolean;
  loginWithProfile: (profile: ProfileRecord, password: string) => void;
  login: (name: string, password: string) => boolean;
  loginSaved: () => void;
  logout: () => void;
  setOnline: (v: boolean) => void;
  setHideFollowing: (hidden: boolean) => void;
  hideFollowing: boolean;
  setHideProfileDetails: (hidden: boolean) => void;
  hideProfileDetails: boolean;
  addGold: (amount: number) => void;
  spendGold: (amount: number) => boolean;
  unlockStickerSlot: (slotIndex: number) => boolean;
  sendDirect: (friendId: string, text: string, imageUrl?: string) => void;
  sendGroup: (groupId: string, text: string) => void;
  markRead: (chatId: string) => void;
  reactToMessage: (messageId: string, reaction: string) => void;
  unreadFor: (friendId: string) => number;
  totalUnread: number;
  blockFriend: (friendId: string) => void;
  removeFriend: (friendId: string) => void;
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
  addFriend: (friend: Friend) => void;
  isNameTaken: (name: string) => boolean;
  nameCooldownDaysLeft: number;
  usernameCooldownDaysLeft: number;
  updateProfile: (data: {
    name?: string | undefined;
    avatar?: string | undefined;
    handle?: string | undefined;
    bio?: string | undefined;
  }) => void;
  deleteAccount: () => Promise<void>;
  isUsernameAvailable: (name: string) => boolean;
  isHandleAvailable: (handle: string) => boolean;
  updatePassword: (password: string) => boolean;
  linkEmail: (email: string) => void;
  passwordChangedAt: number | null;
  currentPassword: string;
  linkedEmail: string | null;
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
        isProMember:
          localStorage.getItem(userStorageKey(userId, "isPro")) === "true" ||
          stored.isProMember === true,
        equippedProFrame:
          localStorage.getItem(userStorageKey(userId, "equippedProFrame")) ??
          stored.equippedProFrame ??
          null,
        equippedProBanner:
          localStorage.getItem(userStorageKey(userId, "equippedProBanner")) ??
          stored.equippedProBanner ??
          null,
        dailyGoldClaimedDate:
          localStorage.getItem(userStorageKey(userId, "dailyGoldClaimedDate")) ??
          stored.dailyGoldClaimedDate ??
          null,
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
    if (!supabase || !state.user?.id) return;
    let cancelled = false;
    const refreshProfile = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(
          "id, username, avatar_url, city, birth_year, points, gold, games_played, wins, losses",
        )
        .eq("id", state.user?.id)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        console.error("Supabase profile refresh error:", error);
        return;
      }
      if (!data) return;
      const gamesPlayed = Number(data.games_played ?? 0);
      const gold = Number(data.gold ?? 75);
      setState((previous) => ({
        ...previous,
        gold,
        user: previous.user
          ? {
              ...previous.user,
              id: data.id,
              name: data.username ?? previous.user.name,
              avatar: data.avatar_url || previous.user.avatar,
              city: data.city ?? previous.user.city,
              birth_year: data.birth_year ?? previous.user.birth_year,
              points: Number(data.points ?? 0),
              gold,
              games_played: gamesPlayed,
              wins: Number(data.wins ?? 0),
            }
          : previous.user,
      }));
    };
    void refreshProfile();
    return () => {
      cancelled = true;
    };
  }, [state.user?.id]);

  useEffect(() => {
    if (!supabase || !state.user?.id) return;
    let cancelled = false;
    const accountId = state.user.id;
    const loadMessages = async () => {
      const { data, error } = await supabase
        .from("direct_messages")
        .select("id, sender_id, receiver_id, body, image_url, read_at, reaction, created_at")
        .or(`sender_id.eq.${accountId},receiver_id.eq.${accountId}`)
        .order("created_at", { ascending: true });
      if (cancelled || error) {
        if (error) console.error("Supabase messages refresh error:", error);
        return;
      }
      const nextMessages: Record<string, Message[]> = {};
      for (const row of (data ?? []) as DatabaseMessage[]) {
        const friendId = row.sender_id === accountId ? row.receiver_id : row.sender_id;
        const message: Message = {
          id: row.id,
          senderId: row.sender_id,
          text: row.body,
          imageUrl: row.image_url ?? undefined,
          readAt: row.read_at ? new Date(row.read_at).getTime() : undefined,
          reaction: row.reaction ?? undefined,
          at: new Date(row.created_at).getTime(),
        };
        nextMessages[friendId] = [...(nextMessages[friendId] ?? []), message];
      }
      setState((previous) => ({ ...previous, directMessages: nextMessages }));
    };
    const addMessage = (payload: { new: DatabaseMessage }) => {
      const row = payload.new;
      const friendId = row.sender_id === accountId ? row.receiver_id : row.sender_id;
      const message: Message = {
        id: row.id,
        senderId: row.sender_id,
        text: row.body,
        imageUrl: row.image_url ?? undefined,
          readAt: row.read_at ? new Date(row.read_at).getTime() : undefined,
          reaction: row.reaction ?? undefined,
        at: new Date(row.created_at).getTime(),
      };
      setState((previous) => {
        const existing = previous.directMessages[friendId] ?? [];
        if (existing.some((item) => item.id === message.id)) {
          return {
            ...previous,
            directMessages: {
              ...previous.directMessages,
              [friendId]: existing.map((item) =>
                item.id === message.id ? { ...item, reaction: message.reaction, readAt: message.readAt } : item,
              ),
            },
          };
        }
        return {
          ...previous,
          directMessages: { ...previous.directMessages, [friendId]: [...existing, message] },
        };
      });
    };
    void loadMessages();
    const channel = supabase
      .channel(`direct-messages:${accountId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "direct_messages", filter: `sender_id=eq.${accountId}` },
        addMessage,
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "direct_messages", filter: `receiver_id=eq.${accountId}` },
        addMessage,
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "direct_messages", filter: `sender_id=eq.${accountId}` },
        addMessage,
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "direct_messages", filter: `receiver_id=eq.${accountId}` },
        addMessage,
      )
      .subscribe();
    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [state.user?.id]);

  useEffect(() => {
    if (!supabase || !state.user?.id) return;
    let cancelled = false;
    const loadAcceptedFriends = async () => {
      const accountId = state.user?.id;
      if (!accountId) return;
      const { data: requests, error } = await supabase
        .from("friend_requests")
        .select("sender_id, receiver_id")
        .eq("status", "accepted")
        .or(`sender_id.eq.${accountId},receiver_id.eq.${accountId}`);
      if (cancelled || error) {
        if (error) console.error("Supabase friendships refresh error:", error);
        return;
      }
      const acceptedFriends = await Promise.all(
        (requests ?? []).map(async (request) => {
          const friendId = request.sender_id === accountId ? request.receiver_id : request.sender_id;
          const { data: profile } = await supabase
            .from("profiles")
            .select("id, username, avatar_url, city, birth_year, online, points, gold, games_played, wins, losses")
            .eq("id", friendId)
            .maybeSingle();
          if (!profile) return null;
          const gamesPlayed = Number(profile.games_played ?? 0);
          return {
            id: String(profile.id),
            name: String(profile.username ?? "یاریزان"),
            avatar: String(profile.avatar_url ?? ""),
            city: profile.city ?? undefined,
            birth_year: profile.birth_year ?? undefined,
            online: profile.online !== false,
            points: Number(profile.points ?? 0),
            gold: Number(profile.gold ?? 0),
            games_played: gamesPlayed,
            wins: Number(profile.wins ?? 0),
            losses: Number(profile.losses ?? Math.max(0, gamesPlayed - Number(profile.wins ?? 0))),
          } satisfies Friend;
        }),
      );
      if (cancelled) return;
      const friends = acceptedFriends.filter((friend): friend is Friend => Boolean(friend));
      setState((previous) => ({
        ...previous,
        friends: [
          ...(previous.friends ?? []).filter((friend) => friends.some((next) => next.id === friend.id)),
          ...friends.filter((friend) => !(previous.friends ?? []).some((existing) => existing.id === friend.id)),
        ],
      }));
    };
    void loadAcceptedFriends();
    const channel = supabase
      .channel(`friendships:${state.user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "friend_requests",
          filter: `sender_id=eq.${state.user.id}`,
        },
        () => void loadAcceptedFriends(),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "friend_requests",
          filter: `receiver_id=eq.${state.user.id}`,
        },
        () => void loadAcceptedFriends(),
      )
      .subscribe();
    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [state.user?.id]);

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
    const directMessages =
      state.directMessages && typeof state.directMessages === "object" ? state.directMessages : {};
    const readAt = state.readAt && typeof state.readAt === "object" ? state.readAt : {};
    const groups = Array.isArray(state.groups) ? state.groups : [];
    const passwordChangedAt = state.savedAccount?.lastPasswordChangedAt ?? null;
    const currentPassword = state.savedAccount?.password ?? "";
    const linkedEmail = state.savedAccount?.email ?? null;
    const visibleFriends = friends
      .filter((f) => f?.id && !blockedIds.includes(f.id))
      .sort((first, second) => {
        const latestFor = (friendId: string) =>
          Math.max(...(directMessages[friendId] ?? []).map((message) => message.at), 0);
        return latestFor(second.id) - latestFor(first.id);
      });
    const blockedFriends = friends.filter((f) => f?.id && blockedIds.includes(f.id));

    const unreadFor = (friendId: string) => {
      if (blockedIds.includes(friendId)) return 0;
      const last = readAt[friendId] ?? 0;
      return (directMessages[friendId] ?? []).filter(
        (message) =>
          message.senderId !== state.user?.id &&
          message.senderId !== "me" &&
          message.at > last &&
          !message.readAt,
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
      hideFollowing: state.savedAccount?.hideFollowing ?? false,
      hideProfileDetails: state.savedAccount?.hideProfileDetails ?? false,
      passwordChangedAt,
      currentPassword,
      linkedEmail,
      unreadFor,
      totalUnread,
      playerById: (id) => globalPlayers.find((p) => p.id === id),
      acceptRequest: (id) =>
        patch((p) => {
          const req = (p.friendRequests ?? []).find((r) => r?.id === id);
          return {
            ...p,
            friendRequests: (p.friendRequests ?? []).filter((r) => r.id !== id),
            friends:
              req && !(p.friends ?? []).some((f) => f?.id === id)
                ? [...(p.friends ?? []), req]
                : (p.friends ?? []),
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
          friendRequests: [{ ...player } as Friend, ...(p.friendRequests ?? [])],
        }));
        return "added";
      },
      addFriend: (friend) =>
        patch((p) => ({
          ...p,
          friends: (p.friends ?? []).some((existing) => existing.id === friend.id)
            ? (p.friends ?? [])
            : [...(p.friends ?? []), friend],
          friendRequests: (p.friendRequests ?? []).filter((request) => request.id !== friend.id),
        })),

      isNameTaken: (name) => {
        const q = name.trim().toLowerCase();
        if (!q) return false;
        if (q === (state.user?.name ?? "").trim().toLowerCase()) return false;
        return [...globalPlayers, ...friends, ...(state.friendRequests ?? [])].some(
          (p) => p.name.trim().toLowerCase() === q,
        );
      },
      nameCooldownDaysLeft: (() => {
        const changedAt = state.savedAccount?.last_name_change ?? state.nameChangedAt;
        if (!changedAt) return 0;
        const elapsed = Date.now() - changedAt;
        const total = 3 * 86_400_000;
        return elapsed >= total ? 0 : Math.ceil((total - elapsed) / 86_400_000);
      })(),
      usernameCooldownDaysLeft: (() => {
        const changedAt = state.savedAccount?.last_username_change;
        if (!changedAt) return 0;
        const elapsed = Date.now() - changedAt;
        const total = 10 * 86_400_000;
        return elapsed >= total ? 0 : Math.ceil((total - elapsed) / 86_400_000);
      })(),
      isHandleAvailable: (handle) => {
        const normalized = handle.trim().toLowerCase();
        if (!normalized) return false;
        const currentHandle = state.user?.handle ?? state.savedAccount?.handle ?? "";
        if (normalized === currentHandle.trim().toLowerCase()) return true;
        const knownHandle = [...globalPlayers, ...friends].some(
          (player) =>
            ((player as Player & { handle?: string }).handle ?? "").trim().toLowerCase() ===
            normalized,
        );
        if (knownHandle) return false;
        if (typeof window === "undefined") return true;
        for (let index = 0; index < window.localStorage.length; index += 1) {
          const key = window.localStorage.key(index);
          if (!key?.startsWith("user_") || !key.endsWith("_app_state")) continue;
          try {
            const stored = JSON.parse(window.localStorage.getItem(key) ?? "") as Partial<State>;
            const storedHandle = stored.user?.handle ?? stored.savedAccount?.handle ?? "";
            if (
              storedHandle.trim().toLowerCase() === normalized &&
              stored.user?.id !== state.user?.id
            ) {
              return false;
            }
          } catch {
            // Ignore unrelated local storage entries.
          }
        }
        return true;
      },
      updateProfile: ({ name, avatar, handle, bio }) =>
        patch((p) => {
          if (!p.user) return p;
          const nameChanged = !!name && name !== p.user.name;
          const usernameChanged =
            handle !== undefined && handle.trim() !== (p.user.handle ?? "").trim();
          const changedAt = Date.now();
          const lastNameChange = p.savedAccount?.last_name_change ?? p.nameChangedAt;
          const lastUsernameChange = p.savedAccount?.last_username_change;
          const nameChangeAllowed =
            !nameChanged || !lastNameChange || changedAt - lastNameChange >= 3 * 86_400_000;
          const usernameChangeAllowed =
            !usernameChanged ||
            !lastUsernameChange ||
            changedAt - lastUsernameChange >= 10 * 86_400_000;
          const nextName = nameChanged && !nameChangeAllowed ? p.user.name : (name ?? p.user.name);
          const nextHandle =
            usernameChanged && !usernameChangeAllowed
              ? (p.user.handle ?? "")
              : (handle ?? p.user.handle ?? "");
          return {
            ...p,
            user: {
              ...p.user,
              name: nextName,
              handle: nextHandle,
              bio: bio ?? p.user.bio ?? "",
              avatar: avatar ?? p.user.avatar,
            },
            savedAccount: p.savedAccount
              ? {
                  ...p.savedAccount,
                  name: nextName,
                  handle: nextHandle,
                  bio: bio ?? p.savedAccount.bio ?? "",
                  last_name_change:
                    nameChanged && nameChangeAllowed ? changedAt : p.savedAccount.last_name_change,
                  last_username_change:
                    usernameChanged && usernameChangeAllowed
                      ? changedAt
                      : p.savedAccount.last_username_change,
                }
              : p.savedAccount,
            nameChangedAt: nameChanged && nameChangeAllowed ? changedAt : p.nameChangedAt,
          };
        }),
      deleteAccount: async () => {
        const accountId = state.user?.id;
        let deletionError: unknown = null;

        try {
          if (supabase && accountId) {
            const { error: requestsError } = await supabase
              .from("friend_requests")
              .delete()
              .or(`sender_id.eq.${accountId},receiver_id.eq.${accountId}`);
            if (requestsError) throw requestsError;

            const { error: profileError } = await supabase
              .from("profiles")
              .delete()
              .eq("id", accountId);
            if (profileError) throw profileError;
          }
        } catch (error) {
          deletionError = error;
          console.error("Account deletion error:", error);
        } finally {
          if (supabase) {
            const { error: signOutError } = await supabase.auth.signOut();
            if (signOutError) console.error("Supabase sign-out error:", signOutError);
          }
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
        }

        if (deletionError) {
          throw deletionError;
        }
      },

      register: (name, password, birth_year, city, suppliedId) => {
        const id = suppliedId ?? accountIdFor(name);
        if (!name.trim() || !password || localStorage.getItem(userStorageKey(id, "app_state"))) {
          return false;
        }
        setState(() => {
          localStorage.setItem(ACTIVE_SESSION_KEY, id);
          return {
            ...seedState(),
            user: {
              id,
              name,
              handle: "",
              birth_year,
              city,
              avatar: avatarFor(name || "me"),
              points: 0,
              gold: 75,
              games_played: 0,
              wins: 0,
            },
            savedAccount: { id, name, handle: "", birth_year, city, password },
          };
        });
        return true;
      },
      loginWithProfile: (profile, password) => {
        const id = profile.id;
        const gamesPlayed = profile.games_played ?? 0;
        setState(() => ({
          ...seedState(),
          user: {
            id,
            name: profile.username,
            birth_year: profile.birth_year ?? undefined,
            city: profile.city ?? undefined,
            avatar: profile.avatar_url || avatarFor(profile.username),
            points: profile.points ?? 0,
            gold: profile.gold ?? 75,
            games_played: gamesPlayed,
            wins: profile.wins ?? 0,
          },
          gold: profile.gold ?? 75,
          savedAccount: {
            id,
            name: profile.username,
            birth_year: profile.birth_year ?? undefined,
            city: profile.city ?? undefined,
            password,
          },
        }));
        localStorage.setItem(ACTIVE_SESSION_KEY, id);
      },
      login: (name, password) => {
        const id = accountIdFor(name);
        let stored: Partial<State> = {};
        try {
          const raw = localStorage.getItem(userStorageKey(id, "app_state"));
          if (raw) stored = JSON.parse(raw) as Partial<State>;
        } catch {
          return false;
        }
        if (!stored.user || stored.savedAccount?.password !== password) return false;
        const isProMember =
          localStorage.getItem(userStorageKey(id, "isPro")) === "true" ||
          stored.isProMember === true;
        setState(() => ({
          ...seedState(),
          ...stored,
          isProMember,
          user: {
            id,
            name,
            handle: stored.user?.handle ?? stored.savedAccount?.handle ?? "",
            birth_year: stored.user?.birth_year ?? stored.savedAccount?.birth_year,
            city: stored.user?.city ?? stored.savedAccount?.city,
            avatar: avatarFor(name || "me"),
            points: stored.user?.points ?? 1840,
            games_played: stored.user?.games_played ?? 62,
            wins: stored.user?.wins ?? 35,
          },
          savedAccount: {
            id,
            name,
            handle: stored.user?.handle ?? stored.savedAccount?.handle ?? "",
            birth_year: stored.savedAccount?.birth_year ?? stored.user?.birth_year,
            city: stored.savedAccount?.city ?? stored.user?.city,
            password,
          },
        }));
        localStorage.setItem(ACTIVE_SESSION_KEY, id);
        return true;
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
            isProMember:
              localStorage.getItem(userStorageKey(id, "isPro")) === "true" ||
              stored.isProMember === true,
            equippedProFrame:
              localStorage.getItem(userStorageKey(id, "equippedProFrame")) ??
              stored.equippedProFrame ??
              null,
            equippedProBanner:
              localStorage.getItem(userStorageKey(id, "equippedProBanner")) ??
              stored.equippedProBanner ??
              null,
            user: {
              id,
              name,
              handle: stored.user?.handle ?? stored.savedAccount?.handle ?? "",
              birth_year: stored.user?.birth_year ?? stored.savedAccount?.birth_year,
              city: stored.user?.city ?? stored.savedAccount?.city,
              avatar: avatarFor(name),
              points: 1840,
              games_played: 62,
              wins: 35,
            },
            savedAccount: {
              id,
              name,
              handle: stored.user?.handle ?? stored.savedAccount?.handle ?? "",
              birth_year: stored.savedAccount?.birth_year ?? stored.user?.birth_year,
              city: stored.savedAccount?.city ?? stored.user?.city,
              password: stored.savedAccount?.password,
            },
          };
        }),
      logout: () => {
        localStorage.removeItem(ACTIVE_SESSION_KEY);
        setState(seedState());
      },
      setOnline: (v) => patch((p) => ({ ...p, online: v })),
      setHideFollowing: (hidden) =>
        patch((p) => ({
          ...p,
          savedAccount: p.savedAccount
            ? { ...p.savedAccount, hideFollowing: hidden }
            : p.savedAccount,
        })),
      setHideProfileDetails: (hidden) =>
        patch((p) => ({
          ...p,
          savedAccount: p.savedAccount
            ? { ...p.savedAccount, hideProfileDetails: hidden }
            : p.savedAccount,
        })),
      isUsernameAvailable: (name) => {
        const normalized = name.trim();
        return (
          Boolean(normalized) &&
          !localStorage.getItem(userStorageKey(accountIdFor(normalized), "app_state"))
        );
      },
      updatePassword: (password) => {
        if (!state.savedAccount || password.length < 8) return false;
        const changedAt = state.savedAccount.lastPasswordChangedAt ?? 0;
        if (changedAt && Date.now() - changedAt < 10 * 86_400_000) return false;
        patch((p) => ({
          ...p,
          savedAccount: {
            ...p.savedAccount!,
            password,
            lastPasswordChangedAt: Date.now(),
          },
        }));
        return true;
      },
      linkEmail: (email) =>
        patch((p) => ({
          ...p,
          savedAccount: p.savedAccount ? { ...p.savedAccount, email } : p.savedAccount,
        })),
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
          unlockedStickerSlots: [...(p.unlockedStickerSlots ?? []), slotIndex].sort(
            (a, b) => a - b,
          ),
        }));
        return true;
      },
      sendDirect: async (friendId, text, imageUrl) => {
        const senderId = state.user?.id;
        const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const messageText = typeof text === "string" ? text : "";
        const messageImage = typeof imageUrl === "string" && imageUrl ? imageUrl : undefined;
        patch((p) => {
          const directMessages =
            p.directMessages && typeof p.directMessages === "object" ? p.directMessages : {};
          const existingMessages = Array.isArray(directMessages[friendId])
            ? directMessages[friendId]
            : [];
          return {
            ...p,
            directMessages: {
              ...directMessages,
              [friendId]: [
                ...existingMessages,
                { id: tempId, text: messageText, senderId: senderId ?? "me", imageUrl: messageImage, at: Date.now() },
              ],
            },
          };
        });
        if (!supabase || !senderId) return;
        const { data, error } = await supabase
          .from("direct_messages")
          .insert({ sender_id: senderId, receiver_id: friendId, body: messageText, image_url: messageImage })
          .select("id, sender_id, receiver_id, body, image_url, read_at, reaction, created_at")
          .single();
        if (error || !data) {
          console.error("Supabase message send error:", error);
          patch((p) => ({
            ...p,
            directMessages: {
              ...p.directMessages,
              [friendId]: (p.directMessages[friendId] ?? []).filter((message) => message.id !== tempId),
            },
          }));
          return;
        }
        const savedMessage = data as DatabaseMessage;
        const persistedMessage: Message = {
          id: savedMessage.id,
          senderId: savedMessage.sender_id,
          text: savedMessage.body,
          imageUrl: savedMessage.image_url ?? undefined,
          at: new Date(savedMessage.created_at).getTime(),
          reaction: savedMessage.reaction ?? undefined,
        };
        patch((p) => {
          const existing = p.directMessages[friendId] ?? [];
          if (existing.some((message) => message.id === persistedMessage.id)) {
            return {
              ...p,
              directMessages: {
                ...p.directMessages,
                [friendId]: existing.filter((message) => message.id !== tempId),
              },
            };
          }
          return {
            ...p,
            directMessages: {
              ...p.directMessages,
              [friendId]: existing.map((message) =>
                message.id === tempId ? persistedMessage : message,
              ),
            },
          };
        });
      },
      reactToMessage: (messageId, reaction) => {
        const reactionValue = reaction || null;
        patch((p) => ({
          ...p,
          directMessages: Object.fromEntries(
            Object.entries(p.directMessages).map(([friendId, messages]) => [
              friendId,
              messages.map((message) =>
                message.id === messageId ? { ...message, reaction: reactionValue ?? undefined } : message,
              ),
            ]),
          ),
        }));
        if (!supabase) return;
        void supabase.from("direct_messages").update({ reaction: reactionValue }).eq("id", messageId);
      },
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
      markRead: (chatId) => {
        const readTimestamp = Date.now();
        const accountId = state.user?.id;
        patch((p) => ({
          ...p,
          readAt: { ...p.readAt, [chatId]: readTimestamp },
          directMessages: {
            ...p.directMessages,
            [chatId]: (p.directMessages[chatId] ?? []).map((message) =>
              message.senderId !== accountId && message.senderId !== "me" && message.at <= readTimestamp
                ? { ...message, readAt: readTimestamp }
                : message,
            ),
          },
        }));
        if (!supabase || !accountId) return;
        void supabase
          .from("direct_messages")
          .update({ read_at: new Date(readTimestamp).toISOString() })
          .eq("sender_id", chatId)
          .eq("receiver_id", accountId)
          .is("read_at", null);
      },
      blockFriend: (friendId) =>
        patch((p) => {
          const directMessages = { ...p.directMessages };
          delete directMessages[friendId];
          const readAt = { ...p.readAt };
          delete readAt[friendId];
          if (supabase && p.user?.id) {
            void supabase
              .from("friend_requests")
              .delete()
              .or(`and(sender_id.eq.${p.user.id},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${p.user.id})`);
          }
          return {
            ...p,
            blockedIds: p.blockedIds.includes(friendId)
              ? p.blockedIds
              : [...p.blockedIds, friendId],
            friends: p.friends.filter((friend) => friend.id !== friendId),
            directMessages,
            readAt,
          };
        }),
      removeFriend: (friendId) =>
        patch((p) => {
          const directMessages = { ...p.directMessages };
          delete directMessages[friendId];
          const readAt = { ...p.readAt };
          delete readAt[friendId];
          if (supabase && p.user?.id) {
            void supabase
              .from("friend_requests")
              .delete()
              .or(`and(sender_id.eq.${p.user.id},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${p.user.id})`);
          }
          return {
            ...p,
            friends: p.friends.filter((friend) => friend.id !== friendId),
            directMessages,
            readAt,
          };
        }),
      unblockFriend: (friendId) =>
        patch((p) => {
          const directMessages = { ...p.directMessages };
          delete directMessages[friendId];
          const readAt = { ...p.readAt };
          delete readAt[friendId];
          return {
            ...p,
            blockedIds: p.blockedIds.filter((id) => id !== friendId),
            friends: p.friends.filter((friend) => friend.id !== friendId),
            directMessages,
            readAt,
          };
        }),
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
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}
