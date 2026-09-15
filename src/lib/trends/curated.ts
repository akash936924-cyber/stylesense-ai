import type { Season, TrendEntry } from "@/lib/types";

/**
 * Hand-curated seasonal trends — each links to a seeded palette and carries
 * ready-made search terms, so a trend is one click from shoppable results.
 * Refresh each season (or replace with an editorial API later).
 */
export function currentSeason(date = new Date()): { season: Season; year: number } {
  const m = date.getMonth(); // 0-11
  if (m >= 2 && m <= 4) return { season: "spring", year: date.getFullYear() };
  if (m >= 5 && m <= 7) return { season: "summer", year: date.getFullYear() };
  if (m >= 8 && m <= 10) return { season: "autumn", year: date.getFullYear() };
  return { season: "winter", year: date.getFullYear() };
}

export const CURATED_TRENDS: TrendEntry[] = [
  // summer 2026
  {
    id: "butter-yellow-2026",
    title: "Butter yellow everything",
    blurb:
      "The soft pastel yellow that took over spring runways is now in every high-street window — easiest as a knit or a flowy midi against denim.",
    season: "summer",
    year: 2026,
    paletteId: "butter-denim",
    searchTerms: ["butter yellow", "pastel yellow dress", "yellow knit"],
  },
  {
    id: "sheer-layers-2026",
    title: "Sheer layering",
    blurb:
      "Organza shirts and mesh tops worn over simple slips — dimension without bulk, and your palette shows through.",
    season: "summer",
    year: 2026,
    searchTerms: ["sheer blouse", "organza shirt", "mesh top"],
  },
  {
    id: "capri-revival-2026",
    title: "The capri revival",
    blurb:
      "Cropped trousers are back from the 2000s, sharpened up: slim, tailored, worn with kitten heels or ballet flats.",
    season: "summer",
    year: 2026,
    searchTerms: ["capri pants", "cropped trousers", "pedal pushers"],
  },
  {
    id: "boho-redux-2026",
    title: "Boho, but quiet",
    blurb:
      "Suede fringe, crochet and prairie skirts in muted earth tones — the maximalist boho of 2015 filtered through quiet luxury.",
    season: "summer",
    year: 2026,
    paletteId: "olive-grove",
    searchTerms: ["suede jacket", "crochet top", "prairie skirt"],
  },
  {
    id: "nautical-2026",
    title: "High-tide nautical",
    blurb:
      "Breton stripes, rope details and crisp navy-and-cream — the Riviera classic that never really leaves, worn oversized this year.",
    season: "summer",
    year: 2026,
    paletteId: "french-riviera",
    searchTerms: ["breton stripe top", "sailor pants", "navy linen"],
  },
  // autumn 2026
  {
    id: "mocha-mousse-2026",
    title: "Mocha mousse neutrals",
    blurb:
      "The color of the year matured into a full wardrobe story — chocolate, cream and dusty rose worn tonally head to toe.",
    season: "autumn",
    year: 2026,
    paletteId: "mocha-mousse",
    searchTerms: ["chocolate brown coat", "mocha knit", "tonal brown outfit"],
  },
  {
    id: "burgundy-accent-2026",
    title: "Burgundy as the new black",
    blurb:
      "Oxblood bags, shoes and leather jackets grounding otherwise neutral looks.",
    season: "autumn",
    year: 2026,
    paletteId: "cherry-cola",
    searchTerms: ["burgundy leather jacket", "oxblood boots", "wine handbag"],
  },
];

export function trendsForSeason(season: Season, year: number): TrendEntry[] {
  const current = CURATED_TRENDS.filter((t) => t.season === season && t.year === year);
  // off-season fallback so the page is never empty
  return current.length ? current : CURATED_TRENDS.slice(0, 5);
}
