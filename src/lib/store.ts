"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { Outfit, Product, UserPrefs } from "./types";

/**
 * Tiny localStorage-backed stores shared across pages (likes on /palettes
 * feed the studio tray, etc.). This is the MVP persistence layer; the same
 * shapes move to Supabase tables when auth lands, so swapping the backend
 * doesn't touch feature code.
 */
export function createLocalStore<T>(key: string, initial: T) {
  let state = initial;
  let loaded = false;
  const listeners = new Set<() => void>();

  function load() {
    if (loaded || typeof window === "undefined") return;
    loaded = true;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) state = { ...initial, ...JSON.parse(raw) };
    } catch {
      // corrupted entry — fall back to defaults
    }
  }

  function set(updater: (prev: T) => T) {
    load();
    state = updater(state);
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // storage full/unavailable — state still works in-memory
    }
    listeners.forEach((l) => l());
  }

  function subscribe(listener: () => void) {
    load();
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  return {
    use(): [T, typeof set] {
      const snapshot = useSyncExternalStore(
        useCallback(subscribe, []),
        () => state,
        () => initial,
      );
      return [snapshot, set];
    },
    set,
    /** current state outside React (async orchestration code) */
    get(): T {
      load();
      return state;
    },
  };
}

export const DEFAULT_PREFS: UserPrefs = {
  likedPaletteIds: [],
  selectedRetailerIds: [], // empty = all stores
  customStores: [],
  priceRange: { min: 0, max: 300 },
  gender: "all",
  skinToneId: "tone-3",
};

export const prefsStore = createLocalStore<UserPrefs>("closet-labs:prefs", DEFAULT_PREFS);

export interface SavedState {
  products: Product[];
  outfits: Outfit[];
}

export const savedStore = createLocalStore<SavedState>("closet-labs:saved", {
  products: [],
  outfits: [],
});
