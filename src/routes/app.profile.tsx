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
    </section>
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
  const { online, setOnline, logout, blockedFriends, unblockFriend } = useApp();
  const navigate = useNavigate();
  const [showBlocked, setShowBlocked] = useState(false);

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
        </div>
      )}
    </div>
  );
}

