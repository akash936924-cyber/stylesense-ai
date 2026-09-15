"use client";

import type { BoardPin, BoardRef, BoardSummary } from "@/lib/pinterest/parseBoard";
import type { CanonicalColor, Product } from "@/lib/types";
import { createLocalStore, prefsStore } from "@/lib/store";

/**
 * Inspo match state + orchestration. Lives at module level (not in the
 * page component) so an in-flight match survives navigating away, and in
 * a persistent store so results are still there when you come back.
 */

export interface MatchOutcome {
  labels: { label: string; score: number }[];
  colors: CanonicalColor[];
  products: Product[];
  demo: boolean;
  catalogConfigured: boolean;
  errors: { source: string; message: string }[];
}

export interface BoardMatch {
  status: "queued" | "matching" | "done" | "error";
  error?: string;
  outcome?: MatchOutcome;
}

export interface InspoState {
  mode: "idle" | "pin" | "board";
  /** the inspo image being matched (pin mode) */
  preview: string | null;
  loading: boolean;
  /** phase 2: products shown, visual re-rank still running */
  refining: boolean;
  error: string | null;
  outcome: MatchOutcome | null;
  board: (BoardRef & BoardSummary & { pins: BoardPin[] }) | null;
  selectedPinIds: string[];
  matches: Record<string, BoardMatch>;
  boardRunning: boolean;
}

const INITIAL: InspoState = {
  mode: "idle",
  preview: null,
  loading: false,
  refining: false,
  error: null,
  outcome: null,
  board: null,
  selectedPinIds: [],
  matches: {},
  boardRunning: false,
};

export const inspoStore = createLocalStore<InspoState>("closet-labs:inspo", INITIAL);

// a full page load killed any in-flight work — clear the transient flags
// the previous session may have persisted mid-match
if (typeof window !== "undefined") {
  inspoStore.set((s) => ({
    ...s,
    loading: false,
    refining: false,
    boardRunning: false,
    matches: Object.fromEntries(
      Object.entries(s.matches).map(([id, m]) => [
        id,
        m.status === "matching" || m.status === "queued"
          ? ({ status: "error", error: "interrupted — match again" } as BoardMatch)
          : m,
      ]),
    ),
  }));
}

/** products beyond this rank keep their text/color order (matches server cap) */
const RERANK_TOP = 16;
export const BOARD_DEFAULT_SELECTED = 12;
export const BOARD_MAX_SELECTED = 24;

// stale-response guard: every new user action bumps the run id, and async
// continuations from older runs stop writing to the store
let runId = 0;
let boardCancelled = false;

type InspoApiJson = Partial<MatchOutcome> & {
  error?: string;
  board?: boolean;
  boardUrl?: string;
  resolvedImage?: string | null;
  queryEmbedding?: number[] | null;
};

async function postInspo(
  input: { pinUrl?: string; pinImageUrl?: string; imageDataUrl?: string },
  opts: { limit: number; withEmbedding: boolean },
): Promise<{ ok: boolean; json: InspoApiJson }> {
  const prefs = prefsStore.get();
  const res = await fetch("/api/inspo", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      ...input,
      ...opts,
      gender: prefs.gender === "all" ? undefined : prefs.gender,
      priceRange: prefs.priceRange,
      retailerIds: prefs.selectedRetailerIds.length ? prefs.selectedRetailerIds : undefined,
      customStores: prefs.customStores.length ? prefs.customStores : undefined,
    }),
  });
  return { ok: res.ok, json: (await res.json()) as InspoApiJson };
}

function toOutcome(json: InspoApiJson): MatchOutcome {
  return {
    labels: json.labels ?? [],
    colors: json.colors ?? [],
    products: json.products ?? [],
    demo: json.demo ?? false,
    catalogConfigured: json.catalogConfigured ?? true,
    errors: json.errors ?? [],
  };
}

/** ranked head first (similarity order), unrankable head next, tail untouched */
function applyRanking(products: Product[], ranked: { id: string }[]): Product[] {
  const head = products.slice(0, RERANK_TOP);
  const tail = products.slice(RERANK_TOP);
  const byId = new Map(head.map((p) => [p.id, p]));
  const rankedItems = ranked
    .map((r) => byId.get(r.id))
    .filter((p): p is Product => !!p);
  const rankedIds = new Set(rankedItems.map((p) => p.id));
  return [...rankedItems, ...head.filter((p) => !rankedIds.has(p.id)), ...tail];
}

/** Match one inspo image (pasted pin URL or uploaded file). */
export async function matchPin(input: {
  pinUrl?: string;
  imageDataUrl?: string;
}): Promise<void> {
  const run = ++runId;
  inspoStore.set((s) => ({
    ...INITIAL,
    // keep likes etc. out of this store; only preview carries over
    preview: input.imageDataUrl ?? null,
    mode: "pin",
    loading: true,
    selectedPinIds: s.selectedPinIds,
  }));

  let json: InspoApiJson;
  let ok: boolean;
  try {
    ({ ok, json } = await postInspo(input, { limit: 40, withEmbedding: true }));
  } catch {
    if (run !== runId) return;
    inspoStore.set((s) => ({
      ...s,
      loading: false,
      error: "Matching failed — check your connection and try again.",
    }));
    return;
  }
  if (run !== runId) return;

  if (json.board && json.boardUrl) {
    // a pin.it link that pointed at a whole board — switch flows
    return loadBoard(json.boardUrl);
  }
  if (!ok) {
    inspoStore.set((s) => ({
      ...s,
      loading: false,
      error: json.error ?? "Something went wrong — try another image.",
    }));
    return;
  }

  inspoStore.set((s) => ({
    ...s,
    loading: false,
    outcome: toOutcome(json),
    preview: json.resolvedImage ?? s.preview,
  }));

  // phase 2: visual re-rank — results are already on screen
  const embedding = json.queryEmbedding;
  const products = json.products ?? [];
  if (!embedding || products.length < 2) return;
  inspoStore.set((s) => ({ ...s, refining: true }));
  try {
    const res = await fetch("/api/inspo/rerank", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        queryEmbedding: embedding,
        candidates: products
          .slice(0, RERANK_TOP)
          .map((p) => ({ id: p.id, imageUrl: p.imageUrl })),
      }),
    });
    const rerank = (await res.json()) as { ranked?: { id: string }[] };
    if (run !== runId) return;
    inspoStore.set((s) => ({
      ...s,
      refining: false,
      outcome:
        res.ok && rerank.ranked && s.outcome
          ? { ...s.outcome, products: applyRanking(s.outcome.products, rerank.ranked) }
          : s.outcome,
    }));
  } catch {
    if (run !== runId) return;
    inspoStore.set((s) => ({ ...s, refining: false })); // keep text/color order
  }
}

/** Load a board's pins into the picker. */
export async function loadBoard(boardUrl: string): Promise<void> {
  const run = ++runId;
  boardCancelled = true; // stop any previous board run
  inspoStore.set(() => ({ ...INITIAL, mode: "board", loading: true }));

  try {
    const res = await fetch("/api/board", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ boardUrl }),
    });
    const json = (await res.json()) as
      | (BoardRef & BoardSummary & { pins: BoardPin[] })
      | { error: string };
    if (run !== runId) return;
    if (!res.ok || "error" in json) {
      inspoStore.set((s) => ({
        ...s,
        loading: false,
        error: ("error" in json && json.error) || "Couldn't read that board.",
      }));
      return;
    }
    inspoStore.set((s) => ({
      ...s,
      loading: false,
      board: json,
      selectedPinIds: json.pins.slice(0, BOARD_DEFAULT_SELECTED).map((p) => p.id),
    }));
  } catch {
    if (run !== runId) return;
    inspoStore.set((s) => ({
      ...s,
      loading: false,
      error: "Couldn't reach the board — check your connection and try again.",
    }));
  }
}

/** Match every selected pin that isn't already done, one at a time. */
export async function runBoardMatch(): Promise<void> {
  const state = inspoStore.get();
  if (!state.board || state.boardRunning) return;
  const run = ++runId;
  boardCancelled = false;

  const selected = new Set(state.selectedPinIds);
  const targets = state.board.pins.filter(
    (p) => selected.has(p.id) && state.matches[p.id]?.status !== "done",
  );
  if (!targets.length) return;

  inspoStore.set((s) => ({
    ...s,
    boardRunning: true,
    error: null,
    matches: {
      ...s.matches,
      ...Object.fromEntries(targets.map((p) => [p.id, { status: "queued" } as BoardMatch])),
    },
  }));

  for (const pin of targets) {
    if (run !== runId || boardCancelled) break;
    inspoStore.set((s) => ({
      ...s,
      matches: { ...s.matches, [pin.id]: { status: "matching" } },
    }));
    try {
      const { ok, json } = await postInspo(
        { pinImageUrl: pin.imageUrl },
        // board mode skips the visual re-rank — one CDN download per product
        // image per pin would take minutes across a whole board
        { limit: 12, withEmbedding: false },
      );
      if (run !== runId) return;
      inspoStore.set((s) => ({
        ...s,
        matches: {
          ...s.matches,
          [pin.id]: ok
            ? { status: "done", outcome: toOutcome(json) }
            : { status: "error", error: json.error ?? "match failed" },
        },
      }));
    } catch {
      if (run !== runId) return;
      inspoStore.set((s) => ({
        ...s,
        matches: { ...s.matches, [pin.id]: { status: "error", error: "network error" } },
      }));
    }
  }

  if (run !== runId) return;
  // strip pins this run never reached (cancelled) back out of the list
  inspoStore.set((s) => ({
    ...s,
    boardRunning: false,
    matches: Object.fromEntries(
      Object.entries(s.matches).filter(([, m]) => m.status !== "queued"),
    ),
  }));
}

export function stopBoardMatch(): void {
  boardCancelled = true;
}

export function togglePin(pinId: string): void {
  inspoStore.set((s) => {
    const on = s.selectedPinIds.includes(pinId);
    if (!on && s.selectedPinIds.length >= BOARD_MAX_SELECTED) return s;
    return {
      ...s,
      selectedPinIds: on
        ? s.selectedPinIds.filter((id) => id !== pinId)
        : [...s.selectedPinIds, pinId],
    };
  });
}

export function clearInspo(): void {
  ++runId;
  boardCancelled = true;
  inspoStore.set(() => INITIAL);
}

// the CLIP model takes ~30s to load cold — start it the moment the Inspo
// page mounts so it's warm by the time a URL is pasted
let warmRequested = false;
export function warmInspo(): void {
  if (warmRequested || typeof window === "undefined") return;
  warmRequested = true;
  fetch("/api/warm").catch(() => {
    warmRequested = false; // transient — let a later visit retry
  });
}
