import { NextResponse } from "next/server";
import { z } from "zod";
import { isAllowedPinImageUrl } from "@/lib/pinterest/parsePin";
import { resolvePinSource } from "@/lib/pinterest/resolve";
import {
  classifyGarment,
  dominantColors,
  embedImage,
  loadImage,
} from "@/lib/similarity/embed";
import { SEARCH_TERMS } from "@/lib/color/canonical";
import { runSearch } from "@/lib/sources";

export const runtime = "nodejs";
export const maxDuration = 60;

const inspoBody = z.object({
  pinUrl: z.url().max(500).optional(),
  /** a pin image already resolved to Pinterest's CDN (board flow) */
  pinImageUrl: z.url().max(500).optional(),
  gender: z.enum(["women", "men"]).optional(),
  imageDataUrl: z
    .string()
    .max(6_000_000) // ~4.5MB image
    .regex(/^data:image\/(png|jpeg|webp);base64,/)
    .optional(),
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
  limit: z.number().int().min(1).max(48).optional(),
  /** skip the CLIP query embedding when the caller won't re-rank (board flow) */
  withEmbedding: z.boolean().optional(),
});

/**
 * Analyze an inspo image and text-search the product sources. Returns
 * immediately — the visual re-rank is a separate follow-up call to
 * /api/inspo/rerank so the user isn't stuck behind 16 image downloads.
 */
export async function POST(req: Request) {
  const parsed = inspoBody.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }
  const body = parsed.data;

  let imageSource: string | null = null;
  if (body.imageDataUrl) {
    imageSource = body.imageDataUrl;
  } else if (body.pinImageUrl) {
    if (!isAllowedPinImageUrl(body.pinImageUrl)) {
      return NextResponse.json({ error: "Not a Pinterest image URL" }, { status: 400 });
    }
    imageSource = body.pinImageUrl;
  } else if (body.pinUrl) {
    const resolved = await resolvePinSource(body.pinUrl);
    if (resolved.kind === "board") {
      // pasted link (usually pin.it) was a whole board — client switches flows
      return NextResponse.json({ board: true, boardUrl: resolved.boardUrl });
    }
    if (resolved.kind === "none") {
      return NextResponse.json(
        { error: "Couldn't read that pin — try uploading a screenshot of it instead." },
        { status: 422 },
      );
    }
    imageSource = resolved.url;
  } else {
    return NextResponse.json({ error: "Provide a pin URL or an image" }, { status: 400 });
  }

  // understand the inspo image (decode once, share across all passes)
  let image;
  try {
    image = await loadImage(imageSource);
  } catch {
    return NextResponse.json(
      { error: "Couldn't read that image — try a different one." },
      { status: 422 },
    );
  }
  const [embedding, labels, dominant] = await Promise.all([
    body.withEmbedding === false ? null : embedImage(image),
    classifyGarment(image),
    dominantColors(image),
  ]);

  const garment = labels[0]?.label === "full outfit" ? labels[1]?.label : labels[0]?.label;
  const colors = dominant.map((c) => c.canonical);
  // neutrals are usually the photo background or basics — search on the
  // chromatic identity colors, falling back to neutrals only when the
  // whole image is neutral (product shots on white match "cream" too well)
  const NEUTRALS = new Set(["white", "cream", "beige", "grey", "black", "silver"]);
  const chromatic = dominant.filter((c) => !NEUTRALS.has(c.canonical));
  const searchDominant = chromatic.length ? chromatic : dominant;
  const searchColors = searchDominant.map((c) => c.canonical);
  const colorTerms = [...new Set(searchColors.flatMap((c) => SEARCH_TERMS[c]))];

  const result = await runSearch(
    {
      query: garment,
      gender: body.gender,
      colors: searchColors,
      // real shades from the image feed Channel3's hex palette filter
      colorHexes: searchDominant.map((c) => c.hex),
      colorTerms,
      priceRange: body.priceRange,
      retailerIds: body.retailerIds,
      customStores: body.customStores,
      limit: body.limit ?? 40,
    },
    process.env,
  );

  return NextResponse.json({
    resolvedImage: body.imageDataUrl ? null : imageSource,
    labels: labels.slice(0, 3),
    colors,
    products: result.products,
    demo: result.demo,
    sourcesUsed: result.sourcesUsed,
    catalogConfigured: result.catalogConfigured,
    errors: result.errors,
    queryEmbedding: embedding,
  });
}
