import { createFileRoute } from "@tanstack/react-router";
import {
  Component,
  useEffect,
  useRef,
  useState,
  type ErrorInfo,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  ArrowRight,
  Ban,
  Check,
  Copy,
  LogOut,
  Plus,
  Send,
  UserPlus,
  Users,
  X,
  Image,
} from "lucide-react";
import { toast } from "sonner";
import { formatTime, useApp, type Friend, type Group } from "@/lib/app-store";
import { useHideChrome } from "@/components/chrome";
import { PlayerProfileSheet } from "@/components/PlayerProfileSheet";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env["VITE_SUPABASE_URL"] || "";
const supabaseKey = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] || "";
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

type DatabaseFriendRequest = { requestId: string; friend: Friend; status: string };

export const Route = createFileRoute("/app/friends")({
  head: () => ({
    meta: [
      { title: "هاوڕێکان — مار و پەیژە" },
      { name: "description", content: "چاتی تایبەت و گروپی لەگەڵ هاوڕێکانت." },
      { property: "og:title", content: "هاوڕێکان — مار و پەیژە" },
      { property: "og:description", content: "چات و گروپەکانت لە یاری مار و پەیژە." },
    ],
  }),
  component: FriendsRoute,
});

type View = "friends" | "groups";

const DEFAULT_PROFILE_IMAGE = "/default-avatar.svg";

const handleProfileImageError = (event: React.SyntheticEvent<HTMLImageElement>) => {
  event.currentTarget.onerror = null;
  event.currentTarget.src = DEFAULT_PROFILE_IMAGE;
};

function renderProfilePic(
  profile:
    { avatar?: unknown; avatar_url?: unknown; id?: unknown; name?: unknown } | null | undefined,
): string {
  const value = profile?.avatar_url ?? profile?.avatar;
  if (typeof value !== "string" || !value.trim()) return DEFAULT_PROFILE_IMAGE;
  const image = value.trim();
  if (/^(https?:\/\/|data:image\/)/i.test(image)) return image;
  if (image.startsWith("/")) return image;
  return `/avatars/${encodeURIComponent(image)}.png`;
}

type FriendsBoundaryState = { error: Error | null; retryKey: number };

class FriendsErrorBoundary extends Component<{ children: ReactNode }, FriendsBoundaryState> {
  override state: FriendsBoundaryState = { error: null, retryKey: 0 };

  static getDerivedStateFromError(error: Error): FriendsBoundaryState {
    return { error, retryKey: 0 };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Friends route crashed", error, info.componentStack);
  }

  retry = () => {
    this.setState((previous) => ({ error: null, retryKey: previous.retryKey + 1 }));
  };

  override render() {
    if (this.state.error) {
      return (
        <section className="flex min-h-screen items-center justify-center px-6 pb-32 text-center">
          <div className="glass-strong w-full max-w-sm rounded-3xl p-6">
            <h1 className="text-lg font-extrabold">نەتوانرا هاوڕێیان لۆد بکرێت</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              داتاکانی هاوڕێکان بە شێوەیەکی چاوەڕواننەکراو هاتن.
            </p>
            <button
              onClick={this.retry}
              className="press mt-5 rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground"
            >
              دووبارە هەوڵدانەوە
            </button>
            <details className="mt-5 text-left">
              <summary className="cursor-pointer text-xs font-semibold text-muted-foreground">
                وردەکاریی تەکنیکی
              </summary>
              <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap rounded-lg bg-black/10 p-3 text-[10px] text-destructive">
                {this.state.error.message}
                {this.state.error.stack ? `\n\n${this.state.error.stack}` : ""}
              </pre>
            </details>
          </div>
        </section>
      );
    }
    return <div key={this.state.retryKey}>{this.props.children}</div>;
  }
}

function FriendsRoute() {
  return (
    <FriendsErrorBoundary>
      <FriendsTab />
    </FriendsErrorBoundary>
  );
}

function FriendsTab() {
  const { addFriend, visibleFriends, directMessages, unreadFor, user } = useApp();
  const safeFriends = Array.isArray(visibleFriends) ? visibleFriends.filter(Boolean) : [];
  const [databaseRequests, setDatabaseRequests] = useState<DatabaseFriendRequest[]>([]);
  const [view, setView] = useState<View>("friends");
  const [openFriend, setOpenFriend] = useState<Friend | null>(null);
  const [openGroup, setOpenGroup] = useState<Group | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<Friend | null>(null);
  const [creating, setCreating] = useState(false);
  const [requestsOpen, setRequestsOpen] = useState(false);
  const [popup, setPopup] = useState<{ type: "friend" | "group"; id: string } | null>(null);

  useEffect(() => {
    if (!supabase || !user?.id) {
      setDatabaseRequests([]);
      return;
    }
    let cancelled = false;
    const loadRequests = async () => {
      const { data } = await supabase
        .from("friend_requests")
        .select(
          "id, sender_id, status, profiles:sender_id(username, avatar_url, city, birth_year, online, points, gold, games_played, wins, losses)",
        )
        .eq("receiver_id", user.id)
        .eq("status", "pending");
      if (cancelled) return;
      const requests = (data ?? []).flatMap((row) => {
        const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
        if (!profile) return [];
        const gamesPlayed = Number(profile.games_played ?? 0);
        const friend: Friend = {
          id: String(row.sender_id),
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
        };
        return [{ requestId: String(row.id), friend, status: String(row.status) }];
      });
      setDatabaseRequests(requests);
    };
    void loadRequests();
    const channel = supabase
      .channel(`friend-requests:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "friend_requests",
          filter: `receiver_id=eq.${user.id}`,
        },
        () => void loadRequests(),
      )
      .subscribe();
    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const safeRequests = databaseRequests;

  return (
    <section className="min-h-screen px-4 pt-[max(4.5rem,calc(env(safe-area-inset-top)+3.5rem))] pb-32">
      <button
        onClick={() => setCreating(true)}
        aria-label="دروستکردنی گروپ"
        className="glass press absolute top-[max(1rem,env(safe-area-inset-top))] right-4 flex size-11 items-center justify-center rounded-full"
      >
        <Plus className="size-5 text-primary" />
      </button>

      <button
        onClick={() => setRequestsOpen(true)}
        aria-label="هاوڕێی نوێ"
        className="glass press absolute top-[max(1rem,env(safe-area-inset-top))] left-4 flex size-11 items-center justify-center rounded-full"
      >
        <UserPlus className="size-5 text-primary" />
        {safeRequests.length > 0 && (
          <span className="absolute -top-1 -right-1 flex min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
            {safeRequests.length}
          </span>
        )}
      </button>

      <div className="glass relative mb-5 flex rounded-2xl p-1">
        <span
          className="absolute inset-y-1 w-[calc(50%-0.25rem)] rounded-xl bg-primary shadow-[var(--shadow-glow)] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{ transform: view === "friends" ? "translateX(0)" : "translateX(-100%)" }}
        />
        {(["friends", "groups"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`relative z-10 flex-1 rounded-xl py-2.5 text-sm font-bold transition-colors ${
              view === v ? "text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            {v === "friends" ? "هاوڕێکان" : "گروپەکان"}
          </button>
        ))}
      </div>

      {view === "friends" ? (
        <div className="space-y-3">
          {safeFriends.map((f) => {
            if (!f?.id) return null;
            const unread = unreadFor?.(f.id) ?? 0;
            const latestMessage = directMessages?.[f.id]?.at(-1);
            return (
              <div
                key={f.id}
                className="glass animate-rise-in flex items-center gap-3 rounded-2xl p-3"
              >
                <button
                  onClick={() => f?.id && setOpenFriend(f)}
                  className="press relative"
                  aria-label={`چاتی ${f.name}`}
                >
                  <img
                    src={renderProfilePic(f)}
                    onError={handleProfileImageError}
                    alt={f.name ?? "هاوڕێ"}
                    className="size-12 rounded-full bg-secondary"
                  />
                  {f.online !== false && (
                    <span
                      aria-label="سەرهێڵ"
                      className="absolute bottom-0 right-0 size-3 rounded-full bg-green-500 ring-2 ring-background"
                    />
                  )}
                </button>
                <button
                  onClick={() => f?.id && setOpenFriend(f)}
                  className="press min-w-0 flex-1 text-right"
                >
                  <p className="font-bold">{f.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {latestMessage?.text?.trim() ||
                      (latestMessage?.imageUrl ? "وێنە" : "هیچ نامەیەک نییە")}
                  </p>
                </button>
                <div className="flex w-8 shrink-0 items-center justify-center" aria-label="نامەی نوێ">
                  {unread > 0 && (
                    <span className="flex size-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                      {unread > 99 ? "99+" : unread}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
          {safeFriends.length === 0 && (
            <p className="pt-10 text-center text-sm text-muted-foreground">هیچ هاوڕێیەک نییە</p>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-center h-64">
          <p className="text-xl font-bold text-gray-400">کاری لەسەر دەکرێت</p>
        </div>
      )}

      {popup && <ActionPopup popup={popup} onClose={() => setPopup(null)} />}
      {requestsOpen && (
        <FriendRequests
          requests={databaseRequests}
          onClose={() => setRequestsOpen(false)}
          onStatusChange={(requestId, status, friend) => {
            if (status === "accepted" || status === "rejected") {
              if (status === "accepted") addFriend(friend);
              setDatabaseRequests((requests) =>
                requests.filter((request) => request.requestId !== requestId),
              );
            }
          }}
        />
      )}
      {creating && <ConstructionNotice onClose={() => setCreating(false)} />}
      {openFriend?.id && <DirectChat friend={openFriend} onClose={() => setOpenFriend(null)} />}
      {openGroup?.id && <GroupChat group={openGroup} onClose={() => setOpenGroup(null)} />}
      {selectedProfile?.id && (
        <PlayerProfileSheet
          player={selectedProfile}
          followersCount={safeFriends.length}
          followingCount={safeFriends.length}
          allowFriendRequest
          onMessage={() => {
            setSelectedProfile(null);
            setOpenFriend(selectedProfile);
          }}
          onClose={() => setSelectedProfile(null)}
        />
      )}
    </section>
  );
}

function ActionPopup({
  popup,
  onClose,
}: {
  popup: { type: "friend" | "group"; id: string };
  onClose: () => void;
}) {
  const { blockFriend, leaveGroup } = useApp();
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 px-10"
      onClick={onClose}
    >
      <div
        className="glass-strong animate-soft-in w-full max-w-xs rounded-3xl p-4"
        onClick={(e) => e.stopPropagation()}
      >
        {popup.type === "friend" ? (
          <button
            onClick={() => {
              blockFriend(popup.id);
              toast.success("بلۆک کرا");
              onClose();
            }}
            className="press flex w-full items-center justify-center gap-2 rounded-2xl bg-destructive/20 py-3 font-bold text-destructive"
          >
            <Ban className="size-5" />
            بلۆککردن
          </button>
        ) : (
          <button
            onClick={() => {
              leaveGroup(popup.id);
              toast.success("گروپەکە جێهێشترا");
              onClose();
            }}
            className="press flex w-full items-center justify-center gap-2 rounded-2xl bg-destructive/20 py-3 font-bold text-destructive"
          >
            <LogOut className="size-5" />
            جێهێشتنی گروپ
          </button>
        )}
      </div>
    </div>
  );
}

function ConstructionNotice({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 px-4"
      onClick={onClose}
    >
      <div
        className="glass-strong animate-soft-in rounded-3xl px-8 py-6"
        onClick={(event) => event.stopPropagation()}
      >
        <p className="text-xl font-bold">کاری لەسەر دەکرێت</p>
      </div>
    </div>
  );
}

function ChatBubble({
  mine,
  text,
  at,
  author,
  accent,
  imageUrl,
  reaction,
  messageId,
  onReaction,
}: {
  mine: boolean;
  text?: string;
  at?: number;
  author?: string | undefined;
  accent?: boolean;
  imageUrl?: string | undefined;
  reaction?: string | undefined;
  messageId?: string;
  onReaction?: (messageId: string, reaction: string) => void;
}) {
  const safeText = typeof text === "string" ? text : "";
  const codeMatch = /^\d{6}$/.test(safeText.trim());
  const { joinGroupByCode } = useApp();
  const [reactionMenuOpen, setReactionMenuOpen] = useState(false);
  const [pressed, setPressed] = useState(false);
  const pressTimer = useRef<number | null>(null);
  const reactions = ["🤣", "❤️", "🥰", "😁", "💓", "👍", "🫂", "🔥"];
  const clearPressTimer = () => {
    if (pressTimer.current !== null) window.clearTimeout(pressTimer.current);
    pressTimer.current = null;
  };
  const startLongPress = () => {
    clearPressTimer();
    pressTimer.current = window.setTimeout(() => {
      setPressed(true);
      setReactionMenuOpen(true);
    }, 400);
  };
  const chooseReaction = (nextReaction: string) => {
    if (messageId) onReaction?.(messageId, nextReaction);
    setReactionMenuOpen(false);
    setPressed(false);
  };

  return (
    <div className={`flex flex-col ${mine ? "items-start" : "items-end"}`}>
      {author && <span className="mb-0.5 text-[10px] text-panel-muted">{author}</span>}
      <div className="relative max-w-[75%]">
        {reactionMenuOpen && (
          <div className="absolute bottom-full z-20 mb-2 flex items-center gap-1 rounded-full border border-white/15 bg-background/80 px-2 py-1.5 shadow-xl backdrop-blur-md">
            {reactions.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => chooseReaction(emoji)}
                className="flex size-8 items-center justify-center rounded-full text-lg transition-transform hover:scale-125"
                aria-label={`react ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
        <div
          onPointerDown={startLongPress}
          onPointerUp={clearPressTimer}
          onPointerLeave={clearPressTimer}
          onDoubleClick={() => chooseReaction("❤️")}
          className={`rounded-2xl px-3.5 py-2.5 text-sm transition-transform duration-200 ${pressed ? "scale-[1.04]" : ""} ${
          mine
            ? "bg-primary text-primary-foreground"
            : accent
              ? "bg-accent/25 text-panel-foreground"
              : "bg-panel-foreground/5 text-panel-foreground"
          }`}
        >
        {imageUrl && (
          <img
            src={imageUrl}
            alt="attachment"
            className="mb-2 max-h-48 w-full rounded-xl object-cover"
          />
        )}
        {codeMatch ? (
          <button
            onClick={() => {
              const g = joinGroupByCode?.(safeText.trim());
              toast.success(g ? `چوویتە ناو ${g.name}` : "کۆدەکە دروست نییە");
            }}
            className="font-bold text-emerald-glow underline"
          >
            {safeText}
          </button>
        ) : (
          safeText
        )}
          {reaction && (
            <span className="absolute -bottom-3 right-2 animate-soft-in rounded-full border border-background bg-background px-1.5 py-0.5 text-sm shadow-md">
              {reaction}
            </span>
          )}
        </div>
      </div>
      <span className="mt-1 text-[10px] text-panel-muted">
        {formatTime(typeof at === "number" ? at : Date.now())}
      </span>
    </div>
  );
}

function Composer({
  onSend,
  allowImages = false,
}: {
  onSend: (text: string, imageUrl?: string) => void;
  allowImages?: boolean;
}) {
  const [text, setText] = useState("");
  const [imageUrl, setImageUrl] = useState<string | undefined>();
  const fileRef = useRef<HTMLInputElement>(null);
  const canSend = text.trim() || imageUrl;
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSend) return;
    try {
      onSend(text.trim(), imageUrl);
      setText("");
      setImageUrl(undefined);
    } catch (error) {
      console.error("Unable to send chat message", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 pt-3">
      {allowImages && (
        <>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () => setImageUrl(String(reader.result));
              reader.readAsDataURL(file);
            }}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            aria-label="ناردنی وێنە"
            className="press flex size-11 items-center justify-center rounded-full border border-yellow-400/50 text-yellow-500"
          >
            <Image className="size-5" />
          </button>
        </>
      )}
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="نامەیەک بنووسە..."
        className="flex-1 rounded-2xl border border-panel-border bg-panel-foreground/5 px-4 py-3 text-sm text-panel-foreground outline-none placeholder:text-panel-muted focus:border-primary"
      />
      {canSend && (
        <button
          type="submit"
          aria-label="ناردن"
          className="press animate-soft-in flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground"
        >
          <Send className="size-5 -scale-x-100" />
        </button>
      )}
    </form>
  );
}

function DirectChat({ friend, onClose }: { friend: Friend; onClose: () => void }) {
  const { directMessages, sendDirect, markRead, reactToMessage, isProMember, user } = useApp();
  useHideChrome();
  const friendId = friend?.id;
  const messages =
    friendId && directMessages && typeof directMessages === "object"
      ? Array.isArray(directMessages[friendId])
        ? directMessages[friendId]
        : []
      : [];
  useEffect(() => {
    if (!friendId) return;
    try {
      markRead?.(friendId);
    } catch {
      // Keep an invalid persisted chat from taking down the route.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [friendId]);

  if (!friendId) {
    return <EmptyChat onClose={onClose} label="هاوڕێیەک هەڵبژێرە" />;
  }

  return (
    <div className="panel animate-soft-in fixed inset-0 z-50 flex w-screen flex-col px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="flex items-center justify-between pb-3">
        <div className="flex items-center gap-3">
          <img
            src={renderProfilePic(friend)}
            onError={handleProfileImageError}
            alt={friend?.name ?? "هاوڕێ"}
            className="size-10 rounded-full bg-secondary"
          />
          <span className="font-bold text-panel-foreground">{friend?.name ?? "هاوڕێ"}</span>
        </div>
        <button
          onClick={onClose}
          aria-label="گەڕانەوە"
          className="press flex size-11 items-center justify-center rounded-full border border-panel-border bg-panel-foreground/5 text-panel-foreground"
        >
          <ArrowRight className="size-5" />
        </button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto no-scrollbar py-2">
        {messages.length > 0 ? (
          messages.map((m) =>
            m?.id ? (
              <ChatBubble
                key={m.id}
                mine={m?.senderId === user?.id || m?.senderId === "me"}
                text={m?.text ?? ""}
                imageUrl={m?.imageUrl ?? undefined}
                at={m?.at}
                reaction={m?.reaction}
                messageId={m?.id}
                onReaction={reactToMessage}
              />
            ) : null,
          )
        ) : (
          <p className="pt-10 text-center text-sm text-panel-muted">هیچ نامەیەک نییە</p>
        )}
      </div>

      <Composer
        allowImages={isProMember}
        onSend={(t, imageUrl) => sendDirect(friend.id, t, imageUrl)}
      />
    </div>
  );
}

function EmptyChat({ onClose, label }: { onClose: () => void; label: string }) {
  useHideChrome();
  return (
    <div className="panel animate-soft-in fixed inset-0 z-50 flex flex-col items-center justify-center px-6 text-center">
      <p className="text-sm text-panel-muted">{label}</p>
      <button
        onClick={onClose}
        className="press mt-5 rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground"
      >
        گەڕانەوە
      </button>
    </div>
  );
}

function GroupChat({ group, onClose }: { group: Group; onClose: () => void }) {
  const { groupMessages, sendGroup, friends } = useApp();
  useHideChrome();
  const groupId = group?.id;
  const messages =
    groupId &&
    groupMessages &&
    typeof groupMessages === "object" &&
    Array.isArray(groupMessages[groupId])
      ? groupMessages[groupId]
      : [];
  const safeFriends = Array.isArray(friends) ? friends : [];
  const nameOf = (id: string) => safeFriends.find((f) => f?.id === id)?.name ?? "ئەندام";

  if (!groupId) return <EmptyChat onClose={onClose} label="گروپێک هەڵبژێرە" />;

  return (
    <div className="panel animate-soft-in fixed inset-0 z-50 flex w-screen flex-col px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="flex items-center justify-between pb-3">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-full bg-accent/30">
            <Users className="size-5 text-accent" />
          </span>
          <div>
            <p className="font-bold text-panel-foreground">{group?.name ?? "گروپ"}</p>
            <button
              onClick={() => {
                if (group?.code) navigator.clipboard?.writeText(group.code).catch(() => {});
                toast.success("کۆدەکە کۆپی کرا");
              }}
              className="text-xs font-bold text-emerald-700"
            >
              {group?.code ?? ""}
            </button>
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="گەڕانەوە"
          className="press flex size-11 items-center justify-center rounded-full border border-panel-border bg-panel-foreground/5 text-panel-foreground"
        >
          <ArrowRight className="size-5" />
        </button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto no-scrollbar py-2">
        {messages.length > 0 ? (
          messages.map((m) =>
            m?.id ? (
              <ChatBubble
                key={m.id}
                mine={m.senderId === "me"}
                text={m.text}
                at={m.at}
                accent
                author={m.senderId === "me" ? undefined : nameOf(m.senderId)}
              />
            ) : null,
          )
        ) : (
          <p className="pt-10 text-center text-sm text-panel-muted">هیچ نامەیەک نییە</p>
        )}
      </div>

      <Composer onSend={(t) => sendGroup(group.id, t)} />
    </div>
  );
}

function FriendRequests({
  requests,
  onClose,
  onStatusChange,
}: {
  requests: DatabaseFriendRequest[];
  onClose: () => void;
  onStatusChange: (requestId: string, status: "accepted" | "rejected", friend: Friend) => void;
}) {
  useHideChrome();

  return (
    <div className="panel animate-soft-in fixed inset-0 z-50 flex w-screen flex-col px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="flex items-center justify-between pb-4">
        <span className="w-11" />
        <h2 className="text-lg font-bold text-panel-foreground">هاوڕێی نوێ</h2>
        <button
          onClick={onClose}
          aria-label="گەڕانەوە"
          className="press flex size-11 items-center justify-center rounded-full border border-panel-border bg-panel-foreground/5 text-panel-foreground"
        >
          <ArrowRight className="size-5" />
        </button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto no-scrollbar">
        {requests.map(({ requestId, friend: r }, i) => (
          <div
            key={r.id}
            style={{ animationDelay: `${i * 50}ms` }}
            className="animate-rise-in flex items-center gap-3 rounded-2xl border border-panel-border bg-panel-foreground/5 p-3"
          >
            <img
              src={renderProfilePic(r)}
              onError={handleProfileImageError}
              alt={r.name ?? "هاوڕێ"}
              className="size-12 rounded-full bg-secondary"
            />
            <div className="flex-1 text-right">
              <p className="font-bold text-panel-foreground">{r.name}</p>
              <p className="text-xs text-panel-muted">{r.points} خاڵ</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (!supabase) return;
                  void supabase
                    .from("friend_requests")
                    .update({ status: "accepted" })
                    .eq("id", requestId)
                    .then(({ error }) => {
                      if (error) {
                        toast.error("نەتوانرا زیاد بکرێت");
                        return;
                      }
                      onStatusChange(requestId, "accepted", r);
                      toast.success("زیادکرا");
                    });
                }}
                aria-label="زیادکردن"
                className="press flex items-center gap-1 rounded-2xl border border-primary/40 bg-primary/15 px-3 py-2 text-sm font-bold text-emerald-700 backdrop-blur-md"
              >
                <Check className="size-4" />
                زیادکردن
              </button>
              <button
                onClick={() => {
                  if (!supabase) return;
                  void supabase
                    .from("friend_requests")
                    .update({ status: "rejected" })
                    .eq("id", requestId)
                    .then(({ error }) => {
                      if (error) {
                        toast.error("نەتوانرا ڕەت بکرێتەوە");
                        return;
                      }
                      onStatusChange(requestId, "rejected", r);
                      toast("ڕەتکرایەوە");
                    });
                }}
                aria-label="ڕەتکردنەوە"
                className="press flex items-center gap-1 rounded-2xl border border-destructive/40 bg-destructive/15 px-3 py-2 text-sm font-bold text-destructive backdrop-blur-md"
              >
                <X className="size-4" />
                ڕەتکردنەوە
              </button>
            </div>
          </div>
        ))}
        {requests.length === 0 && (
          <p className="pt-10 text-center text-sm text-panel-muted">هیچ داواکارییەک نییە</p>
        )}
      </div>
    </div>
  );
}
