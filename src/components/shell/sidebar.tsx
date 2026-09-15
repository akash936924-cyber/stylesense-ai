"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Palette,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  PersonStanding,
  Bookmark,
  Settings,
} from "lucide-react";
import { ThemeToggle } from "./theme-toggle";

const NAV = [
  { href: "/palettes", label: "Palettes", icon: Palette },
  { href: "/shop", label: "Shop", icon: ShoppingBag },
  { href: "/inspo", label: "Inspo", icon: Sparkles },
  { href: "/trends", label: "Trends", icon: TrendingUp },
  { href: "/studio", label: "Studio", icon: PersonStanding },
  { href: "/saved", label: "Saved", icon: Bookmark },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="glass-strong sticky top-4 flex h-[calc(100vh-2rem)] w-52 shrink-0 flex-col rounded-3xl p-4 max-md:w-16">
      <Link href="/palettes" className="mb-8 block px-2 pt-1">
        <span className="font-display text-xl leading-tight max-md:hidden">
          Closet
          <br />
          Labs
        </span>
        <span className="font-display text-xl md:hidden">C</span>
      </Link>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition max-md:justify-center max-md:px-0
                ${
                  active
                    ? "bg-accent text-accent-fg"
                    : "text-ink-muted hover:bg-surface-hover hover:text-ink"
                }`}
            >
              <Icon size={17} strokeWidth={active ? 2.2 : 1.8} />
              <span className="max-md:hidden">{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="flex justify-center pt-4">
        <ThemeToggle />
      </div>
    </aside>
  );
}
