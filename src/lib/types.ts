/**
 * Core domain types — one normalized shape shared by every feature and
 * product source. Mirrors supabase/migrations/0001_init.sql.
 */

export const CANONICAL_COLORS = [
  "black",
  "white",
  "cream",
  "beige",
  "brown",
  "grey",
  "red",
  "pink",
  "orange",
  "yellow",
  "green",
  "olive",
  "blue",
  "navy",
  "purple",
  "burgundy",
  "gold",
  "silver",
] as const;
export type CanonicalColor = (typeof CANONICAL_COLORS)[number];

export type Harmony =
  | "monochrome"
  | "analogous"
  | "complementary"
  | "split-complementary"
  | "triadic";

export type Season = "spring" | "summer" | "autumn" | "winter";

export interface PaletteColor {
  hex: string;
  name: string;
  canonical: CanonicalColor;
  /** retailer-friendly words for this shade, used to build search queries */
  searchTerms: string[];
}

export interface Palette {
  id: string;
  name: string;
  kind: "harmony" | "seasonal" | "editorial" | "custom";
  harmony?: Harmony;
  season?: Season;
  colors: PaletteColor[];
}

export type ProductSourceId =
  | "channel3"
  | "ebay"
  | "rakuten"
  | "etsy"
  | "shopify"
  | "tavily"
  | "sample";

export type RetailerTier =
  | "fast-fashion"
  | "mid"
  | "luxury"
  | "marketplace"
  | "custom";

export interface Retailer {
  id: string;
  source: ProductSourceId;
  name: string;
  domain: string;
  tier: RetailerTier;
  logoUrl?: string;
}

export interface CustomStore {
  id: string;
  domain: string;
  displayName: string;
  /** shopify = has a public /products.json; generic = searched via Tavily */
  kind: "shopify" | "generic";
}

export type GenderFilter = "women" | "men";

export interface UserPrefs {
  likedPaletteIds: string[];
  selectedRetailerIds: string[];
  customStores: CustomStore[];
  priceRange: { min: number; max: number };
  /** "all" shows everything */
  gender: GenderFilter | "all";
  skinToneId: string;
}

export interface Product {
  id: string;
  source: ProductSourceId;
  sourceProductId: string;
  title: string;
  brand?: string;
  imageUrl: string;
  price: { amount: number; currency: string };
  salePrice?: number;
  /** outbound (affiliate where available) link to buy */
  productUrl: string;
  retailer: { id: string; name: string; domain: string };
  colors: CanonicalColor[];
  category?: string;
  fetchedAt: string;
}

export interface SearchParams {
  query?: string;
  gender?: GenderFilter;
  colors?: CanonicalColor[];
  /** exact palette hexes — sources with true color filters (Channel3) use these */
  colorHexes?: string[];
  /** extra shade words from the palette (e.g. "taupe", "camel") */
  colorTerms?: string[];
  priceRange?: { min: number; max: number };
  retailerIds?: string[];
  customStores?: CustomStore[];
  limit?: number;
}

export interface OutfitItem {
  id: string;
  productId?: string;
  imageUrl: string;
  /** data-URL or storage path of the background-removed cutout */
  cutoutUrl?: string;
  transform: { x: number; y: number; scale: number; rotation: number; zIndex: number };
}

export interface Outfit {
  id: string;
  name: string;
  skinToneId: string;
  items: OutfitItem[];
  updatedAt: string;
}

export interface TrendEntry {
  id: string;
  title: string;
  blurb: string;
  season: Season;
  year: number;
  imageUrl?: string;
  sourceUrl?: string;
  /** links a trend to a seeded palette and ready-made queries */
  paletteId?: string;
  searchTerms: string[];
}

export type SavedKind = "product" | "palette" | "outfit" | "inspo";
