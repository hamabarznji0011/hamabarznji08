import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { KeyRound, LogIn, UserPlus } from "lucide-react";
import snakesBg from "@/assets/snakes-bg.jpg";
import snakeGreen from "@/assets/snake-green.png";
import snakeBrown from "@/assets/snake-brown.png";
import { useApp } from "@/lib/app-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "چوونەژوورەوە — مار و پەیژە" },
      { name: "description", content: "بچۆ ژوورەوە یان هەژمارێکی نوێ دروست بکە و یاری بکە." },
      { property: "og:title", content: "چوونەژوورەوە — مار و پەیژە" },
      { property: "og:description", content: "بچۆ ژوورەوە و یاری مار و پەیژە بکە." },
    ],
  }),
  component: AuthPage,
});

function GoogleIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.6 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.8 6.1C12.3 13.2 17.7 9.5 24 9.5Z"
      />
      <path
        fill="#4285F4"
        d="M46.1 24.6c0-1.6-.1-3.1-.4-4.6H24v9.1h12.4c-.5 2.9-2.2 5.3-4.7 7l7.6 5.9c4.4-4.1 6.8-10.1 6.8-17.4Z"
      />
      <path
        fill="#FBBC05"
        d="M10.4 28.6a14.5 14.5 0 0 1 0-9.3l-7.8-6.1a24 24 0 0 0 0 21.5l7.8-6.1Z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.9 2.3-8.3 2.3-6.3 0-11.7-3.7-13.6-9.1l-7.8 6.1C6.5 42.6 14.6 48 24 48Z"
      />
    </svg>
  );
}

function AuthPage() {
  const { savedAccount, login, register } = useApp();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"register" | "login">("register");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !password.trim()) return;
    if (mode === "register") {
      register(name.trim());
      navigate({ to: "/app/profile" });
    } else {
      login(name.trim());
      navigate({ to: "/app/play" });
    }
  };

  const googleAuth = () => {
    if (savedAccount) {
      login(savedAccount.name);
      navigate({ to: "/app/play" });
      return;
    }
    register("بەکارهێنەری Google");
    navigate({ to: "/app/profile" });
  };

  return (
    <main className="relative min-h-screen overflow-hidden">
      <img
        src={snakesBg}
        alt="مارە ڕەش و سەوز و قاوەییەکان"
        width={896}
        height={1600}
        className="animate-float-slow absolute inset-0 size-full object-cover blur-[3px]"
      />

      {/* Animated snakes gliding with depth */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <img
          src={snakeGreen}
          alt=""
          className="animate-glide-right absolute top-[12%] w-[130%] max-w-none opacity-70 blur-[1px] drop-shadow-[0_25px_35px_rgba(0,0,0,0.6)]"
        />
        <img
          src={snakeBrown}
          alt=""
          className="animate-glide-left absolute top-[55%] w-[150%] max-w-none opacity-55 blur-[2px] drop-shadow-[0_25px_35px_rgba(0,0,0,0.6)]"
        />
        <img
          src={snakeGreen}
          alt=""
          className="animate-glide-left absolute top-[78%] w-[95%] max-w-none opacity-40 blur-[3px]"
          style={{ animationDuration: "44s" }}
        />
      </div>

      <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/55 to-background/90" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-10">
        <div className="animate-rise-in mb-8 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground">مار و پەیژە</h1>
          <p className="mt-2 text-sm text-muted-foreground">یاری ئۆنلاین لەگەڵ هاوڕێکانت</p>
        </div>

        <div className="glass-strong animate-rise-in rounded-3xl p-5">
          <div className="mb-5 flex rounded-2xl bg-secondary p-1">
            {(["register", "login"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`press flex-1 rounded-xl py-2.5 text-sm font-bold transition-all ${
                  mode === m
                    ? "bg-primary text-primary-foreground shadow-[var(--shadow-glow)]"
                    : "text-muted-foreground"
                }`}
              >
                {m === "login" ? "چوونەژوورەوە" : "تۆمارکردن"}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-3">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                ناوی بەکارهێنەر
              </span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ناوەکەت بنووسە"
                className="w-full rounded-2xl border border-border bg-input px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                وشەی نهێنی
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                className="w-full rounded-2xl border border-border bg-input px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
              />
            </label>

            <button
              type="submit"
              className="press flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-[var(--shadow-glow)]"
            >
              {mode === "login" ? <LogIn className="size-5" /> : <UserPlus className="size-5" />}
              {mode === "login" ? "چوونەژوورەوە" : "دروستکردنی هەژمار"}
            </button>
          </form>

          <div className="my-4 flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="text-[11px] text-muted-foreground">یان</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <button
            type="button"
            onClick={googleAuth}
            className="press flex w-full items-center justify-center gap-3 rounded-2xl bg-panel py-3.5 text-sm font-bold text-panel-foreground shadow-[var(--shadow-glass)]"
          >
            <GoogleIcon className="size-5" />
            بەردەوامبوون بە Google
          </button>
        </div>

        {savedAccount && <SavedAccountButton />}
      </div>
    </main>
  );
}

function SavedAccountButton() {
  const { savedAccount, loginSaved } = useApp();
  const navigate = useNavigate();
  if (!savedAccount) return null;

  return (
    <button
      type="button"
      onClick={() => {
        loginSaved();
        navigate({ to: "/app/play" });
      }}
      className="glass press animate-rise-in mt-4 flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-bold text-foreground"
    >
      <KeyRound className="size-5 text-primary" />
      چوونەژوورەوە بە هەژماری پێشوو ({savedAccount.name})
    </button>
  );
}
