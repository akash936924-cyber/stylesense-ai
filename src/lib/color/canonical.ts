import { differenceCiede2000, parse } from "culori";
import type { CanonicalColor } from "@/lib/types";

/**
 * Maps any hex to the small canonical color vocabulary retailers understand.
 * Nearest-anchor classification with CIEDE2000 in Lab space — each canonical
 * color has several representative shades so off-center hues still land well.
 */
const ANCHORS: Record<CanonicalColor, string[]> = {
  black: ["#000000", "#1a1a1a", "#26262b"],
  white: ["#ffffff", "#f8f8f8"],
  cream: ["#f5f1e6", "#efe6d5", "#f3ecdc"],
  beige: ["#d9c7a7", "#b8ad9e", "#c19a6b", "#cbbfa8"],
  brown: ["#6b4226", "#8b5a2b", "#4e342e", "#7b5b45"],
  grey: ["#808080", "#a9a9a9", "#55555a", "#c7c7c7"],
  red: ["#d32f2f", "#b71c1c", "#e53935"],
  pink: ["#f4a7b9", "#e75480", "#f2c1c6", "#e8a0bf"],
  orange: ["#e8722a", "#d2691e", "#c65d2e"],
  yellow: ["#e8c547", "#ffd700", "#d4a017", "#f0e18a"],
  green: ["#2e7d32", "#4caf50", "#2e8b57", "#1f5c3d"],
  olive: ["#708238", "#6b8e23", "#8a865d", "#55603a"],
  blue: ["#1e88e5", "#4a90d9", "#a3c4e8", "#3b6fb5"],
  navy: ["#1a2744", "#101d3a", "#232f55"],
  purple: ["#7e57c2", "#b39ddb", "#5e4b8b"],
  burgundy: ["#6d071a", "#800020", "#58181f"],
  gold: ["#d4af37", "#cfa93f"],
  silver: ["#c0c0c0", "#b5b8bd"],
};

/** Retailer-friendly words per canonical color, broadest first. */
export const SEARCH_TERMS: Record<CanonicalColor, string[]> = {
  black: ["black"],
  white: ["white"],
  cream: ["cream", "ivory", "off-white"],
  beige: ["beige", "taupe", "tan", "camel", "sand"],
  brown: ["brown", "chocolate", "mocha", "espresso"],
  grey: ["grey", "gray", "charcoal", "heather"],
  red: ["red", "scarlet", "cherry"],
  pink: ["pink", "blush", "rose"],
  orange: ["orange", "rust", "terracotta"],
  yellow: ["yellow", "mustard", "butter"],
  green: ["green", "emerald", "forest green"],
  olive: ["olive", "khaki", "sage"],
  blue: ["blue", "cobalt", "sky blue", "light blue"],
  navy: ["navy", "dark blue", "midnight"],
  purple: ["purple", "lavender", "lilac", "plum"],
  burgundy: ["burgundy", "wine", "maroon", "oxblood"],
  gold: ["gold", "metallic gold"],
  silver: ["silver", "metallic silver"],
};

const deltaE = differenceCiede2000();

const anchorList = (Object.entries(ANCHORS) as [CanonicalColor, string[]][]).flatMap(
  ([canonical, hexes]) => hexes.map((hex) => ({ canonical, color: parse(hex)! })),
);

type ParsedColor = NonNullable<ReturnType<typeof parse>>;

function nearestCanonical(color: ParsedColor): CanonicalColor {
  let best: CanonicalColor = "grey";
  let bestDist = Infinity;
  for (const anchor of anchorList) {
    const d = deltaE(color, anchor.color);
    if (d < bestDist) {
      bestDist = d;
      best = anchor.canonical;
    }
  }
  return best;
}

export function hexToCanonical(hex: string): CanonicalColor {
  const color = parse(hex);
  if (!color) return "grey";
  return nearestCanonical(color);
}

/** Classify a raw 0-255 RGB pixel (used for dominant-color extraction). */
export function rgbToCanonical(r: number, g: number, b: number): CanonicalColor {
  return nearestCanonical({ mode: "rgb", r: r / 255, g: g / 255, b: b / 255 });
}

export function searchTermsFor(hex: string): string[] {
  return SEARCH_TERMS[hexToCanonical(hex)];
}

/** Reverse lookup: a color word from product data ("Camel") → canonical bucket. */
export function wordToCanonical(word: string): CanonicalColor | undefined {
  const w = word.trim().toLowerCase();
  for (const [canonical, terms] of Object.entries(SEARCH_TERMS) as [
    CanonicalColor,
    string[],
  ][]) {
    if (canonical === w || terms.includes(w)) return canonical;
  }
  return undefined;
}
