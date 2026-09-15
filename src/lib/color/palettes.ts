import type { Palette, PaletteColor, Season } from "@/lib/types";
import { hexToCanonical, SEARCH_TERMS } from "./canonical";

/**
 * Curated "colors that go together" gallery — editorial combos that show up
 * in real outfits, plus one palette per season. canonical/searchTerms are
 * derived from the hex so the data stays one honest source.
 */
function c(hex: string, name: string): PaletteColor {
  const canonical = hexToCanonical(hex);
  return { hex, name, canonical, searchTerms: SEARCH_TERMS[canonical] };
}

function editorial(id: string, name: string, colors: PaletteColor[]): Palette {
  return { id, name, kind: "editorial", colors };
}

function seasonal(id: string, name: string, season: Season, colors: PaletteColor[]): Palette {
  return { id, name, kind: "seasonal", season, colors };
}

export const CURATED_PALETTES: Palette[] = [
  editorial("quiet-luxury", "Quiet Luxury", [
    c("#f5f1ea", "cream"),
    c("#c19a6b", "camel"),
    c("#5c4033", "chocolate"),
    c("#2b2b28", "charcoal"),
  ]),
  editorial("french-riviera", "French Riviera", [
    c("#1a2744", "navy"),
    c("#ffffff", "white"),
    c("#c8353a", "rouge"),
    c("#d9c7a7", "sand"),
  ]),
  editorial("coastal-morning", "Coastal Morning", [
    c("#a3c4e8", "sky blue"),
    c("#f8f6f1", "white"),
    c("#d8c6a5", "sand"),
    c("#1a2744", "navy"),
  ]),
  editorial("coffee-date", "Coffee Date", [
    c("#4e342e", "espresso"),
    c("#8b6f5c", "mocha"),
    c("#f3ecdc", "cream"),
    c("#e8c4b8", "blush"),
  ]),
  editorial("ballet-core", "Ballet Core", [
    c("#f2c1c6", "ballet pink"),
    c("#f5f0e8", "ivory"),
    c("#b9b4ac", "dove grey"),
    c("#1a1a1a", "black"),
  ]),
  editorial("old-money-autumn", "Old Money Autumn", [
    c("#1f5c3d", "forest green"),
    c("#c19a6b", "camel"),
    c("#f5f1e6", "cream"),
    c("#6d071a", "burgundy"),
  ]),
  editorial("cherry-cola", "Cherry Cola", [
    c("#6d071a", "burgundy"),
    c("#b01e2e", "cherry"),
    c("#f2c1c6", "blush"),
    c("#1a1a1a", "black"),
  ]),
  editorial("lavender-haze", "Lavender Haze", [
    c("#b39ddb", "lavender"),
    c("#c9bfd4", "lilac grey"),
    c("#ffffff", "white"),
    c("#2b2b28", "charcoal"),
  ]),
  editorial("butter-denim", "Butter & Denim", [
    c("#f0e18a", "butter yellow"),
    c("#3b6fb5", "denim blue"),
    c("#ffffff", "white"),
    c("#1a2744", "navy"),
  ]),
  editorial("olive-grove", "Olive Grove", [
    c("#708238", "olive"),
    c("#9caf88", "sage"),
    c("#f5f1e6", "cream"),
    c("#5c4033", "brown"),
  ]),
  editorial("monochrome-mode", "Monochrome Mode", [
    c("#1a1a1a", "black"),
    c("#55555a", "charcoal grey"),
    c("#c7c7c7", "light grey"),
    c("#ffffff", "white"),
  ]),
  editorial("sunset-terracotta", "Sunset Terracotta", [
    c("#c65d2e", "terracotta"),
    c("#e8a87c", "apricot"),
    c("#f3ecdc", "cream"),
    c("#5c4033", "chocolate"),
  ]),
  editorial("emerald-evening", "Emerald Evening", [
    c("#2e8b57", "emerald"),
    c("#1a1a1a", "black"),
    c("#d4af37", "gold"),
    c("#f5f1e6", "cream"),
  ]),
  editorial("mocha-mousse", "Mocha Mousse", [
    c("#a47864", "mocha mousse"),
    c("#f3ecdc", "cream"),
    c("#d8a596", "dusty rose"),
    c("#2b2b28", "charcoal"),
  ]),
  seasonal("spring-air", "Spring Air", "spring", [
    c("#f0e18a", "butter yellow"),
    c("#a3c4e8", "sky blue"),
    c("#f2c1c6", "blush"),
    c("#ffffff", "white"),
  ]),
  seasonal("summer-shore", "Summer Shore", "summer", [
    c("#ffffff", "white"),
    c("#d8c6a5", "sand"),
    c("#e8756d", "coral"),
    c("#3b6fb5", "ocean blue"),
  ]),
  seasonal("autumn-ember", "Autumn Ember", "autumn", [
    c("#b7410e", "rust"),
    c("#708238", "olive"),
    c("#f5f1e6", "cream"),
    c("#4e342e", "chocolate"),
  ]),
  seasonal("winter-frost", "Winter Frost", "winter", [
    c("#1a1a1a", "black"),
    c("#c7d0d8", "ice grey"),
    c("#6d071a", "burgundy"),
    c("#1a2744", "midnight navy"),
  ]),
];

export function getPalette(id: string): Palette | undefined {
  return CURATED_PALETTES.find((p) => p.id === id);
}
