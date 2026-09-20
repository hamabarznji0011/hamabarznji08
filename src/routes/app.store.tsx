import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Crown, Sparkles } from "lucide-react";
import { goldPackages } from "@/lib/game-data";
import { useApp } from "@/lib/app-store";
import { GoldBar } from "@/components/GoldBar";

export const Route = createFileRoute("/app/store")({
  head: () => ({
    meta: [
      { title: "فرۆشگا — مار و پەیژە" },
      { name: "description", content: "پاکێجی زێڕ بکڕە بۆ یاری مار و پەیژە." },
      { property: "og:title", content: "فرۆشگا — مار و پەیژە" },
      { property: "og:description", content: "پاکێجەکانی زێڕ." },
    ],
  }),
  component: StoreTab,
});

function purchasePlatform() {
  if (typeof navigator === "undefined") return "web";
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return "ios";
  if (/Android/.test(ua)) return "android";
  return "web";
}

function StoreTab() {
  const { addGold, activatePro, isProMember } = useApp();
  const [proOpen, setProOpen] = useState(false);

  const buy = (id: string, gold: number) => {
    const platform = purchasePlatform();
    // Native in-app purchase bridge (Apple StoreKit / Google Play Billing).
    const bridge = (window as unknown as { IAP?: { purchase: (p: string) => void } }).IAP;
    if (bridge?.purchase) {
      bridge.purchase(id);
      return;
    }
    addGold(gold);
    toast.success(
      platform === "ios"
        ? "کڕین لە App Store پەسەندکرا"
        : platform === "android"
          ? "کڕین لە Google Play پەسەندکرا"
          : "کڕین پەسەندکرا",
    );
  };

  return (
    <section className="min-h-screen bg-store px-4 pt-[max(4.5rem,calc(env(safe-area-inset-top)+3.5rem))] pb-32">
      <h1 className="mb-5 text-center text-2xl font-extrabold text-foreground">فرۆشگای زێڕ</h1>

      <button
        onClick={() => setProOpen(true)}
        className="gold-surface press mb-5 flex w-full items-center gap-4 rounded-3xl border border-yellow-200/60 p-5 text-left text-yellow-950"
      >
        <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-black/15"><Crown className="size-8" /></span>
        <span className="flex-1">
          <span className="block text-xl font-black">{isProMember ? "PRO Pass چالاکە" : "Get PRO"}</span>
          <span className="mt-1 block text-xs font-bold opacity-80">500 زێڕ + 20 زێڕی ڕۆژانە + کۆسمەتیکی تایبەت</span>
        </span>
        <span className="rounded-xl bg-black/15 px-3 py-2 text-sm font-black">$5.99</span>
      </button>

      <div className="space-y-3">
        {goldPackages.map((p, i) => (
          <button
            key={p.id}
            onClick={() => buy(p.id, p.gold)}
            style={{ animationDelay: `${i * 60}ms` }}
            className="press animate-rise-in flex w-full items-center justify-between rounded-2xl border border-white/10 bg-black/80 p-4 backdrop-blur-xl"
          >
            <span className="flex items-center gap-3">
              <GoldBar className="w-12" />
              <span className="text-lg font-extrabold tabular-nums text-gold">{p.gold} زێڕ</span>
            </span>
            <span className="rounded-xl bg-white/10 px-4 py-2 text-base font-bold text-foreground">
              ${p.price}
            </span>
          </button>
        ))}
      </div>
      {proOpen && <ProModal active={isProMember} onClose={() => setProOpen(false)} onActivate={() => {
        if (activatePro()) toast.success("PRO Pass چالاک کرا");
        setProOpen(false);
      }} />}
    </section>
  );
}

function ProModal({ active, onClose, onActivate }: { active: boolean; onClose: () => void; onActivate: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-5 backdrop-blur-sm" onClick={onClose}>
      <div className="gold-surface w-full max-w-sm rounded-3xl p-6 text-yellow-950" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center gap-3"><Crown className="size-8" /><h2 className="text-2xl font-black">PRO Pass</h2></div>
        <p className="mt-2 text-sm font-bold">هەموو یارییەکەت بکە بە ئەزموونێکی VIP</p>
        <div className="mt-5 space-y-3 text-sm font-bold">
          <p><Sparkles className="mr-2 inline size-4" />500 زێڕی دەستبەجێ</p>
          <p><Sparkles className="mr-2 inline size-4" />20 زێڕی زیادە هەموو ڕۆژێک</p>
          <p><Sparkles className="mr-2 inline size-4" />فریم و بانەری زێڕین + بۆرد و پوولی VIP</p>
          <p><Sparkles className="mr-2 inline size-4" />20٪ داشکاندن لە slot ـەکانی ستیکەر</p>
        </div>
        <button onClick={active ? onClose : onActivate} className="mt-6 w-full rounded-2xl bg-yellow-950 py-3 text-sm font-black text-yellow-100">
          {active ? "PRO چالاکە" : "چالاککردن بۆ $5.99"}
        </button>
        <button onClick={onClose} className="mt-3 w-full py-2 text-xs font-bold opacity-70">داخستن</button>
      </div>
    </div>
  );
}
