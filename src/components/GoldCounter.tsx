import { useApp } from "@/lib/app-store";
import { useChrome } from "@/components/chrome";
import { GoldBar } from "@/components/GoldBar";

export function GoldCounter() {
  const { gold } = useApp();
  const { hidden } = useChrome();

  if (hidden) return null;

  return (
    <div className="fixed top-[max(1rem,env(safe-area-inset-top))] left-4 z-40 animate-soft-in">
      <div className="glass-strong flex items-center gap-1.5 rounded-full py-1 pr-2.5 pl-1">
        <span className="flex size-7 items-center justify-center rounded-full bg-black/30">
          <GoldBar className="w-5" />
        </span>
        <span className="min-w-6 text-xs font-bold tabular-nums text-gold">{gold}</span>
      </div>
    </div>
  );
}

export function GoldPill({ amount }: { amount: number }) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-panel-border bg-panel-foreground/5 py-1 pr-3 pl-1.5">
      <GoldBar className="w-9" />
      <span className="text-sm font-bold tabular-nums text-panel-foreground">{amount}</span>
    </div>
  );
}
