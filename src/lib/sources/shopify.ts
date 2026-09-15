import { z } from "zod";
import type { CustomStore, Product, SearchParams } from "@/lib/types";
import { wordToCanonical } from "@/lib/color/canonical";
import type { SourceContext } from "./types";

/**
 * Custom stores, path 1: most fashion brands run Shopify, which publicly
 * serves /products.json — structured products with variants, prices and
 * images, no key required. We fetch one page (250 items) and filter locally.
 */
const shopifyVariant = z.looseObject({
  price: z.string(),
  compare_at_price: z.string().nullable().optional(),
  available: z.boolean().optional(),
  option1: z.string().nullable().optional(),
  option2: z.string().nullable().optional(),
});

const shopifyProduct = z.looseObject({
  id: z.number(),
  title: z.string(),
  handle: z.string(),
  vendor: z.string().optional(),
  product_type: z.string().optional(),
  tags: z.union([z.array(z.string()), z.string()]).optional(),
  variants: z.array(shopifyVariant),
  options: z
    .array(z.looseObject({ name: z.string(), values: z.array(z.string()) }))
    .optional(),
  images: z.array(z.looseObject({ src: z.string() })).optional(),
});

const shopifyResponse = z.looseObject({ products: z.array(shopifyProduct) });

export function productsJsonUrl(domain: string): string {
  return `https://${domain.replace(/^https?:\/\//, "").replace(/\/.*$/, "")}/products.json?limit=250`;
}

function colorsOf(p: z.infer<typeof shopifyProduct>) {
  const words: string[] = [];
  const colorOption = p.options?.find((o) => /^colou?r$/i.test(o.name));
  if (colorOption) words.push(...colorOption.values);
  const tags = Array.isArray(p.tags) ? p.tags : (p.tags?.split(",") ?? []);
  words.push(...tags, ...p.title.split(/\s+/));
  const found = new Set<NonNullable<ReturnType<typeof wordToCanonical>>>();
  for (const w of words) {
    const c = wordToCanonical(w);
    if (c) found.add(c);
  }
  return [...found];
}

const MENS_RE = /\bmen'?s?\b/i;
const WOMENS_RE = /\bwomen'?s?\b|\bladies\b/i;

/** Best-effort gender filter on product text: drop items explicitly labeled
 *  for the other gender; unlabeled/unisex items are kept. */
function matchesGender(text: string, gender: SearchParams["gender"]): boolean {
  if (!gender) return true;
  if (gender === "women") return !(MENS_RE.test(text) && !WOMENS_RE.test(text));
  return !(WOMENS_RE.test(text) && !MENS_RE.test(text));
}

export function parseShopifyProducts(
  json: unknown,
  store: CustomStore,
  params: SearchParams,
): Product[] {
  const parsed = shopifyResponse.safeParse(json);
  if (!parsed.success) return [];

  const wantedColors = new Set(params.colors ?? []);
  const queryWords = params.query?.toLowerCase().split(/\s+/).filter(Boolean) ?? [];

  return parsed.data.products.flatMap((p) => {
    const variant = p.variants.find((v) => v.available !== false) ?? p.variants[0];
    const image = p.images?.[0];
    if (!variant || !image) return [];

    const amount = Number(variant.price);
    if (Number.isNaN(amount)) return [];
    if (params.priceRange && (amount < params.priceRange.min || amount > params.priceRange.max)) {
      return [];
    }

    const colors = colorsOf(p);
    if (wantedColors.size && !colors.some((c) => wantedColors.has(c))) return [];

    const tags = Array.isArray(p.tags) ? p.tags.join(" ") : (p.tags ?? "");
    if (!matchesGender(`${p.title} ${p.product_type ?? ""} ${tags}`, params.gender)) {
      return [];
    }

    if (queryWords.length) {
      const haystack = `${p.title} ${p.product_type ?? ""}`.toLowerCase();
      if (!queryWords.some((w) => haystack.includes(w))) return [];
    }

    const compareAt = variant.compare_at_price ? Number(variant.compare_at_price) : null;
    return [
      {
        id: `shopify:${store.domain}:${p.id}`,
        source: "shopify" as const,
        sourceProductId: String(p.id),
        title: p.title,
        brand: p.vendor,
        imageUrl: image.src,
        price: {
          amount: compareAt && compareAt > amount ? compareAt : amount,
          currency: "USD",
        },
        salePrice: compareAt && compareAt > amount ? amount : undefined,
        productUrl: `https://${store.domain}/products/${p.handle}`,
        retailer: { id: store.domain, name: store.displayName, domain: store.domain },
        colors,
        category: p.product_type,
        fetchedAt: new Date().toISOString(),
      },
    ];
  });
}

export async function searchShopifyStore(
  store: CustomStore,
  params: SearchParams,
  ctx: SourceContext,
): Promise<Product[]> {
  const res = await ctx.fetchFn(productsJsonUrl(store.domain), {
    headers: { "user-agent": "closet-labs (personal styling app)" },
  });
  if (!res.ok) throw new Error(`shopify ${store.domain} ${res.status}`);
  return parseShopifyProducts(await res.json(), store, params);
}

/** Does this domain expose a public Shopify catalog? Used when adding a store. */
export async function probeShopify(
  domain: string,
  fetchFn: typeof fetch,
): Promise<boolean> {
  try {
    const res = await fetchFn(productsJsonUrl(domain), {
      headers: { "user-agent": "closet-labs (personal styling app)" },
    });
    if (!res.ok) return false;
    const json = await res.json();
    return shopifyResponse.safeParse(json).success;
  } catch {
    return false;
  }
}
