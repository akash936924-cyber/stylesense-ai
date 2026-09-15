import type { Product, SearchParams } from "@/lib/types";
import { channel3Source, NON_CHANNEL3_RETAILERS } from "./channel3";
import { ebaySource } from "./ebay";
import { sampleSource } from "./sample";
import { searchShopifyStore } from "./shopify";
import { searchTavilyStore } from "./tavily";
import type { SourceContext } from "./types";

export interface SearchResult {
  products: Product[];
  /** which adapters actually contributed */
  sourcesUsed: string[];
  /** true when results are demo data because no product API key is set */
  demo: boolean;
  /** false when catalog retailers (Zara, Nordstrom, ...) can't be searched — no Channel3/eBay key */
  catalogConfigured: boolean;
  errors: { source: string; message: string }[];
}

function dedupe(products: Product[]): Product[] {
  const seen = new Set<string>();
  return products.filter((p) => {
    const keys = [`${p.retailer.domain}|${p.title.toLowerCase()}`, p.imageUrl];
    if (keys.some((k) => seen.has(k))) return false;
    keys.forEach((k) => seen.add(k));
    return true;
  });
}

/** How well a product hits the asked-for colors (used to sort, not drop). */
function colorScore(p: Product, wanted: Set<string>): number {
  if (!wanted.size) return 0;
  return p.colors.reduce((score, c) => score + (wanted.has(c) ? 1 : 0), 0);
}

/**
 * Sources treat priceRange as advisory (Channel3 regularly returns items
 * over max) — enforce it locally on the payable price. amount 0 means
 * "see price" (unknown) and is kept.
 */
export function withinBudget(
  p: Product,
  range?: SearchParams["priceRange"],
): boolean {
  if (!range) return true;
  const payable = p.salePrice ?? p.price.amount;
  if (payable === 0) return true;
  if (payable < range.min) return false;
  return range.max <= 0 || payable <= range.max;
}

/**
 * Fan out across every enabled source, then normalize / dedupe / rank.
 * Individual source failures degrade gracefully into `errors`.
 */
export async function runSearch(
  params: SearchParams,
  env: SourceContext["env"],
  fetchFn: typeof fetch = fetch,
): Promise<SearchResult> {
  const ctx: SourceContext = { fetchFn, env };
  const jobs: { source: string; run: () => Promise<Product[]> }[] = [];

  const retailerIds = params.retailerIds ?? [];
  // skip channel3 when the selection is exclusively adapter-owned stores (e.g. only eBay)
  const channel3Wanted =
    !retailerIds.length || retailerIds.some((id) => !NON_CHANNEL3_RETAILERS.has(id));
  if (channel3Source.isConfigured(env) && channel3Wanted) {
    jobs.push({ source: "channel3", run: () => channel3Source.search(params, ctx) });
  }
  const ebayWanted = !retailerIds.length || retailerIds.includes("ebay.com");
  if (ebaySource.isConfigured(env) && ebayWanted) {
    jobs.push({ source: "ebay", run: () => ebaySource.search(params, ctx) });
  }

  for (const store of params.customStores ?? []) {
    if (store.kind === "shopify") {
      jobs.push({
        source: `shopify:${store.domain}`,
        run: () => searchShopifyStore(store, params, ctx),
      });
    } else if (env.TAVILY_API_KEY) {
      jobs.push({
        source: `tavily:${store.domain}`,
        run: () => searchTavilyStore(store, params, ctx),
      });
    }
  }

  // no real source at all (no API keys, no custom stores) → labeled demo data
  const demo = jobs.length === 0;
  if (demo) {
    jobs.push({ source: "sample", run: () => sampleSource.search(params, ctx) });
  }

  const settled = await Promise.allSettled(jobs.map((j) => j.run()));
  const products: Product[] = [];
  const sourcesUsed: string[] = [];
  const errors: SearchResult["errors"] = [];

  settled.forEach((result, i) => {
    if (result.status === "fulfilled") {
      if (result.value.length) sourcesUsed.push(jobs[i].source);
      products.push(...result.value);
    } else {
      errors.push({ source: jobs[i].source, message: String(result.reason) });
    }
  });

  // store selection is enforced per-source (Channel3 website_ids, eBay
  // on/off, custom stores are explicit) — no local domain post-filter,
  // which would wrongly drop catalog results from unlisted boutiques
  const filtered = dedupe(products).filter((p) => withinBudget(p, params.priceRange));

  const wanted = new Set<string>(params.colors ?? []);
  filtered.sort((a, b) => colorScore(b, wanted) - colorScore(a, wanted));

  return {
    products: filtered,
    sourcesUsed,
    demo,
    catalogConfigured: channel3Source.isConfigured(env) || ebaySource.isConfigured(env),
    errors,
  };
}
