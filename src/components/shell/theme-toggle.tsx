"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  // avoid hydration mismatch: theme is unknown until mounted
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const dark = mounted && resolvedTheme === "dark";
  return (
    <button
      type="button"
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
      onClick={() => setTheme(dark ? "light" : "dark")}
      className="glass flex h-10 w-10 items-center justify-center rounded-full text-ink transition hover:bg-surface-hover"
    >
      {dark ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  );
}
