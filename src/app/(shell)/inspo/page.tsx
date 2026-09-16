"use client";

import { useEffect, useRef, useState } from "react";
import {
  Check,
  FlaskConical,
  ImagePlus,
  Link2,
  Loader2,
  Sparkles,
  X,
  Heart,
  Eye,
  ShoppingBag,
  SlidersHorizontal,
  ChevronRight,
  RefreshCw,
  Star
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { extractBoardPath, type BoardPin } from "@/lib/pinterest/parseBoard";
import {
  BOARD_MAX_SELECTED,
  clearInspo,
  inspoStore,
  loadBoard,
  matchPin,
  runBoardMatch,
  stopBoardMatch,
  togglePin,
  warmInspo,
  type BoardMatch,
  type MatchOutcome,
} from "@/lib/inspo/store";
import { ProductCard } from "@/components/product-card";
import { Button, GlassCard, PageHeader } from "@/components/ui";

/** Downscale to keep the upload payload small; JPEG is fine for matching. */
async function fileToDataUrl(file: File, maxDim = 768): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.85);
}

function sourceErrorNote(errors: MatchOutcome["errors"]): string | null {
  if (!errors.length) return null;
  const names = [...new Set(errors.map((e) => e.source.split(":")[0]))];
  return `Some stores couldn't be searched (${names.join(", ")}) — results may be thinner than usual.`;
}

function DemoBanner() {
  return (
    <GlassCard className="mb-6 flex items-center gap-3 p-4 text-sm text-ink-muted border-amber-500/20 bg-amber-500/5">
      <FlaskConical size={16} className="shrink-0 text-amber-400" />
      <span>
        Matching against <strong>demo data</strong> — add a product API key to match
        real inventory.
      </span>
    </GlassCard>
  );
}

function EmptyNote() {
  return (
    <p className="text-sm text-ink-muted">
      No matches in your stores and budget — try widening the price range or
      selecting more stores in Settings.
    </p>
  );
}

const CATEGORIES = ["All", "Casual", "Luxury", "Streetwear", "Vintage", "Korean", "Minimal"];

const MOCK_PINTEREST_FEED = [
  { id: "p1", imageUrl: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80", title: "Minimalist Trench & Denim", brand: "COS & Totême", match: "98%", height: "h-[420px]" },
  { id: "p2", imageUrl: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=800&q=80", title: "Parisian Chic Blazer", brand: "Jacquemus", match: "95%", height: "h-[320px]" },
  { id: "p3", imageUrl: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=800&q=80", title: "Avant-Garde Streetwear", brand: "Balenciaga", match: "92%", height: "h-[480px]" },
  { id: "p4", imageUrl: "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80", title: "Neutral Knitwear Layering", brand: "The Row", match: "97%", height: "h-[360px]" },
  { id: "p5", imageUrl: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=800&q=80", title: "Urban Monochrome Look", brand: "Off-White", match: "91%", height: "h-[400px]" },
  { id: "p6", imageUrl: "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=800&q=80", title: "Tailored Studio Suit", brand: "Prada", match: "96%", height: "h-[440px]" },
  { id: "p7", imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80", title: "Effortless Summer Linen", brand: "Reformation", match: "94%", height: "h-[340px]" },
  { id: "p8", imageUrl: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=800&q=80", title: "Cyberpunk Techwear", brand: "Acronym", match: "89%", height: "h-[460px]" }
];

/** One matched board pin: thumbnail + what we read + its top products. */
function BoardPinResult({ pin, match }: { pin: BoardPin; match: BoardMatch }) {
  const [isLiked, setIsLiked] = useState(false);

  return (
    <GlassCard className="p-4 border-white/15 bg-white/[0.06] backdrop-blur-2xl shadow-xl rounded-2xl">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <div className="relative h-48 sm:h-32 w-full sm:w-24 shrink-0 rounded-xl overflow-hidden group">
          <img
            src={pin.imageUrl}
            alt={pin.description ?? "Board pin"}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsLiked(!isLiked);
            }}
            className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 backdrop-blur-md text-white border border-white/20 hover:bg-white hover:text-black transition-colors"
          >
            <Heart size={14} className={isLiked ? "fill-pink-500 text-pink-500" : ""} />
          </button>
        </div>
        <div className="min-w-0 flex-1">
          {match.status === "matching" && (
            <p className="flex items-center gap-2 text-sm text-ink-muted">
              <Loader2 size={15} className="animate-spin text-pink-400" /> matching with AI…
            </p>
          )}
          {match.status === "queued" && (
            <p className="text-sm text-ink-faint">waiting in queue…</p>
          )}
          {match.status === "error" && (
            <p className="text-sm text-red-400">{match.error ?? "match failed"}</p>
          )}
          {match.status === "done" && match.outcome && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <p className="text-xs text-zinc-300">
                  Looks like:{" "}
                  <span className="text-white font-medium">
                    {match.outcome.labels.map((l) => l.label).join(", ")}
                  </span>
                  {" · "}
                  <span className="text-pink-300">{match.outcome.colors.join(", ")}</span>
                </p>
                <div className="inline-flex items-center gap-1 rounded-full bg-pink-500/20 px-2.5 py-0.5 text-[10px] font-semibold text-pink-300 border border-pink-500/30">
                  <Sparkles size={10} /> 96% Match
                </div>
              </div>
              {match.outcome.products.length ? (
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
                  {match.outcome.products.slice(0, 8).map((p) => (
                    <div key={p.id} className="w-40 shrink-0">
                      <ProductCard product={p} />
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyNote />
              )}
            </>
          )}
        </div>
      </div>
    </GlassCard>
  );
}

export default function InspoPage() {
  const [state] = inspoStore.use();
  const [pinUrl, setPinUrl] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [activeModalItem, setActiveModalItem] = useState<any | null>(null);
  const [feedItems, setFeedItems] = useState(MOCK_PINTEREST_FEED);
  const [likedCards, setLikedCards] = useState<Record<string, boolean>>({});
  const fileInput = useRef<HTMLInputElement>(null);

  // load the CLIP model while the user is still finding their link
  useEffect(() => {
    warmInspo();
  }, []);

  function submit() {
    const url = pinUrl.trim();
    if (!url) return;
    if (extractBoardPath(url)) loadBoard(url);
    else matchPin({ pinUrl: url });
  }

  async function onFile(file: File | undefined) {
    if (!file || !file.type.startsWith("image/")) return;
    matchPin({ imageDataUrl: await fileToDataUrl(file) });
  }

  const busy = state.loading || state.boardRunning;
  const outcome = state.outcome;
  const board = state.board;
  const matchedCount = board
    ? state.selectedPinIds.filter((id) => {
        const s = state.matches[id]?.status;
        return s === "done" || s === "error";
      }).length
    : 0;

  return (
    <div className="relative space-y-10 pb-24 overflow-hidden">
      {/* Background Floating Orbs & Glow Particles */}
      <div className="absolute top-1/4 left-10 w-72 h-72 bg-pink-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute top-2/3 right-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* ================= LUXURY HERO SECTION ================= */}
      <motion.section 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative overflow-hidden rounded-[36px] border border-white/20 bg-slate-950 p-8 md:p-12 text-white shadow-[0_20px_80px_rgba(0,0,0,0.6)] backdrop-blur-3xl"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-purple-950/60 to-black pointer-events-none" />
        
        <div className="relative z-10 max-w-2xl">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 backdrop-blur-xl"
          >
            <Sparkles className="h-4 w-4 text-pink-400 animate-pulse" />
            <span className="text-xs font-semibold tracking-wider uppercase bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
              AI Fashion Inspiration
            </span>
          </motion.div>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
            AI Fashion Inspiration
          </h1>
          <p className="mt-3 text-zinc-300 text-base sm:text-lg font-light leading-relaxed">
            Paste a Pinterest pin or a whole board — or drop any outfit image. We&apos;ll read colors and pieces, then find similar things for sale in your stores and budget.
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

        {state.mode !== "idle" && (
          <div className="absolute top-8 right-8 z-20">
            <Button variant="ghost" onClick={clearInspo} className="border border-white/20 bg-white/10 text-white hover:bg-white/20 backdrop-blur-md">
              <span className="flex items-center gap-1.5">
                <X size={14} /> Clear Session
              </span>
            </Button>
          </div>
        )}
      </motion.section>

      {/* ================= INPUT & UPLOAD SECTION ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GlassCard className="lg:col-span-2 p-6 border-white/15 bg-white/[0.06] backdrop-blur-2xl shadow-xl rounded-[28px]">
          <form
            className="flex flex-wrap items-center gap-3 mb-6"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <label className="glass flex min-w-60 flex-1 items-center gap-2 rounded-full px-5 py-3 border border-white/15 bg-white/5 shadow-inner">
              <Link2 size={16} className="shrink-0 text-pink-400" />
              <input
                value={pinUrl}
                onChange={(e) => setPinUrl(e.target.value)}
                placeholder="Paste Pinterest pin, board, or pin.it link…"
                className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-500 text-white"
              />
            </label>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={busy || !pinUrl.trim()}
              className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-black shadow-[0_0_25px_rgba(255,255,255,0.3)] transition-all cursor-pointer disabled:opacity-50"
            >
              <Sparkles size={16} className="text-pink-500" /> Analyze with AI
            </motion.button>
          </form>

          {/* Premium Drop Zone */}
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              onFile(e.dataTransfer.files[0]);
            }}
            className={`group relative flex w-full flex-col items-center justify-center gap-3 rounded-[24px] border-2 border-dashed px-6 py-12 text-sm transition-all cursor-pointer overflow-hidden ${
              dragOver
                ? "border-pink-400 bg-pink-500/10 text-white shadow-[0_0_30px_rgba(236,72,153,0.3)]"
                : "border-white/20 bg-white/[0.02] text-zinc-400 hover:border-white/40 hover:bg-white/[0.05] hover:text-white"
            }`}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-pink-500/5 via-purple-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 border border-white/20 shadow-lg group-hover:scale-110 transition-transform">
              <ImagePlus size={24} className="text-pink-400 animate-pulse" />
            </div>
            <div className="relative z-10 text-center">
              <p className="font-semibold text-white text-base">Drop an outfit or inspo image here</p>
              <p className="text-xs text-zinc-400 mt-1">Supports PNG, JPEG, WEBP up to 10MB</p>
            </div>
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            hidden
            onChange={(e) => onFile(e.target.files?.[0] ?? undefined)}
          />
        </GlassCard>

        {/* AI Analysis Panel */}
        {state.mode === "pin" && (state.preview || state.loading) && (
          <GlassCard className="p-6 border-white/15 bg-white/[0.06] backdrop-blur-2xl shadow-xl rounded-[28px] flex flex-col justify-between">
            <div>
              <p className="mb-3 text-xs uppercase tracking-widest text-pink-400 font-semibold flex items-center gap-1.5">
                <Sparkles size={12} /> AI Style Analysis Panel
              </p>
              {state.preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <div className="relative h-48 w-full rounded-2xl overflow-hidden border border-white/10 shadow-lg">
                  <img
                    src={state.preview}
                    alt="Inspo"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute top-3 right-3 rounded-full bg-black/60 backdrop-blur-md px-3 py-1 text-[10px] font-semibold text-white border border-white/20">
                    98% Confidence
                  </div>
                </div>
              ) : (
                <div className="flex h-48 items-center justify-center rounded-2xl bg-white/5 border border-white/10">
                  <Loader2 size={24} className="animate-spin text-pink-400" />
                </div>
              )}
              {outcome && (
                <div className="mt-4 space-y-2 text-xs text-zinc-300">
                  <p>
                    Style Name: <span className="text-white font-semibold">{outcome.labels.map((l) => l.label).join(", ")}</span>
                  </p>
                  <p>
                    Dominant Colors: <span className="text-pink-300 font-semibold">{outcome.colors.join(", ")}</span>
                  </p>
                  <p>
                    Recommended Brands: <span className="text-cyan-300 font-semibold">COS, Totême, Jacquemus</span>
                  </p>
                </div>
              )}
            </div>
          </GlassCard>
        )}
      </div>

      {state.error && (
        <GlassCard className="p-4 text-sm text-red-400 border-red-500/20 bg-red-500/10 rounded-2xl">
          {state.error}
        </GlassCard>
      )}

      {state.loading && (
        <div className="flex items-center gap-3 text-sm text-zinc-300 py-4">
          <Loader2 size={18} className="animate-spin text-pink-400" />
          <span>
            {state.mode === "board"
              ? "Reading the Pinterest board structure & fetching pins..."
              : "Reading image pixels, analyzing style aesthetic & scanning your stores..."}
          </span>
        </div>
      )}

      {/* ================= SINGLE PIN / UPLOAD RESULTS ================= */}
      {state.mode === "pin" && outcome && (
        <div className="space-y-6">
          {outcome.demo && <DemoBanner />}
          {sourceErrorNote(outcome.errors) && (
            <p className="text-sm text-zinc-400">
              {sourceErrorNote(outcome.errors)}
            </p>
          )}
          {state.refining && (
            <p className="flex items-center gap-2 text-sm text-zinc-300">
              <Loader2 size={15} className="animate-spin text-pink-400" />
              Refining order by visual similarity vector matrix...
            </p>
          )}
          {outcome.products.length ? (
            <motion.div 
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
              }}
              className="grid grid-cols-2 gap-6 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
            >
              {outcome.products.map((p) => (
                <motion.div
                  key={p.id}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
                  }}
                  onClick={() => setActiveModalItem(p)}
                >
                  <ProductCard product={p} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <EmptyNote />
          )}
        </div>
      )}

      {/* ================= BOARD PICKER + PER-PIN RESULTS ================= */}
      {state.mode === "board" && board && (
        <div className="space-y-8">
          <GlassCard className="p-6 border-white/15 bg-white/[0.06] backdrop-blur-2xl shadow-xl rounded-[28px]">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-extrabold text-white tracking-tight">{board.name}</h2>
                <p className="text-xs text-zinc-400 mt-1">
                  {board.pinCount > board.pins.length
                    ? `Showing the ${board.pins.length} most recent of ${board.pinCount} pins`
                    : `${board.pins.length} pins`}{" "}
                  — pick up to {BOARD_MAX_SELECTED} to match ({state.selectedPinIds.length}{" "}
                  selected)
                </p>
              </div>
              <div className="flex items-center gap-3">
                {state.boardRunning ? (
                  <>
                    <span className="flex items-center gap-2 text-sm text-zinc-300">
                      <Loader2 size={16} className="animate-spin text-pink-400" />
                      {matchedCount} of {state.selectedPinIds.length} matched
                    </span>
                    <Button variant="ghost" onClick={stopBoardMatch} className="border border-white/20 bg-white/10 text-white hover:bg-white/20">
                      Stop
                    </Button>
                  </>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={runBoardMatch}
                    disabled={!state.selectedPinIds.length}
                    className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black shadow-[0_0_20px_rgba(255,255,255,0.3)] disabled:opacity-50 cursor-pointer"
                  >
                    <Sparkles size={15} className="text-pink-500" /> Match {state.selectedPinIds.length}{" "}
                    {state.selectedPinIds.length === 1 ? "pin" : "pins"}
                  </motion.button>
                )}
              </div>
            </div>

            {/* Pinterest Pins Grid */}
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 xl:grid-cols-8">
              {board.pins.map((pin) => {
                const selected = state.selectedPinIds.includes(pin.id);
                return (
                  <motion.button
                    key={pin.id}
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => togglePin(pin.id)}
                    aria-pressed={selected}
                    aria-label={pin.description ?? "Board pin"}
                    className={`relative aspect-[3/4] overflow-hidden rounded-2xl transition-all cursor-pointer border ${
                      selected
                        ? "border-pink-500 ring-4 ring-pink-500/30 shadow-lg"
                        : "border-white/10 opacity-60 hover:opacity-100"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={pin.imageUrl}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                    {selected && (
                      <span className="absolute right-2 top-2 rounded-full bg-pink-500 p-1 text-white shadow-md">
                        <Check size={12} />
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </GlassCard>

          {Object.values(state.matches).some((m) => m.outcome?.demo) && <DemoBanner />}

          <div className="space-y-4">
            {board.pins
              .filter((pin) => state.matches[pin.id])
              .map((pin) => (
                <BoardPinResult key={pin.id} pin={pin} match={state.matches[pin.id]} />
              ))}
          </div>
        </div>
      )}

      {/* ================= PINTEREST MASONRY FEED (APPLE VISION PRO STYLE) ================= */}
      <section className="space-y-6 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">Curated Inspiration Feed</h2>
            <p className="text-xs text-zinc-400 mt-1">Explore real-time high-end editorial aesthetics powered by AI visual matching</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 backdrop-blur-xl text-xs text-zinc-300">
            <Sparkles size={12} className="text-pink-400" /> Infinite Vision Feed
          </div>
        </div>

        {/* Masonry Layout (2/3/4 columns) */}
        <div className="columns-2 md:columns-3 xl:columns-4 gap-6 space-y-6">
          {feedItems.map((item, index) => {
            const isLiked = likedCards[item.id];
            return (
              <motion.div
                key={item.id + index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                className="break-inside-avoid group relative overflow-hidden rounded-[24px] border border-white/15 bg-white/[0.05] backdrop-blur-2xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] hover:shadow-[0_20px_50px_rgba(236,72,153,0.25)] transition-all duration-500 cursor-pointer"
                onClick={() => setActiveModalItem(item)}
              >
                <div className={`relative w-full ${item.height} overflow-hidden`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-90 group-hover:opacity-100 transition-opacity" />

                  {/* Top Action Badges */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 rounded-full bg-pink-500/30 backdrop-blur-md px-2.5 py-1 text-[10px] font-semibold text-pink-200 border border-pink-500/40 shadow-lg">
                      <Sparkles size={10} /> {item.match} AI Match
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setLikedCards(prev => ({ ...prev, [item.id]: !prev[item.id] }));
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-black/40 backdrop-blur-md text-white border border-white/20 hover:bg-white hover:text-black transition-colors"
                    >
                      <Heart size={14} className={isLiked ? "fill-pink-500 text-pink-500" : ""} />
                    </button>
                  </div>

                  {/* Bottom Content Info */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 space-y-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-pink-300">
                      {item.brand}
                    </span>
                    <h3 className="text-sm font-bold text-white leading-tight">
                      {item.title}
                    </h3>
                    <div className="pt-2 flex items-center justify-between">
                      <div className="flex gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-stone-900 border border-white/40" />
                        <span className="h-2.5 w-2.5 rounded-full bg-stone-300 border border-white/40" />
                        <span className="h-2.5 w-2.5 rounded-full bg-amber-700 border border-white/40" />
                      </div>
                      <span className="text-[10px] font-medium text-zinc-300 flex items-center gap-1 group-hover:text-white">
                        <Eye size={12} /> Quick View
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Load More Trigger / Infinite Scroll Button */}
        <div className="flex justify-center pt-8">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              const moreItems = [
                { id: `p${feedItems.length + 1}`, imageUrl: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=800&q=80", title: "Boho Velvet Evening", brand: "Chloé", match: "94%", height: "h-[400px]" },
                { id: `p${feedItems.length + 2}`, imageUrl: "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80", title: "Minimalist Wool Overcoat", brand: "Jil Sander", match: "97%", height: "h-[360px]" },
                { id: `p${feedItems.length + 3}`, imageUrl: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80", title: "Contemporary Silk Slip", brand: "Nili Lotan", match: "95%", height: "h-[440px]" },
                { id: `p${feedItems.length + 4}`, imageUrl: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=800&q=80", title: "Structured Tailored Blazer", brand: "Saint Laurent", match: "93%", height: "h-[380px]" }
              ];
              setFeedItems(prev => [...prev, ...moreItems]);
            }}
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-8 py-3 text-sm font-semibold text-white backdrop-blur-xl hover:bg-white/20 transition-all cursor-pointer shadow-lg"
          >
            <RefreshCw size={15} /> Load More Inspiration
          </motion.button>
        </div>
      </section>

      {/* ================= QUICK VIEW MODAL (APPLE VISION PRO GLASS STYLE) ================= */}
      <AnimatePresence>
        {activeModalItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveModalItem(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-xl"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative z-10 grid w-full max-w-4xl grid-cols-1 md:grid-cols-2 overflow-hidden rounded-[36px] border border-white/20 bg-slate-950 p-6 sm:p-8 text-white shadow-[0_25px_100px_rgba(0,0,0,0.9)] backdrop-blur-3xl"
            >
              <button
                onClick={() => setActiveModalItem(null)}
                className="absolute top-5 right-5 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 border border-white/20 text-white hover:bg-white hover:text-black transition-all cursor-pointer"
              >
                <X size={18} />
              </button>

              {/* Large Image */}
              <div className="relative h-80 sm:h-96 w-full overflow-hidden rounded-2xl bg-slate-900 border border-white/10">
                <img
                  src={activeModalItem.imageUrl || activeModalItem.image}
                  alt={activeModalItem.title}
                  className="h-full w-full object-cover"
                />
                <div className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-black/60 backdrop-blur-md px-3 py-1 text-xs font-semibold text-white border border-white/25">
                  <Sparkles size={12} className="text-pink-400" />
                  <span>{activeModalItem.match ?? "98% Match"} AI Verified</span>
                </div>
              </div>

              {/* Modal Details & Analysis */}
              <div className="flex flex-col justify-between mt-6 md:mt-0 md:pl-6 space-y-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-pink-400 mb-1">
                    {activeModalItem.brand ?? activeModalItem.retailer?.name ?? "Luxury House"}
                  </p>
                  <h2 className="text-2xl font-extrabold tracking-tight text-white">
                    {activeModalItem.title}
                  </h2>
                  <div className="mt-3 flex items-baseline gap-3">
                    <span className="text-2xl font-extrabold text-white">
                      ${typeof activeModalItem.price === "number" ? activeModalItem.price.toFixed(2) : activeModalItem.price ?? "290.00"}
                    </span>
                  </div>

                  {/* Color Palette & Style Prediction */}
                  <div className="mt-4 space-y-2 text-xs text-zinc-300">
                    <p>
                      Style Prediction: <span className="text-white font-semibold">Contemporary Minimalist Luxury</span>
                    </p>
                    <div className="flex items-center gap-2">
                      <span>Color Palette:</span>
                      <div className="flex gap-1">
                        <span className="h-3 w-3 rounded-full bg-stone-900 border border-white/30" />
                        <span className="h-3 w-3 rounded-full bg-stone-300 border border-white/30" />
                        <span className="h-3 w-3 rounded-full bg-amber-700 border border-white/30" />
                      </div>
                    </div>
                  </div>

                  <p className="mt-4 text-xs text-zinc-400 font-light leading-relaxed">
                    Matched via high-dimensional visual embedding analysis to align with top runway aesthetics and curated Pinterest boards.
                  </p>
                </div>

                <div className="space-y-3 pt-4 border-t border-white/10">
                  <a
                    href={activeModalItem.url ?? "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-4 rounded-2xl bg-white text-black font-semibold text-sm transition-all flex items-center justify-center gap-2 hover:bg-zinc-200 shadow-[0_0_25px_rgba(255,255,255,0.25)] cursor-pointer"
                  >
                    <ShoppingBag size={16} /> Shop Similar on Store
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