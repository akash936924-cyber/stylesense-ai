"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Palette,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  PersonStanding,
  Bookmark,
  Settings,
  Shirt,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";
import { ThemeToggle } from "./theme-toggle";

const NAV = [
  { href: "/palettes", label: "Palettes", icon: Palette },
  { href: "/shop", label: "Shop", icon: ShoppingBag, badge: "NEW" },
  { href: "/inspo", label: "Inspo", icon: Sparkles },
  { href: "/trends", label: "Trends", icon: TrendingUp },
  { href: "/studio", label: "Studio", icon: PersonStanding },
  { href: "/saved", label: "Saved", icon: Bookmark, badge: "3" },
  { href: "/settings", label: "Settings", icon: Settings, dot: true },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile Trigger Button */}
      <div className="fixed top-4 left-4 z-50 lg:hidden">
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => setIsMobileOpen(true)}
          className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/20 bg-slate-950/85 text-white shadow-[0_10px_30px_rgba(0,0,0,0.6)] backdrop-blur-2xl"
          aria-label="Open Mobile Menu"
        >
          <Menu className="h-5 w-5" />
        </motion.button>
      </div>

      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileOpen(false)}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Main Sidebar Component */}
      <motion.aside
        initial={false}
        animate={{
          width: isCollapsed ? "88px" : "280px",
          x: isMobileOpen ? 0 : window.innerWidth >= 1024 ? 0 : "-100%",
        }}
        transition={{ type: "spring", stiffness: 320, damping: 30 }}
        className="fixed inset-y-4 left-4 z-50 flex h-[calc(100vh-2rem)] shrink-0 flex-col rounded-[32px] p-5 shadow-[0_25px_60px_rgba(0,0,0,0.7)] border border-white/20 bg-slate-950/90 backdrop-blur-3xl lg:sticky lg:top-4 lg:translate-x-0 overflow-hidden"
      >
        {/* Animated Slow Moving Navy → Violet → Magenta Liquid Gradient Background */}
        <motion.div
          animate={{
            backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(30,27,75,0.7),transparent_50%),radial-gradient(circle_at_bottom_right,rgba(147,51,234,0.4),transparent_60%),radial-gradient(circle_at_center,rgba(219,39,119,0.3),transparent_70%)] bg-[length:200%_200%] pointer-events-none -z-10"
        />

        {/* Soft Floating Background Particles */}
        <motion.div
          animate={{ y: [-15, 15, -15], opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 right-6 h-28 w-28 rounded-full bg-cyan-500/10 blur-2xl pointer-events-none -z-10"
        />
        <motion.div
          animate={{ y: [15, -15, 15], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-1/3 left-6 h-32 w-32 rounded-full bg-violet-600/15 blur-2xl pointer-events-none -z-10"
        />

        {/* Glassmorphic Shimmer & Inner Shadow */}
        <div className="absolute inset-0 rounded-[32px] border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)] pointer-events-none" />

        {/* Top Header: Floating Logo & Collapse Toggle */}
        <div className="relative z-10 mb-6 flex items-center justify-between border-b border-white/10 pb-5">
          <Link href="/palettes" className="flex items-center gap-3.5 group overflow-hidden">
            {/* Floating Logo with Soft Neon Glow & Breathing Up/Down Animation */}
            <motion.div
              animate={{ y: [-3, 3, -3], scale: [1, 1.03, 1] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
              className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 via-fuchsia-600 to-cyan-400 text-white shadow-[0_0_30px_rgba(168,85,247,0.6)] transition-transform group-hover:scale-110"
            >
              <Shirt size={22} />
              {/* Online indicator dot on logo */}
              <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-400 ring-2 ring-slate-950 animate-pulse" />
            </motion.div>

            <AnimatePresence>
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="flex flex-col truncate"
                >
                  <h1 className="font-display text-xl font-bold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
                    StyleSense
                  </h1>
                  <div className="mt-0.5 flex items-center gap-2">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-cyan-300">
                      AI
                    </span>
                    <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-[9px] font-bold text-violet-300 border border-violet-500/30 shadow-[0_0_10px_rgba(139,92,246,0.3)]">
                      BETA
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Link>

          {/* Mobile Close Button */}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-zinc-300 hover:text-white lg:hidden"
          >
            <X size={18} />
          </button>

          {/* Desktop Collapse Toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-400 hover:bg-white/15 hover:text-white transition-all shadow-md cursor-pointer"
            aria-label="Toggle Sidebar"
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Navigation List */}
        <nav className="relative z-10 flex flex-1 flex-col gap-1.5 overflow-y-auto no-scrollbar py-1">
          {NAV.map(({ href, label, icon: Icon, badge, dot }) => {
            const active = pathname.startsWith(href);

            return (
              <motion.div key={href} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                <Link
                  href={href}
                  onClick={() => setIsMobileOpen(false)}
                  className={`group relative flex items-center gap-3.5 rounded-2xl px-3.5 py-3 text-sm font-medium transition-all duration-300 overflow-hidden ${
                    active
                      ? "text-white font-semibold"
                      : "text-zinc-400 hover:text-white hover:bg-white/[0.08]"
                  }`}
                >
                  {/* Active Liquid Pill with Cyan + Pink Glow & Sliding Indicator */}
                  {active && (
                    <>
                      <motion.div
                        layoutId="activeGlow"
                        className="absolute inset-0 rounded-2xl bg-gradient-to-r from-violet-600/60 via-fuchsia-600/60 to-cyan-400/60 blur-xl opacity-80 pointer-events-none"
                        transition={{ type: "spring", stiffness: 350, damping: 30 }}
                      />
                      <motion.div
                        layoutId="activeLiquidPill"
                        className="absolute inset-0 rounded-2xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-cyan-500 shadow-[0_0_25px_rgba(219,39,119,0.5),0_0_15px_rgba(34,211,238,0.4)] border border-white/30"
                        transition={{ type: "spring", stiffness: 350, damping: 30 }}
                      />
                      <motion.div
                        layoutId="activeNeonBar"
                        className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1.5 rounded-r-full bg-cyan-300 shadow-[0_0_15px_#22d3ee]"
                        transition={{ type: "spring", stiffness: 350, damping: 30 }}
                      />
                    </>
                  )}

                  {/* Hover Ripple Shimmer Layer */}
                  <div className="absolute inset-0 bg-white/0 transition-colors duration-300 group-hover:bg-white/[0.05]" />

                  {/* Icon with 5 deg rotation and pulse effect on active */}
                  <div className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center transition-transform duration-300 group-hover:rotate-[5deg] group-hover:scale-110 ${active ? "text-white animate-pulse" : "text-zinc-400 group-hover:text-white"}`}>
                    <Icon size={19} strokeWidth={active ? 2.4 : 2} />
                  </div>

                  {/* Label & Notification Badges */}
                  <AnimatePresence>
                    {!isCollapsed && (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="relative z-10 flex flex-1 items-center justify-between truncate"
                      >
                        <span className="truncate">{label}</span>
                        {badge && (
                          <span className={`flex h-5 items-center justify-center rounded-full px-2 text-[10px] font-bold text-white shadow-[0_0_12px_rgba(236,72,153,0.7)] animate-pulse ${badge === "NEW" ? "bg-gradient-to-r from-fuchsia-500 to-pink-500" : "bg-pink-500"}`}>
                            {badge}
                          </span>
                        )}
                        {dot && (
                          <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399] animate-pulse" />
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Tooltip for Collapsed State */}
                  {isCollapsed && (
                    <div className="absolute left-full ml-3 px-3 py-1.5 rounded-xl bg-slate-900 border border-white/20 text-white text-xs font-semibold whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-2xl">
                      {label}
                    </div>
                  )}
                </Link>
              </motion.div>
            );
          })}
        </nav>

        {/* Bottom Section: Profile Card & Theme Toggle */}
        <div className="relative z-10 border-t border-white/10 pt-4 mt-2 space-y-3">
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                whileHover={{ scale: 1.02 }}
                className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/[0.05] p-3 backdrop-blur-2xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] transition-all hover:border-white/30 hover:shadow-[0_0_20px_rgba(168,85,247,0.3)]"
              >
                {/* Circular Avatar with Online Indicator */}
                <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-600 to-fuchsia-600 font-bold text-white shadow-md">
                  AI
                  <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-400 ring-2 ring-slate-950 animate-pulse" />
                </div>
                <div className="flex flex-1 flex-col truncate">
                  <span className="text-xs font-bold text-white truncate">StyleSense AI</span>
                  <span className="text-[10px] text-emerald-400 font-medium truncate flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> Online
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center justify-center">
            <ThemeToggle />
          </div>
        </div>
      </motion.aside>
    </>
  );
}