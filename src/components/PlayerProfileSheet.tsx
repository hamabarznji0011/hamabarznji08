import { useState } from "react";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";
import { useHideChrome } from "@/components/chrome";
import { formatHandle, useApp, type Friend, type Player } from "@/lib/app-store";

type ProfilePlayer = Pick<
  Player | Friend,
  | "id"
  | "name"
  | "handle"
  | "birth_year"
  | "city"
  | "online"
  | "avatar"
  | "games"
  | "wins"
  | "gold"
>;

type PlayerProfileSheetProps = {
  player: ProfilePlayer;
  followersCount: number;
  followingCount: number;
  onClose: () => void;
  allowFriendRequest?: boolean;
  followingHidden?: boolean;
};

export function PlayerProfileSheet({
  player,
  followersCount,
  followingCount,
  onClose,
  allowFriendRequest = false,
  followingHidden = false,
}: PlayerProfileSheetProps) {
  const { requestFriend, visibleFriends, online, user, hideProfileDetails } = useApp();
  const isMe = player.id === "me";
  const birthYear = isMe ? user?.birth_year : player.birth_year;
  const city = isMe ? user?.city : player.city;
  const age = birthYear ? new Date().getFullYear() - Number(birthYear) : null;
  const profileDetails = city && age && age > 0 ? `${city} • ${age} ساڵ` : null;
  const isOnline = isMe ? online : player.online !== false;
  const canViewFollowing = isMe || !followingHidden;
  const [socialList, setSocialList] = useState<"followers" | "following" | null>(null);
  const [selectedSocialPlayer, setSelectedSocialPlayer] = useState<Friend | null>(null);
  useHideChrome();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 px-4"
      onClick={onClose}
    >
      <div
        className="panel animate-soft-in max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl p-5 shadow-[var(--shadow-glass)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-panel-foreground">پرۆفایلی یاریزان</h2>
          {allowFriendRequest && !isMe ? (
            <button
              onClick={() => {
                const result = requestFriend(player as Player);
                toast[result === "added" ? "success" : "error"](
                  result === "added" ? "داواکاری نێردرا" : "پێشتر هەیە",
                );
              }}
              aria-label="زیادکردنی هاوڕێ"
              className="press flex size-11 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/30"
            >
              <UserPlus className="size-5" />
            </button>
          ) : (
            <button
              onClick={onClose}
              className="press rounded-xl px-3 py-2 text-sm font-bold text-panel-muted"
            >
              داخستن
            </button>
          )}
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
          {profileDetails && (isMe || !hideProfileDetails) && (
            <span className="mt-3 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              {profileDetails}
            </span>
          )}
          <h3 className="mt-3 text-xl font-extrabold text-panel-foreground">{player.name}</h3>
          {formatHandle(player.handle) && (
            <button
              type="button"
              onClick={() => {
                const handle = formatHandle(player.handle);
                navigator.clipboard?.writeText(handle).then(() => toast.success("یوزەر کۆپی کرا"));
              }}
              className="mt-1 text-xs text-panel-muted"
            >
              {formatHandle(player.handle)}
            </button>
          )}
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3">
          <ProfileStat label="یاری کراوەکان" value={player.games} />
          <ProfileStat label="دۆڕان" value={Math.max(0, player.games - player.wins)} />
          <ProfileStat label="زێڕ" value={player.gold} />
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
