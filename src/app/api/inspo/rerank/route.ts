import { NextResponse } from "next/server";
import { z } from "zod";
import { isSafeRemoteImageUrl } from "@/lib/safe-url";
import { embedImage } from "@/lib/similarity/embed";
import { topKBySimilarity } from "@/lib/similarity/rank";

export const runtime = "nodejs";
export const maxDuration = 60;

const rerankBody = z.object({
  queryEmbedding: z.array(z.number()).length(512),
  candidates: z
    .array(z.object({ id: z.string().max(200), imageUrl: z.url().max(1000) }))
    .min(1)
    .max(24),
});

// in-memory product-image embedding cache (pgvector takes over with Supabase)
const embeddingCache = new Map<string, number[]>();
const CACHE_MAX = 500;

async function embedCached(url: string): Promise<number[] | null> {
  const hit = embeddingCache.get(url);
  if (hit) return hit;
  try {
    const embedding = await embedImage(url);
    if (embeddingCache.size >= CACHE_MAX) {
      embeddingCache.delete(embeddingCache.keys().next().value!);
    }
    embeddingCache.set(url, embedding);
    return embedding;
  } catch {
    return null; // CDN blocked us or image is broken — keep original rank
  }
}

/**
 * Visual similarity pass, split out of /api/inspo: embeds candidate product
 * images (the slow part — one CDN download each) and returns them ordered
 * by closeness to the inspo image. Candidates whose image can't be read
 * are omitted; the client keeps them at their original rank.
 */
export async function POST(req: Request) {
  const parsed = rerankBody.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }
  const { queryEmbedding, candidates } = parsed.data;

  const embeddable: { item: string; embedding: number[] }[] = [];
  // small batches: keep memory flat while staying parallel
  for (let i = 0; i < candidates.length; i += 4) {
    const batch = candidates.slice(i, i + 4).filter((c) => isSafeRemoteImageUrl(c.imageUrl));
    const embeddings = await Promise.all(batch.map((c) => embedCached(c.imageUrl)));
    batch.forEach((c, j) => {
      const e = embeddings[j];
      if (e) embeddable.push({ item: c.id, embedding: e });
    });
  }

  const ranked = topKBySimilarity(queryEmbedding, embeddable, embeddable.length);
  return NextResponse.json({
    ranked: ranked.map((r) => ({ id: r.item, score: r.score })),
  });
}
