import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
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
  const { addGold } = useApp();

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
    </section>
  );
}
