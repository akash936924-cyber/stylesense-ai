"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FlaskConical, Search, SlidersHorizontal } from "lucide-react";
import { getPalette } from "@/lib/color/palettes";
import { toPaletteColor } from "@/lib/color/harmony";
import type { Palette, Product } from "@/lib/types";
import { prefsStore } from "@/lib/store";
import { ProductCard } from "@/components/product-card";
import { Chip, GlassCard, PageHeader } from "@/components/ui";

interface SearchResponse {
  products: Product[];
  sourcesUsed: string[];
  demo: boolean;
  catalogConfigured: boolean;
  errors: { source: string; message: string }[];
}

function resolvePalette(params: URLSearchParams): Palette | undefined {
  const id = params.get("palette");
  if (id) return getPalette(id);
  const hexes = params.get("hexes");
  if (hexes) {
    const colors = hexes
      .split(",")
      .filter((h) => /^[0-9a-fA-F]{6}$/.test(h))
      .map((h) => toPaletteColor(`#${h.toLowerCase()}`, `#${h.toLowerCase()}`));
    if (colors.length) {
      return {
        id: "from-url",
        name: params.get("name") ?? "Your palette",
        kind: "custom",
        colors,
      };
    }
  }
  return undefined;
}

function ShopContent() {
  const searchParams = useSearchParams();
  const [prefs, setPrefs] = prefsStore.use();

  const palette = useMemo(
    () => resolvePalette(searchParams) ?? getPalette(prefs.likedPaletteIds[0] ?? ""),
    [searchParams, prefs.likedPaletteIds],
  );

  const [enabledHexes, setEnabledHexes] = useState<string[] | null>(null);
  const activeColors = useMemo(() => {
    if (!palette) return [];
    return palette.colors.filter((c) => enabledHexes === null || enabledHexes.includes(c.hex));
  }, [palette, enabledHexes]);

  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");
  const [result, setResult] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);

  // serialize inputs so the debounced effect has a stable dependency
  const searchKey = JSON.stringify({
    colors: activeColors.map((c) => c.hex),
    query,
    price: prefs.priceRange,
    gender: prefs.gender,
    retailers: prefs.selectedRetailerIds,
    stores: prefs.customStores,
  });

  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/search", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            query: query || undefined,
            gender: prefs.gender === "all" ? undefined : prefs.gender,
            colors: [...new Set(activeColors.map((c) => c.canonical))],
            colorHexes: activeColors.map((c) => c.hex),
            colorTerms: [...new Set(activeColors.flatMap((c) => c.searchTerms))],
            priceRange: prefs.priceRange,
            retailerIds: prefs.selectedRetailerIds.length
              ? prefs.selectedRetailerIds
              : undefined,
            customStores: prefs.customStores.length ? prefs.customStores : undefined,
            limit: 48,
          }),
        });
        if (res.ok) setResult(await res.json());
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchKey]);

  return (
    <div>
      <PageHeader
        title="Shop"
        subtitle={
          palette
            ? `Pieces for sale in “${palette.name}” — filtered by your stores and budget.`
            : "Search pieces for sale. Pick a palette on the Palettes page to shop by color."
        }
      />

      <GlassCard className="mb-6 flex flex-col gap-4 p-4">
        <div className="flex flex-wrap items-center gap-2">
          {palette ? (
            palette.colors.map((c) => {
              const on = enabledHexes === null || enabledHexes.includes(c.hex);
              return (
                <Chip
                  key={c.hex + c.name}
                  selected={on}
                  onClick={() =>
                    setEnabledHexes(() => {
                      const current = enabledHexes ?? palette.colors.map((x) => x.hex);
                      return on
                        ? current.filter((h) => h !== c.hex)
                        : [...current, c.hex];
                    })
                  }
                >
                  <span className="flex items-center gap-2">
                    <span
                      className="h-3.5 w-3.5 rounded-full border border-edge-strong"
                      style={{ backgroundColor: c.hex }}
                    />
                    {c.name}
                  </span>
                </Chip>
              );
            })
          ) : (
            <Link href="/palettes" className="text-sm text-ink-muted underline">
              choose a palette →
            </Link>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="glass flex rounded-full p-1" role="group" aria-label="Clothing section">
            {(["all", "women", "men"] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setPrefs((p) => ({ ...p, gender: g }))}
                className={`rounded-full px-3.5 py-1.5 text-sm capitalize transition ${
                  prefs.gender === g
                    ? "bg-accent text-accent-fg"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
          <label className="glass flex min-w-56 flex-1 items-center gap-2 rounded-full px-4 py-2">
            <Search size={15} className="shrink-0 text-ink-faint" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="dress, knit, trousers, coat…"
              className="w-full bg-transparent text-sm outline-none placeholder:text-ink-faint"
            />
          </label>
          <div className="flex items-center gap-2 text-sm text-ink-muted">
            <SlidersHorizontal size={15} />
            <span>$</span>
            <input
              type="number"
              min={0}
              value={prefs.priceRange.min}
              onChange={(e) =>
                setPrefs((p) => ({
                  ...p,
                  priceRange: { ...p.priceRange, min: Number(e.target.value) },
                }))
              }
              className="glass w-20 rounded-full px-3 py-1.5 text-sm outline-none"
              aria-label="Minimum price"
            />
            <span>–</span>
            <input
              type="number"
              min={0}
              value={prefs.priceRange.max}
              onChange={(e) =>
                setPrefs((p) => ({
                  ...p,
                  priceRange: { ...p.priceRange, max: Number(e.target.value) },
                }))
              }
              className="glass w-20 rounded-full px-3 py-1.5 text-sm outline-none"
              aria-label="Maximum price"
            />
          </div>
          <Link href="/settings" className="text-sm text-ink-muted underline">
            {prefs.selectedRetailerIds.length
              ? `${prefs.selectedRetailerIds.length} ${
                  prefs.selectedRetailerIds.length === 1 ? "store" : "stores"
                }`
              : "all stores"}
          </Link>
        </div>
      </GlassCard>

      {result?.demo && (
        <GlassCard className="mb-6 flex items-center gap-3 p-4 text-sm text-ink-muted">
          <FlaskConical size={16} className="shrink-0" />
          <span>
            Showing <strong>demo data</strong> — add a Channel3 or eBay API key in{" "}
            <code>.env.local</code> to search real stores. See the README for free signups.
          </span>
        </GlassCard>
      )}

      {result && !result.demo && !result.catalogConfigured && (
        <GlassCard className="mb-6 flex items-center gap-3 p-4 text-sm text-ink-muted">
          <FlaskConical size={16} className="shrink-0" />
          <span>
            Searching <strong>only your custom stores</strong> right now (
            {prefs.customStores.map((s) => s.displayName).join(", ")}). The catalog
            stores — Zara, Nordstrom, eBay and the rest — need a free Channel3 or eBay
            API key in <code>.env.local</code>. See the README for the signup list.
          </span>
        </GlassCard>
      )}

      {loading && !result ? (
        <p className="text-sm text-ink-muted">Searching…</p>
      ) : result?.products.length ? (
        <div
          className={`grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 ${
            loading ? "opacity-60" : ""
          }`}
        >
          {result.products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-ink-muted">
          Nothing in range — try widening the price range, enabling more colors
          {prefs.selectedRetailerIds.length ? (
            <>
              , or selecting more stores in{" "}
              <Link href="/settings" className="underline">
                Settings
              </Link>{" "}
              (store filters only show items those exact retailers stock)
            </>
          ) : null}
          .
        </p>
      )}
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={null}>
      <ShopContent />
    </Suspense>
  );
}
