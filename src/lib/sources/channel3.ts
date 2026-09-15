import { z } from "zod";
import type { Product, SearchParams } from "@/lib/types";
import { wordToCanonical } from "@/lib/color/canonical";
import type { ProductSource, SourceContext } from "./types";

/**
 * Channel3 — primary multi-retailer fashion catalog (free tier, affiliate URLs).
 * POST https://api.trychannel3.com/v1/search with x-api-key.
 * Notably supports a true hex-palette color filter and price range.
 */
const ENDPOINT = "https://api.trychannel3.com/v1/search";

// retailers with their own adapters — never sent to Channel3 as website filters
export const NON_CHANNEL3_RETAILERS = new Set(["ebay.com", "etsy.com"]);

export function buildChannel3Request(
  params: SearchParams,
  opts: { useHexFilter?: boolean } = {},
): {
  url: string;
  init: RequestInit & { headers: Record<string, string> };
} {
  const { useHexFilter = true } = opts;
  // color words must stay in the query unless the hex palette filter is
  // actually applied — "dress" alone loses the color signal entirely
  const hexApplied = useHexFilter && !!params.colorHexes?.length;
  const filters: Record<string, unknown> = {};
  if (params.priceRange) {
    filters.price = {
      min_price: params.priceRange.min,
      max_price: params.priceRange.max,
    };
  }
  if (hexApplied) {
    filters.colors = { palette: params.colorHexes!.map((hex) => ({ hex })) };
  }
  if (params.gender) {
    filters.gender = params.gender === "women" ? "female" : "male";
  }
  // Channel3's website_ids filter accepts domains directly
  const websiteIds = (params.retailerIds ?? []).filter(
    (id) => !NON_CHANNEL3_RETAILERS.has(id),
  );
  if (websiteIds.length) filters.website_ids = websiteIds;

  const colorWords = params.colorTerms?.slice(0, 2).join(" ") ?? "";
  const query = params.query
    ? hexApplied
      ? params.query
      : `${colorWords} ${params.query}`.trim()
    : `${colorWords} clothing`.trim();

  return {
    url: ENDPOINT,
    init: {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": "" },
      body: JSON.stringify({
        query,
        limit: Math.min(params.limit ?? 20, 30),
        filters,
        config: { country: "US", currency: "USD" },
      }),
    },
  };
}

const channel3Product = z.looseObject({
  id: z.string(),
  title: z.string(),
  brands: z.array(z.looseObject({ name: z.string() })).optional(),
  images: z
    .array(z.looseObject({ url: z.string(), is_main_image: z.boolean().optional() }))
    .optional(),
  category: z.looseObject({ title: z.string().optional() }).optional(),
  structured_attributes: z.record(z.string(), z.array(z.string())).optional(),
  offers: z
    .array(
      z.looseObject({
        url: z.string(),
        domain: z.string().optional(),
        price: z
          .looseObject({
            price: z.number(),
            compare_at_price: z.number().nullable().optional(),
            currency: z.string().optional(),
          })
          .optional(),
      }),
    )
    .optional(),
});

const channel3Response = z.looseObject({
  products: z.array(channel3Product).optional(),
});

function prettifyDomain(domain: string): string {
  // use the registrable label, not a subdomain: us.brand.com -> brand,
  // brand.co.uk -> brand, shopmarea.com -> shopmarea
  const parts = domain.replace(/^www\./, "").split(".").filter(Boolean);
  let core = parts.length >= 2 ? parts[parts.length - 2] : parts[0] ?? domain;
  if (parts.length >= 3 && /^(co|com|net|org|ac|gov)$/.test(core)) {
    core = parts[parts.length - 3];
  }
  return core.charAt(0).toUpperCase() + core.slice(1);
}

export function parseChannel3Response(json: unknown): Product[] {
  const parsed = channel3Response.safeParse(json);
  if (!parsed.success) return [];
  return (parsed.data.products ?? []).flatMap((p) => {
    const offer = p.offers?.[0];
    const image = p.images?.find((i) => i.is_main_image) ?? p.images?.[0];
    if (!offer?.price || !image) return [];
    const domain = offer.domain ?? "";
    const colorAttrs = p.structured_attributes?.color ?? [];
    const compareAt = offer.price.compare_at_price;
    return [
      {
        id: `channel3:${p.id}`,
        source: "channel3" as const,
        sourceProductId: p.id,
        title: p.title,
        brand: p.brands?.[0]?.name,
        imageUrl: image.url,
        price: {
          // compare_at_price is the original price when the offer is a markdown
          amount: compareAt != null && compareAt > offer.price.price ? compareAt : offer.price.price,
          currency: offer.price.currency ?? "USD",
        },
        salePrice:
          compareAt != null && compareAt > offer.price.price ? offer.price.price : undefined,
        productUrl: offer.url,
        retailer: domain
          ? { id: domain, name: prettifyDomain(domain), domain }
          : { id: "channel3", name: "Channel3", domain: "trychannel3.com" },
        colors: colorAttrs
          .map((c) => wordToCanonical(c))
          .filter((c): c is NonNullable<typeof c> => !!c),
        category: p.category?.title,
        fetchedAt: new Date().toISOString(),
      },
    ];
  });
}

export const channel3Source: ProductSource = {
  id: "channel3",
  label: "Channel3 catalog",
  isConfigured: (env) => !!env.CHANNEL3_API_KEY,
  async search(params: SearchParams, ctx: SourceContext): Promise<Product[]> {
    const run = async (useHexFilter: boolean) => {
      const { url, init } = buildChannel3Request(params, { useHexFilter });
      init.headers["x-api-key"] = ctx.env.CHANNEL3_API_KEY!;
      const res = await ctx.fetchFn(url, init);
      if (!res.ok) throw new Error(`channel3 ${res.status}`);
      return parseChannel3Response(await res.json());
    };
    const products = await run(true);
    // the exact-hex palette filter is strict and often returns nothing —
    // retry once with color words in the query instead
    if (!products.length && params.colorHexes?.length) {
      return run(false);
    }
    return products;
  },
};
