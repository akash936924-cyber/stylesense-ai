import { describe, expect, it } from "vitest";
import { buildChannel3Request, parseChannel3Response } from "./channel3";
import { buildEbaySearchUrl, parseEbayResponse } from "./ebay";
import { withinBudget } from "./index";
import { parseShopifyProducts } from "./shopify";
import { parseTavilyResponse } from "./tavily";
import { sampleProducts } from "./sample";
import type { CustomStore, Product, SearchParams } from "@/lib/types";

const params: SearchParams = {
  query: "knit",
  colors: ["beige", "cream"],
  colorHexes: ["#c19a6b", "#f5f1ea"],
  colorTerms: ["camel", "beige", "cream", "ivory"],
  priceRange: { min: 20, max: 150 },
  limit: 20,
};

describe("channel3", () => {
  it("builds a request with hex palette and price filters", () => {
    const { url, init } = buildChannel3Request(params);
    expect(url).toContain("api.trychannel3.com/v1/search");
    const body = JSON.parse(init.body as string);
    expect(body.query).toBe("knit");
    expect(body.filters.price).toEqual({ min_price: 20, max_price: 150 });
    expect(body.filters.colors.palette).toEqual([
      { hex: "#c19a6b" },
      { hex: "#f5f1ea" },
    ]);
  });

  it("parses products from the documented response shape", () => {
    const products = parseChannel3Response({
      products: [
        {
          id: "p1",
          title: "Wool crewneck",
          brands: [{ id: "b1", name: "Acme" }],
          images: [{ url: "https://img/1.jpg", is_main_image: true }],
          category: { title: "Knitwear" },
          structured_attributes: { color: ["Camel"] },
          offers: [
            {
              url: "https://buy/1",
              domain: "aritzia.com",
              price: { price: 48, compare_at_price: 88, currency: "USD" },
            },
          ],
        },
      ],
    });
    expect(products).toHaveLength(1);
    expect(products[0]).toMatchObject({
      id: "channel3:p1",
      brand: "Acme",
      price: { amount: 88, currency: "USD" },
      salePrice: 48,
      retailer: { id: "aritzia.com", name: "Aritzia", domain: "aritzia.com" },
      colors: ["beige"],
    });
  });

  it("drops offerless or imageless products and survives junk", () => {
    expect(parseChannel3Response({ products: [{ id: "x", title: "no offer" }] })).toEqual([]);
    expect(parseChannel3Response({ nonsense: true })).toEqual([]);
    expect(parseChannel3Response(null)).toEqual([]);
  });

  it("passes selected retailers as website_ids, excluding adapter-owned stores", () => {
    const { init } = buildChannel3Request({
      ...params,
      retailerIds: ["zara.com", "nordstrom.com", "ebay.com", "etsy.com"],
    });
    const body = JSON.parse(init.body as string);
    expect(body.filters.website_ids).toEqual(["zara.com", "nordstrom.com"]);
  });

  it("maps the gender filter to Channel3's enum", () => {
    const women = JSON.parse(
      buildChannel3Request({ ...params, gender: "women" }).init.body as string,
    );
    const men = JSON.parse(
      buildChannel3Request({ ...params, gender: "men" }).init.body as string,
    );
    expect(women.filters.gender).toBe("female");
    expect(men.filters.gender).toBe("male");
    const none = JSON.parse(buildChannel3Request(params).init.body as string);
    expect(none.filters.gender).toBeUndefined();
  });

  it("drops the hex filter and moves color words into the query on retry", () => {
    const { init } = buildChannel3Request(params, { useHexFilter: false });
    const body = JSON.parse(init.body as string);
    expect(body.filters.colors).toBeUndefined();
    expect(body.query).toBe("camel beige knit");
  });

  it("keeps color words in the query when no hexes exist to filter on", () => {
    // regression: inspo matches used to send a colorless "knit" here,
    // returning products in every shade but the inspo image's
    const { init } = buildChannel3Request({ ...params, colorHexes: undefined });
    const body = JSON.parse(init.body as string);
    expect(body.filters.colors).toBeUndefined();
    expect(body.query).toBe("camel beige knit");
  });

  it("prettifies retailer names from subdomains and ccTLDs", () => {
    const make = (domain: string) =>
      parseChannel3Response({
        products: [
          {
            id: "p",
            title: "t",
            images: [{ url: "https://img/i.jpg" }],
            offers: [{ url: "https://buy", domain, price: { price: 10 } }],
          },
        ],
      })[0].retailer.name;
    expect(make("us.brand.com")).toBe("Brand");
    expect(make("shop.brand.co.uk")).toBe("Brand");
    expect(make("aritzia.com")).toBe("Aritzia");
  });
});

describe("ebay", () => {
  it("builds a clothing-category search url with price filter", () => {
    const url = new URL(buildEbaySearchUrl(params));
    expect(url.searchParams.get("q")).toBe("camel knit");
    expect(url.searchParams.get("category_ids")).toBe("11450");
    expect(url.searchParams.get("filter")).toContain("price:[20..150]");
  });

  it("parses item summaries and tags colors from titles", () => {
    const products = parseEbayResponse({
      itemSummaries: [
        {
          itemId: "v1|123|0",
          title: "Vintage Camel Wool Coat",
          image: { imageUrl: "https://img/coat.jpg" },
          price: { value: "75.00", currency: "USD" },
          itemWebUrl: "https://ebay.com/itm/123",
          categories: [{ categoryName: "Coats" }],
        },
      ],
    });
    expect(products).toHaveLength(1);
    expect(products[0].price.amount).toBe(75);
    expect(products[0].colors).toContain("beige");
    expect(products[0].retailer.domain).toBe("ebay.com");
  });
});

describe("shopify", () => {
  const store: CustomStore = {
    id: "acme.com",
    domain: "acme.com",
    displayName: "Acme",
    kind: "shopify",
  };

  const catalog = {
    products: [
      {
        id: 1,
        title: "Camel Knit Sweater",
        handle: "camel-knit",
        vendor: "Acme",
        product_type: "Knitwear",
        tags: ["camel", "wool"],
        variants: [{ price: "58.00", compare_at_price: null, available: true }],
        options: [{ name: "Color", values: ["Camel"] }],
        images: [{ src: "https://acme.com/img.jpg" }],
      },
      {
        id: 2,
        title: "Neon Windbreaker",
        handle: "neon",
        variants: [{ price: "200.00", available: true }],
        options: [{ name: "Color", values: ["Green"] }],
        images: [{ src: "https://acme.com/img2.jpg" }],
      },
    ],
  };

  it("keeps matching items and applies color + price + query filters", () => {
    const products = parseShopifyProducts(catalog, store, params);
    expect(products).toHaveLength(1);
    expect(products[0]).toMatchObject({
      title: "Camel Knit Sweater",
      productUrl: "https://acme.com/products/camel-knit",
      colors: ["beige"],
      retailer: { domain: "acme.com" },
    });
  });

  it("filters by gender labels while keeping unisex items", () => {
    const gendered = {
      products: [
        { ...catalog.products[0], id: 3, title: "Men's Camel Knit Sweater", handle: "m" },
        { ...catalog.products[0], id: 4, title: "Women's Camel Knit Sweater", handle: "w" },
        { ...catalog.products[0], id: 5, title: "Camel Knit Sweater", handle: "u" },
      ],
    };
    const women = parseShopifyProducts(gendered, store, { ...params, gender: "women" });
    expect(women.map((p) => p.title)).toEqual([
      "Women's Camel Knit Sweater",
      "Camel Knit Sweater",
    ]);
    const men = parseShopifyProducts(gendered, store, { ...params, gender: "men" });
    expect(men.map((p) => p.title)).toEqual([
      "Men's Camel Knit Sweater",
      "Camel Knit Sweater",
    ]);
  });

  it("handles string tags and junk safely", () => {
    const stringTags = {
      products: [{ ...catalog.products[0], tags: "camel, wool" }],
    };
    expect(parseShopifyProducts(stringTags, store, params)).toHaveLength(1);
    expect(parseShopifyProducts({ whatever: 1 }, store, params)).toEqual([]);
  });
});

describe("tavily", () => {
  it("maps results to see-price products", () => {
    const store: CustomStore = {
      id: "boutique.com",
      domain: "boutique.com",
      displayName: "Boutique",
      kind: "generic",
    };
    const products = parseTavilyResponse(
      {
        results: [{ title: "Cream knit", url: "https://boutique.com/p/1" }],
        images: ["https://boutique.com/i/1.jpg"],
      },
      store,
    );
    expect(products).toHaveLength(1);
    expect(products[0].price.amount).toBe(0);
    expect(products[0].imageUrl).toBe("https://boutique.com/i/1.jpg");
  });
});

describe("withinBudget", () => {
  const product = (amount: number, salePrice?: number): Product => ({
    id: "p",
    source: "channel3",
    sourceProductId: "p",
    title: "t",
    imageUrl: "https://img/i.jpg",
    price: { amount, currency: "USD" },
    salePrice,
    productUrl: "https://buy",
    retailer: { id: "r", name: "R", domain: "r.com" },
    colors: [],
    fetchedAt: "2026-01-01T00:00:00.000Z",
  });

  it("drops items outside the range on the payable price", () => {
    const range = { min: 20, max: 150 };
    expect(withinBudget(product(100), range)).toBe(true);
    expect(withinBudget(product(151), range)).toBe(false);
    expect(withinBudget(product(10), range)).toBe(false);
    // marked down into range counts — you pay the sale price
    expect(withinBudget(product(400, 120), range)).toBe(true);
  });

  it("keeps unknown ('see price') items and handles open-ended ranges", () => {
    expect(withinBudget(product(0), { min: 20, max: 150 })).toBe(true);
    expect(withinBudget(product(9999), { min: 0, max: 0 })).toBe(true);
    expect(withinBudget(product(9999))).toBe(true);
  });
});

describe("sample", () => {
  it("respects color, price and query filters deterministically", () => {
    const products = sampleProducts(params);
    expect(products.length).toBeGreaterThan(0);
    for (const p of products) {
      expect(["beige", "cream"]).toContain(p.colors[0]);
      expect(p.price.amount).toBeGreaterThanOrEqual(20);
      expect(p.price.amount).toBeLessThanOrEqual(150);
      expect(p.title.toLowerCase()).toContain("knit");
      expect(p.imageUrl.startsWith("data:image/svg+xml,")).toBe(true);
    }
    // deterministic apart from the fetchedAt timestamp
    const strip = (list: typeof products) => list.map(({ fetchedAt: _, ...p }) => p);
    expect(strip(sampleProducts(params))).toEqual(strip(products));
  });
});
