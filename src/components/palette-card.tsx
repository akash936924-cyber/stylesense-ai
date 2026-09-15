"use client";

import Link from "next/link";
import { Heart, ShoppingBag } from "lucide-react";
import type { Palette } from "@/lib/types";
import { prefsStore } from "@/lib/store";

export function PaletteCard({ palette }: { palette: Palette }) {
  const [prefs, setPrefs] = prefsStore.use();
  const liked = prefs.likedPaletteIds.includes(palette.id);

  const toggleLike = () =>
    setPrefs((p) => ({
      ...p,
      likedPaletteIds: liked
        ? p.likedPaletteIds.filter((id) => id !== palette.id)
        : [...p.likedPaletteIds, palette.id],
    }));

  const tag = palette.kind === "seasonal" ? palette.season : (palette.harmony ?? "editorial");

  // curated palettes deep-link by id; generated ones carry their hexes
  const curated = palette.kind === "editorial" || palette.kind === "seasonal";
  const shopHref = curated
    ? `/shop?palette=${palette.id}`
    : `/shop?hexes=${palette.colors.map((c) => c.hex.slice(1)).join(",")}&name=${encodeURIComponent(palette.name)}`;

  return (
    <div className="glass group rounded-2xl p-4 transition hover:bg-surface-hover">
      <div className="flex h-24 gap-1.5 overflow-hidden rounded-xl">
        {palette.colors.map((c) => (
          <div
            key={c.hex + c.name}
            className="flex-1 transition-all duration-300 group-hover:first:flex-[1.5]"
            style={{ backgroundColor: c.hex }}
            title={`${c.name} (${c.hex})`}
          />
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-display truncate text-lg leading-tight">{palette.name}</h3>
          <p className="text-xs capitalize text-ink-muted">{tag}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {curated && (
            <button
              type="button"
              aria-label={liked ? `Unlike ${palette.name}` : `Like ${palette.name}`}
              onClick={toggleLike}
              className={`rounded-full p-2 transition hover:bg-surface-hover ${
                liked ? "text-like" : "text-ink-faint"
              }`}
            >
              <Heart size={17} fill={liked ? "currentColor" : "none"} />
            </button>
          )}
          <Link
            href={shopHref}
            aria-label={`Shop ${palette.name}`}
            className="rounded-full p-2 text-ink-faint transition hover:bg-surface-hover hover:text-ink"
          >
            <ShoppingBag size={17} />
          </Link>
        </div>
      </div>
    </div>
  );
}
