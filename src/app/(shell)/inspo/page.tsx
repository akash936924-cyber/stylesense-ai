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
} from "lucide-react";
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
    <GlassCard className="mb-6 flex items-center gap-3 p-4 text-sm text-ink-muted">
      <FlaskConical size={16} className="shrink-0" />
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

/** One matched board pin: thumbnail + what we read + its top products. */
function BoardPinResult({ pin, match }: { pin: BoardPin; match: BoardMatch }) {
  return (
    <GlassCard className="p-4">
      <div className="flex gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={pin.imageUrl}
          alt={pin.description ?? "Board pin"}
          className="h-32 w-24 shrink-0 rounded-xl object-cover"
        />
        <div className="min-w-0 flex-1">
          {match.status === "matching" && (
            <p className="flex items-center gap-2 text-sm text-ink-muted">
              <Loader2 size={15} className="animate-spin" /> matching…
            </p>
          )}
          {match.status === "queued" && (
            <p className="text-sm text-ink-faint">waiting…</p>
          )}
          {match.status === "error" && (
            <p className="text-sm text-like">{match.error ?? "match failed"}</p>
          )}
          {match.status === "done" && match.outcome && (
            <>
              <p className="mb-2 text-xs text-ink-muted">
                looks like:{" "}
                <span className="text-ink">
                  {match.outcome.labels.map((l) => l.label).join(", ")}
                </span>
                {" · "}
                <span className="text-ink">{match.outcome.colors.join(", ")}</span>
              </p>
              {match.outcome.products.length ? (
                <div className="flex gap-3 overflow-x-auto pb-2">
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
  const fileInput = useRef<HTMLInputElement>(null);

  // load the CLIP model while the user is still finding their link
  useEffect(() => warmInspo(), []);

  function submit() {
    const url = pinUrl.trim();
    if (!url) return;
    // board URLs get the picker; everything else goes through pin matching,
    // which bounces back board-shaped pin.it links on its own
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
    <div>
      <PageHeader
        title="Inspo"
        subtitle="Paste a Pinterest pin or a whole board — or drop any outfit image. We'll read colors and pieces, then find similar things for sale in your stores and budget."
      >
        {state.mode !== "idle" && (
          <Button variant="ghost" onClick={clearInspo}>
            <span className="flex items-center gap-1.5">
              <X size={14} /> Clear
            </span>
          </Button>
        )}
      </PageHeader>

      <div className="mb-8 flex flex-wrap gap-6">
        <GlassCard className="min-w-72 flex-1 p-5">
          <form
            className="flex flex-wrap items-center gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <label className="glass flex min-w-60 flex-1 items-center gap-2 rounded-full px-4 py-2">
              <Link2 size={15} className="shrink-0 text-ink-faint" />
              <input
                value={pinUrl}
                onChange={(e) => setPinUrl(e.target.value)}
                placeholder="pin, board, or pin.it link…"
                className="w-full bg-transparent text-sm outline-none placeholder:text-ink-faint"
              />
            </label>
            <Button type="submit" disabled={busy || !pinUrl.trim()}>
              <span className="flex items-center gap-1.5">
                <Sparkles size={15} /> Match it
              </span>
            </Button>
          </form>

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
            className={`mt-4 flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed px-6 py-10 text-sm transition ${
              dragOver
                ? "border-ink bg-surface-hover text-ink"
                : "border-edge-strong text-ink-muted hover:bg-surface-hover"
            }`}
          >
            <ImagePlus size={22} />
            <span>drop an inspo image here, or click to browse</span>
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            hidden
            onChange={(e) => onFile(e.target.files?.[0] ?? undefined)}
          />
        </GlassCard>

        {state.mode === "pin" && (state.preview || state.loading) && (
          <GlassCard className="w-64 shrink-0 p-4 max-md:w-full">
            <p className="mb-3 text-xs uppercase tracking-widest text-ink-muted">
              Your inspo
            </p>
            {state.preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={state.preview}
                alt="Inspo"
                className="w-full rounded-xl object-cover"
              />
            ) : (
              <div className="flex h-40 items-center justify-center">
                <Loader2 size={20} className="animate-spin text-ink-faint" />
              </div>
            )}
            {outcome && (
              <div className="mt-3 space-y-1 text-xs text-ink-muted">
                <p>
                  looks like:{" "}
                  <span className="text-ink">
                    {outcome.labels.map((l) => l.label).join(", ")}
                  </span>
                </p>
                <p>
                  colors: <span className="text-ink">{outcome.colors.join(", ")}</span>
                </p>
              </div>
            )}
          </GlassCard>
        )}
      </div>

      {state.error && (
        <GlassCard className="mb-6 p-4 text-sm text-like">{state.error}</GlassCard>
      )}

      {state.loading && (
        <p className="mb-6 flex items-center gap-2 text-sm text-ink-muted">
          <Loader2 size={15} className="animate-spin" />
          {state.mode === "board"
            ? "reading the board…"
            : "reading the image and searching your stores…"}
        </p>
      )}

      {/* ── single pin / upload results ─────────────────────────────── */}
      {state.mode === "pin" && outcome && (
        <>
          {outcome.demo && <DemoBanner />}
          {sourceErrorNote(outcome.errors) && (
            <p className="mb-4 text-sm text-ink-muted">
              {sourceErrorNote(outcome.errors)}
            </p>
          )}
          {state.refining && (
            <p className="mb-4 flex items-center gap-2 text-sm text-ink-muted">
              <Loader2 size={15} className="animate-spin" />
              refining order by visual similarity…
            </p>
          )}
          {outcome.products.length ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {outcome.products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <EmptyNote />
          )}
        </>
      )}

      {/* ── board picker + per-pin results ──────────────────────────── */}
      {state.mode === "board" && board && (
        <>
          <GlassCard className="mb-6 p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-xl">{board.name}</h2>
                <p className="text-xs text-ink-muted">
                  {board.pinCount > board.pins.length
                    ? `showing the ${board.pins.length} most recent of ${board.pinCount} pins`
                    : `${board.pins.length} pins`}{" "}
                  — pick up to {BOARD_MAX_SELECTED} to match ({state.selectedPinIds.length}{" "}
                  selected)
                </p>
              </div>
              <div className="flex items-center gap-3">
                {state.boardRunning ? (
                  <>
                    <span className="flex items-center gap-2 text-sm text-ink-muted">
                      <Loader2 size={15} className="animate-spin" />
                      {matchedCount} of {state.selectedPinIds.length}
                    </span>
                    <Button variant="ghost" onClick={stopBoardMatch}>
                      Stop
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={runBoardMatch}
                    disabled={!state.selectedPinIds.length}
                  >
                    <span className="flex items-center gap-1.5">
                      <Sparkles size={15} /> Match {state.selectedPinIds.length}{" "}
                      {state.selectedPinIds.length === 1 ? "pin" : "pins"}
                    </span>
                  </Button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 xl:grid-cols-8">
              {board.pins.map((pin) => {
                const selected = state.selectedPinIds.includes(pin.id);
                return (
                  <button
                    key={pin.id}
                    type="button"
                    onClick={() => togglePin(pin.id)}
                    aria-pressed={selected}
                    aria-label={pin.description ?? "Board pin"}
                    className={`relative aspect-[3/4] overflow-hidden rounded-xl transition ${
                      selected
                        ? "ring-2 ring-accent"
                        : "opacity-60 hover:opacity-90"
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
                      <span className="glass-strong absolute right-1.5 top-1.5 rounded-full p-1 text-ink">
                        <Check size={12} />
                      </span>
                    )}
                  </button>
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
        </>
      )}
    </div>
  );
}
