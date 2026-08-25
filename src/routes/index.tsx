import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { KeyRound, LogIn, UserPlus } from "lucide-react";
import snakesBg from "@/assets/snakes-bg.jpg";
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

function AuthPage() {
  const { savedAccount, login, register } = useApp();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
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

  return (
    <main className="relative min-h-screen overflow-hidden">
      <img
        src={snakesBg}
        alt="مارە ڕەش و سەوز و قاوەییەکان"
        width={896}
        height={1600}
        className="animate-float-slow absolute inset-0 size-full object-cover blur-[3px]"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/55 to-background/90" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-10">
        <div className="animate-rise-in mb-8 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground">مار و پەیژە</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            یاری ئۆنلاین لەگەڵ هاوڕێکانت
          </p>
        </div>

        <div className="glass-strong animate-rise-in rounded-3xl p-5">
          <div className="mb-5 flex rounded-2xl bg-secondary p-1">
            {(["login", "register"] as const).map((m) => (
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
