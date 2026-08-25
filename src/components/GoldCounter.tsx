import { Coins } from "lucide-react";
import { useApp } from "@/lib/app-store";
import { useChrome } from "@/components/chrome";

export function GoldCounter() {
  const { gold } = useApp();
  const { hidden } = useChrome();

  if (hidden) return null;

  return (
    <div className="fixed top-[max(1rem,env(safe-area-inset-top))] left-4 z-40 animate-soft-in">
      <div className="glass-strong flex items-center gap-2 rounded-full py-1.5 pr-3 pl-1.5">
        <span className="gold-surface flex size-9 items-center justify-center rounded-full">
          <Coins className="size-5 text-accent-foreground" strokeWidth={2.2} />
        </span>
        <span className="min-w-8 text-sm font-bold tabular-nums text-gold">{gold}</span>
      </div>
    </div>
  );
}

export function GoldPill({ amount }: { amount: number }) {
  return (
    <div className="glass flex items-center gap-2 rounded-full py-1 pr-3 pl-1">
      <span className="gold-surface flex size-8 items-center justify-center rounded-full">
        <Coins className="size-4 text-accent-foreground" strokeWidth={2.2} />
      </span>
      <span className="text-sm font-bold tabular-nums text-gold">{amount}</span>
    </div>
  );
}
