import { useEffect, useState } from "react";
import { Check, MessageCircle, UserPlus, X } from "lucide-react";
import { toast } from "sonner";
import { useHideChrome } from "@/components/chrome";
import { formatHandle, useApp, type Friend, type Player } from "@/lib/app-store";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env["VITE_SUPABASE_URL"] || "";
const supabaseKey = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] || "";
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

type ProfilePlayer = Pick<
  Player | Friend,
  | "id"
  | "name"
  | "handle"
  | "bio"
  | "birth_year"
  | "city"
  | "online"
  | "avatar"
  | "games_played"
  | "wins"
  | "losses"
  | "gold"
>;

type PlayerProfileSheetProps = {
  player: ProfilePlayer;
  followersCount: number;
  followingCount: number;
  onClose: () => void;
  allowFriendRequest?: boolean;
  followingHidden?: boolean;
  onMessage?: () => void;
};

export function PlayerProfileSheet({
  player,
  followersCount,
  followingCount,
  onClose,
  allowFriendRequest = false,
  followingHidden = false,
  onMessage,
}: PlayerProfileSheetProps) {
  const { addFriend, visibleFriends, online, user, hideProfileDetails } = useApp();
  const isMe = player.id === "me" || player.id === user?.id;
  const birthYear = isMe ? user?.birth_year : player.birth_year;
  const city = isMe ? user?.city : player.city;
  const age = birthYear ? new Date().getFullYear() - Number(birthYear) : null;
  const profileDetails = city && age && age > 0 ? `${city} • ${age} ساڵ` : null;
  const bio = player.bio?.trim();
  const isOnline = isMe ? online : player.online !== false;
  const gamesPlayed = player.games_played ?? 0;
  const wins = player.wins ?? 0;
  const losses = player.losses ?? Math.max(0, gamesPlayed - wins);
  const gold = player.gold ?? 0;
  const canViewFollowing = isMe || !followingHidden;
  const [socialList, setSocialList] = useState<"followers" | "following" | null>(null);
  const [selectedSocialPlayer, setSelectedSocialPlayer] = useState<Friend | null>(null);
  const [copiedHandle, setCopiedHandle] = useState(false);
  const [requestStatus, setRequestStatus] = useState<
    "idle" | "pending" | "incoming" | "rejected" | "accepted"
  >("idle");
  const isFriend = visibleFriends.some((friend) => friend.id === player.id);

  useEffect(() => {
    if (!allowFriendRequest || isMe || isFriend || !player.id) return;
    let cancelled = false;
    const loadStatus = async () => {
      if (!supabase) {
        console.error("Supabase Error: Supabase client is not configured");
        return;
      }
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError) {
        console.error("Supabase Error:", authError.message);
        return;
      }
      if (!authUser?.id) {
        console.error("Supabase Error: authenticated user ID is missing");
        return;
      }
      const { data: outgoing } = await supabase
        .from("friend_requests")
        .select("status")
        .eq("sender_id", authUser.id)
        .eq("receiver_id", player.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      const { data: incoming } = await supabase
        .from("friend_requests")
        .select("id, status")
        .eq("sender_id", player.id)
        .eq("receiver_id", authUser.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      const status = incoming?.status === "pending" ? "incoming" : outgoing?.status;
      if (
        status === "pending" ||
        status === "incoming" ||
        status === "rejected" ||
        status === "accepted"
      ) {
        if (!cancelled) setRequestStatus(status);
      } else if (!cancelled) {
        setRequestStatus("idle");
      }
    };
    void loadStatus();
    const timer = window.setInterval(() => void loadStatus(), 5000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [allowFriendRequest, isFriend, isMe, player.id]);

  const sendFriendRequest = async () => {
    if (requestStatus === "pending") return;
    try {
      if (!supabase) throw new Error("Supabase client is not configured");
      if (!player.id || typeof player.id !== "string") {
        throw new Error("receiver_id is missing or invalid");
      }

      let authUserId: string | null = null;
      try {
        const {
          data: { user: authUser },
          error: authError,
        } = await supabase.auth.getUser();
        if (authError) {
          console.warn("Supabase auth session unavailable; using app session fallback", authError);
        }
        authUserId = authUser?.id ?? null;
      } catch (authError) {
        console.warn("Supabase auth session unavailable; using app session fallback", authError);
      }
      const currentUserId =
        user?.id ??
        localStorage.getItem("user_id") ??
        localStorage.getItem("userId") ??
        localStorage.getItem("snakes_ladders_active_session");
      const senderId = authUserId || currentUserId;
      if (!senderId) throw new Error("Current user ID is missing");

      const { data: existingPending, error: pendingLookupError } = await supabase
        .from("friend_requests")
        .select("id")
        .eq("sender_id", senderId)
        .eq("receiver_id", player.id)
        .eq("status", "pending")
        .limit(1)
        .maybeSingle();
      if (pendingLookupError) throw pendingLookupError;
      if (existingPending) {
        setRequestStatus("pending");
        return;
      }

      const { error } = await supabase.from("friend_requests").insert({
        sender_id: senderId,
        receiver_id: player.id,
        status: "pending",
        created_at: new Date().toISOString(),
      });
      if (error) throw error;

      setRequestStatus("pending");
      toast.success("داواکاری نێردرا");
    } catch (error) {
      console.error("Supabase Friend Request Error:", error);
      const message = error instanceof Error ? error.message : "Error details logged in console";
      alert(message || "Error details logged in console");
      toast.error("داواکاری نەنێردرا");
    }
  };
  const acceptIncomingRequest = async () => {
    if (!supabase || requestStatus !== "incoming") return;
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();
    if (!authUser) return;
    const { error } = await supabase
      .from("friend_requests")
      .update({ status: "accepted" })
      .eq("sender_id", player.id)
      .eq("receiver_id", authUser.id)
      .eq("status", "pending");
    if (error) {
      toast.error("نەتوانرا داواکارییەکە قبوڵ بکرێت");
      return;
    }
    addFriend(player as Friend);
    setRequestStatus("accepted");
    toast.success("هاوڕێ زیادکرا");
  };
  useHideChrome();

  return (
    <div
      className="fixed inset-0 z-50 flex min-h-screen flex-col bg-background/95"
      onClick={onClose}
    >
      <div
        className="panel animate-soft-in flex min-h-screen w-full flex-col overflow-y-auto px-5 pb-10 pt-[max(1rem,env(safe-area-inset-top))] shadow-[var(--shadow-glass)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="relative flex items-center justify-end">
          <h2 className="absolute left-1/2 -translate-x-1/2 text-lg font-extrabold text-panel-foreground">
            پرۆفایلی یاریزان
          </h2>
          <button
            onClick={onClose}
            aria-label="داخستن"
            className="press flex size-10 items-center justify-center rounded-full border border-panel-border bg-panel-foreground/5 text-panel-foreground"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="mt-5 flex flex-col items-center">
          <div className="relative">
            <img
              src={player.avatar}
              alt={player.name}
              className="size-24 rounded-full border-2 border-panel-border bg-panel-foreground/5"
            />
            {isOnline && (
              <span
                aria-label="سەرهێڵ"
                className="absolute bottom-1 right-1 size-4 rounded-full bg-green-500 ring-2 ring-panel"
              />
            )}
          </div>
          <h3 className="mt-3 text-xl font-extrabold text-panel-foreground">{player.name}</h3>
          {bio && (
            <p className="mx-auto mt-2 max-w-xs rounded-xl border border-emerald-500/30 bg-emerald-950/40 px-4 py-2 text-xs text-emerald-100">
              {bio}
            </p>
          )}
          {formatHandle(player.handle) && (
            <button
              type="button"
              onClick={async () => {
                const handle = formatHandle(player.handle);
                await navigator.clipboard?.writeText(handle);
                setCopiedHandle(true);
                window.setTimeout(() => setCopiedHandle(false), 2000);
              }}
              className="mt-1 flex items-center gap-1 text-xs text-panel-muted"
            >
              {formatHandle(player.handle)}
              {copiedHandle && <Check className="size-3 text-emerald-400" />}
            </button>
          )}
          {profileDetails && (isMe || !hideProfileDetails) && (
            <span className="mt-3 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              {profileDetails}
            </span>
          )}
        </div>

        {allowFriendRequest && !isMe && (
          <button
            type="button"
            onClick={() => {
              if (requestStatus === "incoming") {
                void acceptIncomingRequest();
                return;
              }
              if (isFriend || requestStatus === "accepted") {
                onMessage?.();
                return;
              }
              void sendFriendRequest();
            }}
            disabled={!isFriend && (requestStatus === "pending" || requestStatus === "accepted")}
            className={`press mx-auto mt-6 flex h-10 w-full max-w-xs items-center justify-center gap-2 rounded-xl px-5 font-bold transition-colors disabled:cursor-not-allowed ${requestStatus === "incoming" ? "bg-yellow-400 text-yellow-950 hover:bg-yellow-300" : isFriend || requestStatus === "accepted" ? "bg-red-600 text-white hover:bg-red-700" : requestStatus === "pending" ? "bg-zinc-700 text-zinc-300" : "bg-red-600 text-white hover:bg-red-700"}`}
          >
            {requestStatus === "incoming" ? (
              <Check className="size-4" />
            ) : isFriend || requestStatus === "accepted" ? (
              <MessageCircle className="size-4" />
            ) : (
              <UserPlus className="size-4" />
            )}
            {requestStatus === "incoming"
              ? "قبوڵکردنی داواکاری"
              : isFriend || requestStatus === "accepted"
                ? "نامەناردن"
                : requestStatus === "pending"
                  ? "داواکاری نێردراوە"
                  : "داوای هاوڕێتی"}
          </button>
        )}

        <div className="mt-6 grid grid-cols-3 gap-3">
          <ProfileStat label="یاری کراوەکان" value={gamesPlayed} />
          <ProfileStat label="دۆڕان" value={losses} />
          <ProfileStat label="زێڕ" value={gold} />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <button onClick={() => setSocialList("followers")}>
            <ProfileStat label="followers" value={followersCount} />
          </button>
          {canViewFollowing ? (
            <button onClick={() => setSocialList("following")}>
              <ProfileStat label="following" value={followingCount} />
            </button>
          ) : (
            <div aria-label="following داخرا">
              <ProfileStat label="following" value={followingCount} />
            </div>
          )}
        </div>
      </div>
      {socialList && (
        <SocialListOverlay
          title={socialList}
          players={visibleFriends}
          onClose={() => setSocialList(null)}
          onSelect={(listedPlayer) => setSelectedSocialPlayer(listedPlayer)}
        />
      )}
      {selectedSocialPlayer && (
        <PlayerProfileSheet
          player={selectedSocialPlayer}
          followersCount={visibleFriends.length}
          followingCount={visibleFriends.length}
          onClose={() => setSelectedSocialPlayer(null)}
        />
      )}
    </div>
  );
}

function SocialListOverlay({
  title,
  players,
  onClose,
  onSelect,
}: {
  title: "followers" | "following";
  players: Friend[];
  onClose: () => void;
  onSelect: (player: Friend) => void;
}) {
  useHideChrome();
  return (
    <div className="panel animate-soft-in fixed inset-0 z-[60] flex flex-col px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-8">
      <div className="flex items-center justify-between">
        <button
          onClick={onClose}
          aria-label="گەڕانەوە"
          className="press flex size-11 items-center justify-center rounded-full border border-panel-border bg-panel-foreground/5 text-panel-foreground"
        >
          <span className="text-xl">×</span>
        </button>
        <h2 className="text-lg font-bold text-panel-foreground">{title}</h2>
        <span className="size-11" />
      </div>
      <div className="mt-5 flex-1 space-y-3 overflow-y-auto no-scrollbar">
        {players.map((listedPlayer) => (
          <button
            key={listedPlayer.id}
            onClick={() => onSelect(listedPlayer)}
            className="glass press flex w-full items-center gap-3 rounded-2xl p-3 text-right"
          >
            <img
              src={listedPlayer.avatar}
              alt={listedPlayer.name}
              className="size-12 rounded-full bg-secondary"
            />
            <span className="flex-1 font-bold text-panel-foreground">{listedPlayer.name}</span>
            {formatHandle(listedPlayer.handle) && (
              <span className="text-xs text-panel-muted">{formatHandle(listedPlayer.handle)}</span>
            )}
          </button>
        ))}
        {players.length === 0 && (
          <p className="pt-10 text-center text-sm text-panel-muted">هیچ بەکارهێنەرێک نییە</p>
        )}
      </div>
    </div>
  );
}

function ProfileStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-panel-border bg-panel-foreground/5 p-3 text-center">
      <p className="text-xl font-extrabold tabular-nums text-panel-foreground">{value}</p>
      <p className="mt-1 text-[11px] text-panel-muted">{label}</p>
    </div>
  );
}
