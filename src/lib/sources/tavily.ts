import { z } from "zod";
import type { CustomStore, Product, SearchParams } from "@/lib/types";
import type { SourceContext } from "./types";

/**
 * Custom stores, path 2: non-Shopify sites are searched via Tavily with
 * include_domains — best-effort results (title + link, price unknown).
 * 1,000 free credits/month, so callers should cache aggressively.
 */
const ENDPOINT = "https://api.tavily.com/search";

export function buildTavilyRequest(
  store: CustomStore,
  params: SearchParams,
): { url: string; body: Record<string, unknown> } {
  const query = [
    params.colorTerms?.[0],
    params.query ?? "clothing",
    "buy",
  ]
    .filter(Boolean)
    .join(" ");
  return {
    url: ENDPOINT,
    body: {
      query,
      include_domains: [store.domain],
      include_images: true,
      max_results: Math.min(params.limit ?? 10, 10),
    },
  };
}

const tavilyResponse = z.looseObject({
  results: z
    .array(z.looseObject({ title: z.string(), url: z.string() }))
    .optional(),
  images: z.array(z.union([z.string(), z.looseObject({ url: z.string() })])).optional(),
});

export function parseTavilyResponse(json: unknown, store: CustomStore): Product[] {
  const parsed = tavilyResponse.safeParse(json);
  if (!parsed.success) return [];
  const images = (parsed.data.images ?? []).map((i) => (typeof i === "string" ? i : i.url));
  return (parsed.data.results ?? []).map((r, i) => ({
    id: `tavily:${store.domain}:${r.url}`,
    source: "tavily" as const,
    sourceProductId: r.url,
    title: r.title,
    imageUrl: images[i] ?? "",
    price: { amount: 0, currency: "USD" }, // unknown — UI shows "see price"
    productUrl: r.url,
    retailer: { id: store.domain, name: store.displayName, domain: store.domain },
    colors: [],
    fetchedAt: new Date().toISOString(),
  }));
}

export async function searchTavilyStore(
  store: CustomStore,
  params: SearchParams,
  ctx: SourceContext,
): Promise<Product[]> {
  const { url, body } = buildTavilyRequest(store, params);
  const res = await ctx.fetchFn(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${ctx.env.TAVILY_API_KEY}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`tavily ${res.status}`);
  return parseTavilyResponse(await res.json(), store);
}
