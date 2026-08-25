import { Link } from "@tanstack/react-router";
import { Dices, ShoppingBag, Trophy, UserRound, Users } from "lucide-react";
import { useApp } from "@/lib/app-store";
import { useChrome } from "@/components/chrome";

const items = [
  { to: "/app/profile", label: "پرۆفایل", Icon: UserRound },
  { to: "/app/friends", label: "هاوڕێکان", Icon: Users },
  { to: "/app/play", label: "یاری", Icon: Dices },
  { to: "/app/store", label: "فرۆشگا", Icon: ShoppingBag },
  { to: "/app/leaderboards", label: "پێشەنگەکان", Icon: Trophy },
] as const;

export function BottomNav() {
  const { totalUnread } = useApp();
  const { hidden } = useChrome();

  if (hidden) return null;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="glass-strong mx-auto flex max-w-md items-center justify-between rounded-3xl px-2 py-2">
        {items.map(({ to, label, Icon }) => (
          <Link
            key={to}
            to={to}
            className="press relative flex flex-1 flex-col items-center gap-1 rounded-2xl px-1 py-2 text-muted-foreground data-[status=active]:bg-primary/15 data-[status=active]:text-primary"
            activeProps={{ className: "text-primary" }}
          >
            <span className="relative">
              <Icon className="size-6" strokeWidth={1.9} />
              {to === "/app/friends" && totalUnread > 0 && (
                <span className="absolute -top-2 -right-2 flex min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                  {totalUnread}
                </span>
              )}
            </span>
            <span className="text-[10px] font-semibold">{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
