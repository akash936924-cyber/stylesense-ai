"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FlaskConical, 
  Search, 
  SlidersHorizontal, 
  Heart, 
  Eye, 
  Sparkles, 
  Star, 
  X, 
  ShoppingBag, 
  Check, 
  RefreshCw,
  ChevronRight
} from "lucide-react";
import { getPalette } from "@/lib/color/palettes";
import { toPaletteColor } from "@/lib/color/harmony";
import type { Palette, Product } from "@/lib/types";
import { prefsStore } from "@/lib/store";
import { Chip, GlassCard } from "@/components/ui";

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

function formatPrice(value: string | number | undefined | null): string {
  if (value === undefined || value === null) return "0.00";
  if (typeof value === "number") {
    return value.toFixed(2);
  }
  // Remove currency symbols, commas, or non-numeric characters except dots and digits
  const cleaned = String(value).replace(/[^0-9.]/g, "");
  const num = parseFloat(cleaned);
  return isNaN(num) ? "0.00" : num.toFixed(2);
}

const CATEGORIES = ["All", "Casual", "Streetwear", "Luxury", "Formal", "Sneakers"];
const SIZES = ["XS", "S", "M", "L", "XL"];

export function ShopContent() {
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
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [result, setResult] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);

  // Interactive states for luxury experience
  const [wishlist, setWishlist] = useState<Record<string, boolean>>({});
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState("M");
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isAddedToCloset, setIsAddedToCloset] = useState(false);

  const toggleWishlist = (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setWishlist((prev) => ({ ...prev, [productId]: !prev[productId] }));
  };

  // serialize inputs so the debounced effect has a stable dependency
  const searchKey = JSON.stringify({
    colors: activeColors.map((c) => c.hex),
    query: selectedCategory !== "All" ? `${query} ${selectedCategory}`.trim() : query,
    price: prefs.priceRange,
    gender: prefs.gender,
    retailers: prefs.selectedRetailerIds,
    stores: prefs.customStores,
  });

  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const searchQuery = selectedCategory !== "All" && !query.toLowerCase().includes(selectedCategory.toLowerCase())
          ? `${query} ${selectedCategory}`.trim()
          : query;

        const res = await fetch("/api/search", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            query: searchQuery || undefined,
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
    <div className="space-y-10 pb-20">
      {/* ================= LUXURY HERO SECTION ================= */}
      <motion.section 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden rounded-[36px] border border-white/20 bg-slate-950 p-8 md:p-12 text-white shadow-[0_20px_80px_rgba(0,0,0,0.6)] backdrop-blur-3xl"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-purple-950/60 to-black pointer-events-none" />
        <div className="absolute -top-32 -right-20 h-96 w-96 rounded-full bg-pink-500/20 blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-cyan-500/20 blur-[100px] pointer-events-none" />

        <div className="relative z-10 max-w-2xl">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 backdrop-blur-xl"
          >
            <Sparkles className="h-4 w-4 text-pink-400 animate-pulse" />
            <span className="text-xs font-semibold tracking-wider uppercase bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
              AI-Powered Outfit Discovery
            </span>
          </motion.div>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
            Luxury Fashion Store
          </h1>
          <p className="mt-3 text-zinc-300 text-base sm:text-lg font-light leading-relaxed">
            {palette
              ? `Curated pieces in “${palette.name}” — tailored by your preferred boutiques, budget, and AI harmony.`
              : "Discover exquisite pieces across global luxury houses and streetwear icons, perfectly matched to your aesthetic."}
          </p>

          {/* Category Chips */}
          <div className="mt-6 flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <motion.button
                  key={cat}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedCategory(cat)}
                  className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                    active
                      ? "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.4)]"
                      : "border border-white/15 bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white backdrop-blur-md"
                  }`}
                >
                  {cat}
                </motion.button>
              );
            })}
          </div>
        </div>
      </motion.section>

      {/* ================= PREMIUM FILTER & SEARCH BAR ================= */}
      <GlassCard className="flex flex-col gap-4 p-5 backdrop-blur-2xl border-white/15 shadow-xl">
        {/* Palette color chips */}
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
                      className="h-3.5 w-3.5 rounded-full border border-edge-strong shadow-sm"
                      style={{ backgroundColor: c.hex }}
                    />
                    {c.name}
                  </span>
                </Chip>
              );
            })
          ) : (
            <Link href="/palettes" className="text-sm text-ink-muted hover:text-ink underline flex items-center gap-1">
              Choose a palette <ChevronRight size={14} />
            </Link>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Gender Selector */}
          <div className="glass flex rounded-full p-1 border border-white/10 bg-white/5" role="group" aria-label="Clothing section">
            {(["all", "women", "men"] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setPrefs((p) => ({ ...p, gender: g }))}
                className={`rounded-full px-4 py-1.5 text-sm capitalize transition cursor-pointer ${
                  prefs.gender === g
                    ? "bg-accent text-accent-fg shadow-md"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                {g}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <label className="glass flex min-w-56 flex-1 items-center gap-2 rounded-full px-4 py-2.5 border border-white/10 bg-white/5 shadow-inner">
            <Search size={16} className="shrink-0 text-ink-faint" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search dress, knit, trousers, coat…"
              className="w-full bg-transparent text-sm outline-none placeholder:text-ink-faint text-ink"
            />
          </label>

          {/* Price Range */}
          <div className="flex items-center gap-2 text-sm text-ink-muted">
            <SlidersHorizontal size={15} />
            <span className="font-semibold">$</span>
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
              className="glass w-20 rounded-full px-3 py-1.5 text-sm outline-none border border-white/10 text-center"
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
              className="glass w-20 rounded-full px-3 py-1.5 text-sm outline-none border border-white/10 text-center"
              aria-label="Maximum price"
            />
          </div>

          <Link href="/settings" className="text-sm font-medium text-ink-muted hover:text-ink underline transition">
            {prefs.selectedRetailerIds.length
              ? `${prefs.selectedRetailerIds.length} ${
                  prefs.selectedRetailerIds.length === 1 ? "store" : "stores"
                }`
              : "all stores"}
          </Link>
        </div>
      </GlassCard>

      {/* Notices */}
      {result?.demo && (
        <GlassCard className="flex items-center gap-3 p-4 text-sm text-ink-muted border-amber-500/20 bg-amber-500/5">
          <FlaskConical size={16} className="shrink-0 text-amber-400" />
          <span>
            Showing <strong>demo data</strong> — add a Channel3 or eBay API key in{" "}
            <code>.env.local</code> to search real stores. See the README for free signups.
          </span>
        </GlassCard>
      )}

      {result && !result.demo && !result.catalogConfigured && (
        <GlassCard className="flex items-center gap-3 p-4 text-sm text-ink-muted border-blue-500/20 bg-blue-500/5">
          <FlaskConical size={16} className="shrink-0 text-blue-400" />
          <span>
            Searching <strong>only your custom stores</strong> right now (
            {prefs.customStores.map((s) => s.displayName).join(", ")}). The catalog
            stores — Zara, Nordstrom, eBay and the rest — need a free Channel3 or eBay
            API key in <code>.env.local</code>.
          </span>
        </GlassCard>
      )}

      {/* ================= PRODUCT GRID / SKELETONS ================= */}
      {loading && !result ? (
        <div className="grid grid-cols-2 gap-6 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse rounded-[28px] border border-white/10 bg-white/5 p-4 space-y-4 h-[380px]">
              <div className="h-60 w-full rounded-2xl bg-white/10" />
              <div className="h-4 w-3/4 rounded bg-white/10" />
              <div className="h-4 w-1/2 rounded bg-white/10" />
            </div>
          ))}
        </div>
      ) : result?.products.length ? (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.06 },
            },
          }}
          className={`grid grid-cols-2 gap-6 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 ${
            loading ? "opacity-60" : ""
          }`}
        >
          {result.products.map((product) => {
            const isWishlisted = wishlist[product.id] || false;
            return (
              <motion.div
                key={product.id}
                variants={{
                  hidden: { opacity: 0, y: 25 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
                }}
                whileHover={{ y: -8, rotateZ: 0.5 }}
                className="group relative flex flex-col justify-between overflow-hidden rounded-[28px] border border-white/15 bg-white/[0.06] p-4 backdrop-blur-2xl shadow-[0_10px_30px_rgba(0,0,0,0.3)] transition-all hover:border-white/40 hover:shadow-[0_20px_50px_rgba(255,255,255,0.12)] cursor-pointer"
                onClick={() => {
                  setQuickViewProduct(product);
                  setSelectedImageIndex(0);
                }}
              >
                <div>
                  {/* Image Container with Zoom & Floating Buttons */}
                  <div className="relative mb-4 h-64 w-full overflow-hidden rounded-2xl bg-slate-900/40">
                    <Image
                      src={product.image}
                      alt={product.title}
                      fill
                      sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                      className="object-cover object-center transition-transform duration-700 group-hover:scale-110"
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    {/* AI Match Badge */}
                    <div className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-black/60 backdrop-blur-md px-2.5 py-1 text-[10px] font-semibold text-white border border-white/20 shadow-lg">
                      <Sparkles size={11} className="text-pink-400" />
                      <span>98% AI Match</span>
                    </div>

                    {/* Wishlist Button */}
                    <motion.button
                      whileTap={{ scale: 0.85 }}
                      onClick={(e) => toggleWishlist(product.id, e)}
                      className="absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-white shadow-lg transition-colors hover:bg-white hover:text-black cursor-pointer"
                    >
                      <Heart size={16} className={isWishlisted ? "fill-pink-500 text-pink-500" : ""} />
                    </motion.button>

                    {/* Quick View Button on Hover */}
                    <div className="absolute inset-x-4 bottom-4 flex justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setQuickViewProduct(product);
                          setSelectedImageIndex(0);
                        }}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/90 backdrop-blur-xl py-2.5 text-xs font-semibold text-black shadow-lg hover:bg-white transition-all cursor-pointer"
                      >
                        <Eye size={14} /> Quick View
                      </button>
                    </div>
                  </div>

                  {/* Brand & Title */}
                  <div className="space-y-1">
                    <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">
                      {product.retailer?.name ?? "Luxury Boutique"}
                    </p>
                    <h3 className="line-clamp-1 text-sm font-semibold text-white group-hover:text-pink-300 transition-colors">
                      {product.title}
                    </h3>
                  </div>
                </div>

                {/* Footer: Price, Rating & Swatches */}
                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                  <div className="flex items-baseline gap-2">
                    <span className="text-base font-extrabold text-white">
                      ${formatPrice(product.price)}
                    </span>
                    {product.originalPrice && Number(formatPrice(product.originalPrice)) > Number(formatPrice(product.price)) && (
                      <span className="text-xs text-zinc-500 line-through">
                        ${formatPrice(product.originalPrice)}
                      </span>
                    )}
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-1 text-amber-400 text-xs font-medium">
                    <Star size={13} className="fill-amber-400" />
                    <span>4.9</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      ) : (
        /* ================= LUXURY EMPTY STATE ================= */
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center rounded-[36px] border border-white/15 bg-slate-950/80 p-16 text-center backdrop-blur-3xl shadow-2xl"
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/10 border border-white/20 mb-6 shadow-[0_0_30px_rgba(255,255,255,0.15)]">
            <ShoppingBag size={32} className="text-zinc-300" />
          </div>
          <h3 className="text-2xl font-bold text-white tracking-tight">No products found</h3>
          <p className="mt-2 text-sm text-zinc-400 max-w-md font-light leading-relaxed">
            Nothing matches your precise filters in this aesthetic. Try widening your price range, enabling more colors, or switching categories.
          </p>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setQuery("");
              setSelectedCategory("All");
            }}
            className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-white px-8 py-3.5 text-sm font-semibold text-black shadow-[0_0_25px_rgba(255,255,255,0.3)] transition-all cursor-pointer"
          >
            <RefreshCw size={16} /> Reset Filters & Retry
          </motion.button>
        </motion.div>
      )}

      {/* ================= QUICK VIEW MODAL ================= */}
      <AnimatePresence>
        {quickViewProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setQuickViewProduct(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-xl"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative z-10 grid w-full max-w-4xl grid-cols-1 md:grid-cols-2 overflow-hidden rounded-[36px] border border-white/20 bg-slate-950 p-6 sm:p-8 text-white shadow-[0_25px_100px_rgba(0,0,0,0.9)] backdrop-blur-3xl"
            >
              {/* Close Button */}
              <button
                onClick={() => setQuickViewProduct(null)}
                className="absolute top-5 right-5 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 border border-white/20 text-white hover:bg-white hover:text-black transition-all cursor-pointer"
              >
                <X size={18} />
              </button>

              {/* Left: Images */}
              <div className="flex flex-col gap-4">
                <div className="relative h-80 sm:h-96 w-full overflow-hidden rounded-2xl bg-slate-900 border border-white/10">
                  <Image
                    src={quickViewProduct.image}
                    alt={quickViewProduct.title}
                    fill
                    className="object-cover object-center"
                  />
                  <div className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-black/60 backdrop-blur-md px-3 py-1 text-xs font-semibold text-white border border-white/25">
                    <Sparkles size={12} className="text-pink-400" />
                    <span>AI Verified Match</span>
                  </div>
                </div>
              </div>

              {/* Right: Details & Actions */}
              <div className="flex flex-col justify-between mt-6 md:mt-0 md:pl-6 space-y-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-pink-400 mb-1">
                    {quickViewProduct.retailer?.name ?? "Luxury House"}
                  </p>
                  <h2 className="text-2xl font-extrabold tracking-tight text-white">
                    {quickViewProduct.title}
                  </h2>

                  <div className="mt-3 flex items-baseline gap-3">
                    <span className="text-2xl font-extrabold text-white">
                      ${formatPrice(quickViewProduct.price)}
                    </span>
                    {quickViewProduct.originalPrice && Number(formatPrice(quickViewProduct.originalPrice)) > Number(formatPrice(quickViewProduct.price)) && (
                      <span className="text-sm text-zinc-500 line-through">
                        ${formatPrice(quickViewProduct.originalPrice)}
                      </span>
                    )}
                  </div>

                  <p className="mt-4 text-sm text-zinc-300 font-light leading-relaxed">
                    Exquisite craftsmanship designed for the modern aesthetic. Features premium breathable fabrics and tailored precision fit.
                  </p>

                  {/* Size Selector */}
                  <div className="mt-6">
                    <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 block mb-2">
                      Select Size
                    </label>
                    <div className="flex gap-2">
                      {SIZES.map((size) => (
                        <button
                          key={size}
                          onClick={() => setSelectedSize(size)}
                          className={`h-10 w-12 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                            selectedSize === size
                              ? "border-white bg-white text-black shadow-lg"
                              : "border-white/20 bg-white/5 text-zinc-300 hover:bg-white/10"
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* CTA Buttons */}
                <div className="space-y-3 pt-4 border-t border-white/10">
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={() => {
                      setIsAddedToCloset(true);
                      setTimeout(() => setIsAddedToCloset(false), 2500);
                    }}
                    className={`w-full py-4 rounded-2xl font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg ${
                      isAddedToCloset
                        ? "bg-emerald-500 text-white"
                        : "bg-white text-black hover:bg-zinc-200 shadow-[0_0_25px_rgba(255,255,255,0.25)]"
                    }`}
                  >
                    {isAddedToCloset ? (
                      <>
                        <Check size={16} /> Added to Your Closet!
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} /> Add to Closet
                      </>
                    )}
                  </motion.button>

                  <a
                    href={quickViewProduct.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-4 rounded-2xl border border-white/25 bg-white/10 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2 hover:bg-white/20 hover:shadow-[0_0_25px_rgba(255,255,255,0.15)] backdrop-blur-xl cursor-pointer"
                  >
                    <ShoppingBag size={16} /> Buy Now on {quickViewProduct.retailer?.name ?? "Store"}
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
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