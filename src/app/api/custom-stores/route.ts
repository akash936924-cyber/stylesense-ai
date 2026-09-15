import { NextResponse } from "next/server";
import { z } from "zod";
import { probeShopify } from "@/lib/sources/shopify";

export const runtime = "nodejs";

const body = z.object({
  domain: z
    .string()
    .max(200)
    .transform((d) =>
      d
        .trim()
        .toLowerCase()
        .replace(/^https?:\/\//, "")
        .replace(/\/.*$/, ""),
    )
    .pipe(z.string().regex(/^[a-z0-9.-]+\.[a-z]{2,}$/, "enter a valid domain")),
});

/** Classify a user-added store: public Shopify catalog vs generic website. */
export async function POST(req: Request) {
  const parsed = body.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid store domain" }, { status: 400 });
  }
  const domain = parsed.data.domain;
  const isShopify = await probeShopify(domain, fetch);
  return NextResponse.json({
    domain,
    kind: isShopify ? "shopify" : "generic",
    searchable: isShopify || !!process.env.TAVILY_API_KEY,
  });
}
