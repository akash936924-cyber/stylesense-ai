import { NextResponse } from "next/server";
import { z } from "zod";
import { CANONICAL_COLORS } from "@/lib/types";
import { runSearch } from "@/lib/sources";

export const runtime = "nodejs";

const searchBody = z.object({
  query: z.string().max(200).optional(),
  gender: z.enum(["women", "men"]).optional(),
  colors: z.array(z.enum(CANONICAL_COLORS)).max(8).optional(),
  colorHexes: z.array(z.string().regex(/^#[0-9a-fA-F]{6}$/)).max(8).optional(),
  colorTerms: z.array(z.string().max(40)).max(16).optional(),
  priceRange: z.object({ min: z.number().min(0), max: z.number().min(0) }).optional(),
  retailerIds: z.array(z.string().max(100)).max(50).optional(),
  customStores: z
    .array(
      z.object({
        id: z.string(),
        domain: z.string().max(200),
        displayName: z.string().max(100),
        kind: z.enum(["shopify", "generic"]),
      }),
    )
    .max(10)
    .optional(),
  limit: z.number().int().min(1).max(60).optional(),
});

export async function POST(req: Request) {
  const body = searchBody.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ error: body.error.message }, { status: 400 });
  }
  const result = await runSearch(body.data, process.env);
  return NextResponse.json(result);
}
