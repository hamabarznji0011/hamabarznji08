import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  CircleCheck,
  CircleX,
  ChevronDown,
  KeyRound,
  Loader2,
  LogIn,
  UserPlus,
  X,
} from "lucide-react";
import snakesBg from "@/assets/snakes-bg.jpg";
import snakeGreen from "@/assets/snake-green.png";
import snakeBrown from "@/assets/snake-brown.png";
import { useApp, type ProfileRecord } from "@/lib/app-store";
import { supabase } from "@/lib/supabase";

const birthYears = Array.from({ length: 61 }, (_, index) => String(2020 - index));
const cities = [
  "هەولێر",
  "سلێمانی",
  "دهۆک",
  "هەڵەبجە",
  "کەرکووک",
  "زاخۆ",
  "ڕانیە",
  "کۆیە",
  "تاوز",
  "ئامێدی",
  "عەقرە",
  "چەمچەماڵ",
  "پێنجوێن",
  "دوکان",
  "سەیدسادق",
  "خانەقین",
  "قەڵادزێ",
  "شارەزوور",
];

const emailForUsername = (username: string) =>
  `${encodeURIComponent(username.trim().toLowerCase()).replace(/%/g, "")}@app.com`;

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
  const { savedAccount, login, loginWithProfile, register } = useApp();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"register" | "login">("register");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [city, setCity] = useState("");
  const [isBirthYearModalOpen, setIsBirthYearModalOpen] = useState(false);
  const [isCityModalOpen, setIsCityModalOpen] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<"available" | "taken" | "checking" | null>(
    null,
  );
  const usernameTooLong = name.length > 20;
  const [loginInvalid, setLoginInvalid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const checkUsername = async (username: string): Promise<boolean | null> => {
    if (!supabase) return true;

    const { data, error } = await supabase
      .from("profiles")
      .select("username")
      .eq("username", username.trim())
      .maybeSingle();

    if (error) {
      console.error(error);
      return null;
    }

    return data === null;
  };

  useEffect(() => {
    if (mode !== "register" || !name.trim() || usernameTooLong) {
      setUsernameStatus(null);
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setUsernameStatus("checking");
      const available = await checkUsername(name);
      if (!cancelled && available !== null) {
        setUsernameStatus(available ? "available" : "taken");
      }
    }, 350);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [mode, name, usernameTooLong]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!name.trim() || !password.trim()) return;
    setIsSubmitting(true);
    try {
      if (mode === "register") {
        if (usernameTooLong || password.length < 8 || password.length > 20 || !birthYear || !city)
          return;
        const username = name.trim();
        const available = await checkUsername(username);
        if (available !== true) {
          if (available === false) {
            setUsernameStatus("taken");
            alert("ئەم هەژمارە پێشتر تۆمارکراوە، تکایە بچۆ بەشی چوونەژوورەوە");
          }
          return;
        }

        let profileId: string | undefined;
        if (supabase) {
          const email = emailForUsername(username);
          const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
          });
          let authUser = authData.user;
          if (authError) {
            if (!authError.message.toLowerCase().includes("already registered")) {
              throw authError;
            }

            const { data: existingProfile, error: profileLookupError } = await supabase
              .from("profiles")
              .select("id")
              .eq("username", username)
              .maybeSingle();
            if (profileLookupError) throw profileLookupError;
            if (existingProfile) {
              setUsernameStatus("taken");
              alert("ئەم هەژمارە پێشتر تۆمارکراوە، تکایە بچۆ بەشی چوونەژوورەوە");
              return;
            }

            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword(
              { email, password },
            );
            if (signInError) {
              setUsernameStatus("taken");
              alert("ئەم هەژمارە پێشتر تۆمارکراوە، تکایە بچۆ بەشی چوونەژوورەوە");
              return;
            }
            authUser = signInData.user;
          }
          if (!authUser?.id) {
            throw new Error("Supabase Auth user was not returned");
          }
          profileId = authUser.id;
          const age = new Date().getFullYear() - Number(birthYear);
          const { error: profileError } = await supabase.from("profiles").upsert(
            [
              {
                id: authUser.id,
                username,
                avatar_url: "",
                city,
                age: Number.isFinite(age) && age >= 0 ? age : null,
                birth_year: birthYear,
                gold: 75,
                wins: 0,
                losses: 0,
              },
            ],
            { onConflict: "id" },
          );
          if (profileError) throw profileError;
        }
        if (!register(username, password, birthYear, city, profileId)) {
          throw new Error("هەژمارەکە نەتوانرا دروست بکرێت");
        }
        setName("");
        setPassword("");
        setBirthYear("");
        setCity("");
        setUsernameStatus(null);
        navigate({ to: "/app/profile" });
      } else {
        if (supabase) {
          const username = name.trim();
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .eq("username", username)
            .maybeSingle();
          if (profileError) throw profileError;
          if (!profile) {
            setLoginInvalid(true);
            return;
          }
          const email = emailForUsername(username);
          const { error: authError } = await supabase.auth.signInWithPassword({
            email,
            password: password.trim(),
          });
          if (authError) {
            setLoginInvalid(true);
            return;
          }
          loginWithProfile(profile as ProfileRecord, password.trim());
        } else if (!login(name.trim(), password.trim())) {
          setLoginInvalid(true);
          return;
        }
        setLoginInvalid(false);
        navigate({ to: "/app/play" });
      }
    } catch (error) {
      console.error("Signup error detail:", error);
      const errorRecord =
        error && typeof error === "object"
          ? (error as { message?: unknown; error_description?: unknown })
          : null;
      const errorMessage =
        (typeof errorRecord?.message === "string" && errorRecord.message) ||
        (typeof errorRecord?.error_description === "string" && errorRecord.error_description) ||
        "کێشەی پەیوەندی لەگەڵ سێرڤەر هەبوو";
      alert("کێشەیەک لە تۆمارکردن هەبوو: " + errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const googleAuth = async () => {
    if (supabase) {
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin },
      });
      return;
    }
    if (mode === "login" && savedAccount) {
      if (login(savedAccount.name, savedAccount.password ?? "")) navigate({ to: "/app/play" });
      return;
    }
    if (mode === "register") {
      register("بەکارهێنەری Google", crypto.randomUUID());
      navigate({ to: "/app/profile" });
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
              <div className="relative">
                <input
                  value={name}
                  maxLength={20}
                  onChange={(e) => {
                    setName(e.target.value);
                    setLoginInvalid(false);
                  }}
                  placeholder="ناوەکەت بنووسە"
                  className={`w-full rounded-2xl border bg-input px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary ${mode === "login" && loginInvalid ? "border-red-500 ring-2 ring-red-500" : usernameTooLong || usernameStatus === "taken" ? "border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" : usernameStatus === "available" ? "border-emerald-500 ring-2 ring-emerald-500" : "border-border"}`}
                />
                {mode === "register" &&
                  usernameStatus &&
                  (usernameStatus === "available" ? (
                    <CircleCheck className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-emerald-500" />
                  ) : (
                    <CircleX className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-red-500" />
                  ))}
              </div>
              {mode === "register" && usernameTooLong && (
                <span className="mt-1 block text-xs font-semibold text-red-500">
                  لە 20 پیت کەمتر
                </span>
              )}
              {mode === "register" && !usernameTooLong && usernameStatus === "taken" && (
                <span className="mt-1 block text-xs font-semibold text-red-500">
                  ئەم ناوە پێشتر بەکارهاتووە، تکایە ناوێکی تر هەڵبژێرە
                </span>
              )}
              {mode === "login" && loginInvalid && (
                <span className="mt-1 block text-xs font-semibold text-red-500">
                  ناو یان وشەی نهێنی هەڵەیە
                </span>
              )}
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                وشەی نهێنی
              </span>
              <input
                type="password"
                value={password}
                maxLength={20}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setLoginInvalid(false);
                }}
                placeholder="••••••"
                className={`w-full rounded-2xl border bg-input px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary ${mode === "login" && loginInvalid ? "border-red-500 ring-2 ring-red-500" : mode === "register" && (password.length < 8 || password.length > 20) && password.length > 0 ? "border-red-500 ring-2 ring-red-500" : "border-border"}`}
              />
              {mode === "register" && password.length > 0 && password.length < 8 && (
                <span className="mt-1 block text-xs font-semibold text-red-500">
                  تکایە بیکە 8 پیت
                </span>
              )}
              {mode === "register" && password.length > 20 && (
                <span className="mt-1 block text-xs font-semibold text-red-500">
                  تکایە لە 20 پیت زیاتر نەبێت
                </span>
              )}
            </label>

            {mode === "register" && (
              <div dir="rtl" className="grid grid-cols-2 gap-3">
                <div className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                    تەمەن
                  </span>
                  <SelectionPicker
                    value={birthYear}
                    placeholder="ساڵی لەدایکبوونت"
                    options={birthYears}
                    isOpen={isBirthYearModalOpen}
                    onOpenChange={setIsBirthYearModalOpen}
                    onSelect={(year) => {
                      setBirthYear(year);
                      setIsBirthYearModalOpen(false);
                    }}
                  />
                </div>
                <div className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                    شار
                  </span>
                  <SelectionPicker
                    value={city}
                    placeholder="شاری خۆت هەڵبژێرە"
                    options={cities}
                    isOpen={isCityModalOpen}
                    onOpenChange={setIsCityModalOpen}
                    onSelect={(selectedCity) => {
                      setCity(selectedCity);
                      setIsCityModalOpen(false);
                    }}
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="press flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-[var(--shadow-glow)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="size-5 animate-spin" />
              ) : mode === "login" ? (
                <LogIn className="size-5" />
              ) : (
                <UserPlus className="size-5" />
              )}
              {isSubmitting
                ? "چاوەڕێ بە..."
                : mode === "login"
                  ? "چوونەژوورەوە"
                  : "دروستکردنی هەژمار"}
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
            {mode === "register" ? "لەسەر گووگڵ دروستی بکە" : "هەژماری کۆن"}
          </button>
        </div>

        {savedAccount && <SavedAccountButton />}
      </div>
    </main>
  );
}

function SelectionPicker({
  value,
  placeholder,
  options,
  isOpen,
  onOpenChange,
  onSelect,
}: {
  value: string;
  placeholder: string;
  options: string[];
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSelect: (value: string) => void;
}) {
  return (
    <>
      <button
        type="button"
        onClick={() => onOpenChange(true)}
        className="flex h-[46px] w-full items-center justify-between rounded-2xl border border-border bg-input px-3 text-sm text-foreground outline-none transition-colors hover:border-primary focus:border-primary"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <ChevronDown className="size-4 text-muted-foreground" />
        <span className={value ? "font-semibold" : "text-muted-foreground"}>
          {value || placeholder}
        </span>
      </button>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 px-4 pb-5 sm:items-center"
          onClick={() => onOpenChange(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="animate-soft-in w-full max-w-sm rounded-3xl border border-border bg-panel p-4 text-panel-foreground shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                aria-label="داخستن"
                className="press flex size-9 items-center justify-center rounded-full bg-secondary text-muted-foreground"
              >
                <X className="size-4" />
              </button>
              <h2 className="font-bold">{placeholder}</h2>
              <span className="size-9" />
            </div>
            <div className="grid max-h-[min(55vh,24rem)] grid-cols-2 gap-2 overflow-y-auto pr-1">
              {options.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => onSelect(option)}
                  className={`rounded-2xl border px-3 py-3 text-sm font-semibold transition-all hover:border-primary hover:bg-primary/10 active:scale-[.98] ${value === option ? "border-primary bg-primary text-primary-foreground shadow-[var(--shadow-glow)]" : "border-border bg-input"}`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
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
