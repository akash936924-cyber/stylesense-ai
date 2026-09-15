import { z } from "zod";
import type { Product, SearchParams } from "@/lib/types";
import { wordToCanonical } from "@/lib/color/canonical";
import type { ProductSource, SourceContext } from "./types";

/**
 * eBay Browse API — the marketplace/resale tier. Free developer keys.
 * Client-credentials OAuth, then GET item_summary/search in the
 * Clothing, Shoes & Accessories category (11450).
 */
const TOKEN_URL = "https://api.ebay.com/identity/v1/oauth2/token";
const SEARCH_URL = "https://api.ebay.com/buy/browse/v1/item_summary/search";
const CLOTHING_CATEGORY = "11450";

export function buildEbaySearchUrl(params: SearchParams): string {
  const genderWord =
    params.gender === "women" ? "womens" : params.gender === "men" ? "mens" : undefined;
  const q = [genderWord, params.colorTerms?.[0], params.query ?? "clothing"]
    .filter(Boolean)
    .join(" ");
  const url = new URL(SEARCH_URL);
  url.searchParams.set("q", q);
  url.searchParams.set("category_ids", CLOTHING_CATEGORY);
  url.searchParams.set("limit", String(Math.min(params.limit ?? 20, 50)));
  if (params.priceRange) {
    url.searchParams.set(
      "filter",
      `price:[${params.priceRange.min}..${params.priceRange.max}],priceCurrency:USD,conditions:{NEW|USED_EXCELLENT|USED_VERY_GOOD}`,
    );
  }
  return url.toString();
}

const ebayItem = z.looseObject({
  itemId: z.string(),
  title: z.string(),
  image: z.looseObject({ imageUrl: z.string() }).optional(),
  thumbnailImages: z.array(z.looseObject({ imageUrl: z.string() })).optional(),
  price: z.looseObject({ value: z.string(), currency: z.string() }).optional(),
  itemWebUrl: z.string().optional(),
  categories: z.array(z.looseObject({ categoryName: z.string() })).optional(),
});

const ebayResponse = z.looseObject({
  itemSummaries: z.array(ebayItem).optional(),
});

/** Tag colors by scanning the title for known color words. */
function colorsFromTitle(title: string) {
  const found = new Set<NonNullable<ReturnType<typeof wordToCanonical>>>();
  for (const word of title.toLowerCase().split(/[^a-z-]+/)) {
    const c = wordToCanonical(word);
    if (c) found.add(c);
  }
  return [...found];
}

export function parseEbayResponse(json: unknown): Product[] {
  const parsed = ebayResponse.safeParse(json);
  if (!parsed.success) return [];
  return (parsed.data.itemSummaries ?? []).flatMap((item) => {
    const imageUrl = item.image?.imageUrl ?? item.thumbnailImages?.[0]?.imageUrl;
    if (!imageUrl || !item.price || !item.itemWebUrl) return [];
    return [
      {
        id: `ebay:${item.itemId}`,
        source: "ebay" as const,
        sourceProductId: item.itemId,
        title: item.title,
        imageUrl,
        price: { amount: Number(item.price.value), currency: item.price.currency },
        productUrl: item.itemWebUrl,
        retailer: { id: "ebay.com", name: "eBay", domain: "ebay.com" },
        colors: colorsFromTitle(item.title),
        category: item.categories?.[0]?.categoryName,
        fetchedAt: new Date().toISOString(),
      },
    ];
  });
}

// module-scope token cache — client-credentials tokens live ~2h
let cachedToken: { value: string; expiresAt: number } | null = null;

async function getToken(ctx: SourceContext): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.value;
  }
  const basic = Buffer.from(
    `${ctx.env.EBAY_CLIENT_ID}:${ctx.env.EBAY_CLIENT_SECRET}`,
  ).toString("base64");
  const res = await ctx.fetchFn(TOKEN_URL, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      authorization: `Basic ${basic}`,
    },
    body: "grant_type=client_credentials&scope=https%3A%2F%2Fapi.ebay.com%2Foauth%2Fapi_scope",
  });
  if (!res.ok) throw new Error(`ebay token ${res.status}`);
  const json = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = {
    value: json.access_token,
    expiresAt: Date.now() + json.expires_in * 1000,
  };
  return json.access_token;
}

export const ebaySource: ProductSource = {
  id: "ebay",
  label: "eBay",
  isConfigured: (env) => !!env.EBAY_CLIENT_ID && !!env.EBAY_CLIENT_SECRET,
  async search(params: SearchParams, ctx: SourceContext): Promise<Product[]> {
    const token = await getToken(ctx);
    const res = await ctx.fetchFn(buildEbaySearchUrl(params), {
      headers: {
        authorization: `Bearer ${token}`,
        "X-EBAY-C-MARKETPLACE-ID": "EBAY_US",
      },
    });
    if (!res.ok) throw new Error(`ebay search ${res.status}`);
    return parseEbayResponse(await res.json());
  },
};
