import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { BottomNav } from "@/components/BottomNav";
import { GoldCounter } from "@/components/GoldCounter";
import { ChromeProvider } from "@/components/chrome";
import { useApp } from "@/lib/app-store";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

function AppLayout() {
  return (
    <ChromeProvider>
      <AppShell />
    </ChromeProvider>
  );
}

function AppShell() {
  const { user } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => {
      if (!user) navigate({ to: "/" });
    }, 300);
    return () => clearTimeout(t);
  }, [user, navigate]);

  return (
    <div className="relative min-h-screen bg-background">
      <div className="pointer-events-none fixed inset-0 opacity-70">
        <div className="absolute -top-24 -right-16 size-72 rounded-full bg-primary/25 blur-[90px]" />
        <div className="absolute top-1/3 -left-20 size-72 rounded-full bg-accent/20 blur-[90px]" />
        <div className="absolute bottom-0 right-1/4 size-72 rounded-full bg-emerald-glow/15 blur-[100px]" />
      </div>

      <GoldCounter />
      <div className="relative z-10 mx-auto max-w-md">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  );
}
