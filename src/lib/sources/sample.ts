import type { CanonicalColor, Product, SearchParams } from "@/lib/types";
import type { ProductSource } from "./types";

/**
 * Demo boutique — deterministic sample products rendered as inline SVG
 * garment silhouettes (transparent background, so they drag straight onto
 * the studio model). Active only until a real product API key is added,
 * and always labeled as demo data in the UI.
 */
const DISPLAY_HEX: Record<CanonicalColor, string> = {
  black: "#26262b",
  white: "#f2f0eb",
  cream: "#efe6d5",
  beige: "#c8b697",
  brown: "#6b4a35",
  grey: "#8f8f94",
  red: "#b8302f",
  pink: "#e8a0b4",
  orange: "#cf6b35",
  yellow: "#e3c65f",
  green: "#3a7d55",
  olive: "#74804a",
  blue: "#4a7fc1",
  navy: "#24304f",
  purple: "#8d78bd",
  burgundy: "#6f1d2c",
  gold: "#c9a84c",
  silver: "#b9bcc2",
};

const GARMENTS = [
  {
    key: "knit",
    title: "Relaxed Crewneck Knit",
    category: "Knitwear",
    basePrice: 58,
    path: "M60 40 L85 28 Q100 38 115 28 L140 40 L162 60 L172 150 L150 155 L142 90 L142 205 L58 205 L58 90 L50 155 L28 150 L38 60 Z",
  },
  {
    key: "tee",
    title: "Boxy Cotton Tee",
    category: "Tops",
    basePrice: 24,
    path: "M60 40 L85 28 Q100 38 115 28 L140 40 L165 70 L140 88 L135 72 L135 200 L65 200 L65 72 L60 88 L35 70 Z",
  },
  {
    key: "dress",
    title: "Slip Midi Dress",
    category: "Dresses",
    basePrice: 72,
    path: "M70 35 L88 28 Q100 36 112 28 L130 35 L138 60 L128 90 L150 210 L50 210 L72 90 L62 60 Z",
  },
  {
    key: "trousers",
    title: "Wide-Leg Trousers",
    category: "Bottoms",
    basePrice: 64,
    path: "M65 30 L135 30 L142 110 L148 215 L108 215 L100 120 L92 215 L52 215 L58 110 Z",
  },
  {
    key: "skirt",
    title: "A-Line Mini Skirt",
    category: "Bottoms",
    basePrice: 42,
    path: "M70 40 L130 40 L134 55 L156 150 Q100 165 44 150 L66 55 Z",
  },
  {
    key: "coat",
    title: "Longline Wool Coat",
    category: "Outerwear",
    basePrice: 128,
    path: "M58 38 L85 26 L100 40 L115 26 L142 38 L160 62 L168 160 L146 164 L140 95 L146 215 L104 215 L100 120 L96 215 L54 215 L60 95 L54 164 L32 160 L40 62 Z",
  },
] as const;

export function garmentSvgDataUrl(path: string, hex: string): string {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 240">` +
    `<path d="${path}" fill="${hex}" stroke="rgba(0,0,0,0.18)" stroke-width="2" stroke-linejoin="round"/>` +
    `</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

const DEFAULT_COLORS: CanonicalColor[] = ["cream", "beige", "navy", "black"];

export function sampleProducts(params: SearchParams): Product[] {
  const colors = params.colors?.length ? params.colors : DEFAULT_COLORS;
  const queryWords = params.query?.toLowerCase().split(/\s+/).filter(Boolean) ?? [];

  const products: Product[] = [];
  colors.forEach((color, ci) => {
    GARMENTS.forEach((g, gi) => {
      // deterministic price spread so filters have something to bite on
      const amount = Math.round(g.basePrice * (0.8 + ((ci * 7 + gi * 13) % 11) / 20));
      if (params.priceRange && (amount < params.priceRange.min || amount > params.priceRange.max)) {
        return;
      }
      const title = `${g.title} — ${color}`;
      if (queryWords.length) {
        const haystack = `${title} ${g.category}`.toLowerCase();
        if (!queryWords.some((w) => haystack.includes(w))) return;
      }
      products.push({
        id: `sample:${color}-${g.key}`,
        source: "sample",
        sourceProductId: `${color}-${g.key}`,
        title,
        brand: "Demo Boutique",
        imageUrl: garmentSvgDataUrl(g.path, DISPLAY_HEX[color]),
        price: { amount, currency: "USD" },
        productUrl: "#demo",
        retailer: { id: "demo", name: "Demo Boutique", domain: "demo.local" },
        colors: [color],
        category: g.category,
        fetchedAt: new Date().toISOString(),
      });
    });
  });
  return products.slice(0, params.limit ?? 48);
}

export const sampleSource: ProductSource = {
  id: "sample",
  label: "Demo data",
  isConfigured: () => true,
  async search(params) {
    return sampleProducts(params);
  },
};
