"use client";

import { BarChart3, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { OwnerBadge } from "@/components/common/owner-badge";
import { ThemeToggle } from "@/components/common/theme-toggle";
import { getCurrentUserId } from "@/lib/session";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboards", label: "Dashboards", icon: LayoutDashboard },
  { href: "/charts", label: "Charts", icon: BarChart3 },
] as const;

export function TopNav() {
  const pathname = usePathname();

  return (
    <header className="bg-background/80 sticky top-0 z-30 border-b backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-6 px-4 sm:px-6">
        <Link href="/dashboards" className="flex items-center gap-2 font-semibold">
          <span className="bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-md text-xs font-bold">
            CIA
          </span>
          <span className="hidden sm:inline">Dashboards</span>
        </Link>

        <nav className="flex items-center gap-1" aria-label="Primary">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "hover:bg-accent hover:text-accent-foreground inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  active ? "bg-accent text-accent-foreground" : "text-muted-foreground",
                )}
              >
                <Icon className="size-4" aria-hidden />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <OwnerBadge ownerId={getCurrentUserId()} className="hidden sm:inline-flex" />
        </div>
      </div>
    </header>
  );
}
