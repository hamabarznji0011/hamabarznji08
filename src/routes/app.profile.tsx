import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  CircleCheck,
  CircleX,
  Crown,
  Eye,
  EyeOff,
  LogOut,
  Menu,
  Pencil,
  ShieldBan,
  Trash2,
  UserX,
} from "lucide-react";
import { formatHandle, NAME_MAX, useApp } from "@/lib/app-store";
import { toast } from "sonner";
import { useHideChrome } from "@/components/chrome";
import { PlayerProfileSheet } from "@/components/PlayerProfileSheet";
import { createClient } from "@supabase/supabase-js";
import { upsertProfile } from "@/lib/supabase";

const supabaseUrl = import.meta.env["VITE_SUPABASE_URL"] || "";
const supabaseKey = import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] || "";
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export const Route = createFileRoute("/app/profile")({
  head: () => ({
    meta: [
      { title: "پرۆفایل — مار و پەیژە" },
      { name: "description", content: "پرۆفایل، ئاماری یاری و ڕێکخستنەکانی هەژمار." },
      { property: "og:title", content: "پرۆفایل — مار و پەیژە" },
      { property: "og:description", content: "پرۆفایل و ئاماری یاریزان." },
    ],
  }),
  component: ProfileTab,
});

function ProfileTab() {
  const {
    user,
    gold,
    isProMember,
    equippedProFrame,
    equippedProBanner,
    visibleFriends,
    hideProfileDetails,
    online,
  } = useApp();
  const handleText = formatHandle(user?.handle);
  const age = user?.birth_year ? new Date().getFullYear() - Number(user.birth_year) : null;
  const profileDetails = user?.city && age && age > 0 ? `${user.city} • ${age} ساڵ` : null;
  const bio = user?.bio?.trim();
  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [copiedHandle, setCopiedHandle] = useState(false);
  const [socialList, setSocialList] = useState<"followers" | "following" | null>(null);
  const [selectedSocialPlayer, setSelectedSocialPlayer] = useState<
    (typeof visibleFriends)[number] | null
  >(null);

  return (
    <section className="min-h-screen px-4 pt-[max(4.5rem,calc(env(safe-area-inset-top)+3.5rem))] pb-32">
      <button
        onClick={() => setMenuOpen(true)}
        aria-label="مێنیو"
        className="glass press absolute top-[max(1rem,env(safe-area-inset-top))] right-4 flex size-11 items-center justify-center rounded-full"
      >
        <Menu className="size-5" />
      </button>

      <div
        className={`glass-strong animate-rise-in relative flex flex-col items-center overflow-hidden rounded-3xl p-6 ${isProMember ? "border-2 border-yellow-300/80 shadow-[0_0_28px_rgba(250,204,21,.35)]" : ""}`}
        style={
          isProMember && equippedProBanner
            ? {
                backgroundImage:
                  "radial-gradient(circle at 20% 10%, rgba(255,239,150,.42), transparent 28%), linear-gradient(135deg, rgba(20,20,10,.9), rgba(130,82,10,.7))",
              }
            : undefined
        }
      >
        <div className="relative">
          <img
            src={user?.avatar}
            alt={user?.name ?? "پرۆفایل"}
            className={`size-24 rounded-full bg-secondary ${isProMember && equippedProFrame ? "border-4 border-yellow-300 shadow-[0_0_24px_rgba(250,204,21,.8)]" : "border-2 border-primary/60"}`}
          />
          {online && (
            <span
              aria-label="سەرهێڵ"
              className="absolute bottom-0 right-0 size-4 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,.95)] ring-2 ring-background"
            />
          )}
        </div>
        <button
          onClick={() => setEditOpen(true)}
          aria-label="دەستکاری پرۆفایل"
          className="press absolute right-4 top-4 flex size-9 items-center justify-center rounded-full border border-border bg-secondary text-primary"
        >
          <Pencil className="size-4" />
        </button>
        {profileDetails && !hideProfileDetails && (
          <span className="mt-3 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            {profileDetails}
          </span>
        )}
        <div
          className={`${profileDetails && !hideProfileDetails ? "mt-2" : "mt-3"} flex items-center gap-2`}
        >
          <h1
            className={`text-2xl font-extrabold ${isProMember ? "bg-gradient-to-r from-yellow-200 via-yellow-500 to-amber-700 bg-clip-text text-transparent" : ""}`}
          >
            {user?.name ?? "یاریزان"}
          </h1>
          {isProMember && (
            <span className="flex items-center gap-1 rounded-full bg-yellow-300 px-2 py-1 text-[10px] font-black text-yellow-950">
              <Crown className="size-3" /> PRO
            </span>
          )}
        </div>
        {handleText && (
          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(handleText).then(() => {
                setCopiedHandle(true);
                window.setTimeout(() => setCopiedHandle(false), 2000);
              });
            }}
            className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"
          >
            {handleText}
            {copiedHandle && <Check className="size-3 text-emerald-400" />}
          </button>
        )}
      </div>

      {bio && (
        <div className="mt-3 w-full rounded-xl border border-white/10 bg-slate-900/60 px-4 py-2 text-center text-sm text-slate-200">
          <p className="whitespace-pre-wrap break-words">{bio}</p>
        </div>
      )}

      <div className="glass mt-4 rounded-2xl border border-yellow-300/40 p-4">
        <div className="flex items-center justify-center gap-8 text-center">
          <button
            onClick={() => setSocialList("followers")}
            className="press min-w-24 cursor-pointer rounded-2xl border border-white/10 px-4 py-3 text-white transition-all hover:bg-white/5 active:scale-95"
          >
            <p className="text-sm font-bold text-white">followers</p>
            <p className="mt-1 text-2xl font-black text-white">{visibleFriends.length}</p>
          </button>
          <button
            onClick={() => setSocialList("following")}
            className="press min-w-24 cursor-pointer rounded-2xl border border-white/10 px-4 py-3 text-white transition-all hover:bg-white/5 active:scale-95"
          >
            <p className="text-sm font-bold text-white">following</p>
            <p className="mt-1 text-2xl font-black text-white">{visibleFriends.length}</p>
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Stat label="خاڵەکان" value={user?.points ?? 0} />
        <Stat label="زێڕ" value={gold} />
        <Stat label="یارییە کراوەکان" value={user?.games_played ?? 0} />
        <Stat label="بردنەوە" value={user?.wins ?? 0} />
      </div>

      {menuOpen && <ProfileMenu onClose={() => setMenuOpen(false)} />}
      {editOpen && <EditProfile onClose={() => setEditOpen(false)} />}
      {socialList && (
        <SocialListOverlay
          title={socialList}
          players={visibleFriends}
          onClose={() => setSocialList(null)}
          onSelect={(player) => setSelectedSocialPlayer(player)}
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
    </section>
  );
}

function SocialListOverlay({
  title,
  players,
  onClose,
  onSelect,
}: {
  title: "followers" | "following";
  players: Array<(typeof visibleFriends)[number]>;
  onClose: () => void;
  onSelect: (player: (typeof visibleFriends)[number]) => void;
}) {
  useHideChrome();

  return (
    <div className="panel animate-soft-in fixed inset-0 z-50 flex flex-col px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-8">
      <div className="flex items-center justify-between">
        <button
          onClick={onClose}
          aria-label="گەڕانەوە"
          className="press flex size-11 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-slate-700"
        >
          <ArrowRight className="size-5" />
        </button>
        <h2 className="text-lg font-bold text-panel-foreground">{title}</h2>
        <span className="size-11" />
      </div>
      <div className="mt-5 flex-1 space-y-3 overflow-y-auto no-scrollbar">
        {players.map((player) => (
          <button
            key={player.id}
            onClick={() => onSelect(player)}
            className="glass press flex w-full items-center gap-3 rounded-2xl p-3 text-right"
          >
            <img
              src={player.avatar}
              alt={player.name}
              className="size-12 rounded-full bg-secondary"
            />
            <span className="flex-1 font-bold text-panel-foreground">{player.name}</span>
            <span className="text-xs text-panel-muted">{player.points} خاڵ</span>
          </button>
        ))}
        {players.length === 0 && (
          <p className="pt-10 text-center text-sm text-panel-muted">هیچ بەکارهێنەرێک نییە</p>
        )}
      </div>
    </div>
  );
}

function EditProfile({ onClose }: { onClose: () => void }) {
  const {
    user,
    updateProfile,
    isNameTaken,
    isHandleAvailable,
    nameCooldownDaysLeft,
    usernameCooldownDaysLeft,
  } = useApp();
  const [name, setName] = useState(user?.name ?? "");
  const [handle, setHandle] = useState(user?.handle ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [avatar, setAvatar] = useState(user?.avatar ?? "");
  const [handleStatus, setHandleStatus] = useState<"available" | "taken" | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useHideChrome();

  const locked = nameCooldownDaysLeft > 0;
  const usernameLocked = usernameCooldownDaysLeft > 0;
  const originalHandle = user?.handle ?? "";
  const handleChanged = handle.trim() !== originalHandle.trim();
  const tooLong = name.trim().length > NAME_MAX;
  const taken = !tooLong && isNameTaken(name);
  const empty = name.trim().length === 0;
  const valid = !tooLong && !taken && !empty;
  const hasKurdish = /[\u0600-\u06FF]/.test(handle);
  const handleTooLong = handle.length >= 15;
  const handleValidFormat = handle.length === 0 || (!hasKurdish && !handleTooLong);
  const bioTooLong = bio.length >= 150;
  const bioRemaining = Math.max(0, 150 - bio.length);

  useEffect(() => {
    if (!handleValidFormat) {
      setHandleStatus(null);
      return;
    }
    if (!handle.trim()) {
      setHandleStatus("available");
      return;
    }
    const timer = window.setTimeout(() => {
      setHandleStatus(isHandleAvailable(handle) ? "available" : "taken");
    }, 300);
    return () => window.clearTimeout(timer);
  }, [handle, handleValidFormat, isHandleAvailable]);

  const pickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatar(String(reader.result));
    reader.readAsDataURL(file);
  };

  const save = () => {
    if (
      (!valid && !locked) ||
      handleStatus !== "available" ||
      bioTooLong ||
      (usernameLocked && handleChanged)
    )
      return;
    updateProfile({
      name: locked ? undefined : name.trim(),
      handle: handle.trim(),
      bio: bio.trim(),
      avatar,
    });
    if (user?.id) {
      void upsertProfile({
        id: user.id,
        username: name.trim(),
        avatar_url: avatar,
      });
    }
    onClose();
  };

  const borderClass = locked
    ? "border-panel-border"
    : valid
      ? "border-emerald-500 shadow-[0_0_18px_-2px_rgba(16,185,129,0.8)]"
      : "border-red-500 shadow-[0_0_18px_-2px_rgba(239,68,68,0.8)]";

  const handleBorderClass =
    hasKurdish || handleTooLong || handleStatus === "taken"
      ? "border-red-500 ring-2 ring-red-500"
      : handleStatus === "available"
        ? "border-emerald-500 ring-2 ring-emerald-500"
        : "border-slate-200";

  const bioBorderClass = bioTooLong
    ? "border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"
    : "border-slate-200";

  return (
    <div className="animate-soft-in fixed inset-0 z-50 flex flex-col bg-white px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-8 text-slate-900">
      <div className="flex items-center justify-between">
        <button
          onClick={onClose}
          aria-label="گەڕانەوە"
          className="press flex size-11 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-slate-700"
        >
          <ArrowRight className="size-5" />
        </button>
        <h2 className="text-lg font-bold">دەستکاری پرۆفایل</h2>
        <button
          onClick={save}
          disabled={
            (!locked && !valid) ||
            handleStatus !== "available" ||
            bioTooLong ||
            (usernameLocked && handleChanged)
          }
          aria-label="پاشەکەوتکردن"
          className="press flex size-11 items-center justify-center rounded-full bg-emerald-500 text-white shadow-[0_0_24px_-2px_rgba(16,185,129,0.9)] disabled:opacity-40 disabled:shadow-none"
        >
          <Check className="size-5" />
        </button>
      </div>

      <div className="mt-8 flex flex-col items-center">
        <button
          onClick={() => fileRef.current?.click()}
          aria-label="گۆڕینی وێنە"
          className="press relative"
        >
          <img
            src={avatar}
            alt={name}
            className="size-28 rounded-full border-2 border-panel-border bg-panel-foreground/5 object-cover"
          />
          <span className="absolute bottom-0 left-0 flex size-9 items-center justify-center rounded-full bg-emerald-500 text-white">
            <Pencil className="size-4" />
          </span>
        </button>
        <input ref={fileRef} type="file" accept="image/*" onChange={pickImage} className="hidden" />
      </div>

      <div className="mx-auto mt-8 w-full max-w-md space-y-5">
        <div>
          <span className="mb-1.5 block text-xs font-semibold text-slate-500">ناوی بەکارهێنەر</span>
          <input
            value={name}
            disabled={locked}
            onChange={(e) => setName(e.target.value)}
            className={`w-full rounded-2xl border-2 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-all disabled:opacity-60 ${borderClass}`}
          />
          {locked ? (
            <p className="mt-2 text-[11px] font-light text-slate-500">
              ناتوانیت ناوەکەت بگۆڕیت تا 3 ڕۆژی تر
            </p>
          ) : tooLong ? (
            <p className="mt-2 text-[11px] font-light text-red-500">
              ناوی بەکارهێنەر دەبێت {NAME_MAX} پیت یان کەمتر بێت.
            </p>
          ) : taken ? (
            <p className="mt-2 text-[11px] font-light text-red-500">
              ئەم ناوە پێشتر وەرگیراوە. تکایە ناوێکی تر هەڵبژێرە.
            </p>
          ) : null}
        </div>
        <div>
          <span className="mb-1.5 block text-xs font-semibold text-slate-500">یوزەر</span>
          <div className="relative">
            <input
              value={handle}
              maxLength={15}
              onChange={(event) => setHandle(event.target.value)}
              placeholder="your_handle"
              className={`w-full rounded-2xl border-2 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-all ${usernameLocked && handleChanged ? "border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" : handleBorderClass}`}
            />
            {handleStatus === "available" && (
              <CircleCheck className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-emerald-500" />
            )}
            {(hasKurdish || handleTooLong || handleStatus === "taken") && (
              <CircleX className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-red-500" />
            )}
          </div>
          {hasKurdish && (
            <p className="mt-1 text-xs font-semibold text-red-500">تکایە بیکە ئینگلیزی</p>
          )}
          {!hasKurdish && handleTooLong && (
            <p className="mt-1 text-xs font-semibold text-red-500">تکایە لە 15 پیت زیاتر نەبێت</p>
          )}
          {usernameLocked && handleChanged && (
            <p className="mt-1 text-xs font-semibold text-red-500">
              ناتوانیت یوزەرنەیمەکەت بگۆڕیت تا 10 ڕۆژی تر
            </p>
          )}
          {!usernameLocked && !hasKurdish && handleTooLong && (
            <p className="mt-1 text-xs font-semibold text-red-500">لە ١٥ پیت کەمتر</p>
          )}
          {!usernameLocked && !hasKurdish && !handleTooLong && handleStatus === "taken" && (
            <p className="mt-1 text-xs font-semibold text-red-500">ئەم یوزرە هەیە</p>
          )}
        </div>
        <div>
          <span className="mb-1.5 block text-xs font-semibold text-slate-500">بیۆ</span>
          <textarea
            value={bio}
            maxLength={150}
            rows={4}
            onChange={(event) => setBio(event.target.value)}
            placeholder="دەربارەی خۆت بنووسە"
            className={`w-full resize-none rounded-2xl border-2 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-all ${bioBorderClass}`}
          />
          <p
            className={`mt-1 text-xs ${bioTooLong ? "font-semibold text-red-500" : "text-slate-500"}`}
          >
            {bioRemaining}
          </p>
          {bioTooLong && (
            <p className="mt-1 text-xs font-semibold text-red-500">پێویستە لە ١٥٠ پیت کەمتر بێت</p>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="glass animate-rise-in rounded-2xl p-4 text-center">
      <p className="text-2xl font-extrabold tabular-nums text-primary">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function ProfileMenu({ onClose }: { onClose: () => void }) {
  const { logout, blockedFriends, unblockFriend, deleteAccount } = useApp();
  const navigate = useNavigate();
  const [showBlocked, setShowBlocked] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);

  useHideChrome();

  return (
    <div className="fixed inset-0 z-50 bg-black/55" onClick={onClose}>
      <div
        className="animate-slide-in-right absolute right-0 top-0 flex h-full w-[40vw] max-w-[350px] min-w-[280px] flex-col overflow-y-auto bg-white px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-8 text-slate-900 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <button
            onClick={() => (showBlocked ? setShowBlocked(false) : onClose())}
            aria-label="گەڕانەوە"
            className="press flex size-11 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-slate-700"
          >
            <ArrowRight className="size-5" />
          </button>
          <h2 className="text-lg font-bold text-slate-900">
            {showBlocked ? "لیستی بلۆککراوەکان" : "مێنیو"}
          </h2>
          <span className="size-11" />
        </div>

        {showBlocked ? (
          <div className="mt-6 space-y-1">
            {blockedFriends.length === 0 && (
              <p className="text-center text-sm text-slate-500">کەس بلۆک نەکراوە</p>
            )}
            {blockedFriends.map((f) => (
              <div
                key={f.id}
                className="flex w-full items-center justify-between rounded-xl px-2 py-2 hover:bg-slate-100 active:bg-slate-200"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <img
                    src={f.avatar}
                    alt={f.name}
                    className="size-10 shrink-0 rounded-full bg-slate-200 object-cover"
                  />
                  <span className="truncate font-semibold text-slate-900">{f.name}</span>
                </div>
                <button
                  onClick={() => unblockFriend(f.id)}
                  aria-label="کردنەوەی بلۆک"
                  className="press flex size-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-200 active:bg-slate-300"
                >
                  <Trash2 className="size-5 text-destructive" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-6 space-y-1">
            <button
              onClick={() => setShowBlocked(true)}
              className="press flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-900 hover:bg-slate-100 active:bg-slate-200"
            >
              <ShieldBan className="size-5" />
              <span className="font-semibold">لیستی بلۆککراوەکان</span>
            </button>

            <button
              onClick={() => setPrivacyOpen(true)}
              className="press flex w-full items-center rounded-xl px-3 py-2 text-sm text-slate-900 hover:bg-slate-100 active:bg-slate-200"
            >
              <span className="font-semibold">شاراوە</span>
            </button>

            <button
              onClick={() => setInfoOpen(true)}
              className="press flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-900 hover:bg-slate-100 active:bg-slate-200"
            >
              <UserX className="size-5" />
              <span className="font-semibold">زانیاری من</span>
            </button>

            <button
              onClick={() => setConfirmLogout(true)}
              className="press flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-destructive hover:bg-red-50 active:bg-red-100"
            >
              <LogOut className="size-5" />
              <span className="font-semibold">دەرچوون</span>
            </button>

            <button
              onClick={() => setConfirmDelete(true)}
              className="press flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-red-600 hover:bg-red-50 active:bg-red-100"
            >
              <UserX className="size-5" />
              <span className="font-semibold">سڕینەوەی هەژمار</span>
            </button>
          </div>
        )}

        {confirmDelete && (
          <div
            className="animate-soft-in fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-6"
            onClick={() => setConfirmDelete(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="panel w-full max-w-xs rounded-3xl p-5 text-center shadow-[var(--shadow-glass)]"
            >
              <p className="text-sm font-bold text-panel-foreground">
                دڵنیایت لە سڕینەوەی هەژمارەکەت بۆ هەمیشە؟
              </p>
              <div className="mt-5 flex gap-3">
                <button
                  onClick={async () => {
                    try {
                      await deleteAccount();
                    } catch (error) {
                      console.error("Account deletion failed:", error);
                    } finally {
                      navigate({ to: "/" });
                    }
                  }}
                  className="press flex-1 rounded-2xl bg-red-600 py-3 text-sm font-bold text-white"
                >
                  بەڵێ
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="press flex-1 rounded-2xl bg-emerald-500 py-3 text-sm font-bold text-white"
                >
                  نەخێر
                </button>
              </div>
            </div>
          </div>
        )}
        {confirmLogout && (
          <div
            className="animate-soft-in fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-6"
            onClick={() => setConfirmLogout(false)}
          >
            <div
              onClick={(event) => event.stopPropagation()}
              className="w-full max-w-xs rounded-3xl bg-white p-5 text-center text-slate-900 shadow-2xl"
            >
              <p className="text-sm font-bold">ئایا دەتەوێت بچیتە دەرەوە لەم ئەکاونتە؟</p>
              <div className="mt-5 flex gap-3">
                <button
                  onClick={() => {
                    logout();
                    navigate({ to: "/" });
                  }}
                  className="press flex-1 rounded-2xl bg-red-600 py-3 text-sm font-bold text-white"
                >
                  بەڵێ
                </button>
                <button
                  onClick={() => setConfirmLogout(false)}
                  className="press flex-1 rounded-2xl bg-slate-200 py-3 text-sm font-bold text-slate-900"
                >
                  نەخێر
                </button>
              </div>
            </div>
          </div>
        )}
        {infoOpen && <MyInformation onClose={() => setInfoOpen(false)} />}
        {privacyOpen && <PrivacySettings onClose={() => setPrivacyOpen(false)} />}
      </div>
    </div>
  );
}

function PrivacySettings({ onClose }: { onClose: () => void }) {
  const {
    online,
    setOnline,
    hideFollowing,
    setHideFollowing,
    hideProfileDetails,
    setHideProfileDetails,
  } = useApp();
  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/55 px-4"
      onClick={onClose}
    >
      <div
        className="animate-soft-in w-full max-w-sm rounded-3xl bg-white p-5 text-slate-900 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <button
            onClick={onClose}
            aria-label="گەڕانەوە"
            className="press flex size-10 items-center justify-center rounded-full bg-slate-100 text-slate-700"
          >
            <ArrowRight className="size-5" />
          </button>
          <h2 className="text-lg font-bold">شاراوە</h2>
          <span className="size-10" />
        </div>
        <div className="mt-5 space-y-1">
          <button
            onClick={() => setOnline(!online)}
            className="press flex w-full items-center justify-between rounded-xl px-3 py-3 text-sm hover:bg-slate-100 active:bg-slate-200"
          >
            <span className="font-semibold">{online ? "سەرهێڵ" : "دەرهێڵ"}</span>
            <PrivacyToggle checked={online} ariaLabel="سەرهێڵ" />
          </button>
          <button
            onClick={() => setHideFollowing(!hideFollowing)}
            className="press flex w-full items-center justify-between rounded-xl px-3 py-3 text-sm hover:bg-slate-100 active:bg-slate-200"
          >
            <span className="font-semibold">
              {hideFollowing ? "following داخرا" : "following بشارەوە"}
            </span>
            <PrivacyToggle checked={hideFollowing} ariaLabel="following بشارەوە" />
          </button>
          <button
            onClick={() => setHideProfileDetails(!hideProfileDetails)}
            className="press flex w-full items-center justify-between rounded-xl px-3 py-3 text-sm hover:bg-slate-100 active:bg-slate-200"
          >
            <span className="font-semibold">ناونیشان بشارەوە</span>
            <PrivacyToggle checked={hideProfileDetails} ariaLabel="ناونیشان بشارەوە" />
          </button>
        </div>
      </div>
    </div>
  );
}

function PrivacyToggle({ checked, ariaLabel }: { checked: boolean; ariaLabel: string }) {
  return (
    <span
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      className={`relative block h-6 w-12 shrink-0 rounded-full transition-colors duration-200 ${checked ? "bg-emerald-500" : "bg-red-500"}`}
    >
      <span
        className={`absolute top-0.5 size-5 rounded-full bg-slate-900 shadow-md transition-transform duration-200 ease-out ${checked ? "right-0.5 -translate-x-6" : "right-0.5"}`}
      />
    </span>
  );
}

function MyInformation({ onClose }: { onClose: () => void }) {
  const { user, currentPassword, linkedEmail, passwordChangedAt, updatePassword, linkEmail } =
    useApp();
  const [password, setPassword] = useState(currentPassword);
  const [editing, setEditing] = useState(false);
  const [visible, setVisible] = useState(false);
  const cooldown = passwordChangedAt
    ? Math.max(0, 10 * 86_400_000 - (Date.now() - passwordChangedAt))
    : 0;
  const canChange = cooldown === 0;
  const valid = password.length >= 8;

  useHideChrome();

  return (
    <div className="panel animate-soft-in fixed inset-0 z-[70] flex flex-col px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-8">
      <div className="flex items-center justify-between">
        <button
          onClick={onClose}
          aria-label="گەڕانەوە"
          className="press flex size-11 items-center justify-center rounded-full border border-panel-border bg-panel-foreground/5 text-panel-foreground"
        >
          <ArrowRight className="size-5" />
        </button>
        <h2 className="text-lg font-bold text-panel-foreground">زانیاری من</h2>
        <span className="size-11" />
      </div>

      <div className="mx-auto mt-8 w-full max-w-md space-y-5">
        <div>
          <p className="mb-2 text-xs font-bold text-panel-muted">ناوی بەکارهێنەر</p>
          <div className="rounded-2xl border border-panel-border bg-panel-foreground/5 px-4 py-3 font-bold text-panel-foreground">
            {user?.name ?? "یاریزان"}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-bold text-panel-muted">وشەی نهێنی</p>
          <div
            className={`relative rounded-2xl border px-4 py-3 ${editing ? "border-primary bg-panel-foreground/5" : "border-panel-border bg-panel-foreground/10"}`}
          >
            <input
              type={visible ? "text" : "password"}
              value={password}
              disabled={!editing || !canChange}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              className="w-full bg-transparent pr-9 text-panel-foreground outline-none disabled:opacity-60"
            />
            <button
              onClick={() => setVisible((current) => !current)}
              aria-label="پیشاندانی وشەی نهێنی"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-panel-muted"
            >
              {visible ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
            </button>
            {editing && valid && canChange && (
              <button
                onClick={() => {
                  if (updatePassword(password)) {
                    setEditing(false);
                    (document.activeElement as HTMLElement | null)?.blur();
                  }
                }}
                aria-label="پاشەکەوتکردنی وشەی نهێنی"
                className="absolute right-10 top-1/2 -translate-y-1/2 text-emerald-500"
              >
                <Check className="size-5" />
              </button>
            )}
          </div>
          <button
            disabled={!canChange}
            onClick={() => setEditing(true)}
            className="mt-2 text-xs font-bold text-primary disabled:text-panel-muted"
          >
            وشەی نهێنیت بگۆڕە
          </button>
          {!canChange && (
            <p className="mt-1 text-xs text-panel-muted">
              گۆڕینی وشەی نهێنی دوای ١٠ ڕۆژ بەردەست دەبێت.
            </p>
          )}
        </div>

        <button
          onClick={async () => {
            if (linkedEmail) return;
            if (supabase) {
              await supabase.auth.linkIdentity({
                provider: "google",
                options: { redirectTo: window.location.href },
              });
              return;
            }
            const email = window.prompt("گیمەیڵەکەت بنووسە");
            if (email?.trim()) linkEmail(email.trim());
          }}
          className="w-full rounded-2xl border border-panel-border bg-panel-foreground/5 p-4 text-right"
        >
          <p className="text-xs font-bold text-panel-muted">گیمەیڵ</p>
          <p className="mt-1 font-bold text-panel-foreground">
            {linkedEmail ?? "گیمێڵەکەت بپەیوەست بکە"}
          </p>
        </button>
      </div>
    </div>
  );
}
