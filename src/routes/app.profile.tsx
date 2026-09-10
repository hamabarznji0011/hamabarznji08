import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { ArrowRight, Check, LogOut, Menu, Pencil, ShieldBan, Trash2, UserX } from "lucide-react";
import { NAME_MAX, useApp } from "@/lib/app-store";
import { useHideChrome } from "@/components/chrome";

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
  const { user, gold } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  return (
    <section className="min-h-screen px-4 pt-[max(4.5rem,calc(env(safe-area-inset-top)+3.5rem))] pb-32">
      <button
        onClick={() => setMenuOpen(true)}
        aria-label="مێنیو"
        className="glass press absolute top-[max(1rem,env(safe-area-inset-top))] right-4 flex size-11 items-center justify-center rounded-full"
      >
        <Menu className="size-5" />
      </button>

      <div className="glass-strong animate-rise-in flex flex-col items-center rounded-3xl p-6">
        <img
          src={user?.avatar}
          alt={user?.name ?? "پرۆفایل"}
          className="size-24 rounded-full border-2 border-primary/60 bg-secondary"
        />
        <div className="mt-3 flex items-center gap-2">
          <h1 className="text-2xl font-extrabold">{user?.name ?? "یاریزان"}</h1>
          <button
            onClick={() => setEditOpen(true)}
            aria-label="دەستکاری پرۆفایل"
            className="press flex size-9 items-center justify-center rounded-full border border-border bg-secondary text-primary"
          >
            <Pencil className="size-4" />
          </button>
        </div>
        <p className="text-xs text-muted-foreground">هەژماری یاریزان</p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Stat label="خاڵەکان" value={user?.points ?? 0} />
        <Stat label="زێڕ" value={gold} />
        <Stat label="یارییە کراوەکان" value={user?.games ?? 0} />
        <Stat label="بردنەوە" value={user?.wins ?? 0} />
      </div>

      {menuOpen && <ProfileMenu onClose={() => setMenuOpen(false)} />}
      {editOpen && <EditProfile onClose={() => setEditOpen(false)} />}
    </section>
  );
}

function EditProfile({ onClose }: { onClose: () => void }) {
  const { user, updateProfile, isNameTaken, nameCooldownDaysLeft } = useApp();
  const [name, setName] = useState(user?.name ?? "");
  const [avatar, setAvatar] = useState(user?.avatar ?? "");
  const fileRef = useRef<HTMLInputElement>(null);

  useHideChrome();

  const locked = nameCooldownDaysLeft > 0;
  const tooLong = name.trim().length > NAME_MAX;
  const taken = !tooLong && isNameTaken(name);
  const empty = name.trim().length === 0;
  const valid = !tooLong && !taken && !empty;

  const pickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatar(String(reader.result));
    reader.readAsDataURL(file);
  };

  const save = () => {
    if (!valid && !locked) return;
    updateProfile({ name: locked ? undefined : name.trim(), avatar });
    onClose();
  };

  const borderClass = locked
    ? "border-panel-border"
    : valid
      ? "border-emerald-500 shadow-[0_0_18px_-2px_rgba(16,185,129,0.8)]"
      : "border-red-500 shadow-[0_0_18px_-2px_rgba(239,68,68,0.8)]";

  return (
    <div className="panel animate-soft-in fixed inset-0 z-50 flex flex-col px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-8">
      <div className="flex items-center justify-between">
        <button
          onClick={onClose}
          aria-label="گەڕانەوە"
          className="press flex size-11 items-center justify-center rounded-full border border-panel-border bg-panel-foreground/5 text-panel-foreground"
        >
          <ArrowRight className="size-5" />
        </button>
        <h2 className="text-lg font-bold">دەستکاری پرۆفایل</h2>
        <button
          onClick={save}
          disabled={!locked && !valid}
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
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={pickImage}
          className="hidden"
        />
      </div>

      <div className="mt-8">
        <span className="mb-1.5 block text-xs font-semibold text-panel-muted">ناوی بەکارهێنەر</span>
        <input
          value={name}
          disabled={locked}
          onChange={(e) => setName(e.target.value)}
          className={`w-full rounded-2xl border-2 bg-panel-foreground/5 px-4 py-3 text-sm text-panel-foreground outline-none transition-all disabled:opacity-60 ${borderClass}`}
        />
        {locked ? (
          <p className="mt-2 text-[11px] font-light text-panel-muted">
            دەتوانیت دوای {nameCooldownDaysLeft} ڕۆژ ناوەکەت بگۆڕیت
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
  const { online, setOnline, logout, blockedFriends, unblockFriend, deleteAccount } = useApp();
  const navigate = useNavigate();
  const [showBlocked, setShowBlocked] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useHideChrome();

  return (
    <div className="panel animate-soft-in fixed inset-0 z-50 flex flex-col px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-8">
      <div className="flex items-center justify-between">
        <button
          onClick={() => (showBlocked ? setShowBlocked(false) : onClose())}
          aria-label="گەڕانەوە"
          className="press flex size-11 items-center justify-center rounded-full border border-panel-border bg-panel-foreground/5 text-panel-foreground"
        >
          <ArrowRight className="size-5" />
        </button>
        <h2 className="text-lg font-bold">{showBlocked ? "لیستی بلۆککراوەکان" : "مێنیو"}</h2>
        <span className="size-11" />
      </div>

      {showBlocked ? (
        <div className="mt-6 space-y-3">
          {blockedFriends.length === 0 && (
            <p className="text-center text-sm text-panel-muted">کەس بلۆک نەکراوە</p>
          )}
          {blockedFriends.map((f) => (
            <div key={f.id} className="flex items-center justify-between rounded-2xl border border-panel-border bg-panel-foreground/5 p-3">
              <span className="font-semibold">{f.name}</span>
              <button
                onClick={() => unblockFriend(f.id)}
                aria-label="کردنەوەی بلۆک"
                className="press flex size-10 items-center justify-center rounded-full bg-destructive/20"
              >
                <Trash2 className="size-5 text-destructive" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-8 space-y-3">
          <button
            onClick={() => setShowBlocked(true)}
            className="press flex w-full items-center gap-3 rounded-2xl border border-panel-border bg-panel-foreground/5 p-4 text-panel-foreground"
          >
            <ShieldBan className="size-5" />
            <span className="font-semibold">لیستی بلۆککراوەکان</span>
          </button>

          <button
            onClick={() => setOnline(!online)}
            className="press flex w-full items-center justify-between rounded-2xl border border-panel-border bg-panel-foreground/5 p-4 text-panel-foreground"
          >
            <span className="font-semibold">{online ? "سەرهێڵ" : "دەرهێڵ"}</span>
            <span
              className={`size-4 rounded-full transition-colors ${
                online ? "bg-primary shadow-[var(--shadow-glow)]" : "bg-destructive"
              }`}
            />
          </button>

          <button
            onClick={() => {
              logout();
              navigate({ to: "/" });
            }}
            className="press flex w-full items-center gap-3 rounded-2xl border border-panel-border bg-destructive/10 p-4 text-destructive"
          >
            <LogOut className="size-5" />
            <span className="font-semibold">دەرچوون</span>
          </button>

          <button
            onClick={() => setConfirmDelete(true)}
            className="press flex w-full items-center gap-3 rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-red-600"
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
                onClick={() => {
                  deleteAccount();
                  navigate({ to: "/" });
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
    </div>
  );
}

