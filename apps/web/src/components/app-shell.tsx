"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  LayoutDashboard,
  Inbox,
  FileText,
  Ship,
  Columns3,
  ChartColumn,
  Bell,
  Settings,
  LogOut,
  Search,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { Button } from "./ui";

const links = [
  { href: "/app", label: "Dashboard", icon: LayoutDashboard, roles: ["ADMIN", "OPS", "CLIENT"] },
  { href: "/app/leads", label: "Leads", icon: Inbox, roles: ["ADMIN", "OPS"] },
  { href: "/app/quotes", label: "Quotes", icon: FileText, roles: ["ADMIN", "OPS", "CLIENT"] },
  { href: "/app/shipments", label: "Shipments", icon: Ship, roles: ["ADMIN", "OPS", "CLIENT"] },
  { href: "/app/kanban", label: "Kanban", icon: Columns3, roles: ["ADMIN", "OPS", "CLIENT"] },
  { href: "/app/analytics", label: "Analytics", icon: ChartColumn, roles: ["ADMIN", "OPS", "CLIENT"] },
  { href: "/app/notifications", label: "Notifications", icon: Bell, roles: ["ADMIN", "OPS", "CLIENT"] },
  { href: "/app/settings", label: "Settings", icon: Settings, roles: ["ADMIN", "OPS", "CLIENT"] },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--ink)] text-white/60">
        Loading console…
      </div>
    );
  }

  const nav = links.filter((l) => l.roles.includes(user.role));

  return (
    <div className="min-h-screen bg-[var(--ink)] text-white lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="border-b border-white/10 bg-[var(--panel)] lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between px-5 py-5">
          <Link href="/" className="font-[family-name:var(--font-display)] text-sm font-bold tracking-[0.18em]">
            ELIOS
          </Link>
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-white/60">
            {user.role}
          </span>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-4 lg:flex-col lg:overflow-visible">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm whitespace-nowrap",
                  active ? "bg-[var(--gold)]/15 text-[var(--gold-soft)]" : "text-white/65 hover:bg-white/5 hover:text-white",
                )}
              >
                <Icon size={16} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="hidden border-t border-white/10 p-4 lg:block">
          <div className="text-sm font-medium">{user.name}</div>
          <div className="text-xs text-white/45">{user.organizationName}</div>
          <Button
            variant="ghost"
            className="mt-3 w-full justify-start px-2"
            onClick={async () => {
              await logout();
              router.push("/");
            }}
          >
            <LogOut size={16} /> Sign out
          </Button>
        </div>
      </aside>
      <div className="min-w-0">
        <div className="flex items-center gap-3 border-b border-white/10 px-6 py-3">
          <Search size={16} className="text-white/40" />
          <Link href="/app/search" className="text-sm text-white/45 hover:text-white">
            Search shipments, quotes, leads…
          </Link>
        </div>
        <div className="px-6 py-6">{children}</div>
      </div>
    </div>
  );
}
