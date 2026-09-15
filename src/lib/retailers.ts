import type { Retailer } from "./types";

/**
 * Curated retailer catalog shown in Settings. Catalog-tier retailers are
 * reached through Channel3 offers (post-filtered by domain); eBay has its
 * own adapter; custom stores are appended per user.
 */
export const RETAILER_CATALOG: Retailer[] = [
  // fast fashion & high street
  { id: "zara.com", source: "channel3", name: "Zara", domain: "zara.com", tier: "fast-fashion" },
  { id: "hm.com", source: "channel3", name: "H&M", domain: "hm.com", tier: "fast-fashion" },
  { id: "asos.com", source: "channel3", name: "ASOS", domain: "asos.com", tier: "fast-fashion" },
  { id: "mango.com", source: "channel3", name: "Mango", domain: "mango.com", tier: "fast-fashion" },
  { id: "uniqlo.com", source: "channel3", name: "Uniqlo", domain: "uniqlo.com", tier: "fast-fashion" },
  // mid-range & department
  { id: "nordstrom.com", source: "channel3", name: "Nordstrom", domain: "nordstrom.com", tier: "mid" },
  { id: "aritzia.com", source: "channel3", name: "Aritzia", domain: "aritzia.com", tier: "mid" },
  { id: "madewell.com", source: "channel3", name: "Madewell", domain: "madewell.com", tier: "mid" },
  { id: "abercrombie.com", source: "channel3", name: "Abercrombie & Fitch", domain: "abercrombie.com", tier: "mid" },
  { id: "anthropologie.com", source: "channel3", name: "Anthropologie", domain: "anthropologie.com", tier: "mid" },
  { id: "urbanoutfitters.com", source: "channel3", name: "Urban Outfitters", domain: "urbanoutfitters.com", tier: "mid" },
  // luxury & designer
  { id: "net-a-porter.com", source: "channel3", name: "Net-a-Porter", domain: "net-a-porter.com", tier: "luxury" },
  { id: "ssense.com", source: "channel3", name: "SSENSE", domain: "ssense.com", tier: "luxury" },
  { id: "farfetch.com", source: "channel3", name: "Farfetch", domain: "farfetch.com", tier: "luxury" },
  { id: "saksfifthavenue.com", source: "channel3", name: "Saks Fifth Avenue", domain: "saksfifthavenue.com", tier: "luxury" },
  // marketplaces & resale
  { id: "ebay.com", source: "ebay", name: "eBay", domain: "ebay.com", tier: "marketplace" },
  { id: "etsy.com", source: "etsy", name: "Etsy", domain: "etsy.com", tier: "marketplace" },
  { id: "amazon.com", source: "channel3", name: "Amazon Fashion", domain: "amazon.com", tier: "marketplace" },
  { id: "depop.com", source: "channel3", name: "Depop", domain: "depop.com", tier: "marketplace" },
  { id: "poshmark.com", source: "channel3", name: "Poshmark", domain: "poshmark.com", tier: "marketplace" },
];

export const TIER_LABELS: Record<Retailer["tier"], string> = {
  "fast-fashion": "Fast fashion & high street",
  mid: "Mid-range & department",
  luxury: "Luxury & designer",
  marketplace: "Marketplaces & resale",
  custom: "Your stores",
};
